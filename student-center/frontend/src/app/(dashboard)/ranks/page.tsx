"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Zap, Crown, Star, Users, GraduationCap } from "lucide-react";

// ── Dữ liệu ranks ──────────────────────────────────────────────────────────────

const STUDENT_RANKS = [
  {
    name: "Sơ cấp", abbr: "S1", minXp: 0, maxXp: 99,
    icon: "🌱", img: "iron",
    gradient: "from-slate-500 to-slate-700",
    frameGrad: "from-slate-400 via-slate-600 to-slate-800",
    glow: "rgba(100,116,139,0.7)",
    glowLight: "rgba(100,116,139,0.15)",
    accent: "#94a3b8",
    description: "Khởi đầu hành trình. Hoàn thành bài tập đầu tiên để thăng hạng!",
    perks: ["Truy cập kho bài tập cơ bản", "Tham gia lớp học trực tuyến"],
  },
  {
    name: "Tân binh", abbr: "T2", minXp: 100, maxXp: 299,
    icon: "⚡", img: "bronze",
    gradient: "from-emerald-500 to-green-700",
    frameGrad: "from-green-400 via-emerald-600 to-emerald-800",
    glow: "rgba(52,211,153,0.7)",
    glowLight: "rgba(52,211,153,0.12)",
    accent: "#34d399",
    description: "Đã quen với nền tảng. Thử thách bản thân với các đề khó hơn!",
    perks: ["Mở khóa thêm dạng bài luận", "Huy hiệu Tân Binh trên hồ sơ"],
  },
  {
    name: "Học bá", abbr: "H3", minXp: 300, maxXp: 799,
    icon: "📘", img: "silver",
    gradient: "from-blue-500 to-indigo-700",
    frameGrad: "from-blue-300 via-blue-500 to-indigo-700",
    glow: "rgba(99,102,241,0.7)",
    glowLight: "rgba(99,102,241,0.12)",
    accent: "#818cf8",
    description: "Học lực vượt trội. Bắt đầu leo bảng xếp hạng toàn trường!",
    perks: ["Huy hiệu xanh đặc biệt", "Hiển thị nổi bật trên Leaderboard"],
  },
  {
    name: "Học thần", abbr: "H4", minXp: 800, maxXp: 1999,
    icon: "🔮", img: "gold",
    gradient: "from-purple-500 to-pink-700",
    frameGrad: "from-purple-300 via-fuchsia-500 to-pink-800",
    glow: "rgba(168,85,247,0.7)",
    glowLight: "rgba(168,85,247,0.12)",
    accent: "#c084fc",
    description: "Đỉnh cao tri thức! Chỉ thiểu số học sinh đạt được bậc này.",
    perks: ["Danh hiệu tím huyền bí", "Quyền đề xuất đề thi thử"],
  },
  {
    name: "Thủ khoa", abbr: "T5", minXp: 2000, maxXp: null,
    icon: "🏆", img: "diamond",
    gradient: "from-amber-400 to-orange-600",
    frameGrad: "from-yellow-300 via-amber-500 to-orange-700",
    glow: "rgba(251,191,36,0.7)",
    glowLight: "rgba(251,191,36,0.12)",
    accent: "#fbbf24",
    description: "Bậc cao nhất cho học sinh. Huyền thoại thực sự của MINDA!",
    perks: ["Khung vàng trên avatar", "Biệt danh Thủ Khoa vĩnh viễn", "Gắn sao trên mọi bảng xếp hạng"],
  },
  {
    name: "Thần Thoại", abbr: "👑", minXp: 99999999, maxXp: null,
    icon: "👑", img: "mythic",
    gradient: "from-yellow-400 via-red-500 to-fuchsia-500",
    frameGrad: "from-yellow-400 via-red-500 to-fuchsia-500",
    glow: "rgba(250,204,21,0.8)",
    glowLight: "rgba(250,204,21,0.1)",
    accent: "#f59e0b",
    description: "Danh hiệu đặc biệt dành riêng cho Admin và những cống hiến phi thường.",
    perks: ["Quyền tối thượng", "Ẩn tất cả giới hạn", "Biểu tượng vương miện vĩnh viễn"],
    isMystic: true,
  },
];

const TEACHER_RANKS = [
  {
    name: "Trợ giảng", minXp: 0, maxXp: 49,
    icon: "📖", img: "iron",
    gradient: "from-stone-500 to-stone-700",
    frameGrad: "from-stone-400 via-stone-600 to-stone-800",
    glow: "rgba(120,113,108,0.7)",
    glowLight: "rgba(120,113,108,0.12)",
    accent: "#a8a29e",
    description: "Bước đầu xây dựng lớp học và quản lý học sinh.",
    perks: ["Tạo lớp học cơ bản", "Đăng bài tập"],
  },
  {
    name: "Giáo viên", minXp: 50, maxXp: 149,
    icon: "✏️", img: "bronze",
    gradient: "from-blue-500 to-blue-700",
    frameGrad: "from-blue-400 via-blue-600 to-blue-800",
    glow: "rgba(59,130,246,0.7)",
    glowLight: "rgba(59,130,246,0.12)",
    accent: "#60a5fa",
    description: "Đã có kinh nghiệm giảng dạy. Học sinh bắt đầu tin tưởng!",
    perks: ["Mở khóa bộ đề nâng cao", "Thống kê chi tiết lớp học"],
  },
  {
    name: "Chuyên gia", minXp: 150, maxXp: 299,
    icon: "🎓", img: "silver",
    gradient: "from-violet-500 to-purple-700",
    frameGrad: "from-violet-300 via-purple-500 to-purple-800",
    glow: "rgba(139,92,246,0.7)",
    glowLight: "rgba(139,92,246,0.12)",
    accent: "#a78bfa",
    description: "Kỹ năng sư phạm nổi bật. Được học sinh và phụ huynh đánh giá cao.",
    perks: ["Huy hiệu tím chuyên gia", "Ưu tiên hiển thị trang giáo viên"],
  },
  {
    name: "Thạc sĩ", minXp: 300, maxXp: 599,
    icon: "🏆", img: "gold",
    gradient: "from-amber-400 to-yellow-600",
    frameGrad: "from-amber-300 via-amber-500 to-orange-700",
    glow: "rgba(245,158,11,0.7)",
    glowLight: "rgba(245,158,11,0.12)",
    accent: "#f59e0b",
    description: "Bậc thầy trong lĩnh vực. Uy tín vàng trên nền tảng MINDA!",
    perks: ["Khung vàng trên avatar", "Tính năng phân tích AI độc quyền"],
  },
  {
    name: "Tiến sĩ GS", minXp: 600, maxXp: null,
    icon: "⭐", img: "mythic",
    gradient: "from-red-500 to-rose-700",
    frameGrad: "from-yellow-400 via-red-600 to-rose-900",
    glow: "rgba(239,68,68,0.7)",
    glowLight: "rgba(239,68,68,0.12)",
    accent: "#f87171",
    description: "Đỉnh cao giảng dạy. Là hình mẫu cho toàn bộ hệ sinh thái MINDA.",
    perks: ["Danh hiệu đỏ huyền thoại", "Ưu tiên cộng tác đặc biệt"],
  },
  {
    name: "Tối Thượng", minXp: 99999999, maxXp: null,
    icon: "👑", img: "mythic",
    gradient: "from-yellow-400 via-red-500 to-fuchsia-500",
    frameGrad: "from-yellow-400 via-red-500 to-fuchsia-500",
    glow: "rgba(250,204,21,0.8)",
    glowLight: "rgba(250,204,21,0.1)",
    accent: "#f59e0b",
    description: "Danh hiệu tối thượng dành riêng cho Admin hệ thống.",
    perks: ["Quyền tối thượng", "Tất cả tính năng", "Biểu tượng vương miện"],
    isMystic: true,
  },
];

// ── Slider Component ─────────────────────────────────────────────────────────

function RankSlider({ ranks }: { ranks: any[] }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const go = (dir: 1 | -1) => {
    setDirection(dir);
    setCurrent(c => Math.max(0, Math.min(ranks.length - 1, c + dir)));
  };

  const rank = ranks[current];
  const isMystic = rank.isMystic;

  const variants = {
    enter: (dir: number) => ({ x: dir * 80, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir * -80, opacity: 0, scale: 0.96 }),
  };

  return (
    <div className="relative select-none">
      {/* Dot indicators */}
      <div className="flex justify-center gap-2 mb-5">
        {ranks.map((r, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current
                ? "w-6"
                : "w-2 bg-white/20 hover:bg-white/40"
            }`}
            style={i === current ? { background: rank.accent, boxShadow: `0 0 8px ${rank.glow}` } : {}}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-3xl" style={{ minHeight: 340 }}>
        {/* Background glow layer */}
        <div
          className="absolute inset-0 transition-all duration-700 rounded-3xl pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 20%, ${rank.glowLight} 0%, transparent 70%)` }}
        />

        <AnimatePresence custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="relative"
          >
            {/* Main Card */}
            <div
              className={`rounded-3xl border overflow-hidden ${isMystic ? "border-yellow-400/40" : "border-white/10"}`}
              style={{
                background: isMystic
                  ? "linear-gradient(160deg, rgba(251,191,36,0.10), rgba(239,68,68,0.07), rgba(217,70,239,0.10))"
                  : "rgba(255,255,255,0.04)",
              }}
            >
              {/* Top gradient strip */}
              <div className={`h-1.5 bg-gradient-to-r ${rank.gradient} opacity-80`} />

              <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                {/* Badge */}
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={`w-32 h-32 rounded-3xl p-[4px] bg-gradient-to-b ${rank.frameGrad} shadow-2xl`}
                    style={{ boxShadow: `0 0 40px ${rank.glow}, 0 0 12px ${rank.glow}` }}
                  >
                    <div className="w-full h-full rounded-[22px] bg-bg-main overflow-hidden flex items-center justify-center">
                      <img
                        src={`/ranks/${rank.img}.png`}
                        alt={rank.name}
                        className="w-full h-full object-contain p-2 drop-shadow-2xl"
                        style={{ filter: `drop-shadow(0 0 10px ${rank.glow})` }}
                      />
                    </div>
                  </motion.div>

                  {/* EXP Badge */}
                  {!isMystic ? (
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full border"
                      style={{ color: rank.accent, borderColor: `${rank.accent}40`, background: `${rank.accent}12` }}
                    >
                      {rank.minXp}{rank.maxXp ? ` – ${rank.maxXp}` : "+"} EXP
                    </span>
                  ) : (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  )}
                </div>

                {/* Info panel */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <span className="text-3xl">{rank.icon}</span>
                    <h2 className={`text-2xl font-black tracking-tight ${
                      isMystic
                        ? "bg-gradient-to-r from-yellow-300 via-red-400 to-fuchsia-400 bg-clip-text text-transparent"
                        : "text-text-primary"
                    }`}>
                      {rank.name}
                    </h2>
                    <span className="text-xs font-bold text-text-muted bg-white/10 px-2 py-0.5 rounded-full">
                      {rank.abbr || "★"}
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary leading-relaxed mb-5 max-w-md">
                    {rank.description}
                  </p>

                  {/* Perks */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {rank.perks.map((perk: string) => (
                      <span
                        key={perk}
                        className="text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 border"
                        style={{
                          color: isMystic ? "#fde68a" : rank.accent,
                          borderColor: `${isMystic ? "#fbbf24" : rank.accent}30`,
                          background: `${isMystic ? "#fbbf24" : rank.accent}0d`,
                        }}
                      >
                        <span style={{ color: isMystic ? "#fbbf24" : rank.accent }}>✦</span> {perk}
                      </span>
                    ))}
                  </div>

                  {/* Progress bar (to next rank) */}
                  {!isMystic && rank.maxXp && (
                    <div className="mt-5">
                      <div className="flex justify-between text-[11px] text-text-muted mb-1.5 font-mono">
                        <span>{rank.minXp} EXP</span>
                        <span>Thăng hạng tiếp: {rank.maxXp + 1} EXP</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: "42%",
                            background: `linear-gradient(to right, ${rank.accent}99, ${rank.accent})`,
                            boxShadow: `0 0 6px ${rank.glow}`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrow navigation */}
      <div className="flex items-center justify-between mt-4 px-1">
        <button
          onClick={() => go(-1)}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-secondary hover:text-text-primary group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">{current > 0 ? ranks[current - 1].name : "Đầu tiên"}</span>
        </button>

        <span className="text-xs text-text-muted font-mono">
          {current + 1} / {ranks.length}
        </span>

        <button
          onClick={() => go(1)}
          disabled={current === ranks.length - 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-text-secondary hover:text-text-primary group"
        >
          <span className="text-sm font-medium">{current < ranks.length - 1 ? ranks[current + 1].name : "Cuối"}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RanksPage() {
  const [tab, setTab] = useState<"student" | "teacher">("student");

  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] bg-indigo-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-600/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/leaderboard" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Bảng Xếp Hạng</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Bảng Bậc Rank</h1>
            </div>
            <p className="text-text-secondary text-sm max-w-lg">
              Hệ thống xếp hạng MINDA được tính theo <strong className="text-indigo-400">EXP (điểm kinh nghiệm)</strong> tích lũy từ bài tập, đề thi và hoạt động học tập.
            </p>
          </motion.div>
        </div>

        {/* EXP Info */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="mb-7 p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex gap-3 items-start"
        >
          <Zap className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-300 mb-1.5">Cách tích EXP</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-secondary">
              <span>✅ Nộp bài tập: <strong className="text-green-400">+10 EXP</strong></span>
              <span>🏅 Điểm cao ≥ 8: <strong className="text-blue-400">+20 EXP</strong></span>
              <span>⚡ Hoàn thành đề: <strong className="text-purple-400">+15 EXP</strong></span>
              <span>🔥 Chuỗi ngày học: <strong className="text-amber-400">+Bonus</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="flex gap-2 mb-7 p-1 rounded-2xl bg-white/5 border border-white/10 w-fit"
        >
          {([
            { key: "student", label: "👨‍🎓 Bậc Học Sinh", Icon: Users },
            { key: "teacher", label: "👩‍🏫 Bậc Giáo Viên", Icon: GraduationCap },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                tab === key
                  ? "bg-white/12 text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Slider */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <RankSlider ranks={tab === "student" ? STUDENT_RANKS : TEACHER_RANKS} />
        </motion.div>
      </div>
    </div>
  );
}
