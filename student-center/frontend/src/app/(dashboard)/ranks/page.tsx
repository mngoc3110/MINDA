"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Zap, Crown, Star } from "lucide-react";

// ── Dữ liệu ranks (đồng bộ với backend/dashboard.py) ──────────────────────────

const STUDENT_RANKS = [
  {
    name: "Sơ cấp",
    abbr: "S1",
    minXp: 0,
    maxXp: 99,
    icon: "🌱",
    gradient: "from-slate-400 to-slate-600",
    glow: "rgba(100,116,139,0.4)",
    description: "Khởi đầu hành trình. Hoàn thành bài tập đầu tiên để thăng hạng!",
    perks: ["Truy cập kho bài tập cơ bản", "Tham gia lớp học trực tuyến"],
  },
  {
    name: "Tân binh",
    abbr: "T2",
    minXp: 100,
    maxXp: 299,
    icon: "⚡",
    gradient: "from-green-400 to-emerald-600",
    glow: "rgba(52,211,153,0.4)",
    description: "Đã quen với nền tảng. Thử thách bản thân với các đề khó hơn!",
    perks: ["Mở khóa thêm dạng bài luận", "Huy hiệu Tân Binh trên hồ sơ"],
  },
  {
    name: "Học bá",
    abbr: "H3",
    minXp: 300,
    maxXp: 799,
    icon: "📘",
    gradient: "from-blue-400 to-indigo-600",
    glow: "rgba(99,102,241,0.4)",
    description: "Học lực vượt trội. Bắt đầu leo bảng xếp hạng toàn trường!",
    perks: ["Huy hiệu xanh đặc biệt", "Hiển thị nổi bật trên Leaderboard"],
  },
  {
    name: "Học thần",
    abbr: "H4",
    minXp: 800,
    maxXp: 1999,
    icon: "🔮",
    gradient: "from-purple-400 to-pink-600",
    glow: "rgba(168,85,247,0.4)",
    description: "Đỉnh cao tri thức! Chỉ thiểu số học sinh đạt được bậc này.",
    perks: ["Danh hiệu tím huyền bí", "Quyền đề xuất đề thi thử"],
  },
  {
    name: "Thủ khoa",
    abbr: "T5",
    minXp: 2000,
    maxXp: null,
    icon: "🏆",
    gradient: "from-amber-400 to-orange-600",
    glow: "rgba(251,191,36,0.5)",
    description: "Bậc cao nhất cho học sinh. Huyền thoại thực sự của MINDA!",
    perks: ["Khung vàng trên avatar", "Biệt danh Thủ Khoa vĩnh viễn", "Được gắn sao trên mọi bảng xếp hạng"],
  },
  {
    name: "Thần Thoại (Mystic)",
    abbr: "👑",
    minXp: 99999999,
    maxXp: null,
    icon: "👑",
    gradient: "from-yellow-400 via-red-500 to-fuchsia-500",
    glow: "rgba(250,204,21,0.6)",
    description: "Danh hiệu đặc biệt dành riêng cho Admin và những cống hiến phi thường.",
    perks: ["Quyền tối thượng", "Ẩn tất cả giới hạn", "Biểu tượng vương miện vĩnh viễn"],
    isMystic: true,
  },
];

const TEACHER_RANKS = [
  {
    name: "Trợ giảng",
    minXp: 0,
    maxXp: 49,
    icon: "📖",
    color: "#78716c",
    gradient: "from-stone-400 to-stone-600",
    glow: "rgba(120,113,108,0.4)",
    description: "Bước đầu xây dựng lớp học và quản lý học sinh.",
    perks: ["Tạo lớp học cơ bản", "Đăng bài tập"],
  },
  {
    name: "Giáo viên",
    minXp: 50,
    maxXp: 149,
    icon: "✏️",
    color: "#3b82f6",
    gradient: "from-blue-400 to-blue-600",
    glow: "rgba(59,130,246,0.4)",
    description: "Đã có kinh nghiệm giảng dạy. Học sinh bắt đầu tin tưởng!",
    perks: ["Mở khóa bộ đề nâng cao", "Thống kê chi tiết lớp học"],
  },
  {
    name: "Chuyên gia",
    minXp: 150,
    maxXp: 299,
    icon: "🎓",
    color: "#8b5cf6",
    gradient: "from-violet-400 to-purple-600",
    glow: "rgba(139,92,246,0.4)",
    description: "Kỹ năng sư phạm nổi bật. Được học sinh và phụ huynh đánh giá cao.",
    perks: ["Huy hiệu tím chuyên gia", "Ưu tiên hiển thị trang giáo viên"],
  },
  {
    name: "Thạc sĩ",
    minXp: 300,
    maxXp: 599,
    icon: "🏆",
    color: "#f59e0b",
    gradient: "from-amber-400 to-yellow-600",
    glow: "rgba(245,158,11,0.5)",
    description: "Bậc thầy trong lĩnh vực. Uy tín vàng trên nền tảng MINDA!",
    perks: ["Khung vàng trên avatar", "Tính năng phân tích AI độc quyền"],
  },
  {
    name: "Tiến sĩ GS",
    minXp: 600,
    maxXp: null,
    icon: "⭐",
    color: "#ef4444",
    gradient: "from-red-400 to-rose-600",
    glow: "rgba(239,68,68,0.5)",
    description: "Đỉnh cao giảng dạy. Là hình mẫu cho toàn bộ hệ sinh thái MINDA.",
    perks: ["Danh hiệu đỏ huyền thoại", "Ưu tiên cộng tác đặc biệt"],
  },
  {
    name: "Tối Thượng (Mystic)",
    minXp: 99999999,
    maxXp: null,
    icon: "👑",
    color: "#fbbf24",
    gradient: "from-yellow-400 via-red-500 to-fuchsia-500",
    glow: "rgba(250,204,21,0.6)",
    description: "Danh hiệu tối thượng dành riêng cho Admin hệ thống.",
    perks: ["Quyền tối thượng", "Tất cả tính năng", "Biểu tượng vương miện"],
    isMystic: true,
  },
];

function RankCard({ rank, index, role }: { rank: any; index: number; role: "student" | "teacher" }) {
  const isMystic = rank.isMystic;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={`relative rounded-2xl border overflow-hidden ${
        isMystic ? "border-yellow-400/50" : "border-white/10"
      }`}
      style={{
        background: isMystic
          ? "linear-gradient(135deg, rgba(251,191,36,0.12), rgba(239,68,68,0.08), rgba(217,70,239,0.12))"
          : "rgba(255,255,255,0.04)",
        boxShadow: isMystic ? `0 0 40px ${rank.glow}` : "none",
      }}
    >
      {isMystic && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/60 to-transparent" />
        </div>
      )}

      <div className="p-6 flex gap-5">
        {/* Icon + XP badge */}
        <div className="flex flex-col items-center gap-2 min-w-[72px]">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${rank.gradient} flex items-center justify-center text-3xl shadow-lg`}
            style={{ boxShadow: `0 8px 24px ${rank.glow}` }}
          >
            {rank.icon}
          </div>
          {!isMystic && (
            <span className="text-[10px] font-bold text-text-muted bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
              {rank.minXp} EXP
            </span>
          )}
          {isMystic && <Crown className="w-4 h-4 text-yellow-400 mt-1" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-lg font-black ${isMystic ? "bg-gradient-to-r from-yellow-300 via-red-400 to-fuchsia-400 bg-clip-text text-transparent" : "text-text-primary"}`}>
              {rank.name}
            </h3>
            {!isMystic && rank.maxXp && (
              <span className="text-[10px] text-text-muted font-medium">→ {rank.maxXp} EXP</span>
            )}
          </div>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">{rank.description}</p>

          {/* Perks */}
          <div className="flex flex-wrap gap-1.5">
            {rank.perks.map((perk: string) => (
              <span
                key={perk}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                  isMystic
                    ? "bg-yellow-400/15 text-yellow-300 border border-yellow-400/30"
                    : "bg-white/8 text-text-secondary border border-white/10"
                }`}
              >
                ✦ {perk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RanksPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-[700px] h-[700px] bg-indigo-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-600/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <Link href="/leaderboard" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm">Bảng Xếp Hạng</span>
          </Link>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
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
          transition={{ delay: 0.1 }}
          className="mb-10 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex gap-4 items-start"
        >
          <Zap className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-indigo-300 mb-1">Cách tích EXP</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-secondary">
              <span>✅ Nộp bài tập: <strong className="text-green-400">+10 EXP</strong></span>
              <span>🏅 Điểm cao ≥ 8: <strong className="text-blue-400">+20 EXP</strong></span>
              <span>⚡ Hoàn thành đề: <strong className="text-purple-400">+15 EXP</strong></span>
              <span>🔥 Chuỗi ngày học: <strong className="text-amber-400">+Bonus</strong></span>
            </div>
          </div>
        </motion.div>

        {/* Student Ranks */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">👨‍🎓</span>
            <h2 className="text-xl font-black text-text-primary">Bậc Học Sinh</h2>
          </div>
          <div className="flex flex-col gap-3">
            {STUDENT_RANKS.map((rank, i) => (
              <RankCard key={rank.name} rank={rank} index={i} role="student" />
            ))}
          </div>
        </div>

        {/* Teacher Ranks */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-xl">👩‍🏫</span>
            <h2 className="text-xl font-black text-text-primary">Bậc Giáo Viên</h2>
          </div>
          <div className="flex flex-col gap-3">
            {TEACHER_RANKS.map((rank, i) => (
              <RankCard key={rank.name} rank={rank} index={i} role="teacher" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
