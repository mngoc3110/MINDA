"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Brain, Wifi, WifiOff, Users, Mic, MicOff, Video, VideoOff, MonitorUp } from "lucide-react";
import type Peer from "peerjs";

// ─── Types & Constants ────────────────────────────────────────────────────────
interface EmotionResult {
  label: string;
  emoji: string;
  confidence: number;
  probabilities: Record<string, number>;
}

const EMOTION_COLORS: Record<string, string> = {
  Neutral:     "bg-blue-500/20 border-blue-500/40 text-blue-300",
  Enjoyment:   "bg-green-500/20 border-green-500/40 text-green-300",
  Confusion:   "bg-yellow-500/20 border-yellow-500/40 text-yellow-300",
  Fatigue:     "bg-orange-500/20 border-orange-500/40 text-orange-300",
  Distraction: "bg-red-500/20 border-red-500/40 text-red-300",
};

const EMOTION_BAR_COLORS: Record<string, string> = {
  Neutral:     "bg-blue-400",
  Enjoyment:   "bg-green-400",
  Confusion:   "bg-yellow-400",
  Fatigue:     "bg-orange-400",
  Distraction: "bg-red-500",
};

const ANALYZE_INTERVAL_MS = 5000;

// ─── Emotion Overlay Component ───────────────────────────────────────────────
function EmotionOverlay({ emotion, isAnalyzing, serviceOnline, position = "top-4 right-4" }: any) {
  if (serviceOnline === false) {
    return (
      <div className={`absolute ${position} z-20 flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400`}>
        <WifiOff className="w-3.5 h-3.5" />
        <span>AI Emotion: Offline</span>
      </div>
    );
  }

  return (
    <div className={`absolute ${position} z-20 min-w-[200px]`}>
      <div className="flex items-center gap-2 bg-black/70 backdrop-blur-md rounded-t-xl px-3 py-2 border border-white/10 border-b-0">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-bold text-white/70 tracking-wider uppercase">AI Emotion</span>
        {isAnalyzing && <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse ml-auto" />}
        {serviceOnline === null && <Wifi className="w-3 h-3 text-gray-500 ml-auto animate-pulse" />}
      </div>
      <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-b-xl px-3 pb-3 pt-2 lg:scale-100 scale-[0.6] origin-top-right">
        {emotion ? (
          <>
            <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border mb-2 ${EMOTION_COLORS[emotion.label] ?? "bg-white/10 border-white/20 text-white"}`}>
              <span className="text-xl">{emotion.emoji}</span>
              <div>
                <p className="font-bold text-sm leading-none">{emotion.label}</p>
                <p className="text-[10px] opacity-70">{Math.round(emotion.confidence * 100)}% confident</p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-white/40 text-xs py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Đang phân tích...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Room Component ──────────────────────────────────────────────────
export default function LiveRoomPage() {
  const { room_id } = useParams();
  const router = useRouter();

  const [userInfo, setUserInfo] = useState<{ full_name: string; role: string } | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // WebRTC & Media States
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [teacherStream, setTeacherStream] = useState<MediaStream | null>(null);
  const [studentStreams, setStudentStreams] = useState<{peerId: string, stream: MediaStream}[]>([]);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Emotion
  const [emotion, setEmotion] = useState<EmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [serviceOnline, setServiceOnline] = useState<boolean | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const teacherVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const peerInstance = useRef<Peer | null>(null);

  // --- Initialize Session & Check AI Service
  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("minda_token");
      const role = localStorage.getItem("minda_role") ?? "student";
      if (!token) return;

      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserInfo({ full_name: payload.sub ?? "Học Sinh MINDA", role });
      } catch {
        setUserInfo({ full_name: "Khách", role: "student" });
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const s = sessions.find((x: any) => x.room_id === room_id);
          if (s) setSessionId(s.id);
        }
      } catch { /* ignore */ }

      try {
        const hRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/emotion/health`);
        if (hRes.ok) {
          const h = await hRes.json();
          setServiceOnline(h.inference_service === "online");
        }
      } catch {
        setServiceOnline(false);
      }
    };
    init();
  }, [room_id]);


  // --- Bind streams to video tags
  const assignStream = (videoObj: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (videoObj && stream) {
      videoObj.srcObject = stream;
      videoObj.onloadedmetadata = () => videoObj.play().catch(console.error);
    }
  };

  useEffect(() => { assignStream(localVideoRef.current, localStream); }, [localStream, isPeerConnected, userInfo]);
  useEffect(() => { assignStream(teacherVideoRef.current, teacherStream); }, [teacherStream, isPeerConnected, userInfo]);

  // --- Connect WebRTC
  useEffect(() => {
    if (!userInfo) return;
    
    let isMounted = true;

    const setupWebRTC = async () => {
      try {
        // Optimize constraints to prevent slow networking/stuttering audio
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { max: 640 },
                height: { max: 480 },
                frameRate: { max: 24 }
            }, 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false, // Turn off AGC to prevent volume clipping/stuttering
                channelCount: 1      // Force mono audio for lower bandwidth
            } 
        });
        if (!isMounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }
        setLocalStream(stream);
        activeStreamRef.current = stream;
        
        const PeerJs = (await import("peerjs")).default;
        
        // Teacher fixes their ID to room_id so students know exactly who to call.
        const peerId = userInfo.role === "teacher" || userInfo.role === "admin" ? (room_id as string) : undefined;
        
        const peerConfig = {
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        };
        const peer = peerId ? new PeerJs(peerId, peerConfig) : new PeerJs(peerConfig);

        peer.on("open", (id) => {
           setIsPeerConnected(true);
           peerInstance.current = peer;

           // If Student, call the teacher immediately
           if (userInfo.role === "student") {
               const call = peer.call(room_id as string, stream);
               if(call) {
                  call.on("stream", (remoteStream) => {
                      setTeacherStream(remoteStream);
                  });
               }
           }
        });

        peer.on("call", (call) => {
           // Answer with whatever stream is currently active (Camera or Screen)
           call.answer(activeStreamRef.current || stream);
           
           if (userInfo.role === "teacher" || userInfo.role === "admin") {
               call.on("stream", (remoteStream) => {
                  setStudentStreams((prev) => {
                      if(prev.find(p => p.peerId === call.peer)) return prev;
                      return [...prev, { peerId: call.peer, stream: remoteStream }];
                  });
               });
               call.on("close", () => {
                  setStudentStreams((prev) => prev.filter(p => p.peerId !== call.peer));
               });
           } else {
               call.on("stream", (remoteStream) => {
                   setTeacherStream(remoteStream);
               });
           }
        });

        peer.on("error", (err) => {
           console.error("PeerJS Error:", err);
           if(err.type === "unavailable-id") {
              alert("Phòng học đã tồn tại giáo viên khác!");
           }
        });

      } catch (err) {
        console.error("Lỗi webcam/mic:", err);
        alert("Vui lòng cấp quyền truy cập Camera & Microphone để tham gia lớp học.");
      }
    };

    setupWebRTC();

    return () => {
      isMounted = false;
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (peerInstance.current) peerInstance.current.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo, room_id]);

  // --- Capture Emotion Logic
  const captureAndAnalyze = useCallback(async () => {
    if (!canvasRef.current || !localVideoRef.current || !serviceOnline || userInfo?.role === "teacher") return;
    const video = localVideoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < 2) return;

    canvas.width = video.videoWidth || 224;
    canvas.height = video.videoHeight || 224;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const frame_b64 = canvas.toDataURL("image/jpeg", 0.7);

    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/emotion/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ frame_b64, session_id: sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmotion(data);
      }
    } catch { /* ignore */ }
    finally {
      setIsAnalyzing(false);
    }
  }, [serviceOnline, sessionId, userInfo?.role]);

  useEffect(() => {
    if (localStream && serviceOnline && userInfo?.role === "student") {
       if (intervalRef.current) clearInterval(intervalRef.current);
       intervalRef.current = setInterval(captureAndAnalyze, ANALYZE_INTERVAL_MS);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [localStream, serviceOnline, captureAndAnalyze, userInfo?.role]);

  // --- Control Actions
  const toggleMic = () => {
    if (localStream) {
      const isAudEnabled = localStream.getAudioTracks()[0]?.enabled;
      localStream.getAudioTracks().forEach(t => t.enabled = !isAudEnabled);
      setMicEnabled(!isAudEnabled);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      const isVidEnabled = localStream.getVideoTracks()[0]?.enabled;
      localStream.getVideoTracks().forEach(t => t.enabled = !isVidEnabled);
      setCamEnabled(!isVidEnabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!peerInstance.current || !localStream) return;

    if (isScreenSharing) {
        setIsScreenSharing(false);
        const camTrack = localStream.getVideoTracks()[0];
        if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
        activeStreamRef.current = localStream;

        const connections = (peerInstance.current as any).connections;
        for (const peerId in connections) {
            connections[peerId].forEach((conn: any) => {
                if (conn.type === "media" && conn.peerConnection) {
                    const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
                    if (sender) sender.replaceTrack(camTrack).catch(console.error);
                }
            });
        }
        return;
    }

    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        setIsScreenSharing(true);

        if (localVideoRef.current) {
            const comboStream = new MediaStream([screenTrack, localStream.getAudioTracks()[0]]);
            localVideoRef.current.srcObject = comboStream;
            activeStreamRef.current = comboStream;
        }

        const connections = (peerInstance.current as any).connections;
        for (const peerId in connections) {
            connections[peerId].forEach((conn: any) => {
                if (conn.type === "media" && conn.peerConnection) {
                    const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
                    if (sender) sender.replaceTrack(screenTrack).catch(console.error);
                }
            });
        }

        screenTrack.onended = () => {
            setIsScreenSharing(false);
            const camTrack = localStream.getVideoTracks()[0];
            if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
            activeStreamRef.current = localStream;
            
            for (const peerId in connections) {
                connections[peerId].forEach((conn: any) => {
                    if (conn.type === "media" && conn.peerConnection) {
                        const sender = conn.peerConnection.getSenders().find((s: any) => s.track?.kind === "video");
                        if (sender) sender.replaceTrack(camTrack).catch(console.error);
                    }
                });
            }
        };
    } catch (err) {
        console.error("Lỗi Share Screen:", err);
    }
  };

  const handleCloseClass = async () => {
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (peerInstance.current) peerInstance.current.destroy();

    try {
      const token = localStorage.getItem("minda_token");
      if (userInfo?.role === "teacher" || userInfo?.role === "admin") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const sessions = await res.json();
          const cur = sessions.find((s: any) => s.room_id === room_id);
          if (cur) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/${cur.id}/status?status=ended`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
    } catch { /* ignore */ }
    finally {
      router.push("/live");
    }
  };

  return (
    <div className="w-full h-[calc(100vh-60px)] relative overflow-hidden bg-black flex flex-col font-outfit text-white">
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Left/Main Side: Teacher Video */}
        <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] p-2 md:p-6">
            {!isPeerConnected ? (
                <div className="flex flex-col items-center gap-4 text-white/50">
                   <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
                   <p className="font-bold md:text-lg animate-pulse tracking-wide">Đang kết nối WebRTC (P2P)...</p>
                </div>
            ) : (userInfo?.role === "teacher" || userInfo?.role === "admin") ? (
                /* TEACHER VIEW */
                <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
                   <video 
                     ref={localVideoRef} 
                     className={`w-full h-full object-cover origin-center ${isScreenSharing ? '' : 'scale-x-[-1]'}`} 
                     muted playsInline autoPlay 
                   />
                   <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
                   <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 font-bold flex items-center gap-3 text-lg">
                       <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]"></span>
                       Camera Giáo viên (Bạn)
                   </div>
                </div>
            ) : (
                /* STUDENT VIEW */
                <div className="w-full h-full relative rounded-3xl overflow-hidden border border-white/10 bg-black/50 shadow-2xl">
                    {teacherStream ? (
                       <video 
                         ref={teacherVideoRef} 
                         className="w-full h-full object-cover rounded-3xl" 
                         playsInline autoPlay 
                       />
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-[#111]">
                           <Users className="w-16 h-16 mb-4 opacity-30" />
                           <p>Đang chờ giáo viên bật camera...</p>
                       </div>
                    )}
                    <div className="absolute bottom-6 left-6 px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 font-bold flex items-center gap-3">
                       <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                       Camera Giáo viên
                    </div>
                </div>
            )}

            {/* PIP Local Camera for Student */}
            {userInfo?.role === "student" && isPeerConnected && (
                <div className="absolute top-6 right-6 w-32 md:w-48 aspect-video bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-40 transition-transform duration-300 hover:scale-105">
                    <video 
                        ref={localVideoRef} 
                        className="w-full h-full object-cover scale-x-[-1]" 
                        muted playsInline autoPlay 
                    />
                    <div className="absolute bottom-1 left-2 text-[10px] font-bold px-2 py-0.5 rounded text-white bg-black/40 backdrop-blur-sm">Bạn</div>
                    
                    {/* Emotion Overlay attached exactly to Student Cam */}
                    <EmotionOverlay
                        emotion={emotion}
                        isAnalyzing={isAnalyzing}
                        serviceOnline={serviceOnline}
                        position="inset-0 top-auto bottom-8 right-2 pointer-events-none origin-bottom-right scale-[0.8]"
                    />
                </div>
            )}
        </div>

        {/* Right Sidebar: Student Grid (Only visible to teacher) */}
        {(userInfo?.role === "teacher" || userInfo?.role === "admin") && (
            <div className="w-full md:w-80 lg:w-[400px] bg-[#111] border-l border-white/10 flex flex-col shrink-0 z-20">
               <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50">
                   <h3 className="font-bold flex items-center gap-3 text-lg"><Users className="w-5 h-5 text-indigo-400"/> Học viên tham gia</h3>
                   <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-black tracking-widest">{studentStreams.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                  {studentStreams.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-white/30 h-full gap-4">
                         <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center"><Users className="w-8 h-8"/></div>
                         <p className="text-sm font-medium">Chưa có học viên truy cập</p>
                      </div>
                  ) : (
                      studentStreams.map((s) => (
                         <div key={s.peerId} className="aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 relative group hover:border-indigo-500/50 transition-colors">
                             <VideoRefPlayer stream={s.stream} />
                             <div className="absolute top-2 left-2 bg-black/60 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                 ID: {s.peerId.substring(0, 6)}...
                             </div>
                         </div>
                      ))
                  )}
               </div>
            </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-[#0a0a0a] border-t border-white/10 shrink-0 flex items-center justify-between px-6 z-10 relative">
         <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 uppercase">
                <Wifi className="w-4 h-4" /> WebRTC
             </div>
             {serviceOnline === true && (
                <div className="hidden md:flex items-center gap-2 text-xs font-bold tracking-widest text-purple-400 bg-purple-500/10 px-4 py-2 rounded-xl border border-purple-500/20 uppercase">
                <Brain className="w-4 h-4" /> AI Active
                </div>
            )}
         </div>

         <div className="flex items-center gap-4 absolute left-1/2 -translate-x-1/2">
            <button 
               onClick={toggleMic}
               className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${micEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
            >
               {micEnabled ? <Mic className="w-5 h-5"/> : <MicOff className="w-5 h-5"/>}
            </button>
            <button 
               onClick={toggleCam}
               className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${camEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'}`}
            >
               {camEnabled ? <Video className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}
            </button>
            {(userInfo?.role === "teacher" || userInfo?.role === "admin") && (
                <button 
                   onClick={toggleScreenShare}
                   className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${isScreenSharing ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                   title="Chia sẻ màn hình"
                >
                   <MonitorUp className="w-5 h-5"/>
                </button>
            )}
            <button
                onClick={handleCloseClass}
                className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all ml-4"
            >
                RỜI GIỜ HỌC
            </button>
         </div>

         <div className="text-white/40 font-mono tracking-widest text-sm font-bold opacity-0 md:opacity-100">
            ROOM: {room_id}
         </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}

// Helper component
function VideoRefPlayer({ stream }: { stream: MediaStream }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {});
        }
    }, [stream]);
    return <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" autoPlay playsInline />;
}
