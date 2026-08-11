"use client";

import React, { useState } from "react";
import { Clapperboard, Play, Sparkles, Loader2, CheckCircle2, Video } from "lucide-react";

interface ManimVideoEmbedProps {
  lessonTitle: string;
  defaultPrompt?: string;
}

export default function ManimVideoEmbed({ 
  lessonTitle, 
  defaultPrompt = "Tạo video animation Manim mô phỏng sơ đồ 3 bước xử lý thông tin của máy tính: Tiếp nhận dữ liệu (Input: Bàn phím/Camera) -> Xử lý dữ liệu (CPU/RAM biến đổi bit) -> Đưa ra kết quả (Output: Màn hình/Ổ cứng 1TB)."
}: ManimVideoEmbedProps) {
  const [prompt, setPrompt] = useState<string>(defaultPrompt);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const handleGenerateManim = async () => {
    setIsGenerating(true);
    setStatusMsg("AI đang viết kịch bản Manim Python...");
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
      // 1. Generate code
      const codeRes = await fetch(`${apiBase}/api/manim/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!codeRes.ok) throw new Error("Không thể sinh mã Manim");
      const { code } = await codeRes.json();

      // 2. Render code
      setStatusMsg("Manim Engine đang render video hoạt họa MP4...");
      const renderRes = await fetch(`${apiBase}/api/manim/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });

      if (!renderRes.ok) throw new Error("Lỗi render video Manim");
      const { video_url } = await renderRes.json();
      setVideoUrl(`${apiBase}${video_url}`);
      setStatusMsg("Render video hoàn tất!");
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`⚠️ Sử dụng video hoạt họa mô phỏng chuẩn có sẵn`);
      // Fallback to pre-rendered educational animation or sample video
      setVideoUrl("/media/manim_tin10_bai1.mp4");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-bg-card border border-border-card shadow-xl space-y-5">
      <div className="flex items-center justify-between border-b border-border-card pb-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Manim Animation Studio</span>
          <h3 className="text-lg sm:text-xl font-black text-text-primary flex items-center gap-2 mt-0.5">
            <Clapperboard className="w-5 h-5 text-indigo-400" /> Video Hoạt Họa Mô Phỏng Trực Quan
          </h3>
        </div>
        <button
          onClick={handleGenerateManim}
          disabled={isGenerating}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 hover:opacity-95 transition flex items-center gap-1.5 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {isGenerating ? "Đang tạo video..." : "✨ Tạo Video Hoạt Họa Mới"}
        </button>
      </div>

      {statusMsg && (
        <p className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {statusMsg}
        </p>
      )}

      {/* Video Display Area / Simulation Player */}
      <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-border-card shadow-2xl relative flex items-center justify-center group">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          /* Interactive Animated Canvas / Graphic Representation */
          <div className="p-6 text-center space-y-6 max-w-lg w-full">
            <div className="flex items-center justify-center gap-4">
              <div className="p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-center animate-pulse">
                <span className="text-3xl block mb-1">⌨️</span>
                <p className="text-xs font-bold text-indigo-300">Dữ liệu vào</p>
                <p className="text-[10px] text-slate-400 font-mono">01001001...</p>
              </div>
              <div className="text-2xl text-indigo-400 font-bold animate-bounce">➔</div>
              <div className="p-4 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-center scale-110 shadow-xl shadow-purple-500/20">
                <span className="text-3xl block mb-1">🧠</span>
                <p className="text-xs font-bold text-purple-300">CPU Xử lý</p>
                <p className="text-[10px] text-purple-400 font-mono">Biến đổi Bit</p>
              </div>
              <div className="text-2xl text-emerald-400 font-bold animate-bounce">➔</div>
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center animate-pulse">
                <span className="text-3xl block mb-1">🖥️</span>
                <p className="text-xs font-bold text-emerald-300">Thông tin ra</p>
                <p className="text-[10px] text-slate-400 font-mono">Ý nghĩa / Tri thức</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 italic">
              Bấm nút "Tạo Video Hoạt Họa Mới" để Manim render mô phỏng đồ họa chuyển động động học theo thời gian thực!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
