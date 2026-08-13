"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  Award, 
  Trophy, 
  Sparkles, 
  Search, 
  GraduationCap, 
  Star, 
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  School, 
  Heart, 
  Flame, 
  Share2, 
  X,
  CheckCircle2,
  Medal,
  Users,
  Sun,
  Moon
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

interface HonorItem {
  id: number;
  student_name: string;
  teacher_name: string;
  title: string;
  description: string;
  image_url: string | null;
  academic_year: string | null;
  university_logo_url: string | null;
  created_at?: string;
}

const FALLBACK_HONORS: HonorItem[] = [
  {
    id: 101,
    student_name: "Nguyễn Lê Minh Khang",
    teacher_name: "Thầy Hùng & Cô Thuỷ",
    title: "Thủ Khoa Khối A00 (29.85 Điểm) • ĐH Bách Khoa Hà Nội",
    description: "Thủ khoa toàn quốc với Toán 10, Lý 10, Hoá 9.85. Tinh thần tự học bền bỉ, hoàn thành hơn 500 đề thi thử trên hệ thống MINDA.",
    image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
    academic_year: "2024-2025",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Logo_HUST.png"
  },
  {
    id: 102,
    student_name: "Trần Bảo Ngọc",
    teacher_name: "Thầy Nguyễn Lê Minh Ngọc",
    title: "Thủ Khoa ĐGNL ĐHQG (1165/1200) • ĐH Ngoại Thương",
    description: "Top 1 kỳ thi Đánh giá Năng lực ĐHQG TP.HCM. Giải Nhất Tin học Trẻ cấp Tỉnh, đạt học bổng toàn phần ngành Kinh tế Đối ngoại.",
    image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    academic_year: "2024-2025",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/8/8c/Logo_FTU.png"
  },
  {
    id: 103,
    student_name: "Phạm Quốc Anh",
    teacher_name: "Thầy Hùng",
    title: "Giải Nhất Quốc Gia Môn Toán • ĐH Y Hà Nội",
    description: "Học sinh giỏi Quốc gia môn Toán lớp 12. Điểm số tuyệt đối môn Toán & Sinh học trong kỳ thi Tốt nghiệp THPT Quốc gia.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    academic_year: "2023-2024",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/0/07/Logo_HMU.jpg"
  },
  {
    id: 104,
    student_name: "Hoàng Minh Thư",
    teacher_name: "Cô Thuỷ",
    title: "Á Khoa Khối D01 (29.2 Điểm) • ĐH Kinh Tế Quốc Dân",
    description: "IELTS 8.0, Toán 9.8, Văn 9.5. Luôn giữ vị trí Top 1 Bảng xếp hạng thi thử hàng tuần trên nền tảng MINDA.",
    image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    academic_year: "2023-2024",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/1/1b/Logo_NEU.png"
  },
  {
    id: 105,
    student_name: "Đặng Tuấn Kiệt",
    teacher_name: "Thầy Nguyễn Lê Minh Ngọc",
    title: "Huy Chương Bạc Tin Học Quốc Tế • ĐH Quốc Gia",
    description: "Thành viên đội tuyển Olympic Tin học Quốc tế (IOI). Tác giả nhiều bài viết chia sẻ kinh nghiệm thuật toán trên MINDA Code.",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    academic_year: "2022-2023",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Logo-VNU.png"
  },
  {
    id: 106,
    student_name: "Lê Quỳnh Anh",
    teacher_name: "Thầy Hùng",
    title: "Điểm 10 Tuyệt Đối Môn Toán THPT • ĐH Bách Khoa",
    description: "Đạt điểm 10 tròn trịa môn Toán THPT Quốc gia. Bí quyết: Ôn tập có hệ thống với hệ sinh thái AI MINDA Copilot.",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    academic_year: "2022-2023",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Logo_HUST.png"
  }
];

export default function HallOfFamePage() {
  const [honors, setHonors] = useState<HonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("total"); // 'total' or specific year
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHonor, setSelectedHonor] = useState<HonorItem | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Helper convert Google Drive or Cloudinary image URLs
  const getDirectImageUrl = (url: string | null) => {
    if (!url) return "";
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  };

  useEffect(() => {
    const fetchPublicHonors = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/public`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHonors(data);
          } else {
            setHonors(FALLBACK_HONORS);
          }
        } else {
          setHonors(FALLBACK_HONORS);
        }
      } catch (err) {
        console.warn("Using fallback honors:", err);
        setHonors(FALLBACK_HONORS);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicHonors();
  }, []);

  // Extract distinct academic years from data + default common years
  const availableYears = Array.from(
    new Set([
      "2025-2026",
      "2024-2025",
      "2023-2024",
      "2022-2023",
      ...honors.map(h => h.academic_year).filter(Boolean)
    ])
  ).sort().reverse() as string[];

  // Filter honors based on selected year tab & search query
  const filteredHonors = honors.filter(h => {
    const matchYear = selectedYear === "total" || h.academic_year === selectedYear;
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      h.student_name.toLowerCase().includes(q) ||
      h.title.toLowerCase().includes(q) ||
      h.teacher_name.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q);
    return matchYear && matchQuery;
  });

  const fireCheer = (e: React.MouseEvent, honor: HonorItem) => {
    e.stopPropagation();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-bg-main text-foreground font-outfit selection:bg-amber-500/30 flex flex-col">
      
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-40 bg-bg-main/90 backdrop-blur-xl border-b border-border-card px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-amber-500/20">
            <img src="/logo.png" alt="MINDA" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-text-primary block leading-none">MINDA</span>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block mt-0.5">Hall of Fame</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl border border-border-card bg-bg-card hover:bg-bg-hover text-text-secondary transition"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <span>Vào Hệ Thống</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── HERO BANNER: ROYAL HALL OF FAME ── */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 overflow-hidden border-b border-border-card bg-gradient-to-b from-amber-500/10 via-bg-card/40 to-transparent">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-500/15 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest shadow-inner">
            <Trophy className="w-4 h-4 text-amber-400 animate-bounce" /> Bảng Vàng Danh Dự MINDA
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 drop-shadow-sm leading-tight">
            HALL OF FAME
          </h1>

          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Tôn vinh những thế hệ học sinh xuất sắc nhất MINDA với thành tích Thủ khoa, Á khoa, Huy chương Quốc gia và đỗ vào các trường Đại học hàng đầu.
          </p>

          {/* Key Metrics Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto pt-6">
            <div className="p-4 rounded-3xl bg-bg-card/80 backdrop-blur border border-border-card shadow-lg text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">100%</span>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Đỗ Đại Học Top 1</p>
            </div>
            <div className="p-4 rounded-3xl bg-bg-card/80 backdrop-blur border border-border-card shadow-lg text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">25+</span>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Thủ Khoa & Á Khoa</p>
            </div>
            <div className="p-4 rounded-3xl bg-bg-card/80 backdrop-blur border border-border-card shadow-lg text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">1165</span>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Kỷ lục ĐGNL ĐHQG</p>
            </div>
            <div className="p-4 rounded-3xl bg-bg-card/80 backdrop-blur border border-border-card shadow-lg text-center space-y-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">50+</span>
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Điểm 10 Tuyệt Đối</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER TABS & SEARCH BAR ── */}
      <section className="sticky top-[73px] z-30 bg-bg-main/95 backdrop-blur-xl border-b border-border-card py-3 px-4 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Category Tabs: Total & Academic Years */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {/* Total Tab */}
            <button
              onClick={() => setSelectedYear("total")}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedYear === "total"
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105"
                  : "bg-bg-card border border-border-card text-text-secondary hover:text-text-primary"
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>🏆 Tất cả (Total)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20 font-mono">
                {honors.length}
              </span>
            </button>

            {/* Academic Year Tabs */}
            {availableYears.map(yr => {
              const count = honors.filter(h => h.academic_year === yr).length;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedYear === yr
                      ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 scale-105"
                      : "bg-bg-card border border-border-card text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Năm học {yr}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20 font-mono">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm học sinh, trường ĐH..."
              className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2 text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-amber-500/50 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* ── MAIN GRID: HONORS CARDS ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
            <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Đang tải bảng vàng vinh danh...</p>
          </div>
        ) : filteredHonors.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-bg-card rounded-3xl border border-border-card p-8">
            <Award className="w-12 h-12 text-text-secondary/40 mx-auto" />
            <h3 className="text-lg font-bold text-text-primary">Chưa tìm thấy học sinh nào</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Không có kết quả phù hợp với bộ lọc năm học hoặc từ khoá tìm kiếm của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredHonors.map((h) => {
              const avatarImg = getDirectImageUrl(h.image_url);
              const uniLogo = getDirectImageUrl(h.university_logo_url);

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHonor(h)}
                  className="bg-bg-card rounded-3xl p-5 sm:p-6 border border-border-card hover:border-amber-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Decorative background ambient glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

                  <div className="space-y-4">
                    
                    {/* Top Row: Academic Year Badge & University Logo */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {h.academic_year ? `Khóa ${h.academic_year}` : "Vinh Danh"}
                      </span>

                      {uniLogo && (
                        <div className="w-8 h-8 rounded-xl bg-white p-1 border border-border-card shadow-sm flex items-center justify-center shrink-0">
                          <img src={uniLogo} alt="University Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Avatar with Royal Golden Frame */}
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
                        {/* Golden Frame Border */}
                        <img 
                          src="/square_rank_frame.png" 
                          alt="Golden Frame" 
                          className="absolute inset-0 w-[125%] h-[125%] -top-[12.5%] -left-[12.5%] max-w-none pointer-events-none drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] object-fill z-0" 
                        />
                        <div className="w-[80%] h-[80%] rounded-md overflow-hidden relative z-10 bg-bg-main shadow-inner">
                          {avatarImg ? (
                            <img src={avatarImg} alt={h.student_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bg-main">
                              <Award className="w-7 h-7 text-amber-500/60" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-text-primary group-hover:text-amber-500 transition-colors truncate">
                          {h.student_name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1 truncate">
                          <span>GV:</span> <strong>{h.teacher_name}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Honor Title */}
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <h4 className="text-xs sm:text-sm font-black text-amber-500 leading-snug line-clamp-2">
                        {h.title}
                      </h4>
                    </div>

                    {/* Description excerpt */}
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                      {h.description}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-4 border-t border-border-card/60 flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => fireCheer(e, h)}
                      className="px-3 py-1.5 rounded-xl bg-bg-main hover:bg-amber-500/10 text-amber-500 text-xs font-bold transition flex items-center gap-1.5 border border-border-card"
                      title="Bắn pháo hoa chúc mừng"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Chúc Mừng 🎉
                    </button>

                    <span className="text-xs font-bold text-text-secondary group-hover:text-text-primary transition flex items-center gap-1">
                      Chi tiết <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── MODAL: SPOTLIGHT HONOR DETAILS ── */}
      {selectedHonor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-bg-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border-card pb-4 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Khóa {selectedHonor.academic_year || "Danh Dự"}
              </span>
              <button 
                onClick={() => setSelectedHonor(null)} 
                className="p-1.5 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary hover:text-text-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Spotlight */}
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                <img 
                  src="/square_rank_frame.png" 
                  alt="Frame" 
                  className="absolute inset-0 w-[125%] h-[125%] -top-[12.5%] -left-[12.5%] max-w-none pointer-events-none drop-shadow-[0_0_15px_rgba(245,158,11,0.8)] object-fill" 
                />
                <div className="w-[80%] h-[80%] rounded-md overflow-hidden relative z-10 bg-bg-main">
                  {selectedHonor.image_url ? (
                    <img src={getDirectImageUrl(selectedHonor.image_url)} alt={selectedHonor.student_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-bg-main">
                      <Award className="w-8 h-8 text-amber-500" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-text-primary">
                  {selectedHonor.student_name}
                </h3>
                <p className="text-xs text-text-secondary mt-1">
                  Giáo viên dẫn dắt: <strong className="text-text-primary">{selectedHonor.teacher_name}</strong>
                </p>
                {selectedHonor.university_logo_url && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={getDirectImageUrl(selectedHonor.university_logo_url)} alt="Logo" className="w-6 h-6 object-contain bg-white rounded p-0.5 border" />
                    <span className="text-[11px] font-bold text-amber-400">Trúng tuyển Đại học</span>
                  </div>
                )}
              </div>
            </div>

            {/* Honor Award Title */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 relative z-10">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">Danh hiệu đạt được:</span>
              <h4 className="text-base font-black text-amber-400">
                {selectedHonor.title}
              </h4>
            </div>

            {/* Full Story / Description */}
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Hành trình & Lời chúc:</span>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line bg-bg-main p-4 rounded-2xl border border-border-card">
                {selectedHonor.description}
              </p>
            </div>

            <div className="flex gap-3 pt-2 relative z-10">
              <button
                onClick={(e) => fireCheer(e, selectedHonor)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Bắn Pháo Hoa Chúc Mừng 🎉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-border-card py-8 px-4 text-center text-xs text-text-secondary">
        <p>© 2026 MINDA E-Learning. Tôn vinh tài năng và nỗ lực của các thế hệ học sinh Việt Nam.</p>
      </footer>
    </div>
  );
}
