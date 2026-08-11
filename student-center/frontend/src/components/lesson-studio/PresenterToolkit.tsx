"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { 
  PenTool, 
  Eraser, 
  Trash2, 
  Radio, 
  Clock, 
  Dices, 
  Volume2, 
  X, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react";

interface PresenterToolkitProps {
  students?: string[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export default function PresenterToolkit({ 
  students = ["Nguyễn Văn An", "Trần Thị Bình", "Lê Minh Cường", "Phạm Thu Dung", "Hoàng Văn Em", "Vũ Hoàng Giang", "Đặng Thị Hoa", "Bùi Tuấn Kiệt", "Đỗ Quỳnh Mai", "Ngô Bảo Nam"],
  isFullscreen,
  onToggleFullscreen
}: PresenterToolkitProps) {
  // Tools state
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false);
  const [isLaserMode, setIsLaserMode] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>("#f43f5e"); // Red
  const [penSize, setPenSize] = useState<number>(4);

  // Modals
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [showWheelModal, setShowWheelModal] = useState<boolean>(false);
  const [showSoundModal, setShowSoundModal] = useState<boolean>(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);

  // Wheel State
  const [spinning, setSpinning] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Canvas drawing refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef<boolean>(false);

  // Laser position
  const [laserPos, setLaserPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });

  // Web Audio Context Synthesizer for SFX
  const playSFX = (type: "correct" | "wrong" | "applause" | "beep" | "drum") => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;

      if (type === "correct") {
        // High pleasant ding
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === "wrong") {
        // Low buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === "beep") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "applause") {
        // Synthesized noise cheer
        const bufferSize = ctx.sampleRate * 1.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      }
    } catch (e) {
      console.warn("Audio Context not supported:", e);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            playSFX("beep");
            setTimerRunning(false);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  // Laser pointer move
  useEffect(() => {
    if (!isLaserMode) return;
    const handleMouseMove = (e: MouseEvent) => {
      setLaserPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isLaserMode]);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDrawingMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX, e.clientY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !isDrawingMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Spin Random Wheel
  const spinWheel = () => {
    if (spinning || students.length === 0) return;
    setSpinning(true);
    setSelectedStudent(null);
    let count = 0;
    const maxFlips = 25;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * students.length);
      setSelectedStudent(students[randIdx]);
      count++;
      playSFX("beep");
      if (count >= maxFlips) {
        clearInterval(interval);
        setSpinning(false);
        playSFX("applause");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    }, 100);
  };

  return (
    <>
      {/* ── DRAWING CANVAS OVERLAY ── */}
      {isDrawingMode && (
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="fixed inset-0 z-40 cursor-crosshair touch-none"
        />
      )}

      {/* ── LASER POINTER OVERLAY ── */}
      {isLaserMode && (
        <div
          className="fixed z-50 pointer-events-none w-6 h-6 rounded-full bg-red-500 shadow-[0_0_20px_6px_rgba(239,68,68,0.9)] -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ left: laserPos.x, top: laserPos.y }}
        />
      )}

      {/* ── TOOLKIT FLOATING BAR (BOTTOM RIGHT) ── */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-1.5 p-2 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-xl">
        
        {/* Drawing Pen */}
        <button
          onClick={() => {
            setIsDrawingMode(!isDrawingMode);
            setIsLaserMode(false);
          }}
          className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
            isDrawingMode ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-slate-300 hover:bg-slate-800"
          }`}
          title="Bút vẽ trực tiếp lên slide (Smartboard)"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* Color Palette (When Drawing) */}
        {isDrawingMode && (
          <div className="flex items-center gap-1 pl-1 border-l border-slate-700">
            {["#f43f5e", "#10b981", "#3b82f6", "#f59e0b", "#ffffff"].map(c => (
              <button
                key={c}
                onClick={() => setPenColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${penColor === c ? "scale-125 border-white shadow-md" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <button
              onClick={clearCanvas}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition ml-1"
              title="Xoá tất cả nét vẽ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Laser Pointer */}
        <button
          onClick={() => {
            setIsLaserMode(!isLaserMode);
            setIsDrawingMode(false);
          }}
          className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
            isLaserMode ? "bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse" : "text-slate-300 hover:bg-slate-800"
          }`}
          title="Con trỏ Laser đỏ"
        >
          <Radio className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-6 bg-slate-700 mx-0.5" />

        {/* Random Wheel */}
        <button
          onClick={() => setShowWheelModal(true)}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
          title="Vòng quay gọi học sinh ngẫu nhiên"
        >
          <Dices className="w-4 h-4 text-amber-400" />
        </button>

        {/* Countdown Timer */}
        <button
          onClick={() => setShowTimerModal(true)}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
          title="Đồng hồ đếm ngược thảo luận"
        >
          <Clock className="w-4 h-4 text-indigo-400" />
        </button>

        {/* Sound Effects Board */}
        <button
          onClick={() => setShowSoundModal(true)}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
          title="Hiệu ứng âm thanh lớp học"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-bold transition"
          title="Toàn màn hình giảng dạy (Presenter Mode)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* ── MODAL: COUNTDOWN TIMER ── */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Đếm ngược thảo luận
              </span>
              <button onClick={() => setShowTimerModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Display */}
            <div className="py-4">
              <span className={`font-mono text-5xl font-black ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Quick Set */}
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 120, 300].map(s => (
                <button
                  key={s}
                  onClick={() => { setTimeLeft(s); setTimerRunning(false); }}
                  className="py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition"
                >
                  {s < 60 ? `${s}s` : `${s / 60}p`}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition ${
                  timerRunning ? "bg-amber-500 text-white shadow-amber-500/30" : "bg-indigo-600 text-white shadow-indigo-600/30"
                }`}
              >
                {timerRunning ? <><Pause className="w-4 h-4" /> Tạm dừng</> : <><Play className="w-4 h-4" /> Bắt đầu</>}
              </button>
              <button
                onClick={() => { setTimeLeft(60); setTimerRunning(false); }}
                className="p-3 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Đặt lại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RANDOM STUDENT PICKER ── */}
      {showWheelModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Dices className="w-4 h-4" /> Gọi tên ngẫu nhiên
              </span>
              <button onClick={() => setShowWheelModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-500/30 min-h-[140px] flex items-center justify-center">
              {selectedStudent ? (
                <div className="animate-in zoom-in-50">
                  <p className="text-xs text-amber-400 font-bold uppercase tracking-widest mb-1">Học sinh được chọn:</p>
                  <p className="text-2xl font-black text-white">{selectedStudent}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">Bấm quay để chọn ngẫu nhiên học sinh trả lời</p>
              )}
            </div>

            <button
              onClick={spinWheel}
              disabled={spinning}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-sm shadow-lg shadow-amber-500/30 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> {spinning ? "Đang quay..." : "🎲 Quay Gọi Tên"}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: SOUND EFFECTS BOARD ── */}
      {showSoundModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xs w-full bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> Âm thanh lớp học
              </span>
              <button onClick={() => setShowSoundModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => playSFX("correct")}
                className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white transition font-bold text-xs flex flex-col items-center gap-1.5 shadow-sm"
              >
                <span className="text-2xl">🔔</span>
                <span>Trả lời đúng</span>
              </button>
              <button
                onClick={() => playSFX("wrong")}
                className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white transition font-bold text-xs flex flex-col items-center gap-1.5 shadow-sm"
              >
                <span className="text-2xl">❌</span>
                <span>Trả lời sai</span>
              </button>
              <button
                onClick={() => playSFX("applause")}
                className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white transition font-bold text-xs flex flex-col items-center gap-1.5 shadow-sm col-span-2"
              >
                <span className="text-2xl">👏</span>
                <span>Vỗ tay khen thưởng (Applause)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
