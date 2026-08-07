"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Code2, Terminal, Trophy, Zap, Lock, ChevronRight,
  Target, Flame, Star, Clock, CheckCircle2, CircleDot,
  ArrowRight, BookOpen, Cpu
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

// ── Problem data (mock – will be API-driven) ─────────────────────────────────

const PROBLEMS = [
  {
    id: "hello-world", title: "Hello, World!", difficulty: "easy",
    tags: ["I/O cơ bản"], solved: 1240, rating: 800, accepted: true,
    track: "basic",
    desc: "In ra màn hình dòng chữ \"Hello, World!\".",
  },
  {
    id: "sum-two", title: "Tổng Hai Số", difficulty: "easy",
    tags: ["Toán", "I/O"], solved: 980, rating: 850, accepted: false,
    track: "basic",
    desc: "Nhập hai số nguyên a, b. In ra a + b.",
  },
  {
    id: "fibo", title: "Số Fibonacci thứ N", difficulty: "medium",
    tags: ["DP", "Đệ quy"], solved: 540, rating: 1100, accepted: false,
    track: "basic",
    desc: "Tính số Fibonacci thứ N (N ≤ 10^6).",
  },
  {
    id: "prime-sieve", title: "Sàng Nguyên Tố", difficulty: "medium",
    tags: ["Số học", "Sàng Eratosthenes"], solved: 430, rating: 1200, accepted: true,
    track: "cs",
    desc: "Liệt kê tất cả số nguyên tố ≤ N (N ≤ 10^7) dùng Sàng Eratosthenes.",
  },
  {
    id: "sort-basics", title: "Sắp Xếp Nổi Bọt", difficulty: "easy",
    tags: ["Sắp xếp", "Mảng"], solved: 700, rating: 900, accepted: false,
    track: "cs",
    desc: "Cài đặt thuật toán Bubble Sort. In mảng sau khi sắp xếp tăng dần.",
  },
  {
    id: "binary-search", title: "Tìm Kiếm Nhị Phân", difficulty: "medium",
    tags: ["Tìm kiếm", "Mảng"], solved: 390, rating: 1150, accepted: false,
    track: "cs",
    desc: "Tìm vị trí phần tử x trong mảng đã được sắp xếp.",
  },
  {
    id: "dp-knapsack", title: "Bài Toán Cái Túi 0/1", difficulty: "hard",
    tags: ["DP", "Tối ưu"], solved: 210, rating: 1400, accepted: false,
    track: "competitive",
    desc: "Cho n đồ vật và ba-lô sức chứa W. Chọn đồ vật sao cho tổng giá trị lớn nhất.",
  },
  {
    id: "graph-bfs", title: "Duyệt Đồ Thị BFS", difficulty: "hard",
    tags: ["Đồ thị", "BFS"], solved: 180, rating: 1350, accepted: false,
    track: "competitive",
    desc: "Cho đồ thị vô hướng, in ra thứ tự duyệt BFS từ đỉnh 1.",
  },
  {
    id: "segment-tree", title: "Cây Phân Đoạn", difficulty: "hard",
    tags: ["Cấu trúc dữ liệu", "Segment Tree"], solved: 95, rating: 1600, accepted: false,
    track: "advanced",
    desc: "Xây dựng Segment Tree, trả lời truy vấn tổng đoạn và cập nhật điểm.",
  },
  {
    id: "lca", title: "LCA - Tổ Tiên Chung Gần Nhất", difficulty: "hard",
    tags: ["Cây", "Binary Lifting"], solved: 72, rating: 1750, accepted: false,
    track: "advanced",
    desc: "Tìm LCA của hai đỉnh trong cây có trọng số.",
  },
];

const TRACKS = [
  { id: "all",         label: "Tất cả",          icon: "🗂️" },
  { id: "basic",       label: "Tin học cơ bản",   icon: "🌱" },
  { id: "cs",          label: "Khoa học máy tính",icon: "💻" },
  { id: "competitive", label: "Chuyên Tin / CP",  icon: "⚔️" },
  { id: "advanced",    label: "Đại học / Pro",    icon: "🎓" },
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

function ProblemRow({ p, idx }: { p: typeof PROBLEMS[0]; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04 }}
    >
      <Link
        href={`/code/${p.id}`}
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
          <p className="font-semibold text-sm text-text-primary group-hover:text-indigo-300 transition-colors truncate">
            {p.title}
          </p>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {p.tags.map(t => (
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
            color: CODER_RANKS.find(r => p.rating >= r.min && (r.max === null || p.rating <= r.max))?.color ?? "#9ca3af",
            borderColor: `${CODER_RANKS.find(r => p.rating >= r.min && (r.max === null || p.rating <= r.max))?.color ?? "#9ca3af"}30`,
            background: CODER_RANKS.find(r => p.rating >= r.min && (r.max === null || p.rating <= r.max))?.bg,
          }}
        >
          {p.rating}
        </span>

        {/* Difficulty */}
        <span
          className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border hidden md:inline-flex"
          style={{ color: DIFF_COLORS[p.difficulty], background: `${DIFF_COLORS[p.difficulty]}12`, borderColor: `${DIFF_COLORS[p.difficulty]}30` }}
        >
          {DIFF_LABELS[p.difficulty]}
        </span>

        {/* Solved count */}
        <span className="shrink-0 text-xs text-text-muted hidden lg:inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" /> {p.solved}
        </span>

        <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CodePage() {
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState<"all" | "easy" | "medium" | "hard">("all");

  const filtered = PROBLEMS.filter(p =>
    (track === "all" || p.track === track) &&
    (diff === "all" || p.difficulty === diff)
  );

  const solvedCount = PROBLEMS.filter(p => p.accepted).length;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-violet-600/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">MINDA Code</h1>
              <p className="text-text-muted text-xs">Luyện lập trình · Thi đấu · Leo rank Elo</p>
            </div>
          </div>

          {/* Elo badge + stats row */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <EloRankBadge elo={0} />
            <span className="text-xs text-text-muted px-3 py-1 rounded-full bg-white/5 border border-white/8">
              ✅ {solvedCount}/{PROBLEMS.length} bài đã giải
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
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          {[
            { label: "Tin học cơ bản",    desc: "Câu lệnh, vòng lặp, hàm",   icon: "🌱", color: "#4ade80", track: "basic" },
            { label: "Khoa học máy tính", desc: "CTDL, giải thuật nổi bật",   icon: "💻", color: "#60a5fa", track: "cs" },
            { label: "Chuyên Tin / CP",   desc: "DP, Đồ thị, VOI, ICPC style",icon: "⚔️", color: "#c084fc", track: "competitive" },
            { label: "Đại học / Pro",     desc: "Segment Tree, LCA, String", icon: "🎓", color: "#f59e0b", track: "advanced" },
          ].map((c) => (
            <button
              key={c.track}
              onClick={() => setTrack(c.track)}
              className={`text-left p-4 rounded-2xl border transition-all ${track === c.track ? "border-current" : "border-white/8 hover:border-white/16"} bg-white/[0.02] hover:bg-white/[0.04]`}
              style={track === c.track ? { borderColor: `${c.color}50`, background: `${c.color}0a` } : {}}
            >
              <span className="text-xl block mb-2">{c.icon}</span>
              <p className="text-xs font-bold text-text-primary leading-tight mb-1">{c.label}</p>
              <p className="text-[10px] text-text-muted leading-relaxed">{c.desc}</p>
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
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/8">
            {TRACKS.map(t => (
              <button
                key={t.id}
                onClick={() => setTrack(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${track === t.id ? "bg-white/12 text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
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

          <span className="text-xs text-text-muted ml-auto">{filtered.length} bài</span>
        </motion.div>

        {/* ── Problem list ───────────────────────────────────────── */}
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
                <p className="text-sm">Không có bài nào khớp bộ lọc</p>
              </motion.div>
            ) : (
              filtered.map((p, i) => <ProblemRow key={p.id} p={p} idx={i} />)
            )}
          </AnimatePresence>
        </div>

        {/* ── Coming soon banner ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 p-6 rounded-3xl border border-dashed border-indigo-500/25 bg-indigo-500/5 text-center"
        >
          <Cpu className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <p className="font-bold text-text-primary mb-1">Online Judge đang được xây dựng 🚧</p>
          <p className="text-sm text-text-muted max-w-md mx-auto">
            Tính năng nộp code, chấm tự động (AC / WA / TLE / MLE), hệ thống Elo Rating và bảng xếp hạng Coder đang trong quá trình phát triển.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
