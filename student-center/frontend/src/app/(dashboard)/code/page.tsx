"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Code2, Terminal, Trophy, Zap, Lock, ChevronRight,
  Target, Flame, Star, Clock, CheckCircle2, CircleDot,
  ArrowRight, BookOpen, Cpu, Layers, RefreshCw
} from "lucide-react";

// ── Coding Elo Ranks ────────────────────────────────────────────────────────

const CODER_RANKS = [
  { name: "Newbie",    min: 0,    max: 799,  color: "#9ca3af", bg: "rgba(156,163,175,0.1)",  icon: "🔰" },
  { name: "Pupil",     min: 800,  max: 1199, color: "#4ade80", bg: "rgba(74,222,128,0.1)",   icon: "🌿" },
  { name: "Specialist",min: 1200, max: 1399, color: "#22d3ee", bg: "rgba(34,211,238,0.1)",   icon: "💎" },
  { name: "Expert",    min: 1400, max: 1599, color: "#818cf8", bg: "rgba(129,140,248,0.1)",  icon: "🔷" },
  { name: "Candidate", min: 1600, max: 1899, color: "#c084fc", bg: "rgba(192,132,252,0.1)",  icon: "⚡" },
  { name: "Master",    min: 1900, max: 2099, color: "#f59e0b", bg: "rgba(245,158,11,0.1)",   icon: "🏆" },
  { name: "Grandmaster",min:2100, max: 2399, color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: "🔥" },
  { name: "Legend",   min: 2400,  max: null, color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  icon: "👑" },
];

// ── Tracks & Detailed Subject Categories ────────────────────────────────────

const TRACKS = [
  { id: "all",         label: "Tất cả",          icon: "🗂️" },
  { id: "basic",       label: "Tin học cơ bản",   icon: "🌱", desc: "Cú pháp, Vòng lặp, Nhập xuất, Mảng 1D/2D" },
  { id: "cs",          label: "Khoa học máy tính",icon: "💻", desc: "Thuật toán cơ bản, Tìm kiếm nhị phân, Sắp xếp" },
  { id: "competitive", label: "Chuyên Tin (VOI/CP)", icon: "⚔️", desc: "Quy hoạch động, Đồ thị, Cấu trúc dữ liệu" },
  { id: "ptit",        label: "Luyện C++ PTIT",    icon: "🏛️", desc: "Bộ bài tập C++ chuẩn Học viện PTIT" },
  { id: "advanced",    label: "Đại học / Pro",    icon: "🎓", desc: "Segment Tree, String Matching, Graph Pro" },
];

const DIFF_COLORS: Record<string, string> = {
  easy:   "#4ade80",
  medium: "#f59e0b",
  hard:   "#ef4444",
};
const DIFF_LABELS: Record<string, string> = {
  easy: "Dễ", medium: "Trung bình", hard: "Khó",
};

// ── Components ───────────────────────────────────────────────────────────────

function EloRankBadge({ elo = 0 }: { elo?: number }) {
  const rank = CODER_RANKS.find(r => elo >= r.min && (r.max === null || elo <= r.max))
    ?? CODER_RANKS[0];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
      style={{ color: rank.color, background: rank.bg, borderColor: `${rank.color}30` }}
    >
      <span>{rank.icon}</span>{rank.name} · {elo} Elo
    </span>
  );
}

function ProblemRow({ p, idx }: { p: any; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
    >
      <Link
        href={`/code/${p.slug || p.id}`}
        className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/12 transition-all group"
      >
        {/* Status dot */}
        <div className="shrink-0">
          {p.accepted
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <CircleDot className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
          }
        </div>

        {/* Title & tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-text-primary group-hover:text-indigo-300 transition-colors truncate">
              {p.title}
            </p>
            {p.source && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/8 text-indigo-300 border border-white/10 shrink-0">
                {p.source}
              </span>
            )}
          </div>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {p.tags?.map((t: string) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-text-muted border border-white/8">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Rating */}
        <span
          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border hidden sm:inline-flex"
          style={{
            color: CODER_RANKS.find(r => (p.rating || 800) >= r.min && (r.max === null || (p.rating || 800) <= r.max))?.color ?? "#9ca3af",
            borderColor: `${CODER_RANKS.find(r => (p.rating || 800) >= r.min && (r.max === null || (p.rating || 800) <= r.max))?.color ?? "#9ca3af"}30`,
            background: CODER_RANKS.find(r => (p.rating || 800) >= r.min && (r.max === null || (p.rating || 800) <= r.max))?.bg,
          }}
        >
          {p.rating || 800}
        </span>

        {/* Difficulty */}
        <span
          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border hidden md:inline-flex"
          style={{ color: DIFF_COLORS[p.difficulty || "easy"], background: `${DIFF_COLORS[p.difficulty || "easy"]}12`, borderColor: `${DIFF_COLORS[p.difficulty || "easy"]}30` }}
        >
          {DIFF_LABELS[p.difficulty || "easy"]}
        </span>

        {/* Solved count */}
        <span className="shrink-0 text-xs text-text-muted hidden lg:inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" /> {p.solved || 0}
        </span>

        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CodePage() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState<"all" | "easy" | "medium" | "hard">("all");

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/problems`);
      if (res.ok) {
        setProblems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const filtered = problems.filter(p =>
    (track === "all" || p.track === track || (track === "ptit" && p.source?.includes("PTIT"))) &&
    (diff === "all" || p.difficulty === diff)
  );

  const solvedCount = problems.filter(p => p.accepted).length;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">MINDA Code</h1>
              <p className="text-text-muted text-xs">Phân chia phân khúc đề: Tin Học THPT · C++ PTIT · Chuyên Tin (VOI) · LeetCode</p>
            </div>
          </div>

          {/* Elo badge + stats row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <EloRankBadge elo={0} />
            <span className="text-xs text-text-muted px-3 py-1 rounded-full bg-white/5 border border-white/8">
              ✅ {solvedCount}/{problems.length} bài đã giải
            </span>
            <Link
              href="/ranks"
              className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/8 transition-colors flex items-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5" /> Xem bảng rank
            </Link>
          </div>
        </motion.div>

        {/* ── Track quick-access cards ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8"
        >
          {TRACKS.filter(t => t.id !== "all").map((c) => (
            <button
              key={c.id}
              onClick={() => setTrack(c.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all ${track === c.id ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10" : "border-white/8 hover:border-white/16 bg-white/[0.02] hover:bg-white/[0.04]"}`}
            >
              <span className="text-lg block mb-1.5">{c.icon}</span>
              <p className="text-xs font-bold text-text-primary leading-tight mb-1">{c.label}</p>
              <p className="text-[10px] text-text-muted leading-relaxed line-clamp-2">{c.desc}</p>
            </button>
          ))}
        </motion.div>

        {/* ── Filters ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-5"
        >
          {/* Track filter */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/8 overflow-x-auto custom-scrollbar">
            {TRACKS.map(t => (
              <button
                key={t.id}
                onClick={() => setTrack(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${track === t.id ? "bg-white/12 text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Difficulty filter */}
          <div className="flex gap-1.5">
            {(["all", "easy", "medium", "hard"] as const).map(d => (
              <button
                key={d}
                onClick={() => setDiff(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  diff === d
                    ? d === "all" ? "bg-white/12 border-white/20 text-text-primary"
                      : `border-current`
                    : "border-transparent text-text-muted hover:text-text-secondary hover:bg-white/5"
                }`}
                style={diff === d && d !== "all" ? { color: DIFF_COLORS[d], borderColor: `${DIFF_COLORS[d]}40`, background: `${DIFF_COLORS[d]}0d` } : {}}
              >
                {d === "all" ? "Tất cả" : DIFF_LABELS[d]}
              </button>
            ))}
          </div>

          <span className="text-xs text-text-muted ml-auto font-mono">{filtered.length} bài tập</span>
        </motion.div>

        {/* ── Problem list ───────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-text-muted font-medium">Đang kết nối ngân hàng bài tập...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-text-muted"
                >
                  <Code2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Không tìm thấy bài tập thuộc phân khúc này</p>
                </motion.div>
              ) : (
                filtered.map((p, i) => <ProblemRow key={p.id || i} p={p} idx={i} />)
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
}
