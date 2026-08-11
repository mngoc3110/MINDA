"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  HardDrive, 
  Layers, 
  Award, 
  Clock, 
  Zap, 
  HelpCircle, 
  Flame,
  Dices,
  RefreshCw,
  Gift
} from "lucide-react";

import { SlideData } from "@/lib/pptxExporter";
import { SlideTheme } from "./SlideThemePicker";
import InteractiveUnitScale from "./InteractiveUnitScale";
import DragDropGame from "./DragDropGame";

interface InteractiveSlideViewerProps {
  slide: SlideData;
  slideIndex: number;
  totalSlides: number;
  theme: SlideTheme;
}

export default function InteractiveSlideViewer({
  slide,
  slideIndex,
  totalSlides,
  theme
}: InteractiveSlideViewerProps) {
  // Mini-game 1: Sorter card flip
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Mini-game 2: Bit Simulation state (Input -> CPU -> Output)
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);

  // Mini-game 3: Quick Quiz on Slide
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  // Mini-game 4: Mystery Box Reward
  const [openedBox, setOpenedBox] = useState<boolean>(false);

  // Play audio Ding / Buzzer
  const playSound = (isCorrect: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isCorrect) {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.setValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  };

  // Run bit stream simulation
  const runBitSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);
    playSound(true);

    setTimeout(() => {
      setSimStep(2);
      playSound(true);
    }, 1200);

    setTimeout(() => {
      setSimStep(3);
      playSound(true);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setIsSimulating(false);
    }, 2400);
  };

  // Theme styling helpers
  const getThemeContainerStyle = () => {
    switch (theme) {
      case "cyber-neon":
        return "bg-slate-950 border-fuchsia-500/40 shadow-[0_0_35px_rgba(217,70,239,0.25)] text-white";
      case "playful-pastel":
        return "bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 dark:from-slate-900 dark:via-purple-950 dark:to-slate-950 border-amber-400 shadow-2xl text-slate-900 dark:text-white";
      case "cosmic-aurora":
        return "bg-gradient-to-br from-slate-950 via-purple-950/80 to-indigo-950 border-indigo-500/40 shadow-2xl shadow-indigo-500/20 text-white";
      case "clean-modern":
      default:
        return "bg-bg-card border-border-card shadow-xl text-text-primary";
    }
  };

  const getBadgeStyle = () => {
    switch (theme) {
      case "cyber-neon":
        return "bg-gradient-to-r from-fuchsia-500 via-pink-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.5)]";
      case "playful-pastel":
        return "bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-500 text-white shadow-md shadow-amber-500/30";
      case "cosmic-aurora":
        return "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 text-white shadow-lg shadow-purple-500/30";
      case "clean-modern":
      default:
        return "bg-rose-500 text-white";
    }
  };

  return (
    <div className={`w-full aspect-[16/9] rounded-3xl p-6 sm:p-10 flex flex-col justify-between border-2 transition-all duration-500 relative overflow-hidden select-none ${getThemeContainerStyle()}`}>
      
      {/* Ambient background glow orbs */}
      {theme === "cyber-neon" && (
        <>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        </>
      )}
      {theme === "playful-pastel" && (
        <div className="absolute top-4 right-4 flex gap-2 text-2xl opacity-40 pointer-events-none">
          <span>🌟</span><span>🎈</span><span>🎯</span><span>🚀</span>
        </div>
      )}

      {/* ── 1. SLIDE HEADER ── */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${getBadgeStyle()}`}>
              {slide.badge}
            </span>
            {slide.activityType === "expansion" && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1 animate-bounce">
                <Sparkles className="w-3 h-3" /> MỞ RỘNG NGOÀI SGK
              </span>
            )}
          </div>
          <span className="font-mono text-xs font-black opacity-60">
            Slide {slideIndex + 1} / {totalSlides}
          </span>
        </div>

        <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-xs sm:text-sm font-semibold opacity-75 italic">
            {slide.subtitle}
          </p>
        )}
      </div>

      {/* ── 2. SLIDE INTERACTIVE BODY CONTENT ── */}
      <div className="my-auto py-2 space-y-4 relative z-10 overflow-y-auto max-h-[64%] custom-scrollbar">

        {/* ── EMBEDDED GAME A: BIT STREAM INTERACTIVE SIMULATION (FOR SLIDE 4) ── */}
        {slide.slideNumber === 4 && (
          <div className="p-4 sm:p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Mô Phỏng Tương Tác: Luồng Dữ Liệu Chạy Trong Máy Tính
              </span>
              <button
                onClick={runBitSimulation}
                disabled={isSimulating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:scale-105 text-white text-xs font-black transition shadow-lg shadow-rose-500/30 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                {isSimulating ? "Đang chạy luồng..." : "▶️ Bấm Chạy Mô Phỏng"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              {/* Step 1 */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simStep === 1 
                  ? "bg-indigo-500/30 border-indigo-400 scale-105 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                  : "bg-white/5 border-white/10 opacity-70"
              }`}>
                <span className="text-3xl block mb-1">⌨️</span>
                <h4 className="text-xs font-black text-indigo-300">1. Tiếp nhận (Input)</h4>
                <p className="text-[10px] text-slate-300 font-mono mt-1">
                  {simStep >= 1 ? "01001001 01001110..." : "Chờ nhập liệu..."}
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simStep === 2 
                  ? "bg-purple-500/30 border-purple-400 scale-110 shadow-[0_0_25px_rgba(168,85,247,0.6)] animate-pulse" 
                  : "bg-white/5 border-white/10 opacity-70"
              }`}>
                <span className="text-3xl block mb-1">🧠</span>
                <h4 className="text-xs font-black text-purple-300">2. CPU Xử lý</h4>
                <p className="text-[10px] text-purple-200 font-mono mt-1">
                  {simStep >= 2 ? "Biến đổi & Thuật toán..." : "Chờ dữ liệu..."}
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                simStep === 3 
                  ? "bg-emerald-500/30 border-emerald-400 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.6)]" 
                  : "bg-white/5 border-white/10 opacity-70"
              }`}>
                <span className="text-3xl block mb-1">🖥️</span>
                <h4 className="text-xs font-black text-emerald-300">3. Xuất kết quả (Output)</h4>
                <p className="text-[10px] text-emerald-200 font-mono mt-1">
                  {simStep === 3 ? "🎉 Thông tin hữu ích!" : "Chờ kết quả..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── EMBEDDED GAME B: INTERACTIVE UNIT SCALE (FOR SLIDE 6) ── */}
        {slide.slideNumber === 6 && (
          <div className="animate-in fade-in">
            <InteractiveUnitScale />
          </div>
        )}

        {/* ── EMBEDDED GAME C: DRAG & DROP GAME (FOR SLIDE 11) ── */}
        {slide.slideNumber === 11 && (
          <div className="animate-in fade-in">
            <DragDropGame />
          </div>
        )}

        {/* ── EMBEDDED GAME D: CARD FLIP SURPRISE (FOR SLIDE 2 & 3) ── */}
        {(slide.slideNumber === 2 || slide.slideNumber === 3) && slide.cards && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {slide.cards.map((c, i) => {
              const isFlipped = flippedCards[`card-${i}`];
              return (
                <div
                  key={i}
                  onClick={() => {
                    setFlippedCards(prev => ({ ...prev, [`card-${i}`]: !isFlipped }));
                    playSound(true);
                  }}
                  className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none space-y-1.5 shadow-lg ${
                    isFlipped 
                      ? "bg-rose-500/20 border-rose-500 scale-105 shadow-rose-500/20" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{c.icon}</span>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-white/10 opacity-70">
                      {isFlipped ? "Đã lật" : "Bấm để lật thẻ"}
                    </span>
                  </div>
                  <h4 className="font-black text-xs sm:text-sm">{c.title}</h4>
                  <p className="text-[11px] sm:text-xs opacity-80 leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── EMBEDDED GAME E: QUICK QUIZ (FOR SLIDE 12) ── */}
        {slide.slideNumber === 12 && (
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4" /> Thử Thách Trắc Nghiệm Nhanh
              </span>
              <span className="text-xs font-bold opacity-60">16 GB = ? MB</span>
            </div>
            <p className="text-xs sm:text-sm font-bold">Thẻ nhớ 16 GB chứa tối đa bao nhiêu bức ảnh 10 MB?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { ans: "A. 160 ảnh", correct: false },
                { ans: "B. 1000 ảnh", correct: false },
                { ans: "C. 1.638 ảnh", correct: true },
                { ans: "D. 16.000 ảnh", correct: false }
              ].map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuizAnswered(idx);
                    playSound(opt.correct);
                  }}
                  className={`p-3 rounded-xl border text-xs font-black transition-all ${
                    quizAnswered === idx
                      ? opt.correct
                        ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40 scale-105"
                        : "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/40"
                      : "bg-white/5 hover:bg-white/15 border-white/10"
                  }`}
                >
                  {opt.ans}
                </button>
              ))}
            </div>
            {quizAnswered !== null && (
              <p className="text-xs text-emerald-400 font-bold animate-in fade-in">
                {quizAnswered === 2 ? "🎉 Chuẩn xác! 16 GB = 16.384 MB ➔ 16.384 / 10 ≈ 1.638 ảnh." : "❌ Hãy xem lại: 16 GB = 16 × 1024 MB = 16.384 MB nhé!"}
              </p>
            )}
          </div>
        )}

        {/* ── STANDARD CARDS (FOR OTHER SLIDES) ── */}
        {!([2, 3, 4, 6, 11, 12].includes(slide.slideNumber)) && slide.cards && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {slide.cards.map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all space-y-1.5 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{c.icon}</span>
                  <h4 className="font-black text-xs sm:text-sm">{c.title}</h4>
                </div>
                <p className="text-[11px] sm:text-xs opacity-80 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── BULLET POINTS (FOR STANDARD CONTENT SLIDES) ── */}
        {slide.bulletPoints && !([6, 11].includes(slide.slideNumber)) && (
          <ul className="space-y-2 text-xs sm:text-sm lg:text-base">
            {slide.bulletPoints.map((bp, i) => (
              <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-rose-400 font-bold mt-1">▸</span>
                <span>{bp}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ── COMPARISON BOX ── */}
        {slide.comparison && slide.slideNumber !== 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <h4 className="font-black text-sm text-rose-400">{slide.comparison.leftTitle}</h4>
              <p className="text-xs whitespace-pre-line leading-relaxed opacity-90">{slide.comparison.leftContent}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <h4 className="font-black text-sm text-emerald-400">{slide.comparison.rightTitle}</h4>
              <p className="text-xs whitespace-pre-line leading-relaxed opacity-90">{slide.comparison.rightContent}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. SLIDE FOOTER CALLOUT / MYSTERY BOX ── */}
      <div className="relative z-10 pt-2 flex items-center justify-between gap-3">
        {slide.callout ? (
          <div className="flex-1 p-3 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-xs flex items-center gap-2 text-indigo-300">
            <span className="text-base">💡</span>
            <p><strong>{slide.callout.title}:</strong> {slide.callout.content}</p>
          </div>
        ) : (
          <div />
        )}

        {/* Lucky Mystery Box button on slide */}
        <button
          onClick={() => {
            setOpenedBox(!openedBox);
            playSound(true);
            confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-black transition hover:scale-105 shadow-md shadow-amber-500/30 flex items-center gap-1.5 shrink-0"
          title="Hộp quà bí mật khen thưởng học sinh"
        >
          <Gift className="w-4 h-4 animate-bounce" />
          <span>{openedBox ? "🎁 +100 Điểm Thưởng!" : "Mở Quà Bí Mật"}</span>
        </button>
      </div>
    </div>
  );
}
