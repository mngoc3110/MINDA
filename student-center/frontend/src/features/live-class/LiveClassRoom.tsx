"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, MonitorUp } from "lucide-react";

export default function LiveClassRoom() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Khởi động Camera ngay khi vào phòng học
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Quyền truy cập Camera bị từ chối:", err);
      setIsVideoOn(false);
      setIsMicOn(false);
    }
  };

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(t => t.enabled = !isVideoOn);
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMic = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(t => t.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-100px)] bg-bg-main rounded-3xl border border-white/10 overflow-hidden relative flex flex-col shadow-2xl">
      {/* Dynamic Video Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        
        {/* Main Feed: Học sinh */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover transition-opacity duration-300 ${!isVideoOn ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Placeholder khi tắt Camera */}
        {!isVideoOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
            <div className="w-24 h-24 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-3xl font-bold shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              ?
            </div>
          </div>
        )}
        
        {/* Giao diện PiP (Picture-in-Picture) cho Giáo viên (WebRTC Peer Placeholder) */}
        <div className="absolute top-6 right-6 w-56 h-36 bg-[#1a1a1a] rounded-2xl border border-white/20 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
           <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex flex-col items-center justify-center p-4">
             <div className="w-10 h-10 rounded-full bg-white/10 mb-2 animate-pulse"></div>
             <span className="text-xs text-white/70 font-medium">Đang đợi Học Sinh kết nối...</span>
           </div>
        </div>

        {/* Cảm biến AI Đo lường độ Tập trung (Tiền đề cho RAPT-CLIP Phase 4) */}
        <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-green-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,1)] animate-[pulse_1s_ease-in-out_infinite]"></div>
            <span className="text-green-400 text-xs font-bold tracking-wide">AI Analytics: TẬP TRUNG (98%)</span>
        </div>

      </div>

      {/* Control Bar */}
      <div className="h-20 bg-[#080808]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-center gap-4 px-6 z-10 w-full absolute bottom-0 left-0">
        <button onClick={toggleMic} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 hover:scale-105'}`}>
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isVideoOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 hover:scale-105'}`}>
          {isVideoOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        
        <div className="w-px h-8 bg-white/10 mx-2"></div>
        
        <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors">
          <MonitorUp className="w-5 h-5" />
        </button>
        <button className="w-20 h-12 rounded-3xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/20 ml-2 font-medium text-sm gap-2">
          <PhoneOff className="w-4 h-4" />
          Rời
        </button>
      </div>
    </div>
  );
}
