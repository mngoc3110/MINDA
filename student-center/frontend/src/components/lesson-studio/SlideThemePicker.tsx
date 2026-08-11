"use client";

import React from "react";
import { Palette, Sparkles, Sun, Moon, Zap, Orbit } from "lucide-react";

export type SlideTheme = "cyber-neon" | "playful-pastel" | "cosmic-aurora" | "clean-modern";

interface ThemeOption {
  id: SlideTheme;
  name: string;
  desc: string;
  icon: any;
  previewBg: string;
  previewBorder: string;
  textColor: string;
  accentBadge: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "cyber-neon",
    name: "⚡ Cyber Neon",
    desc: "Đậm chất công nghệ, hiệu ứng phát sáng Neon Cyberpunk",
    icon: Zap,
    previewBg: "bg-slate-950",
    previewBorder: "border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]",
    textColor: "text-white",
    accentBadge: "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white"
  },
  {
    id: "playful-pastel",
    name: "🎨 Playful Kahoot",
    desc: "Màu sắc rực rỡ vui nhộn, khối bo tròn tươi sáng",
    icon: Sparkles,
    previewBg: "bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-indigo-500/10",
    previewBorder: "border-amber-400 shadow-lg shadow-amber-500/20",
    textColor: "text-slate-900 dark:text-white",
    accentBadge: "bg-gradient-to-r from-amber-400 to-rose-500 text-white"
  },
  {
    id: "cosmic-aurora",
    name: "🌌 Cosmic Aurora",
    desc: "Cực quang vũ trụ tím - lam mờ ảo chuẩn Apple Keynote",
    icon: Orbit,
    previewBg: "bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950",
    previewBorder: "border-indigo-500/40 shadow-2xl shadow-indigo-500/30",
    textColor: "text-white",
    accentBadge: "bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 text-white"
  },
  {
    id: "clean-modern",
    name: "☀️ Clean Modern",
    desc: "Tươi sáng, rõ nét, tối ưu cho máy chiếu ban ngày",
    icon: Sun,
    previewBg: "bg-slate-50 dark:bg-slate-900",
    previewBorder: "border-slate-300 dark:border-slate-700 shadow-md",
    textColor: "text-slate-800 dark:text-slate-100",
    accentBadge: "bg-rose-500 text-white"
  }
];

interface SlideThemePickerProps {
  currentTheme: SlideTheme;
  onSelectTheme: (theme: SlideTheme) => void;
}

export default function SlideThemePicker({ currentTheme, onSelectTheme }: SlideThemeProps) {
  return (
    <div className="flex items-center gap-1.5 bg-bg-card p-1.5 rounded-2xl border border-border-card shadow-sm">
      <div className="hidden sm:flex items-center gap-1.5 px-2 text-xs font-bold text-text-secondary">
        <Palette className="w-3.5 h-3.5 text-rose-500" />
        <span>Giao diện:</span>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {THEMES.map((t) => {
          const isSelected = currentTheme === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTheme(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
              title={t.desc}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
