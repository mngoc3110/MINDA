"use client";

import React, { useState } from "react";
import { HardDrive, BookOpen, Film, Music, Globe, Database, Cpu, Sparkles, Layers } from "lucide-react";

interface UnitItem {
  id: string;
  name: string;
  symbol: string;
  bytes: string;
  calc: string;
  analogy: string;
  icon: any;
  color: string;
  bgGradient: string;
}

const UNITS: UnitItem[] = [
  { id: "bit", name: "Bit", symbol: "b", bytes: "1/8 Byte (0 hoặc 1)", calc: "Đơn vị nhỏ nhất trong máy tính", analogy: "Tương đương 1 công tắc bóng đèn BẬT/TẮT", icon: Cpu, color: "text-rose-400", bgGradient: "from-rose-500/20 to-pink-500/10" },
  { id: "byte", name: "Byte", symbol: "B", bytes: "8 bits", calc: "1 Byte = 8 bits (2³ bits)", analogy: "Tương đương 1 ký tự chữ cái (Ví dụ: 'A', 'M')", icon: Layers, color: "text-pink-400", bgGradient: "from-pink-500/20 to-purple-500/10" },
  { id: "kb", name: "Kilobyte", symbol: "KB", bytes: "1,024 Bytes", calc: "1 KB = 1024 B = 2¹⁰ Byte", analogy: "Tương đương 1 trang văn bản Word ngắn không hình", icon: BookOpen, color: "text-purple-400", bgGradient: "from-purple-500/20 to-indigo-500/10" },
  { id: "mb", name: "Megabyte", symbol: "MB", bytes: "1,048,576 Bytes", calc: "1 MB = 1024 KB = 2²⁰ Byte", analogy: "Tương đương 1 cuốn sách tiểu thuyết dày 500 trang hoặc 1 bài hát MP3", icon: Music, color: "text-indigo-400", bgGradient: "from-indigo-500/20 to-blue-500/10" },
  { id: "gb", name: "Gigabyte", symbol: "GB", bytes: "1,073,741,824 Bytes", calc: "1 GB = 1024 MB = 2³⁰ Byte", analogy: "Tương đương 1 tập phim HD 720p hoặc ~250 bài hát MP3 chất lượng cao", icon: Film, color: "text-blue-400", bgGradient: "from-blue-500/20 to-cyan-500/10" },
  { id: "tb", name: "Terabyte", symbol: "TB", bytes: "1,099,511,627,776 Bytes", calc: "1 TB = 1024 GB = 2⁴⁰ Byte", analogy: "Tương đương thư viện sách của cả trường đại học hoặc 250.000 bức ảnh", icon: HardDrive, color: "text-cyan-400", bgGradient: "from-cyan-500/20 to-teal-500/10" },
  { id: "pb", name: "Petabyte", symbol: "PB", bytes: "1,125,899,906,842,624 Bytes", calc: "1 PB = 1024 TB = 2⁵⁰ Byte", analogy: "Tương đương toàn bộ kho tài liệu của Thư viện Quốc hội Mỹ (20 triệu cuốn sách)", icon: Database, color: "text-emerald-400", bgGradient: "from-emerald-500/20 to-green-500/10" },
  { id: "eb", name: "Exabyte", symbol: "EB", bytes: "1,152,921,504,606,846,976 Bytes", calc: "1 EB = 1024 PB = 2⁶⁰ Byte", analogy: "Tương đương tổng dung lượng video được truyền trên Internet toàn cầu trong 1 năm", icon: Globe, color: "text-amber-400", bgGradient: "from-amber-500/20 to-yellow-500/10" },
  { id: "zb", name: "Zettabyte / YB", symbol: "ZB / YB", bytes: "2⁷⁰ ~ 2⁸⁰ Bytes", calc: "1 ZB = 1024 EB | 1 YB = 1024 ZB", analogy: "Toàn bộ kho dữ liệu số của toàn thế giới nhân loại tạo ra", icon: Sparkles, color: "text-rose-500", bgGradient: "from-rose-500/30 to-amber-500/20" }
];

export default function InteractiveUnitScale() {
  const [currentIndex, setCurrentIndex] = useState<number>(3); // Default Megabyte
  const current = UNITS[currentIndex];
  const Icon = current.icon;

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-bg-card border border-border-card shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-card pb-4">
        <div>
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest block">Mô hình Tương Tác Trực Quan</span>
          <h3 className="text-lg sm:text-xl font-black text-text-primary flex items-center gap-2 mt-0.5">
            <span>📏</span> Thang Đo Đơn Vị Lưu Trữ Dữ Liệu (Hệ số 2¹⁰ = 1024)
          </h3>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold w-fit">
          Bậc thang {currentIndex + 1} / {UNITS.length}
        </div>
      </div>

      {/* Slider Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-black text-text-secondary px-1">
          {UNITS.map((u, i) => (
            <button
              key={u.id}
              onClick={() => setCurrentIndex(i)}
              className={`transition-colors font-mono ${currentIndex === i ? "text-rose-500 font-bold scale-110" : "hover:text-text-primary"}`}
            >
              {u.symbol}
            </button>
          ))}
        </div>
        <input
          type="range"
          min="0"
          max={UNITS.length - 1}
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
          className="w-full h-3 bg-bg-main rounded-lg appearance-none cursor-pointer accent-rose-500 border border-border-card"
        />
      </div>

      {/* Card Info Display */}
      <div className={`p-6 rounded-2xl border border-border-card bg-gradient-to-br ${current.bgGradient} transition-all duration-300 relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-bg-card/90 border border-border-card flex items-center justify-center ${current.color} shadow-lg shrink-0`}>
              <Icon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-2xl font-black text-text-primary">{current.name}</h4>
                <span className={`text-sm font-bold font-mono px-2 py-0.5 rounded-md bg-bg-card/80 border border-border-card ${current.color}`}>
                  {current.symbol}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-rose-400 font-bold mt-1">
                {current.calc}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto p-3.5 rounded-xl bg-bg-card/80 border border-border-card text-left sm:text-right">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Ví dụ thực tế:</span>
            <p className="text-xs sm:text-sm font-semibold text-text-primary mt-0.5 max-w-sm">
              {current.analogy}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-card/50 flex flex-wrap items-center justify-between gap-2 text-xs text-text-secondary">
          <span>Quy đổi chính xác ra Byte: <strong className="text-text-primary font-mono">{current.bytes}</strong></span>
          <span className="text-[11px] text-rose-400">💡 Gấp 1024 lần đơn vị liền trước</span>
        </div>
      </div>
    </div>
  );
}
