"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2, Brain, Wifi, WifiOff, Users,
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, BookOpen,
} from "lucide-react";
import AnnotationBoard from "./AnnotationBoard";
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

// TẬN DỤNG RAPT-CLIP CHÍNH GỐC ĐỈNH CAO NHẤT:
// Gửi 1 frame mỗi 60ms (~16 FPS). Nghĩa là 16 frames sẽ được thu thập trong ĐÚNG 1 GIÂY (Real-time 1s)!
// Máy Macbook M4 Pro xử lý dư sức lượng frames lớn này qua localhost.
const ANALYZE_INTERVAL_MS = 60;

// PeerJS config: Auto-detect local vs production
const IS_LOCALHOST = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const PEER_HOST   = IS_LOCALHOST ? "localhost" : "minda.io.vn";
const PEER_PORT   = IS_LOCALHOST ? 9000 : 443;
const PEER_PATH   = IS_LOCALHOST ? "/" : "/peerjs/";
const PEER_SECURE = IS_LOCALHOST ? false : true;
const PEER_DEBUG  = 1;

// API URL: auto-detect local backend
const API_BASE_URL = IS_LOCALHOST ? "http://localhost:8000" : (process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn");

// Detect if running on native device
const IS_NATIVE_APP = typeof window !== "undefined" && (!!(window as any).Capacitor || window.location.protocol === "capacitor:");

// ─── Emotion Overlay Component ────────────────────────────────────────────────
function EmotionOverlay({ emotion, isAnalyzing, serviceOnline, compact = false }: {
  emotion: EmotionResult | null;
  isAnalyzing: boolean;
  serviceOnline: boolean | null;
  compact?: boolean;
}) {
  if (serviceOnline === false) {
    return (
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-red-500/30 rounded-lg px-2 py-1 text-[10px] text-red-400">
        <WifiOff className="w-3 h-3" />
        <span>AI Offline</span>
      </div>
    );
  }
  
  if (!emotion && !isAnalyzing) return null;

  // Tính Top 3
  let top3: { label: string, val: number }[] = [];
  if (emotion && emotion.probabilities) {
    top3 = Object.entries(emotion.probabilities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => ({ label: k, val: v }));
  }

  return (
    <div className={`absolute top-2 right-2 z-20 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-2 ${compact ? "min-w-[120px]" : "min-w-[180px]"}`}>
      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-white/10">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest leading-none">AI Emotion</span>
        {isAnalyzing && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-auto" />}
      </div>
      
      {emotion ? (
        <div className="flex flex-col gap-2">
          <div className={`flex items-center gap-1.5 rounded px-2 py-1 border text-xs font-bold w-fit ${EMOTION_COLORS[emotion.label] ?? "bg-white/10 border-white/20 text-white"}`}>
            <span>{emotion.emoji}</span>
            <span>{emotion.label} {Math.round(emotion.confidence * 100)}%</span>
          </div>
          
          {top3.length > 0 && !compact && (
             <div className="flex flex-col gap-1 mt-1">
               {top3.map((item, idx) => (
                 <div key={idx} className="flex flex-col gap-0.5">
                   <div className="flex justify-between text-[8px] uppercase tracking-wider text-white/50 font-bold">
                     <span>{item.label}</span>
                     <span>{Math.round(item.val * 100)}%</span>
                   </div>
                   <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full ${idx === 0 ? "bg-purple-400" : "bg-white/40"}`} style={{ width: `${Math.round(item.val * 100)}%` }} />
                   </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-white/40 text-[10px] mt-1">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          <span>Đang quét biểu cảm...</span>
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
    const video = videoRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.onloadedmetadata = () => video.play().catch(console.error);

      // Lắng nghe sự kiện thêm track mạng (thường gặp ở Safari/Mobile WebRTC)
      const onAddTrack = () => {
         video.srcObject = stream;
         video.play().catch(console.error);
      };
      stream.addEventListener("addtrack", onAddTrack);
      return () => stream.removeEventListener("addtrack", onAddTrack);
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      className={`w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""} ${className}`}
      autoPlay
      playsInline
      muted={true} // Bắt buộc mute để Safari cho phép AutoPlay nếu gặp STUN block hoặc không tương tác
    />
  );
}

// ─── Main Room Component ──────────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { room_id } = useParams();
  const router = useRouter();
  const isStudyGroup = typeof room_id === 'string' && room_id.startsWith("study-");

  const [userInfo, setUserInfo] = useState<{ full_name: string; role: string; isRoomOwner: boolean; isAutoHost?: boolean } | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  // Component-level isTeacher (không nằm trong useEffect closure nữa)
  const isTeacher = userInfo?.role === "teacher" || userInfo?.role === "admin" || false;
  const isHost = isTeacher || userInfo?.isAutoHost || false;

  // WebRTC states
  const [peerStatus, setPeerStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [micEnabled, setMicEnabled]   = useState(true);
  const [camEnabled, setCamEnabled]   = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSelfCamEnlarged, setIsSelfCamEnlarged] = useState(false);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordWsRef = useRef<WebSocket | null>(null);
  const [canShareScreen, setCanShareScreen] = useState(true);

  // Annotation states
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationFileUrl, setAnnotationFileUrl] = useState("");
  const [annotationFileType, setAnnotationFileType] = useState("");
  const [remoteStrokes, setRemoteStrokes] = useState<any[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [myFiles, setMyFiles] = useState<{ id: number; filename: string; file_url: string; file_type: string }[]>([]);

  // Screen share viewer states
  const [screenShareActive, setScreenShareActive] = useState(false);
  const screenCanvasRef = useRef<HTMLCanvasElement>(null);
  const screenWsRef = useRef<WebSocket | null>(null);

  // Streams
  const [localStream, setLocalStream]     = useState<MediaStream | null>(null);
  const [teacherStream, setTeacherStream] = useState<MediaStream | null>(null);
  const [studentStreams, setStudentStreams] = useState<StudentStream[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Emotion
  const [emotion, setEmotion]       = useState<EmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);
  const [studentEmotions, setStudentEmotions] = useState<Record<string, EmotionResult>>({});
  const dataConnRef = useRef<any>(null);

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

      // Decode JWT to get user id
      let myUserId: number | null = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        myUserId = parseInt(payload.sub);
      } catch {}

      let isRoomOwner = false;
      if (!isStudyGroup) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/live-sessions/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const sessions = await res.json();
              const s = sessions.find((x: any) => x.room_id === room_id);
              if (s) {
                setSessionId(s.id);
                isRoomOwner = myUserId !== null && s.teacher_id === myUserId;
              }
            }
          } catch { /* ignore */ }
      }

      setUserInfo({ full_name: name, role, isRoomOwner });

      try {
        const hRes = await fetch(`${API_BASE_URL}/api/emotion/health`);
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
    if (typeof window !== "undefined") {
       if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          setCanShareScreen(false);
       }
    }

    if (!userInfo || !hasJoined) return;
    let isMounted = true;

    const setupWebRTC = async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: IS_NATIVE_APP ? true : { 
            facingMode: "user",
            width: { ideal: 320, max: 640 }, 
            height: { ideal: 240, max: 480 }, 
            frameRate: { ideal: 15, max: 24 } 
          },
          audio: true,
        });
      } catch (err: any) {
        console.error("Camera/Mic permission denied:", err);
        setPeerStatus("error");
        alert("Lỗi Camera/Mic: " + (err?.name || err?.message || JSON.stringify(err)) + "\nVui lòng cấp quyền trong Cài đặt iPhone/iPad.");
        return;
      }

      if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return; }
      setLocalStream(stream);
      activeStreamRef.current = stream;

      const PeerJs = (await import("peerjs")).default;

      // isTeacher = có role GV/admin → hiển thị UI giáo viên
      // isRoomOwner = người TẠO phòng → dùng peer ID cố định = room_id
      const isTeacher = userInfo.role === "teacher" || userInfo.role === "admin";
      const isRoomOwner = userInfo.isRoomOwner;
      const userId = localStorage.getItem("minda_user_id") || "u";
      // Room owner: peer ID = room_id (học sinh tìm tới được)
      // Guest teacher: peer ID = t-{userId}-{roomId} (tránh xung đột)
      // Student: peer ID = s-{userId}-{roomId}
      const stableStudentId = `s-${userId}-${(room_id as string).replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
      const guestTeacherId  = `t-${userId}-${(room_id as string).replace(/[^a-z0-9]/gi, "").toLowerCase()}`;
      let peerId = isRoomOwner ? (room_id as string) : (isTeacher ? guestTeacherId : stableStudentId);

      if (isStudyGroup) {
         peerId = room_id as string; // Auto-Host: thử lấy ngay tên phòng làm Host
      }

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
            // Public TURN Servers (Free OpenRelay) để cứu các ca bị mạng 3G/4G hoặc iOS Safari Private Relay chặn P2P
            { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
            { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
            { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
          ],
        },
        debug: 0,
      };

      const peer = new PeerJs(peerId, peerConfig);
      peerInstance.current = peer;

      // ── Peer is open ──────────────────────────────────────────────
      peer.on("open", (myId) => {
        if (!isMounted) return;
        console.log("[PeerJS] Open, myId =", myId, "role =", userInfo.role);
        setPeerStatus("connected");

        let actAsHost = isTeacher;
        if (isStudyGroup && myId === room_id) {
           actAsHost = true;
           setUserInfo(prev => prev ? {...prev, isAutoHost: true} : prev);
        }

        if (!actAsHost) {
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
          
          const connectData = () => {
             if (!isMounted || !peerInstance.current) return;
             // Tránh kết nối lại nếu đã có
             if (dataConnRef.current && dataConnRef.current.open) return;
             const conn = peerInstance.current.connect(room_id as string, { metadata: { peerId: peerInstance.current.id }});
             conn.on("open", () => { dataConnRef.current = conn; });
             conn.on("error", () => { setTimeout(connectData, 3000); });
             // Khi bị disconnect do GV refresh mạng
             conn.on("close", () => { dataConnRef.current = null; setTimeout(connectData, 3000); });
          };
          connectData();
          // Polyfill retry connectData vì STUN/Peer đôi khi nuốt sự kiện error
          const retryDataInterval = setInterval(() => {
             if (isMounted && (!dataConnRef.current || !dataConnRef.current.open)) {
                 connectData();
             }
          }, 5000);
          
          return () => clearInterval(retryDataInterval);
        }
      });

            // ── Incoming calls & data (Teacher) ───────────
      peer.on("connection", (conn) => {
        conn.on("data", (data: any) => {
          try {
            if (data.type === "emotion" && data.peerId) {
              setStudentEmotions(prev => ({ ...prev, [data.peerId]: data.emotion }));
            }
            // Annotation strokes from teacher → students
            if (data.type?.startsWith("stroke_")) {
              setRemoteStrokes(prev => [...prev, data]);
            }
            if (data.type === "annotation_open") {
              setAnnotationFileUrl(data.fileUrl);
              setAnnotationFileType(data.fileType || "");
              setAnnotationOpen(true);
            }
            if (data.type === "annotation_close") {
              setAnnotationOpen(false);
            }
          } catch(e) {}
        });
      });

      peer.on("call", (call) => {
        // Always answer with current active stream
        call.answer(activeStreamRef.current || stream);

        let actAsHost = isTeacher;
        if (isStudyGroup && peerInstance.current?.id === room_id) {
           actAsHost = true;
        }

        if (actAsHost) {
          call.on("stream", (remoteStream) => {
            if (!isMounted) return;
            const studentName = call.metadata?.name ?? `Học sinh (${call.peer.substring(0, 6)})`;
            setStudentStreams((prev) => {
              // Replace existing entry with same name (reconnect) hoặc same peerId
              const filtered = prev.filter(p => p.peerId !== call.peer && p.name !== studentName);
              return [...filtered, { peerId: call.peer, stream: remoteStream, name: studentName }];
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
          if (isStudyGroup) {
             // Có người làm Host rồi! Ta trở về làm Client (Tạo ID học sinh)
             console.warn("[PeerJS] Study Group: Room is already hosted by another student. Switching to Client Mode...");
             peer.destroy();
             const fallbackPeer = new PeerJs(stableStudentId, peerConfig);
             peerInstance.current = fallbackPeer;
             
             fallbackPeer.on("open", (myId) => {
                if (!isMounted) return;
                setPeerStatus("connected");
                
                // --- Logic của Client kết nối lại vào Host ---
                const attemptCallFallback = () => {
                   if (!isMounted || !peerInstance.current) return;
                   const call = peerInstance.current.call(room_id as string, stream, { metadata: { name: userInfo.full_name } });
                   if (!call) { callRetryRef.current = setTimeout(attemptCallFallback, 3000); return; }
                   call.on("stream", (remoteStream) => { if (isMounted) setTeacherStream(remoteStream); });
                   call.on("error", () => { callRetryRef.current = setTimeout(attemptCallFallback, 3000); });
                   call.on("close", () => { setTeacherStream(null); });
                };
                attemptCallFallback();
                
                const connectDataFallback = () => {
                   if (!isMounted || !peerInstance.current) return;
                   if (dataConnRef.current && dataConnRef.current.open) return;
                   const conn = peerInstance.current.connect(room_id as string, { metadata: { peerId: peerInstance.current.id }});
                   conn.on("open", () => { dataConnRef.current = conn; });
                   conn.on("error", () => { setTimeout(connectDataFallback, 3000); });
                   conn.on("close", () => { dataConnRef.current = null; setTimeout(connectDataFallback, 3000); });
                };
                connectDataFallback();
                const retryDataInterval = setInterval(() => {
                   if (isMounted && (!dataConnRef.current || !dataConnRef.current.open)) connectDataFallback();
                }, 5000);
             });
          }
          else if (isTeacher) {
            alert("Phòng học đã có giáo viên khác. Vui lòng đổi tên phòng.");
          } else {
            // Học sinh: stable ID bị chiếm (session cũ chưa expire) → dùng fallback ID
            console.warn("[PeerJS] Stable peer ID unavailable, retrying with fallback...");
            peer.destroy();
            // Tạo peer mới với ID ngẫu nhiên (sẽ không stable, nhưng vẫn kết nối được)
            const fallbackPeer = new PeerJs(peerConfig);
            peerInstance.current = fallbackPeer;
            fallbackPeer.on("open", (myId) => {
              if (!isMounted) return;
              setPeerStatus("connected");
              const call = fallbackPeer.call(room_id as string, stream, {
                metadata: { name: userInfo.full_name },
              });
              if (call) {
                call.on("stream", (remoteStream) => { if (isMounted) setTeacherStream(remoteStream); });
              }
              const conn = fallbackPeer.connect(room_id as string, { metadata: { peerId: myId } });
              conn.on("open", () => { dataConnRef.current = conn; });
            });
          }
        } else if (err.type === "server-error" || err.type === "network") {
          setPeerStatus("error");
        }
      });

      peer.on("disconnected", () => {
        console.warn("[PeerJS] Disconnected — reconnecting in 3s...");
        setTimeout(() => {
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        }, 3000);
      });
    };

    setupWebRTC();

    // Khi tab bị ẩn/hiện lại, reconnect nếu bị ngắt kết nối
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && peerInstance.current?.disconnected) {
        console.log("[PeerJS] Tab active — reconnecting...");
        peerInstance.current.reconnect();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (callRetryRef.current) clearTimeout(callRetryRef.current);
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (peerInstance.current) peerInstance.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.role, userInfo?.isRoomOwner, room_id, hasJoined]);

  // --- 5. Emotion analysis (students only)
  // Dùng Ref cho isAnalyzing để TRÁNH re-render mỗi lần gửi frame
  const isAnalyzingRef = useRef(false);
  const lastEmotionLabel = useRef<string>("");

  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzingRef.current) return;
    const videoNode = localVideoRef.current || pipVideoRef.current;
    if (!canvasRef.current || !videoNode) return;
    if (userInfo?.role === "teacher" || userInfo?.role === "admin") return;
    const video = videoNode;
    if (video.readyState < 2) return;

    const canvas = canvasRef.current;
    canvas.width  = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, 320, 320);
    const frame_b64 = canvas.toDataURL("image/jpeg", 0.5);

    isAnalyzingRef.current = true;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API_BASE_URL}/api/emotion/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ frame_b64, session_id: sessionId }),
      });
      if (res.ok) {
        const emData = await res.json();
        // Luôn cập nhật UI với kết quả mới nhất (gồm cả confidence)
        setEmotion(emData);
        if (dataConnRef.current) {
          dataConnRef.current.send({ type: "emotion", peerId: peerInstance.current?.id, emotion: emData });
        }
      }
    } catch { /* ignore */ }
    finally { isAnalyzingRef.current = false; }
  }, [sessionId, userInfo?.role]);

  // Dùng Ref để tránh stale closure làm reset Interval mỗi khi component re-render
  const captureRef = useRef(captureAndAnalyze);
  useEffect(() => { captureRef.current = captureAndAnalyze; }, [captureAndAnalyze]);

  useEffect(() => {
    if (localStream && userInfo?.role === "student") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // 200ms = 5 FPS → RAPT-CLIP buffer 16 frames trong ~3.2 giây → kết quả nhanh hơn!
      intervalRef.current = setInterval(() => { captureRef.current(); }, 200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [localStream, userInfo?.role]);


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

    const isNativeCapacitor = typeof window !== "undefined" && (!!(window as any).Capacitor || window.location.protocol === "capacitor:");
    if (isNativeCapacitor) {
      alert("📲 Nhận diện App: Bắt đầu gọi Native Plugin...");
      const nativeOk = await startNativeScreenShare();
      if (nativeOk) return;
    } else {
      alert("⚠️ Thiết bị không được nhận diện là Native App (Capacitor = undefined). Sẽ dùng WebRTC thay thế.");
    }

    // Fallback to browser getDisplayMedia (Phải gọi ngay lập tức không qua await để Safari iOS không chặn)
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
    } catch (err: any) {
      console.error("Screen share error:", err);
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert("Thiết bị chưa hỗ trợ Share màn hình trong trình duyệt.\n\nĐể share màn hình GoodNotes trên iPad:\n→ Cài app MINDA qua AltStore\n→ Mở app MINDA thay vì trình duyệt");
      } else {
        alert("Không thể chia sẻ màn hình: " + err.message);
      }
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      // Bắt đầu Record và mix âm thanh PC + Mic
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true, // Cố gắng lấy âm thanh từ tab nếu trình duyệt hỗ trợ
      });

      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      if (displayStream.getAudioTracks().length > 0) {
        const displaySource = audioCtx.createMediaStreamSource(displayStream);
        displaySource.connect(dest);
      }
      
      if (localStream && localStream.getAudioTracks().length > 0) {
        const micSource = audioCtx.createMediaStreamSource(localStream);
        micSource.connect(dest);
      }

      const mixedAudioTrack = dest.stream.getAudioTracks()[0];
      const videoTrack = displayStream.getVideoTracks()[0];
      
      const mixedStream = new MediaStream([videoTrack]);
      if (mixedAudioTrack) mixedStream.addTrack(mixedAudioTrack);

      const wsUrl = `${API_BASE_URL.replace("http", "ws")}/api/live-sessions/${room_id}/record?token=${localStorage.getItem("minda_token")}`;
      const ws = new WebSocket(wsUrl);
      recordWsRef.current = ws;

      ws.onopen = () => {
        const recorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm' });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            const buffer = await e.data.arrayBuffer();
            ws.send(buffer);
          }
        };

        recorder.onstop = () => {
          if (ws.readyState === WebSocket.OPEN) {
             ws.send(JSON.stringify({ type: "EOF" })); 
             ws.close();
          }
          displayStream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
          alert("Đã kết thúc ghi hình. File sẽ được uploard lên Google Drive tự động.");
        };

        recorder.start(2000); 
        setIsRecording(true);
      };

      ws.onerror = (e) => {
        console.error("Ghi hình thất bại:", e);
        alert("Lỗi kết nối Máy chủ ghi hình WebSocket.");
        setIsRecording(false);
      };

    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
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
        const res = await fetch(`${API_BASE_URL}/api/live-sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const cur = sessions.find((s: any) => s.room_id === room_id);
          if (cur) {
            await fetch(`${API_BASE_URL}/api/live-sessions/${cur.id}/status?status=ended`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    } catch { /* ignore */ }
    finally { router.push("/live"); }
  };



  // ── Screen Share Viewer (students receive JPEG frames via WebSocket) ─────────
  useEffect(() => {
    if (!hasJoined || !userInfo) return;
    const token = localStorage.getItem("minda_token");
    if (!token) return;

    const apiUrl = API_BASE_URL;
    const wsBase = apiUrl.replace("http", "ws");
    const wsUrl = `${wsBase}/api/live-sessions/${room_id}/screen-share?token=${token}&role=viewer`;
    
    const ws = new WebSocket(wsUrl);
    screenWsRef.current = ws;

    ws.onmessage = (evt) => {
      if (typeof evt.data === "string") {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "screen_start") setScreenShareActive(true);
          if (msg.type === "screen_stop") setScreenShareActive(false);
        } catch {}
        return;
      }
      // Binary = JPEG frame
      setScreenShareActive(true);
      const blob = evt.data as Blob;
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = screenCanvasRef.current;
        if (!canvas) { URL.revokeObjectURL(url); return; }
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };

    ws.onerror = () => {};
    ws.onclose = () => { setScreenShareActive(false); };

    return () => { ws.close(); screenWsRef.current = null; };
  }, [hasJoined, userInfo, room_id]);

  // ── Native iOS Screen Share (Capacitor + ReplayKit) ───────────────────────────
  const startNativeScreenShare = async () => {
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return false;

      const { registerPlugin } = await import("@capacitor/core");
      const ScreenShare = registerPlugin("ScreenShare") as any;

      const token = localStorage.getItem("minda_token") || "";
      const serverUrl = "https://minda.io.vn";
      
      console.log("Preparing native share with room:", room_id);
      
      await ScreenShare.setRoomInfo({ roomId: room_id, token, serverUrl });
      await new Promise(r => setTimeout(r, 100));
      
      await ScreenShare.startShare();
      setIsScreenSharing(true);
      return true;
    } catch (err: any) {
      const msg = err?.message || JSON.stringify(err) || String(err);
      alert("❌ Lỗi Native Plugin: " + msg);
      console.error("Native screen share error detail:", msg);
      return false;
    }
  };

  // ─── Render Pre-join Lobby ──────────────────────────────────────────────────
  if (!hasJoined) {
    return (
      <div className="w-full h-[calc(100vh-60px)] flex flex-col items-center justify-center bg-black text-white font-outfit relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center flex flex-col items-center gap-6 shadow-2xl relative z-10">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/30">
            <Video className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Phòng học Live</h2>
            <p className="text-sm text-white/50 px-4">Trình duyệt yêu cầu xác nhận để bật Camera và Microphone.</p>
          </div>
          <button
            onClick={() => setHasJoined(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] mt-2"
          >
            Tham gia lớp học
          </button>
        </div>
      </div>
    );
  }

  // ─── Render Main Room ───────────────────────────────────────────────────────
  return (
    <div className="w-full h-[calc(100vh-60px)] relative overflow-hidden bg-black flex flex-col font-outfit text-white">
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Screen Share Overlay (JPEG frames from iPad ReplayKit) ── */}
      {screenShareActive && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <canvas
            ref={screenCanvasRef}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-indigo-600/90 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm">
            <MonitorUp className="w-4 h-4" />
            Giáo viên đang Share màn hình
          </div>
        </div>
      )}

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
          {peerStatus === "connected" && isHost && (
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
                {isScreenSharing ? "🖥️ Đang chia sẻ màn hình" : `📹 ${userInfo?.full_name} (Bạn) - Trưởng Nhóm`}
              </div>
              
              {/* AI Emotion cho AutoHost khi full-screen */}
              {userInfo?.isAutoHost && !isScreenSharing && (
                 <EmotionOverlay emotion={emotion} isAnalyzing={isAnalyzing} serviceOnline={serviceOnline} compact={false} />
              )}
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
                  {/* AI Emotion cho AutoHost khi Share Màn Hình (PiP) */}
                  {userInfo?.isAutoHost && (
                     <EmotionOverlay emotion={emotion} isAnalyzing={isAnalyzing} serviceOnline={serviceOnline} compact={true} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STUDENT VIEW: teacher camera (main) + self (PiP) ── */}
          {peerStatus === "connected" && !isHost && (
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

              {/* PiP hoặc Fullscreen: self cam (Học sinh) */}
              <div 
                 onClick={() => setIsSelfCamEnlarged(!isSelfCamEnlarged)}
                 className={`absolute bg-black rounded-2xl overflow-hidden border border-white/25 shadow-2xl z-40 transition-all cursor-pointer group ${
                    isSelfCamEnlarged 
                       ? "inset-4 md:inset-8 z-50 rounded-3xl border-indigo-500/50" // Phóng to
                       : "bottom-20 right-6 md:bottom-8 w-28 md:w-44 aspect-video hover:scale-105" // Thu nhỏ
                 }`}
              >
                <video
                  ref={node => { pipVideoRef.current = node; if (node && localStream && node.srcObject !== localStream) { node.srcObject = localStream; } }}
                  className="w-full h-full object-cover scale-x-[-1]"
                  muted
                  playsInline
                  autoPlay
                />
                <div className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white/80 bg-black/60 px-1.5 py-0.5 rounded">Bạn</div>
                {/* AI emotion badge */}
                <EmotionOverlay emotion={emotion} isAnalyzing={isAnalyzing} serviceOnline={serviceOnline} compact={!isSelfCamEnlarged} />
                
                {/* Nút Phóng to / Thu nhỏ ảo (hiện khi hover) */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm text-sm">
                       {isSelfCamEnlarged ? "Thu nhỏ" : "Phóng to"}
                    </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Student Grid (Teacher only) ─────────────────────── */}
        {isHost && peerStatus === "connected" && (
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

                      {/* Emotion Overlay — Giáo viên xem cảm xúc học sinh */}
                      {studentEmotions[s.peerId] ? (
                        <div className="absolute bottom-2 left-2 right-2 z-20">
                          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border text-xs font-bold backdrop-blur-sm ${
                            EMOTION_COLORS[studentEmotions[s.peerId].label] ?? "bg-white/10 border-white/20 text-white"
                          }`}>
                            <Brain className="w-3 h-3 shrink-0" />
                            <span className="text-sm">{studentEmotions[s.peerId].emoji}</span>
                            <span>{studentEmotions[s.peerId].label}</span>
                            <span className="ml-auto font-mono">{Math.round(studentEmotions[s.peerId].confidence * 100)}%</span>
                          </div>
                        </div>
                      ) : serviceOnline && (
                        <div className="absolute bottom-2 left-2 z-20">
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                            <Brain className="w-2.5 h-2.5" />
                            <span>Đang quét...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Name tag */}
                    <div className="px-3 py-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="text-xs font-bold truncate">{s.name}</span>
                      </div>
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
          
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isScreenSharing ? "bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/10 hover:bg-white/20 text-white"}`}
          >
            <MonitorUp className="w-5 h-5" />
          </button>
          
          {isTeacher && canShareScreen && (
            <button
               onClick={toggleRecording}
               title={isRecording ? "Dừng ghi hình" : "Bắt đầu ghi hình trên Server"}
               className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isRecording ? "bg-red-500/20 text-red-500 border border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
               <div className={`w-4 h-4 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-rose-500"}`} />
            </button>
          )}

          {/* Annotation button - for teacher */}
          {isHost && (
            <button
              onClick={async () => {
                // Fetch my files
                const token = localStorage.getItem("minda_token");
                const res = await fetch(`${API_BASE_URL}/api/files/my-drive`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setMyFiles(await res.json());
                setShowFilePicker(true);
              }}
              title="Mở bảng chữa bài"
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${annotationOpen ? "bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]" : "bg-amber-500/20 text-amber-500 border border-amber-500/50 hover:bg-amber-500/40"}`}
            >
              <BookOpen className="w-5 h-5" />
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

        {/* Right: room id & role debug */}
        <div className="flex flex-col items-end gap-1 mr-2">
          <div className="text-white/20 font-mono text-[9px] uppercase tracking-tighter hidden sm:block">
            ROOM: {room_id}
          </div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm ${
             isTeacher ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : 
             userInfo?.isAutoHost ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30" : 
             "bg-blue-500/20 text-blue-400 border border-blue-500/30"
          }`}>
            {isTeacher ? "Giáo viên" : userInfo?.isAutoHost ? "Trưởng Nhóm" : "Học sinh"}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
      `}</style>

      {/* ── File Picker Modal ── */}
      {showFilePicker && (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-black text-white text-lg">📄 Chọn tài liệu cần chữa bài</h3>
              <button onClick={() => setShowFilePicker(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {/* Upload new */}
              <label className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/20 hover:border-amber-500/50 cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <span className="text-xl">📤</span>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Upload file mới</div>
                  <div className="text-white/40 text-xs">PDF, ảnh JPG/PNG</div>
                </div>
                <input type="file" accept=".pdf,image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const token = localStorage.getItem("minda_token");
                  const form = new FormData();
                  form.append("file", file);
                  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: form
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const fileUrl = data.file_url;
                    const fileType = file.type.includes("image") ? "image" : "pdf";
                    setAnnotationFileType(fileType);
                    setAnnotationFileUrl(fileUrl);
                    setAnnotationOpen(true);
                    setShowFilePicker(false);
                    // Broadcast to students
                    const conns = (peerInstance.current as any)?.connections || {};
                    for (const id in conns) {
                      conns[id]?.forEach((c: any) => {
                        if (c.type === "data" && c.open) c.send({ type: "annotation_open", fileUrl, fileType });
                      });
                    }
                  }
                }} />
              </label>
              {/* My Drive files */}
              {myFiles.filter(f => f.file_type?.includes("pdf") || f.file_type?.includes("image")).map(f => (
                <button key={f.id} onClick={() => {
                  const fileType = f.file_type || "";
                  setAnnotationFileType(fileType);
                  setAnnotationFileUrl(f.file_url);
                  setAnnotationOpen(true);
                  setShowFilePicker(false);
                  const conns = (peerInstance.current as any)?.connections || {};
                  for (const id in conns) {
                    conns[id]?.forEach((c: any) => {
                      if (c.type === "data" && c.open) c.send({ type: "annotation_open", fileUrl: f.file_url, fileType });
                    });
                  }
                }} className="flex items-center gap-3 p-4 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 text-left transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xl">{f.file_type?.includes("pdf") ? "📕" : "🖼️"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-sm truncate">{f.filename}</div>
                    <div className="text-white/40 text-xs uppercase">{f.file_type}</div>
                  </div>
                </button>
              ))}
              {myFiles.filter(f => f.file_type?.includes("pdf") || f.file_type?.includes("image")).length === 0 && (
                <div className="text-center py-10 text-white/30 text-sm">Chưa có file nào. Upload file PDF/ảnh ở trên nhé!</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Annotation Board ── */}
      {annotationOpen && (
        <AnnotationBoard
          fileUrl={annotationFileUrl}
          fileType={annotationFileType}
          isTeacher={isTeacher}
          onStroke={(data) => {
            const conns = (peerInstance.current as any)?.connections || {};
            for (const id in conns) {
              conns[id]?.forEach((c: any) => {
                if (c.type === "data" && c.open) c.send(data);
              });
            }
          }}
          remoteStrokes={remoteStrokes}
          onClose={() => {
            setAnnotationOpen(false);
            const conns = (peerInstance.current as any)?.connections || {};
            for (const id in conns) {
              conns[id]?.forEach((c: any) => {
                if (c.type === "data" && c.open) c.send({ type: "annotation_close" });
              });
            }
          }}
        />
      )}
    </div>
  );
}
