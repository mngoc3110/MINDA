"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, RotateCcw, Award, Sparkles, HelpCircle } from "lucide-react";

interface PairItem {
  left: string;
  right: string;
  hint: string;
}

const PAIRS: PairItem[] = [
  { left: "3 MB", right: "3072 KB", hint: "3 × 1024 KB" },
  { left: "2 GB", right: "2097152 KB", hint: "2 × 1024 × 1024 KB" },
  { left: "2048 B", right: "2 KB", hint: "2048 / 1024 Byte" },
  { left: "1 Byte", right: "8 bit", hint: "1 Byte = 8 bit" },
];

export default function DragDropGame() {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [wrongPair, setWrongPair] = useState<string | null>(null);

  // Shuffle right choices
  const [rightItems] = useState(() => [...PAIRS.map(p => p.right)].sort(() => Math.random() - 0.5));

  const handleSelectLeft = (leftVal: string) => {
    if (matches[leftVal]) return;
    setSelectedLeft(leftVal);
    setWrongPair(null);
  };

  const handleSelectRight = (rightVal: string) => {
    if (!selectedLeft) return;

    const expected = PAIRS.find(p => p.left === selectedLeft)?.right;
    if (expected === rightVal) {
      const newMatches = { ...matches, [selectedLeft]: rightVal };
      setMatches(newMatches);
      setSelectedLeft(null);
      setWrongPair(null);

      // Play success confetti if all paired
      if (Object.keys(newMatches).length === PAIRS.length) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    } else {
      setWrongPair(rightVal);
      setTimeout(() => setWrongPair(null), 1000);
    }
  };

  const resetGame = () => {
    setMatches({});
    setSelectedLeft(null);
    setWrongPair(null);
  };

  const isCompleted = Object.keys(matches).length === PAIRS.length;

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-bg-card border border-border-card shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-border-card pb-4">
        <div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block">Trò chơi Tương Tác</span>
          <h3 className="text-lg sm:text-xl font-black text-text-primary flex items-center gap-2 mt-0.5">
            <span>🧩</span> Ghép Cặp Quy Đổi Đơn Vị (SGK Tin 10 Trang 8)
          </h3>
        </div>
        <button
          onClick={resetGame}
          className="p-2 rounded-xl bg-bg-hover hover:bg-rose-500/10 text-text-secondary hover:text-rose-500 transition flex items-center gap-1.5 text-xs font-bold"
          title="Chơi lại"
        >
          <RotateCcw className="w-4 h-4" /> Chơi lại
        </button>
      </div>

      <p className="text-xs sm:text-sm text-text-secondary">
        👉 <strong>Cách chơi:</strong> Bấm chọn 1 đơn vị ở cột bên trái, sau đó bấm chọn giá trị tương đương ở cột bên phải để hoàn thành ghép nối.
      </p>

      {/* Matching Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8">
        {/* Left Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Đơn vị cần đổi</h4>
          {PAIRS.map(p => {
            const isMatched = !!matches[p.left];
            const isSelected = selectedLeft === p.left;
            return (
              <button
                key={p.left}
                onClick={() => handleSelectLeft(p.left)}
                disabled={isMatched}
                className={`w-full p-4 rounded-2xl border text-sm font-black text-center transition-all flex items-center justify-between ${
                  isMatched
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 opacity-60"
                    : isSelected
                    ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30 scale-105"
                    : "bg-bg-main border-border-card text-text-primary hover:border-rose-500/50 hover:bg-bg-hover"
                }`}
              >
                <span>{p.left}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider text-center">Giá trị quy đổi</h4>
          {rightItems.map(rightVal => {
            const isMatched = Object.values(matches).includes(rightVal);
            const isWrong = wrongPair === rightVal;
            return (
              <button
                key={rightVal}
                onClick={() => handleSelectRight(rightVal)}
                disabled={isMatched}
                className={`w-full p-4 rounded-2xl border text-sm font-black text-center transition-all flex items-center justify-between ${
                  isMatched
                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 opacity-60"
                    : isWrong
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-shake"
                    : "bg-bg-main border-border-card text-text-primary hover:border-emerald-500/50 hover:bg-bg-hover"
                }`}
              >
                <span>{rightVal}</span>
                {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Box */}
      {isCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl shadow-lg shrink-0">
            🏆
          </div>
          <div>
            <h4 className="text-base font-black text-emerald-400">Xuất sắc! Bạn đã quy đổi đúng 100% các đơn vị!</h4>
            <p className="text-xs text-text-secondary mt-0.5">
              Ghi nhớ: $1\text{ Byte} = 8\text{ bit}$, $1\text{ KB} = 1024\text{ B}$, $1\text{ MB} = 1024\text{ KB}$, $1\text{ GB} = 1024\text{ MB}$.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
