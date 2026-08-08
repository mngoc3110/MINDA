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
  { id: "thcs",        label: "Chuyên Tin THCS",  icon: "🎒", desc: "Tổng chữ số, Ước số, Xâu ký tự, Thuật toán cơ bản" },
  { id: "thpt",        label: "Chuyên Tin THPT",  icon: "🏆", desc: "Quy hoạch động, Đồ thị Dijkstra, LIS, VOI" },
  { id: "basic",       label: "Tin học cơ bản",   icon: "🌱", desc: "Cú pháp, Vòng lặp, Nhập xuất, Mảng 1D/2D" },
  { id: "cs",          label: "Khoa học máy tính",icon: "💻", desc: "Thuật toán cơ bản, Tìm kiếm nhị phân, Sắp xếp" },
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

// ── Subjects & Chapters Mapping (UpCoder & Standard Curriculum) ──────────────

const SUBJECTS_CHAPTERS: Record<string, string[]> = {
  "Lập trình cơ bản": [
    "1. Nhập / Xuất",
    "2. Lệnh rẽ nhánh",
    "3. Vòng lặp",
    "4. Hàm",
    "5. Mảng",
    "6. Cấu trúc"
  ],
  "Lập trình nâng cao": [
    "1. Quá tải toán tử",
    "2. Khuôn hình [template]",
    "3. Con trỏ",
    "4. Nhập xuất file",
    "5. STL: vector",
    "6. STL: stack, queue",
    "7. Đệ quy",
    "8. Đệ quy quay lui",
    "9. Xử lý chuỗi"
  ],
  "Lập trình hướng đối tượng": [
    "1. Object and Class",
    "2. friend & quá tải toán tử",
    "3. Khuôn hình [template]",
    "4. Kế thừa",
    "5. Đa hình"
  ],
  "Phân tích thiết kế giải thuật": [
    "1. Chia để trị",
    "2. Đệ quy",
    "3. Đệ quy quay lui",
    "4. Quy hoạch động",
    "5. Giải thuật tham lam"
  ],
  "Lý thuyết đồ thị": [
    "1. chương 1_ltdt",
    "2. Duyệt theo chiều rộng",
    "3. Duyệt theo chiều sâu",
    "4. Tìm đường đi ngắn nhất"
  ]
};

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
            {p.subject && (
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                {p.subject} {p.chapter ? `· ${p.chapter}` : ''}
              </span>
            )}
            {p.source && !p.subject && (
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
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedChapter, setSelectedChapter] = useState("all");

  const [userRole, setUserRole] = useState<string>("student");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Lập trình cơ bản");
  const [newChapter, setNewChapter] = useState("1. Nhập / Xuất");
  const [newDiff, setNewDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [newDesc, setNewDesc] = useState("");
  const [newInputEx, setNewInputEx] = useState("");
  const [newOutputEx, setNewOutputEx] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    const role = localStorage.getItem("minda_user_role") || "student";
    setUserRole(role);
  }, []);

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;
    setCreating(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/problems`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          subject: newSubject,
          chapter: newChapter,
          difficulty: newDiff,
          rating: newDiff === "hard" ? 1400 : (newDiff === "medium" ? 1100 : 800),
          description: newDesc,
          examples: [{ input: newInputEx || "1\n5", output: newOutputEx || "YES", explanation: "Ví dụ mẫu bài toán" }]
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewInputEx("");
        setNewOutputEx("");
        await fetchProblems();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  // Reset to page 1 whenever filters change
  const handleTrackChange = (t: string) => {
    setTrack(t);
    setCurrentPage(1);
  };

  const handleDiffChange = (d: "all" | "easy" | "medium" | "hard") => {
    setDiff(d);
    setCurrentPage(1);
  };

  const handleSubjectChange = (s: string) => {
    setSelectedSubject(s);
    setSelectedChapter("all");
    setCurrentPage(1);
  };

  const handleChapterChange = (c: string) => {
    setSelectedChapter(c);
    setCurrentPage(1);
  };

  const filtered = problems.filter(p => {
    const matchTrack = (track === "all" || p.track === track || (track === "ptit" && p.source?.includes("PTIT")));
    const matchDiff = (diff === "all" || p.difficulty === diff);
    const matchSubject = (selectedSubject === "all" || p.subject === selectedSubject);
    const matchChapter = (selectedChapter === "all" || (p.chapter && p.chapter.includes(selectedChapter.replace(/^[0-9.]+\s*/, ''))));
    return matchTrack && matchDiff && matchSubject && matchChapter;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedProblems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
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
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">MINDA Code</h1>
                <p className="text-text-muted text-xs">Phân chia môn học & chương mục: Lập trình cơ bản · Lập trình nâng cao · OOP · Giải thuật · Đồ thị</p>
              </div>
            </div>

            {/* Teacher Create Problem Button */}
            {(userRole === "teacher" || userRole === "admin") && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all shrink-0"
              >
                <Zap className="w-4 h-4" /> + Thêm bài tập mới
              </button>
            )}
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

        {/* ── Subject & Chapter Filter Dropdowns (UpCoder Style) ──── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4"
        >
          {/* Select Môn Học */}
          <div className="flex-1">
            <label className="text-xs text-text-muted font-bold block mb-1.5 uppercase tracking-wider">Lựa chọn môn học:</label>
            <select
              value={selectedSubject}
              onChange={e => handleSubjectChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/8 border border-white/12 text-sm text-text-primary focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="all" className="bg-neutral-900 text-white">-- Tất cả môn học --</option>
              {Object.keys(SUBJECTS_CHAPTERS).map(s => (
                <option key={s} value={s} className="bg-neutral-900 text-white">{s}</option>
              ))}
            </select>
          </div>

          {/* Select Chương - Mục */}
          <div className="flex-1">
            <label className="text-xs text-text-muted font-bold block mb-1.5 uppercase tracking-wider">Chương - mục:</label>
            <select
              value={selectedChapter}
              onChange={e => handleChapterChange(e.target.value)}
              disabled={selectedSubject === "all"}
              className="w-full px-3.5 py-2 rounded-xl bg-white/8 border border-white/12 text-sm text-text-primary focus:outline-none focus:border-indigo-500 disabled:opacity-40 transition-colors"
            >
              <option value="all" className="bg-neutral-900 text-white">
                {selectedSubject === "all" ? "Mời bạn chọn môn học trước" : "-- Tất cả chương --"}
              </option>
              {selectedSubject !== "all" && SUBJECTS_CHAPTERS[selectedSubject]?.map(c => (
                <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(selectedSubject !== "all" || selectedChapter !== "all") && (
            <button
              onClick={() => { setSelectedSubject("all"); setSelectedChapter("all"); setCurrentPage(1); }}
              className="self-end md:self-auto px-4 py-2 rounded-xl bg-white/8 border border-white/12 text-xs font-semibold hover:bg-white/12 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
          )}
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
              onClick={() => handleTrackChange(c.id)}
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
                onClick={() => handleTrackChange(t.id)}
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
                onClick={() => handleDiffChange(d)}
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
              {paginatedProblems.length === 0 ? (
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
                paginatedProblems.map((p, i) => <ProblemRow key={p.id || i} p={p} idx={i} />)
              )}
            </AnimatePresence>

            {/* ── Pagination Controls ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 px-2 py-3 border-t border-white/8">
                <p className="text-xs text-text-muted">
                  Hiển thị <span className="font-semibold text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-text-primary">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> trên <span className="font-semibold text-text-primary">{filtered.length}</span> bài
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Trang trước
                  </button>

                  <div className="flex items-center gap-1 px-2">
                    <span className="text-xs font-bold text-indigo-400 font-mono">{currentPage}</span>
                    <span className="text-xs text-text-muted">/</span>
                    <span className="text-xs font-mono text-text-muted">{totalPages}</span>
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-xs font-semibold hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Teacher Create Problem Modal ───────────────────────── */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl bg-neutral-900 border border-white/12 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/8 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-primary">Tạo Bài Tập Lập Trình Mới</h3>
                    <p className="text-[11px] text-text-muted">Soạn thảo bài toán, phân loại môn học và testcase cho học sinh</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateProblem} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tên bài toán *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kiểm Tra Số Hoàn Hảo"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Môn học</label>
                    <select
                      value={newSubject}
                      onChange={e => {
                        setNewSubject(e.target.value);
                        const chaps = SUBJECTS_CHAPTERS[e.target.value];
                        if (chaps?.length) setNewChapter(chaps[0]);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      {Object.keys(SUBJECTS_CHAPTERS).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Chương - Mục</label>
                    <select
                      value={newChapter}
                      onChange={e => setNewChapter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      {SUBJECTS_CHAPTERS[newSubject]?.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Độ khó</label>
                    <select
                      value={newDiff}
                      onChange={e => setNewDiff(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="easy">Dễ (800 - 1000 Elo)</option>
                      <option value="medium">Trung bình (1100 - 1300 Elo)</option>
                      <option value="hard">Khó (1400+ Elo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Thời gian giới hạn</label>
                    <input
                      type="text"
                      disabled
                      value="1.0 giây · 256 MB"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-text-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Nội dung Đề bài (Hỗ trợ Markdown & LaTeX) *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Mô tả yêu cầu bài toán, quy định input, output..."
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono leading-relaxed focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Input Mẫu</label>
                    <textarea
                      rows={2}
                      placeholder="VD: 5 10"
                      value={newInputEx}
                      onChange={e => setNewInputEx(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Output Mẫu</label>
                    <textarea
                      rows={2}
                      placeholder="VD: 15"
                      value={newOutputEx}
                      onChange={e => setNewOutputEx(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-3 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {creating ? "Đang lưu đề bài..." : "Lưu & Xuất bản đề"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
