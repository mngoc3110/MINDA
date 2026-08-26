"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Code2, Terminal, Trophy, Zap, Lock, ChevronRight,
  Target, Flame, Star, Clock, CheckCircle2, CircleDot,
  ArrowRight, BookOpen, Cpu, Layers, RefreshCw, Plus,
  FileText, Award, CheckSquare, Square, Search
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
  { id: "thcs",        label: "Chuyên Tin THCS / HSG 8", icon: "🎒", desc: "Số học, Ước số, Xâu ký tự, Sàng Eratosthenes, Level 01 & 02" },
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

// ── Subjects & Chapters Mapping ──────────────────────────────────────────────

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
          <div className="flex items-center gap-2 flex-wrap">
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

// ── Page Component ──────────────────────────────────────────────────────────

export default function CodePage() {
  const [viewTab, setViewTab] = useState<"problems" | "exams">("problems");
  const [problems, setProblems] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);

  // Filters
  const [track, setTrack] = useState("all");
  const [diff, setDiff] = useState<"all" | "easy" | "medium" | "hard">("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedChapter, setSelectedChapter] = useState("all");

  const [userRole, setUserRole] = useState<string>("student");

  // Create Problem Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Lập trình cơ bản");
  const [newChapter, setNewChapter] = useState("1. Nhập / Xuất");
  const [newDiff, setNewDiff] = useState<"easy" | "medium" | "hard">("easy");
  const [newDesc, setNewDesc] = useState("");
  const [newInputEx, setNewInputEx] = useState("");
  const [newOutputEx, setNewOutputEx] = useState("");

  // Create Exam Modal states
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [examTitle, setExamTitle] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examDuration, setExamDuration] = useState<number>(120);
  const [examTrack, setExamTrack] = useState("thcs");
  const [examDiff, setExamDiff] = useState("medium");
  const [selectedExamProblemIds, setSelectedExamProblemIds] = useState<number[]>([]);
  const [examProblemSearch, setExamProblemSearch] = useState("");

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

  const fetchExams = async () => {
    setLoadingExams(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/coding-exams`);
      if (res.ok) {
        setExams(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExams(false);
    }
  };

  useEffect(() => {
    fetchProblems();
    fetchExams();
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim() || selectedExamProblemIds.length === 0) {
      alert("Vui lòng nhập tên đề thi và chọn ít nhất 1 bài toán!");
      return;
    }
    setCreatingExam(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/coding-exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: examTitle,
          description: examDesc,
          duration_minutes: Number(examDuration) || 120,
          track: examTrack,
          difficulty: examDiff,
          problem_ids: selectedExamProblemIds,
          tags: ["HSG Tin 8", examTrack.toUpperCase()]
        })
      });

      if (res.ok) {
        setShowCreateExamModal(false);
        setExamTitle("");
        setExamDesc("");
        setSelectedExamProblemIds([]);
        await fetchExams();
        alert("Đã tạo đề thi lập trình thành công!");
      } else {
        alert("Có lỗi khi tạo đề thi.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingExam(false);
    }
  };

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">MINDA Code</h1>
                <p className="text-text-muted text-xs">Luyện thuật toán & Đề thi HSG Tin học THCS / THPT chuẩn hóa</p>
              </div>
            </div>

            {/* Teacher Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Tạo bài tập
              </button>
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition-all"
              >
                <FileText className="w-4 h-4" /> 📝 Tạo đề thi mới
              </button>
            </div>
          </div>

          {/* Tab Switcher: Kho Bài Tập vs Đề Thi */}
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <button
              onClick={() => setViewTab("problems")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                viewTab === "problems"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Kho Bài Tập ({problems.length})
            </button>
            <button
              onClick={() => setViewTab("exams")}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                viewTab === "exams"
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10"
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" /> Đề Thi & Kỳ Thi Lập Trình ({exams.length})
            </button>
          </div>

          {/* Stats Bar */}
          {viewTab === "problems" && (
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
          )}
        </motion.div>

        {/* ══════════════ TAB 1: KHO BÀI TẬP ══════════════ */}
        {viewTab === "problems" && (
          <div>
            {/* Subject & Chapter Filter Dropdowns */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4"
            >
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
            </motion.div>

            {/* Track Selector Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
              {TRACKS.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTrackChange(t.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 border ${
                    track === t.id
                      ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/40"
                      : "bg-white/5 text-text-muted border-white/5 hover:bg-white/10 hover:text-text-primary"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                {(["all", "easy", "medium", "hard"] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => handleDiffChange(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      diff === d
                        ? "bg-white/15 text-white"
                        : "text-text-muted hover:text-text-primary hover:bg-white/5"
                    }`}
                  >
                    {d === "all" ? "Mọi độ khó" : DIFF_LABELS[d]}
                  </button>
                ))}
              </div>
              <span className="text-xs text-text-muted">
                Tìm thấy <strong>{filtered.length}</strong> bài toán
              </span>
            </div>

            {/* Problems List */}
            {loading ? (
              <div className="p-12 text-center text-text-muted text-sm">
                Đang tải dữ liệu bài toán...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center text-text-muted text-sm">
                Không tìm thấy bài tập nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedProblems.map((p, idx) => (
                  <ProblemRow key={p.id || idx} p={p} idx={idx} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-white/8 mt-4">
                    <span className="text-xs text-text-muted">
                      Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} trên {filtered.length} bài
                    </span>
                    <div className="flex items-center gap-2">
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
          </div>
        )}

        {/* ══════════════ TAB 2: ĐỀ THI & KỲ THI LẬP TRÌNH ══════════════ */}
        {viewTab === "exams" && (
          <div className="space-y-6">
            {loadingExams ? (
              <div className="p-12 text-center text-text-muted text-sm">
                Đang nạp danh sách đề thi lập trình...
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                <h3 className="font-bold text-base">Chưa có đề thi nào được tạo</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Hãy bấm nút &quot;Tạo đề thi mới&quot; ở trên để tạo đề thi thử hoặc bộ bài tập HSG cho học sinh.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((ex, idx) => (
                  <motion.div
                    key={ex.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top gradient glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {ex.track?.toUpperCase() || "HSG TIN 8"}
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> {ex.duration_minutes || 120} phút
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-text-primary group-hover:text-indigo-300 transition-colors mb-2">
                        {ex.title}
                      </h3>

                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-3 mb-4">
                        {ex.description || "Bộ đề thi lập trình rèn luyện kỹ năng giải thuật toán học sinh giỏi."}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {ex.tags?.map((t: string) => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-gray-300 border border-white/5">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        <span>📝 <strong>{ex.problem_count || ex.problem_ids?.length || 0}</strong> bài toán</span>
                        <span>·</span>
                        <span>🎯 <strong>{ex.total_score || 100}</strong> điểm</span>
                      </div>

                      <Link
                        href={`/code/exam/${ex.slug || ex.id}`}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition group-hover:translate-x-0.5"
                      >
                        <span>Làm bài thi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ MODAL: TẠO BÀI TẬP MỚI ══════════════ */}
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
                    {creating ? "Đang lưu..." : "Lưu & Xuất bản bài tập"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ══════════════ MODAL: TẠO ĐỀ THI MỚI ══════════════ */}
        {showCreateExamModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-neutral-900 border border-white/12 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/8 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                    📝
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-primary">Tạo Đề Thi & Kỳ Thi Lập Trình</h3>
                    <p className="text-[11px] text-text-muted">Ghép các bài tập trong kho thành một đề thi hoàn chỉnh có tính giờ</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateExamModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateExam} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tên đề thi / Kỳ thi *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Đề Luyện Thi HSG Tin 8 - Tuần 1"
                    value={examTitle}
                    onChange={e => setExamTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Mô tả đề thi</label>
                  <textarea
                    rows={2}
                    placeholder="VD: Đề thi gồm 9 câu kiểm tra kiến thức về Cấu trúc tuần tự, Nhập/Xuất và Rẽ nhánh..."
                    value={examDesc}
                    onChange={e => setExamDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Thời gian làm bài</label>
                    <select
                      value={examDuration}
                      onChange={e => setExamDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value={45}>45 phút</option>
                      <option value={60}>60 phút</option>
                      <option value={90}>90 phút</option>
                      <option value={120}>120 phút (Chuẩn HSG)</option>
                      <option value={150}>150 phút (Chuẩn HSG Tỉnh)</option>
                      <option value={180}>180 phút</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Khối / Đối tượng</label>
                    <select
                      value={examTrack}
                      onChange={e => setExamTrack(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="thcs">Chuyên Tin THCS / HSG 8</option>
                      <option value="thpt">Chuyên Tin THPT</option>
                      <option value="basic">Lập trình cơ bản</option>
                      <option value="contest">Kỳ thi Mở (Contest)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Độ khó</label>
                    <select
                      value={examDiff}
                      onChange={e => setExamDiff(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Nâng cao</option>
                    </select>
                  </div>
                </div>

                {/* Problem Multi-Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-text-muted">
                      Chọn bài toán vào đề thi ({selectedExamProblemIds.length} bài đã chọn):
                    </label>
                    <span className="text-[11px] text-indigo-400">
                      Tích chọn các bài muốn đưa vào đề
                    </span>
                  </div>

                  {/* Search box for problems */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài toán theo tên..."
                      value={examProblemSearch}
                      onChange={e => setExamProblemSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-white/10 rounded-2xl p-2 bg-neutral-950/50">
                    {problems
                      .filter(p => !examProblemSearch || p.title.toLowerCase().includes(examProblemSearch.toLowerCase()))
                      .map(p => {
                        const isChecked = selectedExamProblemIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedExamProblemIds(prev =>
                                isChecked ? prev.filter(id => id !== p.id) : [...prev, p.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-2 rounded-xl text-xs cursor-pointer transition ${
                              isChecked ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30" : "hover:bg-white/5 text-gray-300"
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500 shrink-0" />
                            )}
                            <span className="font-semibold truncate flex-1">{p.title}</span>
                            <span className="text-[10px] text-gray-400 shrink-0 font-mono">Elo: {p.rating || 800}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-3 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateExamModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creatingExam}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {creatingExam ? "Đang tạo đề..." : "Xuất bản Đề Thi"}
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
