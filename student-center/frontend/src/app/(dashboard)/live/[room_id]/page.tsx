"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, Brain, Wifi, WifiOff, Users,
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
} from "lucide-react";
import type Peer from "peerjs";

// ─── Types & Constants ────────────────────────────────────────────────────────
interface EmotionResult {
  label: string;
  emoji: string;
  confidence: number;
  probabilities: Record<string, number>;
}

interface StudentStream {
  peerId: string;
  stream: MediaStream;
  name: string;
}

const EMOTION_COLORS: Record<string, string> = {
  Neutral:     "bg-blue-500/20 border-blue-500/40 text-blue-300",
  Enjoyment:   "bg-green-500/20 border-green-500/40 text-green-300",
  Confusion:   "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  Fatigue:     "bg-orange-500/20 border-orange-500/40 text-orange-300",
  Distraction: "bg-red-500/20 border-red-500/40 text-red-300",
};

const ANALYZE_INTERVAL_MS = 3000;

// PeerJS config:
// - Production (HTTPS): route through nginx /peerjs/ proxy on port 443
// - Development (HTTP localhost): connect directly to port 9000
const IS_LOCALHOST = typeof window !== "undefined" && window.location.hostname === "localhost";
const PEER_HOST   = typeof window !== "undefined" ? window.location.hostname : "localhost";
const PEER_PORT   = IS_LOCALHOST ? 9000 : (window?.location.protocol === "https:" ? 443 : 80);
const PEER_PATH   = IS_LOCALHOST ? "/" : "/peerjs/";
const PEER_SECURE = typeof window !== "undefined" && window.location.protocol === "https:";

// ─── Emotion Overlay Component ────────────────────────────────────────────────
function EmotionOverlay({ emotion, isAnalyzing, serviceOnline }: {
  emotion: EmotionResult | null;
  isAnalyzing: boolean;
  serviceOnline: boolean | null;
}) {
  if (serviceOnline === false) {
    return (
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-red-500/30 rounded-lg px-2 py-1 text-[10px] text-red-400">
        <WifiOff className="w-3 h-3" />
        <span>AI Offline</span>
      </div>
    );
  }
  return (
    <div className="absolute top-2 right-2 z-20 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 min-w-[120px]">
      <div className="flex items-center gap-1.5 mb-1">
        <Brain className="w-3 h-3 text-purple-400" />
        <span className="text-[9px] font-bold text-white/60 uppercase tracking-wider">AI Emotion</span>
        {isAnalyzing && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-auto" />}
      </div>
      {emotion ? (
        <div className={`flex items-center gap-1.5 rounded px-1.5 py-1 border text-[10px] font-bold ${EMOTION_COLORS[emotion.label] ?? "bg-white/10 border-white/20 text-white"}`}>
          <span>{emotion.emoji}</span>
          <span>{emotion.label} {Math.round(emotion.confidence * 100)}%</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-white/40 text-[10px]">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          <span>Đang phân tích...</span>
        </div>
      )}
    </div>
  );
}

// ─── VideoRefPlayer Helper ────────────────────────────────────────────────────
function VideoRefPlayer({ stream, mirrored = false, className = "" }: {
  stream: MediaStream;
  mirrored?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {});
    }
  }, [stream]);
  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""} ${className}`}
      autoPlay
      playsInline
    />
  );
}

// ─── Main Room Component ──────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { room_id } = useParams();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<{ full_name: string; role: string } | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // WebRTC states
  const [peerStatus, setPeerStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [micEnabled, setMicEnabled]   = useState(true);
  const [camEnabled, setCamEnabled]   = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Streams
  const [localStream, setLocalStream]     = useState<MediaStream | null>(null);
  const [teacherStream, setTeacherStream] = useState<MediaStream | null>(null);
  const [studentStreams, setStudentStreams] = useState<StudentStream[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Emotion
  const [emotion, setEmotion]       = useState<EmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);

  // Refs
  const localVideoRef   = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const teacherVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const intervalRef     = useRef<NodeJS.Timeout | null>(null);
  const peerInstance    = useRef<Peer | null>(null);
  const callRetryRef    = useRef<NodeJS.Timeout | null>(null);

  // --- 1. Init user info & session
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("minda_token");
      const role  = localStorage.getItem("minda_role") ?? "student";
      const name  = localStorage.getItem("minda_user_name") ?? "Học sinh";
      if (!token) return;
      setUserInfo({ full_name: name, role });

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/live-sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const s = sessions.find((x: any) => x.room_id === room_id);
          if (s) setSessionId(s.id);
        }
      } catch { /* ignore */ }

      try {
        const hRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/emotion/health`);
        if (hRes.ok) {
          const h = await hRes.json();
          setServiceOnline(h.inference_service === "online");
        }
      } catch { setServiceOnline(false); }
    };
    init();
  }, [room_id]);

  // --- 2. Bind teacher stream to video element
  useEffect(() => {
    if (teacherVideoRef.current && teacherStream) {
      teacherVideoRef.current.srcObject = teacherStream;
      teacherVideoRef.current.onloadedmetadata = () =>
        teacherVideoRef.current?.play().catch(console.error);
    }
  }, [teacherStream]);

  

  // --- 4. WebRTC setup
  useEffect(() => {
    if (!userInfo) return;
    let isMounted = true;

    const setupWebRTC = async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 24 } },
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
        });
      } catch (err) {
        console.error("Camera/Mic permission denied:", err);
        setPeerStatus("error");
        alert("Vui lòng cấp quyền Camera & Microphone để vào lớp học.");
        return;
      }

      if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
      setLocalStream(stream);
      activeStreamRef.current = stream;

      const PeerJs = (await import("peerjs")).default;

      // Teacher takes room_id as fixed peer ID so students can find them
      const isTeacher = userInfo.role === "teacher" || userInfo.role === "admin";
      const peerId = isTeacher ? (room_id as string) : undefined;

      const peerConfig: any = {
        host:   PEER_HOST,
        port:   PEER_PORT,
        path:   PEER_PATH,
        secure: PEER_SECURE,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
          ],
        },
        debug: 0,
      };

      const peer = peerId ? new PeerJs(peerId, peerConfig) : new PeerJs(peerConfig);
      peerInstance.current = peer;

      // ── Peer is open ──────────────────────────────────────────────
      peer.on("open", (myId) => {
        if (!isMounted) return;
        console.log("[PeerJS] Open, myId =", myId, "role =", userInfo.role);
        setPeerStatus("connected");

        if (!isTeacher) {
          // Student: attempt to call teacher with retry
          const attemptCall = () => {
            if (!isMounted || !peerInstance.current) return;
            const call = peerInstance.current.call(room_id as string, stream, {
              metadata: { name: userInfo.full_name },
            });
            if (!call) {
              // Teacher not ready yet — retry in 3s
              callRetryRef.current = setTimeout(attemptCall, 3000);
              return;
            }
            call.on("stream", (remoteStream) => {
              if (isMounted) setTeacherStream(remoteStream);
            });
            call.on("error", () => {
              callRetryRef.current = setTimeout(attemptCall, 3000);
            });
            call.on("close", () => {
              setTeacherStream(null);
            });
          };
          attemptCall();
        }
      });

      // ── Incoming calls (Teacher receives student calls) ───────────
      peer.on("call", (call) => {
        // Always answer with current active stream
        call.answer(activeStreamRef.current || stream);

        if (isTeacher) {
          call.on("stream", (remoteStream) => {
            if (!isMounted) return;
            const studentName = call.metadata?.name ?? `Học sinh (${call.peer.substring(0, 6)})`;
            setStudentStreams((prev) => {
              if (prev.find(p => p.peerId === call.peer)) return prev;
              return [...prev, { peerId: call.peer, stream: remoteStream, name: studentName }];
            });
          });
          call.on("close", () => {
            setStudentStreams((prev) => prev.filter(p => p.peerId !== call.peer));
          });
          call.on("error", () => {
            setStudentStreams((prev) => prev.filter(p => p.peerId !== call.peer));
          });
        } else {
          // Student receives teacher stream (teacher can call back too)
          call.on("stream", (remoteStream) => {
            if (isMounted) setTeacherStream(remoteStream);
          });
        }
      });

      peer.on("error", (err) => {
        console.error("[PeerJS] Error:", err.type, err);
        if (err.type === "unavailable-id") {
          alert("Phòng học đã có giáo viên khác. Vui lòng đổi tên phòng.");
        } else if (err.type === "server-error" || err.type === "network") {
          setPeerStatus("error");
        }
      });

      peer.on("disconnected", () => {
        console.warn("[PeerJS] Disconnected — reconnecting...");
        peer.reconnect();
      });
    };

    setupWebRTC();

    return () => {
      isMounted = false;
      if (callRetryRef.current) clearTimeout(callRetryRef.current);
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (peerInstance.current) peerInstance.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, room_id]);

  // --- 5. Emotion analysis (students only)
  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzing) return;
    if (!canvasRef.current || !localVideoRef.current || !serviceOnline) return;
    if (userInfo?.role === "teacher" || userInfo?.role === "admin") return;
    const video = localVideoRef.current;
    if (video.readyState < 2) return;

    const canvas = canvasRef.current;
    canvas.width  = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 160, 160);
    const frame_b64 = canvas.toDataURL("image/jpeg", 0.4);

    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/emotion/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ frame_b64, session_id: sessionId }),
      });
      if (res.ok) setEmotion(await res.json());
    } catch { /* ignore */ }
    finally { setIsAnalyzing(false); }
  }, [isAnalyzing, serviceOnline, sessionId, userInfo?.role]);

  useEffect(() => {
    if (localStream && serviceOnline && userInfo?.role === "student") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(captureAndAnalyze, ANALYZE_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [localStream, serviceOnline, captureAndAnalyze, userInfo?.role]);

  // --- 6. Control actions
  const toggleMic = () => {
    if (!localStream) return;
    const cur = localStream.getAudioTracks()[0]?.enabled ?? true;
    localStream.getAudioTracks().forEach(t => { t.enabled = !cur; });
    setMicEnabled(!cur);
  };

  const toggleCam = () => {
    if (!localStream) return;
    const cur = localStream.getVideoTracks()[0]?.enabled ?? true;
    localStream.getVideoTracks().forEach(t => { t.enabled = !cur; });
    setCamEnabled(!cur);
  };

  const toggleScreenShare = async () => {
    if (!peerInstance.current || !localStream) return;

    if (isScreenSharing) {
      setIsScreenSharing(false);
      const camTrack = localStream.getVideoTracks()[0];
      if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
      activeStreamRef.current = localStream;
      const conns = (peerInstance.current as any).connections;
      for (const id in conns) {
        conns[id].forEach((c: any) => {
          if (c.type === "media" && c.peerConnection) {
            const sender = c.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
            if (sender && camTrack) sender.replaceTrack(camTrack).catch(console.error);
          }
        });
      }
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack  = screenStream.getVideoTracks()[0];
      setIsScreenSharing(true);

      const comboStream = new MediaStream([screenTrack, ...localStream.getAudioTracks()]);
      if (localVideoRef.current) localVideoRef.current.srcObject = comboStream;
      activeStreamRef.current = comboStream;

      const conns = (peerInstance.current as any).connections;
      for (const id in conns) {
        conns[id].forEach((c: any) => {
          if (c.type === "media" && c.peerConnection) {
            const sender = c.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
            if (sender) sender.replaceTrack(screenTrack).catch(console.error);
          }
        });
      }

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        const camTrack = localStream.getVideoTracks()[0];
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        activeStreamRef.current = localStream;
        for (const id in conns) {
          conns[id].forEach((c: any) => {
            if (c.type === "media" && c.peerConnection) {
              const sender = c.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
              if (sender && camTrack) sender.replaceTrack(camTrack).catch(console.error);
            }
          });
        }
      };
    } catch (err) { console.error("Screen share error:", err); }
  };

  const handleLeave = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (callRetryRef.current) clearTimeout(callRetryRef.current);
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerInstance.current) peerInstance.current.destroy();

    try {
      const token = localStorage.getItem("minda_token");
      const isTeacher = userInfo?.role === "teacher" || userInfo?.role === "admin";
      if (isTeacher) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/live-sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const cur = sessions.find((s: any) => s.room_id === room_id);
          if (cur) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/live-sessions/${cur.id}/status?status=ended`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    } catch { /* ignore */ }
    finally { router.push("/live"); }
  };

  const isTeacher = userInfo?.role === "teacher" || userInfo?.role === "admin";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-[calc(100vh-60px)] relative overflow-hidden bg-black flex flex-col font-outfit text-white">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* ── Left: Main Video Area ─────────────────────────────────── */}
        <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] p-2 md:p-6">

          {/* Loading */}
          {peerStatus === "connecting" && (
            <div className="flex flex-col items-center gap-4 text-white/50">
              <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
              <p className="font-bold md:text-lg animate-pulse tracking-wide">Đang kết nối P2P...</p>
              <p className="text-sm opacity-60">PeerJS → {PEER_HOST}:{PEER_PORT}</p>
            </div>
          )}

          {/* Error */}
          {peerStatus === "error" && (
            <div className="flex flex-col items-center gap-4 text-red-400">
              <WifiOff className="w-12 h-12" />
              <p className="font-bold text-lg">Không thể kết nối PeerJS Server</p>
              <p className="text-sm opacity-70">Kiểm tra server đang chạy trên cổng {PEER_PORT}</p>
            </div>
          )}

          {/* ── TEACHER VIEW: camera của teacher + screen share ── */}
          {peerStatus === "connected" && isTeacher && (
            <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-2xl">
              <video
                ref={node => { localVideoRef.current = node; if (node && activeStreamRef.current && node.srcObject !== activeStreamRef.current) { node.srcObject = activeStreamRef.current; } }}
                className={`w-full h-full object-cover ${isScreenSharing ? "" : "scale-x-[-1]"}`}
                muted
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 font-bold flex items-center gap-3 text-sm">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                {isScreenSharing ? "🖥️ Đang chia sẻ màn hình" : `📹 ${userInfo?.full_name} (Bạn)`}
              </div>
              {isScreenSharing && (
                <div className="absolute top-6 right-6 w-36 aspect-video bg-black rounded-xl overflow-hidden border border-white/20 shadow-lg z-30">
                  <video
                ref={node => { localVideoRef.current = node; if (node && activeStreamRef.current && node.srcObject !== activeStreamRef.current) { node.srcObject = activeStreamRef.current; } }}
                    className="w-full h-full object-cover scale-x-[-1]"
                    muted
                    playsInline
                    autoPlay
                  />
                  <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">Cam bạn</div>
                </div>
              )}
            </div>
          )}

          {/* ── STUDENT VIEW: teacher camera (main) + self (PiP) ── */}
          {peerStatus === "connected" && !isTeacher && (
            <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/10 bg-[#111] shadow-2xl">
              {teacherStream ? (
                <>
                  <video
                    ref={teacherVideoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-sm font-bold flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    📹 Camera Giáo viên
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-4">
                  <Users className="w-16 h-16 opacity-20" />
                  <p className="font-bold">Đang chờ giáo viên bật camera...</p>
                  <p className="text-sm opacity-60 animate-pulse">Đang kết nối P2P với phòng {room_id}</p>
                </div>
              )}

              {/* PiP: self cam (bottom-right) */}
              <div className="absolute bottom-20 right-6 md:bottom-8 w-28 md:w-44 aspect-video bg-black rounded-2xl overflow-hidden border border-white/25 shadow-2xl z-40 hover:scale-105 transition-transform">
                <video
                  ref={node => { pipVideoRef.current = node; if (node && localStream && node.srcObject !== localStream) { node.srcObject = localStream; } }}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                  autoPlay
                />
                <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded">Bạn</div>
                {/* AI emotion badge */}
                <EmotionOverlay emotion={emotion} isAnalyzing={isAnalyzing} serviceOnline={serviceOnline} />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Student Grid (Teacher only) ─────────────────────── */}
        {isTeacher && peerStatus === "connected" && (
          <div className="w-full md:w-80 lg:w-[380px] bg-[#111] border-l border-white/10 flex flex-col shrink-0">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-5 bg-black/50 shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-indigo-400" />
                Học viên tham gia
              </h3>
              <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-black tracking-widest">
                {studentStreams.length}
              </span>
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
              {studentStreams.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-white/25 h-full gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Users className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-center">Chưa có học viên tham gia</p>
                  <p className="text-xs opacity-60 text-center">Học sinh vào phòng sẽ hiển thị ở đây</p>
                </div>
              ) : (
                studentStreams.map((s) => (
                  <div
                    key={s.peerId}
                    className="rounded-2xl overflow-hidden border border-white/10 relative group hover:border-indigo-500/40 transition-colors bg-[#0d0d0d]"
                  >
                    {/* Aspect video box */}
                    <div className="aspect-video relative">
                      <VideoRefPlayer stream={s.stream} mirrored />
                    </div>
                    {/* Name tag */}
                    <div className="px-3 py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-xs font-bold truncate">{s.name}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Control Bar ─────────────────────────────────────────────── */}
      <div className="h-20 bg-[#0a0a0a] border-t border-white/10 shrink-0 flex items-center justify-between px-6 z-10">
        {/* Left: status pills */}
        <div className="flex items-center gap-2">
          <div className={`hidden md:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border uppercase tracking-widest
            ${peerStatus === "connected"
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : peerStatus === "error"
              ? "text-red-400 bg-red-500/10 border-red-500/20"
              : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20 animate-pulse"}`}
          >
            <Wifi className="w-3.5 h-3.5" />
            {peerStatus === "connected" ? "P2P Live" : peerStatus === "error" ? "Error" : "Connecting"}
          </div>
          {serviceOnline === true && (
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 uppercase tracking-widest">
              <Brain className="w-3.5 h-3.5" />
              AI Active
            </div>
          )}
        </div>

        {/* Center: media controls */}
        <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
          <button
            onClick={toggleMic}
            title={micEnabled ? "Tắt mic" : "Bật mic"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${micEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"}`}
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleCam}
            title={camEnabled ? "Tắt camera" : "Bật camera"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${camEnabled ? "bg-white/10 hover:bg-white/20 text-white" : "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"}`}
          >
            {camEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          {isTeacher && (
            <button
              onClick={toggleScreenShare}
              title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isScreenSharing ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
              <MonitorUp className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleLeave}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all ml-2"
          >
            <PhoneOff className="w-4 h-4" />
            Rời lớp
          </button>
        </div>

        {/* Right: room id */}
        <div className="text-white/30 font-mono text-xs font-bold hidden md:block">
          ROOM: {room_id}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>
    </div>
  );
}
