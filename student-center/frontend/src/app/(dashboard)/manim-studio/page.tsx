"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { 
  Play, 
  Code2, 
  Wand2, 
  Save, 
  Download, 
  Loader2,
  TerminalSquare,
  Clapperboard
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export default function ManimStudioPage() {
  const { theme } = useTheme();
  const [mode, setMode] = useState<"ai" | "code">("ai");
  const [aiPrompt, setAiPrompt] = useState("");
  const [pythonCode, setPythonCode] = useState(
`from manim import *

class MathAnimation(Scene):
    def construct(self):
        # Tạo một trục tọa độ
        axes = Axes(
            x_range=[-3, 3],
            y_range=[-3, 3],
            axis_config={"color": BLUE},
        )

        # Vẽ đồ thị y = x^2
        graph = axes.plot(lambda x: x**2, color=WHITE)
        
        # Tiêu đề
        title = MathTex("y = x^2")
        title.to_edge(UP)

        self.play(Create(axes))
        self.play(Write(title))
        self.play(Create(graph), run_time=2)
        self.wait(2)
`
  );
  
  const [isRendering, setIsRendering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRender = async () => {
    setIsRendering(true);
    setVideoUrl(null);
    setErrorMsg(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/manim/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pythonCode }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Render thất bại");
      }
      
      const data = await response.json();
      setVideoUrl(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${data.video_url}`);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsRendering(false);
    }
  };

  const editorTheme = theme === "dark" ? "vs-dark" : "light";

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-bg-main text-text-primary overflow-hidden font-outfit">
      
      {/* LEFT PANEL */}
      <div className="w-1/2 flex flex-col border-r border-border-card">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-card bg-bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Clapperboard className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-base font-black text-text-primary leading-none">Manim Studio</h1>
              <p className="text-[10px] text-text-muted mt-0.5">Tạo video toán học bằng AI</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-bg-hover rounded-xl p-1 border border-border-card">
            <button
              onClick={() => setMode("ai")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "ai" 
                  ? "bg-indigo-500 text-white shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" /> AI Prompt
            </button>
            <button
              onClick={() => setMode("code")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === "code" 
                  ? "bg-indigo-500 text-white shadow-sm" 
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" /> Code Editor
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mode === "ai" ? (
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-bold text-text-primary block mb-1">Nhập yêu cầu bài toán</label>
                <p className="text-xs text-text-muted">AI sẽ tự động viết code Manim và tạo video cho bạn</p>
              </div>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ví dụ: Vẽ đồ thị y = sin(x) từ -π đến π, bôi màu vùng diện tích dưới trục hoành..."
                className="flex-1 w-full bg-bg-input border border-border-card rounded-xl p-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 resize-none text-sm transition-all"
              />

              {/* Suggested Prompts */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Vẽ đồ thị parabol y = x²",
                  "Vẽ tam giác đều và đường cao",
                  "Minh họa đạo hàm của sin(x)",
                ].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setAiPrompt(p)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-bg-hover border border-border-card text-text-secondary hover:text-indigo-500 hover:border-indigo-500/30 transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={handleRender}
                disabled={isRendering || !aiPrompt.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-500/20"
              >
                {isRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {isRendering ? "Đang tạo video..." : "Tự động tạo Video"}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 border-b border-border-card bg-bg-card flex items-center justify-between">
                <span className="text-xs font-mono text-text-muted">scene.py</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">Python</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <Editor
                  height="100%"
                  defaultLanguage="python"
                  theme={editorTheme}
                  value={pythonCode}
                  onChange={(val) => setPythonCode(val || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    padding: { top: 12 },
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    fontLigatures: true,
                  }}
                />
              </div>
              <div className="p-4 border-t border-border-card bg-bg-card">
                <button
                  onClick={handleRender}
                  disabled={isRendering}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-500/20"
                >
                  {isRendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {isRendering ? "Đang Render..." : "Render Video"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Preview */}
      <div className="w-1/2 flex flex-col">
        <div className="h-[57px] border-b border-border-card flex items-center justify-between px-6 bg-bg-card">
          <h2 className="font-bold flex items-center gap-2 text-text-primary text-sm">
            <Play className="w-4 h-4 text-indigo-500" /> Xem trước Video
          </h2>
        </div>

        <div className="flex-1 p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Video Player */}
          <div className="w-full aspect-video bg-bg-card rounded-2xl border border-border-card overflow-hidden flex items-center justify-center shadow-sm">
            {isRendering ? (
              <div className="flex flex-col items-center gap-4 text-text-muted">
                <div className="relative">
                  <div className="w-14 h-14 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                  <Clapperboard className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-500" />
                </div>
                <p className="font-bold text-sm animate-pulse text-text-secondary">Đang Render Manim Scene...</p>
                <p className="text-xs text-text-muted">Quá trình này mất khoảng 15-30 giây</p>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center gap-3 text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <span className="text-xl">⚠️</span>
                </div>
                <p className="font-bold text-text-primary text-sm">Render thất bại</p>
                <p className="text-xs text-red-500 font-mono max-w-xs break-words">{errorMsg}</p>
              </div>
            ) : videoUrl ? (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-muted">
                <div className="w-14 h-14 rounded-2xl bg-bg-hover border border-border-card flex items-center justify-center">
                  <Clapperboard className="w-7 h-7 text-text-muted" />
                </div>
                <p className="font-semibold text-sm text-text-secondary">Chưa có video</p>
                <p className="text-xs">Nhập prompt hoặc viết code rồi bấm Render</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {videoUrl && !isRendering && (
            <div className="flex gap-3">
              <a
                href={videoUrl}
                download="manim_video.mp4"
                className="flex-1 bg-bg-card hover:bg-bg-hover border border-border-card text-text-primary font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Download className="w-4 h-4" /> Tải xuống (.mp4)
              </a>
              <button className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm shadow-sm shadow-indigo-500/20">
                <Save className="w-4 h-4" /> Lưu vào thư viện
              </button>
            </div>
          )}

          {/* Terminal Logs */}
          <div className="mt-auto bg-bg-card border border-border-card rounded-xl overflow-hidden flex flex-col h-44">
            <div className="border-b border-border-card px-4 py-2 flex items-center gap-2 text-xs font-bold text-text-muted">
              <TerminalSquare className="w-3.5 h-3.5" /> Terminal Logs
            </div>
            <div className="p-4 font-mono text-xs text-emerald-600 dark:text-emerald-400 overflow-y-auto flex-1">
              {isRendering ? (
                <>
                  <p className="text-text-muted">[{new Date().toLocaleTimeString()}] Bắt đầu render...</p>
                  <p className="text-amber-500">Manim Community v0.19.1</p>
                  <p className="animate-pulse mt-1">Rendering MathAnimation → 480p15...</p>
                </>
              ) : errorMsg ? (
                <p className="text-red-500">{errorMsg}</p>
              ) : videoUrl ? (
                <>
                  <p className="text-text-muted">[{new Date().toLocaleTimeString()}] Bắt đầu render...</p>
                  <p className="text-amber-500">Manim Community v0.19.1</p>
                  <p>Rendering MathAnimation → 480p15...</p>
                  <p className="text-emerald-500 mt-1">✓ Render hoàn tất! Video đã sẵn sàng.</p>
                </>
              ) : (
                <p className="text-text-muted">Hệ thống sẵn sàng.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
