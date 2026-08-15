"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  Award, 
  Trophy, 
  Sparkles, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Calendar, 
  School, 
  X,
  Sun,
  Moon,
  Edit3,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  Save,
  Loader2
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

interface CurrentUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

const FALLBACK_HONORS: HonorItem[] = [
  {
    id: 101,
    student_name: "Nguyễn Lê Minh Khang",
    teacher_name: "Thầy Hùng & Cô Thuỷ",
    title: "Thủ Khoa Khối A00 (29.85 Điểm)",
    description: "Thủ khoa toàn quốc với Toán 10, Lý 10, Hoá 9.85. Tinh thần tự học bền bỉ, hoàn thành hơn 500 đề thi thử trên hệ thống MINDA.",
    image_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
    academic_year: "2025-2026",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Logo_HUST.png"
  },
  {
    id: 102,
    student_name: "Trần Bảo Ngọc",
    teacher_name: "Thầy Nguyễn Lê Minh Ngọc",
    title: "Thủ Khoa ĐGNL ĐHQG (1165/1200)",
    description: "Top 1 kỳ thi Đánh giá Năng lực ĐHQG TP.HCM. Giải Nhất Tin học Trẻ cấp Tỉnh, đạt học bổng toàn phần ngành Kinh tế Đối ngoại.",
    image_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
    academic_year: "2025-2026",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/8/8c/Logo_FTU.png"
  },
  {
    id: 103,
    student_name: "Phạm Quốc Anh",
    teacher_name: "Thầy Hùng",
    title: "Giải Nhất Quốc Gia Môn Toán",
    description: "Học sinh giỏi Quốc gia môn Toán lớp 12. Điểm số tuyệt đối môn Toán & Sinh học trong kỳ thi Tốt nghiệp THPT Quốc gia.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
    academic_year: "2024-2025",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/0/07/Logo_HMU.jpg"
  },
  {
    id: 104,
    student_name: "Hoàng Minh Thư",
    teacher_name: "Cô Thuỷ",
    title: "Á Khoa Khối D01 (29.2 Điểm)",
    description: "IELTS 8.0, Toán 9.8, Văn 9.5. Luôn giữ vị trí Top 1 Bảng xếp hạng thi thử hàng tuần trên nền tảng MINDA.",
    image_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
    academic_year: "2024-2025",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/vi/1/1b/Logo_NEU.png"
  },
  {
    id: 105,
    student_name: "Đặng Tuấn Kiệt",
    teacher_name: "Thầy Nguyễn Lê Minh Ngọc",
    title: "Huy Chương Bạc Tin Học Quốc Tế",
    description: "Thành viên đội tuyển Olympic Tin học Quốc tế (IOI). Tác giả nhiều bài viết chia sẻ kinh nghiệm thuật toán trên MINDA Code.",
    image_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
    academic_year: "2023-2024",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e8/Logo-VNU.png"
  },
  {
    id: 106,
    student_name: "Lê Quỳnh Anh",
    teacher_name: "Thầy Hùng",
    title: "Điểm 10 Tuyệt Đối Môn Toán THPT",
    description: "Đạt điểm 10 tròn trịa môn Toán THPT Quốc gia. Bí quyết: Ôn tập có hệ thống với hệ sinh thái AI MINDA Copilot.",
    image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80",
    academic_year: "2023-2024",
    university_logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Logo_HUST.png"
  }
];

export default function HallOfFamePage() {
  const [honors, setHonors] = useState<HonorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("2025-2026");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHonor, setSelectedHonor] = useState<HonorItem | null>(null);
  const { theme, toggleTheme } = useTheme();

  // Auth & Admin Edit state
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isDarberAdmin, setIsDarberAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingHonor, setEditingHonor] = useState<HonorItem | null>(null);
  const [formData, setFormData] = useState({
    student_name: "",
    title: "",
    academic_year: "2025-2026",
    description: "",
    image_url: "",
    university_logo_url: ""
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getDirectImageUrl = (url: string | null) => {
    if (!url) return "";
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  };

  const fetchPublicHonors = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/public`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHonors(data);
          // Default to latest year if current is not in data
          const yearsInData = Array.from(new Set(data.map((h: HonorItem) => h.academic_year).filter(Boolean))).sort().reverse() as string[];
          if (yearsInData.length > 0) {
            setSelectedYear(prev => (yearsInData.includes(prev) ? prev : yearsInData[0]));
          }
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

  useEffect(() => {
    fetchPublicHonors();

    // Check Current Logged-in User
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("minda_token");
      if (storedToken) {
        setToken(storedToken);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then(res => res.ok ? res.json() : null)
          .then(user => {
            if (user) {
              setCurrentUser(user);
              const isDarber = 
                user.email?.toLowerCase().includes("darber3110") || 
                user.email?.toLowerCase().includes("darbar3110") ||
                user.role === "admin" ||
                localStorage.getItem("minda_role") === "admin";
              setIsDarberAdmin(Boolean(isDarber));
            }
          })
          .catch(e => console.warn("Auth check error:", e));
      }
    }
  }, []);

  const openCreateModal = () => {
    setEditingHonor(null);
    setFormData({
      student_name: "",
      title: "",
      academic_year: selectedYear || "2025-2026",
      description: "",
      image_url: "",
      university_logo_url: ""
    });
    setAvatarFile(null);
    setAvatarPreview("");
    setLogoFile(null);
    setLogoPreview("");
    setIsEditorOpen(true);
  };

  const openEditModal = (honor: HonorItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingHonor(honor);
    setFormData({
      student_name: honor.student_name,
      title: honor.title,
      academic_year: honor.academic_year || selectedYear || "2025-2026",
      description: honor.description || "",
      image_url: honor.image_url || "",
      university_logo_url: honor.university_logo_url || ""
    });
    setAvatarFile(null);
    setAvatarPreview(honor.image_url ? getDirectImageUrl(honor.image_url) : "");
    setLogoFile(null);
    setLogoPreview(honor.university_logo_url ? getDirectImageUrl(honor.university_logo_url) : "");
    setIsEditorOpen(true);
  };

  const handleSaveHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_name.trim()) {
      alert("Vui lòng nhập họ tên học sinh!");
      return;
    }
    if (!formData.title.trim()) {
      alert("Vui lòng nhập trường trúng tuyển hoặc danh hiệu!");
      return;
    }
    if (!token) {
      alert("Bạn cần đăng nhập bằng tài khoản darber3110 / admin để lưu!");
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append("custom_student_name", formData.student_name.trim());
      data.append("title", formData.title.trim());
      data.append("academic_year", formData.academic_year.trim());
      data.append("description", formData.description.trim());
      
      if (avatarFile) {
        data.append("image", avatarFile);
      } else if (formData.image_url) {
        data.append("image_url", formData.image_url.trim());
      }

      if (logoFile) {
        data.append("university_logo", logoFile);
      } else if (formData.university_logo_url) {
        data.append("university_logo_url", formData.university_logo_url.trim());
      }

      const isEdit = editingHonor && editingHonor.id < 100000;
      const url = isEdit 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/${editingHonor.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        setIsEditorOpen(false);
        setEditingHonor(null);
        await fetchPublicHonors();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        alert("Đã lưu thông tin vinh danh thành công!");
      } else {
        const err = await res.json();
        alert(`Lỗi khi lưu: ${err.detail || "Không thể cập nhật"}`);
      }
    } catch (err: any) {
      console.error("Save honor error:", err);
      alert(`Lỗi kết nối máy chủ: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHonor = async (e: React.MouseEvent, honorId: number) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xoá học sinh này khỏi Bảng Vàng Vinh Danh?")) {
      return;
    }
    if (!token) {
      alert("Vui lòng đăng nhập quyền darber3110 / admin để xoá!");
      return;
    }

    setDeletingId(honorId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/${honorId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setHonors(prev => prev.filter(h => h.id !== honorId));
        if (selectedHonor?.id === honorId) setSelectedHonor(null);
        if (editingHonor?.id === honorId) setIsEditorOpen(false);
        alert("Đã xoá vinh danh thành công!");
      } else {
        const err = await res.json();
        alert(`Lỗi khi xoá: ${err.detail || "Không thể xoá"}`);
      }
    } catch (err: any) {
      console.error("Delete honor error:", err);
      alert(`Lỗi kết nối máy chủ: ${err.message || err}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Distinct academic years (Strictly academic years, sorted newest first)
  const availableYears = Array.from(
    new Set([
      "2025-2026",
      "2024-2025",
      "2023-2024",
      "2022-2023",
      ...honors.map(h => h.academic_year).filter(Boolean)
    ])
  ).sort().reverse() as string[];

  // Filter honors strictly by academic year and search query
  const filteredHonors = honors.filter(h => {
    const matchYear = h.academic_year === selectedYear;
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
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-bg-main text-t-primary font-outfit selection:bg-amber-500/30 flex flex-col`}>
      
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-40 bg-bg-main/90 backdrop-blur-xl border-b border-border-card/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/30 text-slate-950 font-black">
            <Trophy className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-t-primary block leading-none">
              MINDA <span className="text-amber-500">HALL OF FAME</span>
            </span>
            <span className="text-[10px] text-t-secondary font-bold uppercase tracking-widest block mt-0.5">
              Bảng Vàng Vinh Danh Toàn Hệ Thống
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border-card text-xs font-bold text-t-secondary hover:text-t-primary hover:bg-bg-hover transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trang Chủ
          </Link>

          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-border-card bg-bg-card hover:bg-bg-hover text-t-secondary transition"
            title="Đổi giao diện Sáng / Tối"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/25 flex items-center gap-1.5"
          >
            <span>Vào Hệ Thống</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── ADMIN / DARBER3110 QUICK TOOLBAR ── */}
      {isDarberAdmin && (
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-600/20 border-b border-amber-500/30 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-500">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span>Chế độ Quản Trị Viên: <strong>{currentUser?.email || "darber3110"}</strong></span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] uppercase font-black">Full Quyền Chỉnh Sửa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Thêm Học Sinh Mới</span>
            </button>

            <Link
              href="/honors"
              className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-bg-card hover:bg-bg-hover text-amber-500 font-bold text-xs transition flex items-center gap-1.5"
            >
              <span>Trang Quản Lý Vinh Danh</span>
            </Link>
          </div>
        </div>
      )}

      {/* ── HERO BANNER: LUXURIOUS GOLDEN AUDITORIUM ── */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 overflow-hidden border-b border-border-card bg-gradient-to-b from-amber-500/10 via-bg-card/60 to-bg-main">
        {/* Ambient radial glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[320px] bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-600/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" /> BẢNG VÀNG THÀNH TÍCH XUẤT SẮC
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 drop-shadow-sm leading-tight uppercase">
            MINDA HALL OF FAME
          </h1>

          <p className="text-sm sm:text-base text-t-secondary max-w-2xl mx-auto leading-relaxed">
            Nơi ghi danh và vinh danh những cá nhân xuất sắc nhất MINDA — Những thủ khoa, á khoa, học sinh giỏi quốc gia và niềm tự hào của các thế hệ học viên.
          </p>
        </div>
      </section>

      {/* ── FILTER BAR: ACADEMIC YEARS ONLY ── */}
      <section className="sticky top-[69px] z-30 bg-bg-main/95 backdrop-blur-xl border-b border-border-card/80 py-3 px-4 sm:px-6 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Category Tabs by Academic Year */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
            {availableYears.map(yr => {
              const count = honors.filter(h => h.academic_year === yr).length;
              return (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedYear === yr
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-105"
                      : "bg-bg-card border border-border-card text-t-secondary hover:text-t-primary hover:bg-bg-hover"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Năm học {yr}</span>
                  {count > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/20 font-mono font-bold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input & Add button if admin */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 shrink-0">
              <Search className="w-4 h-4 text-t-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm học sinh, trường ĐH..."
                className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2.5 text-xs text-t-primary placeholder:text-t-secondary focus:outline-none focus:border-amber-500/50 shadow-sm"
              />
            </div>

            {isDarberAdmin && (
              <button
                onClick={openCreateModal}
                className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20 shrink-0"
                title="Thêm học sinh mới vào Bảng Vàng"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── MAIN HONORS SHOWCASE GRID ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg" />
            <p className="text-xs text-t-secondary font-bold uppercase tracking-widest">Đang tải bảng vàng vinh danh...</p>
          </div>
        ) : filteredHonors.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-bg-card rounded-3xl border border-border-card p-8">
            <Award className="w-12 h-12 text-t-secondary/40 mx-auto" />
            <h3 className="text-lg font-bold text-t-primary">Chưa có học sinh nào trong Năm học {selectedYear}</h3>
            <p className="text-xs text-t-secondary max-w-sm mx-auto">
              Không có kết quả phù hợp với niên khóa đã chọn hoặc từ khoá tìm kiếm của bạn.
            </p>
            {isDarberAdmin && (
              <button
                onClick={openCreateModal}
                className="mt-3 px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/25"
              >
                <Plus className="w-4 h-4" /> Thêm học sinh vào niên khóa này
              </button>
            )}
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
                  className="bg-bg-card rounded-3xl p-6 border border-border-card hover:border-amber-500/60 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top glowing ambient highlight */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all pointer-events-none" />

                  <div className="space-y-4">
                    
                    {/* Top Row: Academic Year Pill & ULTRA LARGE University Logo */}
                    <div className="flex items-start justify-between gap-3">
                      <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/25 shadow-sm mt-1">
                        {h.academic_year ? `Niên Khóa ${h.academic_year}` : "Vinh Danh"}
                      </span>

                      {/* ULTRA LARGE University Logo Badge (88px) */}
                      {uniLogo && (
                        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-white p-2.5 border-2 border-amber-500/50 shadow-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                          <img src={uniLogo} alt="University Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Student Avatar & Full Name */}
                    <div className="flex items-center gap-4">
                      {/* Avatar with Elegant Gold Ring */}
                      <div className="w-16 h-16 shrink-0 relative rounded-2xl p-0.5 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-md shadow-amber-500/20">
                        <div className="w-full h-full rounded-[14px] overflow-hidden bg-bg-main relative">
                          {avatarImg ? (
                            <img src={avatarImg} alt={h.student_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bg-card">
                              <Award className="w-7 h-7 text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Name & Teacher */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-t-primary group-hover:text-amber-500 transition-colors leading-snug">
                          {h.student_name}
                        </h3>
                        <p className="text-xs text-t-secondary mt-0.5">
                          GV dẫn dắt: <strong className="text-t-primary">{h.teacher_name}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Prominent University & Achievement Ribbon */}
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3.5 shadow-sm">
                      {uniLogo && (
                        <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-border-card shadow-md shrink-0 flex items-center justify-center">
                          <img src={uniLogo} alt="Uni Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider block">Trường Trúng Tuyển / Danh Hiệu</span>
                        <h4 className="text-sm font-black text-amber-500 leading-snug mt-0.5">
                          {h.title}
                        </h4>
                      </div>
                    </div>

                    {/* Description Story */}
                    <p className="text-xs text-t-secondary leading-relaxed line-clamp-3">
                      {h.description}
                    </p>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="space-y-2 pt-4 mt-4 border-t border-border-card/60">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => fireCheer(e, h)}
                        className="px-3 py-1.5 rounded-xl bg-bg-main hover:bg-amber-500/15 text-amber-500 text-xs font-bold transition flex items-center gap-1.5 border border-border-card shadow-sm"
                        title="Bắn pháo hoa chúc mừng"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Chúc Mừng 🎉
                      </button>

                      <span className="text-xs font-bold text-t-secondary group-hover:text-t-primary transition flex items-center gap-1">
                        Xem Chi Tiết <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>

                    {/* Admin Direct Action Buttons on Card */}
                    {isDarberAdmin && (
                      <div className="flex items-center gap-2 pt-2 border-t border-dashed border-amber-500/30">
                        <button
                          onClick={(e) => openEditModal(h, e)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-500 hover:text-slate-950 text-xs font-black transition border border-amber-500/30 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Sửa thông tin
                        </button>
                        <button
                          onClick={(e) => handleDeleteHonor(e, h.id)}
                          disabled={deletingId === h.id}
                          className="p-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold transition border border-rose-500/30 flex items-center justify-center gap-1"
                          title="Xoá vinh danh này"
                        >
                          {deletingId === h.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          <span className="text-[11px] font-bold">Xoá</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── SPOTLIGHT MODAL ── */}
      {selectedHonor && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-bg-card border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border-card pb-4 relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Niên Khóa {selectedHonor.academic_year || "Vinh Danh"}
              </span>
              <button 
                onClick={() => setSelectedHonor(null)} 
                className="p-1.5 rounded-xl bg-bg-main hover:bg-bg-hover text-t-secondary hover:text-t-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Spotlight & GIANT University Logo */}
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-20 h-20 shrink-0 relative rounded-2xl p-0.5 bg-gradient-to-br from-amber-400 to-yellow-600 shadow-lg shadow-amber-500/30">
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-bg-main">
                    {selectedHonor.image_url ? (
                      <img src={getDirectImageUrl(selectedHonor.image_url)} alt={selectedHonor.student_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-bg-main">
                        <Award className="w-8 h-8 text-amber-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h3 className="text-xl sm:text-2xl font-black text-t-primary">
                    {selectedHonor.student_name}
                  </h3>
                  <p className="text-xs text-t-secondary mt-1">
                    GV dẫn dắt: <strong className="text-t-primary">{selectedHonor.teacher_name}</strong>
                  </p>
                </div>
              </div>

              {/* GIANT Uni Emblem in Modal (96px) */}
              {selectedHonor.university_logo_url && (
                <div className="w-24 h-24 rounded-3xl bg-white p-3 border-2 border-amber-500/50 shadow-2xl flex items-center justify-center shrink-0">
                  <img src={getDirectImageUrl(selectedHonor.university_logo_url)} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            {/* Honor Award Title */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 relative z-10">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest block">Thành tích & Danh hiệu:</span>
              <h4 className="text-base font-black text-amber-500">
                {selectedHonor.title}
              </h4>
            </div>

            {/* Full Story */}
            <div className="space-y-2 relative z-10">
              <span className="text-xs font-bold text-t-secondary uppercase tracking-wider block">Hành trình & Lời chúc:</span>
              <p className="text-xs sm:text-sm text-t-secondary leading-relaxed whitespace-pre-line bg-bg-main p-4 rounded-2xl border border-border-card">
                {selectedHonor.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2 relative z-10">
              <button
                onClick={(e) => fireCheer(e, selectedHonor)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Bắn Pháo Hoa Chúc Mừng 🎉
              </button>

              {isDarberAdmin && (
                <button
                  onClick={() => {
                    const honorToEdit = selectedHonor;
                    setSelectedHonor(null);
                    openEditModal(honorToEdit);
                  }}
                  className="py-3 px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500 text-amber-500 hover:text-slate-950 font-black text-xs transition border border-amber-500/40 flex items-center justify-center gap-2 shadow-md"
                >
                  <Edit3 className="w-4 h-4" /> Sửa Thông Tin
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DARBER3110 / ADMIN QUICK EDITOR MODAL ── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full bg-bg-card border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative my-8 animate-in zoom-in-95">
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-border-card pb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-t-primary">
                    {editingHonor ? "Chỉnh Sửa Thông Tin Vinh Danh" : "Thêm Học Sinh Mới Vào Bảng Vàng"}
                  </h3>
                  <p className="text-xs text-t-secondary font-medium">
                    Quyền Admin: <strong className="text-amber-500">{currentUser?.email || "darber3110"}</strong>
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsEditorOpen(false)} 
                className="p-2 rounded-xl bg-bg-main hover:bg-bg-hover text-t-secondary hover:text-t-primary transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHonor} className="space-y-4 relative z-10 text-xs sm:text-sm">
              
              {/* Row 1: Student Name & Academic Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-t-primary flex items-center gap-1">
                    <span>Họ và Tên Học Sinh</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_name}
                    onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                    placeholder="VD: Nguyễn Ngọc Khánh An"
                    className="w-full bg-bg-main border border-border-card rounded-2xl px-4 py-3 text-t-primary focus:outline-none focus:border-amber-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-t-primary flex items-center gap-1">
                    <span>Niên Khóa</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      required
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      placeholder="VD: 2025-2026"
                      className="flex-1 bg-bg-main border border-border-card rounded-2xl px-4 py-3 text-t-primary focus:outline-none focus:border-amber-500 shadow-sm"
                    />
                    <select
                      value={formData.academic_year}
                      onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                      className="bg-bg-main border border-border-card rounded-2xl px-3 py-3 text-t-primary focus:outline-none focus:border-amber-500 text-xs"
                    >
                      <option value="2025-2026">2025-2026</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                      <option value="2021-2022">2021-2022</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 2: University / Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-t-primary flex items-center gap-1">
                  <span>Trường Trúng Tuyển / Danh Hiệu Vinh Danh</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Học viện Hàng không Việt Nam / Thủ Khoa Khối A00"
                  className="w-full bg-bg-main border border-border-card rounded-2xl px-4 py-3 text-t-primary focus:outline-none focus:border-amber-500 shadow-sm"
                />
              </div>

              {/* Row 3: Description / Story */}
              <div className="space-y-1.5">
                <label className="font-bold text-t-primary">
                  <span>Hành trình, Điểm số & Lời chúc</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="VD: Cựu học sinh xuất sắc. Đỗ ngành Quản lý Hoạt động Bay với 27.5 điểm..."
                  className="w-full bg-bg-main border border-border-card rounded-2xl px-4 py-3 text-t-primary focus:outline-none focus:border-amber-500 shadow-sm resize-none"
                />
              </div>

              {/* Row 4: Student Avatar & University Logo Uploads */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* Avatar Input */}
                <div className="p-4 rounded-2xl bg-bg-main border border-border-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-t-primary flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-500" /> Ảnh Chân Dung
                    </span>
                    {avatarPreview && (
                      <span className="text-[10px] text-emerald-500 font-bold">✓ Đã có ảnh</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-bg-card border border-border-card overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Award className="w-6 h-6 text-t-secondary/40" />
                      )}
                    </div>

                    <label className="flex-1 cursor-pointer py-2 px-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-border-card text-center text-xs font-bold transition flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chọn file ảnh mới</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setAvatarFile(f);
                            setAvatarPreview(URL.createObjectURL(f));
                          }
                        }} 
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => {
                      setFormData({ ...formData, image_url: e.target.value });
                      if (!avatarFile) setAvatarPreview(getDirectImageUrl(e.target.value));
                    }}
                    placeholder="Hoặc dán Link ảnh Google Drive / Cloudinary..."
                    className="w-full bg-bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-t-primary focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* University Logo Input */}
                <div className="p-4 rounded-2xl bg-bg-main border border-border-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-t-primary flex items-center gap-1.5">
                      <School className="w-4 h-4 text-amber-500" /> Logo Đại Học (To & Rõ)
                    </span>
                    {logoPreview && (
                      <span className="text-[10px] text-emerald-500 font-bold">✓ Đã có Logo</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-border-card p-1.5 overflow-hidden shrink-0 flex items-center justify-center shadow-md">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <School className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <label className="flex-1 cursor-pointer py-2 px-3 rounded-xl bg-bg-card hover:bg-bg-hover border border-border-card text-center text-xs font-bold transition flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>Chọn file Logo trường</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setLogoFile(f);
                            setLogoPreview(URL.createObjectURL(f));
                          }
                        }} 
                      />
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.university_logo_url}
                    onChange={(e) => {
                      setFormData({ ...formData, university_logo_url: e.target.value });
                      if (!logoFile) setLogoPreview(getDirectImageUrl(e.target.value));
                    }}
                    placeholder="Hoặc dán Link Logo trường Đại học..."
                    className="w-full bg-bg-card border border-border-card rounded-xl px-3 py-2 text-xs text-t-primary focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-card">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-2xl border border-border-card hover:bg-bg-hover text-t-secondary font-bold transition"
                >
                  Huỷ Bỏ
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black transition shadow-lg shadow-amber-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu lên hệ thống...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Lưu Thay Đổi Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-border-card py-8 px-4 text-center text-xs text-t-secondary">
        <p>© 2026 MINDA E-Learning. Tôn vinh tài năng và nỗ lực của các thế hệ học sinh Việt Nam.</p>
      </footer>
    </div>
  );
}
