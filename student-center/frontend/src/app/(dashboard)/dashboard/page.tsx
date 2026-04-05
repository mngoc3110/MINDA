"use client";

import { useEffect, useState, useRef } from "react";
import { BrainCircuit, HardDrive, Star, Trophy, Users, BookOpen, Clock, Activity, FileText, UploadCloud, Loader2, ExternalLink } from "lucide-react";
import Math3DViewer from "@/features/3d-math/Math3DViewer";
import Link from "next/link";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [files, setFiles] = useState<{ id: string; filename: string; file_url: string; file_type: string; file_size: string }[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<Record<string, string | number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async (savedRole: string) => {
    const token = localStorage.getItem("minda_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/my-drive`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setFiles(await res.json());
      
      const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        setIsGoogleConnected(authData.is_google_connected);
      }

      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dashboard/${savedRole === 'teacher' ? 'teacher-stats' : 'student-stats'}`, {
         headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem("minda_role") || "student";
    setRole(savedRole);
    setUserName(localStorage.getItem("minda_user_name") || "Bạn");
    fetchFiles(savedRole);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem("minda_token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchFiles(role || "student");
      } else {
        alert("Lỗi khi tải file lên.");
      }
    } catch {
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderDriveSection = (accentColor: string) => (
    <section className="flex-1 p-6 rounded-3xl bg-bg-card border border-border-card flex flex-col min-h-[260px] shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold flex items-center gap-2 text-text-primary">
          <HardDrive className={`w-5 h-5 ${accentColor}`} /> MINDA_Storage Của Tôi
        </h2>
        <span className="text-xs text-text-secondary font-medium">{files.length} Tệp</span>
      </div>
      
      {files.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center opacity-40 gap-2">
          <HardDrive className="w-10 h-10 text-text-secondary" />
          <p className="text-sm text-text-secondary">Trống. Hãy tải lên tài liệu đầu tiên!</p>
        </div>
      ) : (
        <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
          {files.map((file) => (
            <a
              key={file.id}
              href={file.file_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-bg-hover hover:bg-bg-hover border border-border-card transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-card border border-border-card flex items-center justify-center">
                  <FileText className="w-4 h-4 text-text-secondary" />
                </div>
                <div>
                  <span className="text-sm font-semibold truncate block w-32 md:w-48 text-text-primary">{file.filename}</span>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest">{file.file_type.split('/')[1] || 'FILE'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-text-secondary">{file.file_size}</span>
                <ExternalLink className="w-3 h-3 text-transparent group-hover:text-indigo-500 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      )}
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      
      <button
        onClick={() => isGoogleConnected ? fileInputRef.current?.click() : alert("Vui lòng vào Trang cá nhân để Liên kết Google Drive trước khi tải tài liệu lên!")}
        disabled={uploading || !isGoogleConnected}
        className="w-full mt-4 py-3 rounded-xl bg-bg-hover hover:bg-bg-hover border border-border-card text-sm font-semibold text-text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ...</>
        ) : (
          <><UploadCloud className="w-4 h-4" /> Tải lên tài liệu (+10 EXP)</>
        )}
      </button>
    </section>
  );

  if (role === null) return <div className="min-h-screen bg-bg-main" />;

  // ══════════ TEACHER VIEW ══════════
  if (role === "teacher") {
    return (
      <div className="min-h-screen bg-bg-main p-6 md:p-8 font-outfit">
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-border-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none mb-0.5 text-text-primary">Teacher Dashboard</h1>
              <p className="text-text-secondary text-sm">Chào mừng thầy/cô <strong>{userName}</strong>!</p>
            </div>
          </div>
          <Link href="/login" onClick={() => localStorage.clear()} className="px-4 py-2 border border-border-card hover:bg-bg-hover rounded-full text-sm font-semibold text-text-primary transition-colors">
            Đăng xuất
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: "Tổng số Học sinh", value: stats.total_students || "0", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
            { label: "Khoá học đang mở", value: stats.active_courses || "0", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
            { label: "Học sinh chờ duyệt", value: stats.pending_students ?? "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
            { label: "Bài tập đã tạo", value: stats.assignment_count ?? "0", icon: FileText, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" },
          ].map((stat, i) => (
            <div key={i} className={`p-5 rounded-2xl bg-bg-card border ${stat.border} flex items-center gap-4 shadow-sm`}>
              <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-text-secondary font-medium mb-0.5">{stat.label}</p>
                <p className="text-2xl font-black text-text-primary">{stat.value as string}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="p-6 rounded-3xl bg-bg-card border border-border-card shadow-sm">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-text-primary">
              <Activity className="w-5 h-5 text-pink-500" /> Bảng tin hệ thống
            </h2>
            <div className="text-text-secondary text-sm border-l-2 border-pink-400 pl-4 py-1 space-y-3">
              <div>
                <p className="font-semibold text-text-primary mb-1">Cập nhật lúc 08:00 AM</p>
                <p>Hệ thống tự động chấm điểm bài tập trắc nghiệm đã được bật.</p>
              </div>
              {Number(stats.pending_students) > 0 && (
                <div className="mt-3 pt-3 border-t border-border-card">
                  <p className="font-semibold text-amber-700 mb-1">⚠️ Có {String(stats.pending_students)} học sinh chờ phê duyệt đăng ký!</p>
                  <a href="/courses" className="text-xs text-blue-600 underline">Vào Quản lý Khoá học để duyệt →</a>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border-card">
                <p className="font-semibold text-text-primary mb-1">🎖️ Rank Giáo viên: <span className="text-pink-600">{(stats.rank_icon as string) || "📖"} {(stats.rank_name as string) || "Trợ giảng"}</span> — {String(stats.xp || 0)} XP</p>
                {stats.next_rank && <p className="text-xs">Còn <strong className="text-pink-600">{String(stats.xp_to_next)} XP</strong> để lên <strong>{stats.next_rank as string}</strong>. Tạo bài tập = +10 XP/bài.</p>}
              </div>
            </div>
          </section>
          {renderDriveSection("text-pink-500")}
        </div>
      </div>
    );
  }

  // ══════════ STUDENT VIEW ══════════
  return (
    <div className="min-h-screen bg-bg-main p-6 md:p-8 font-outfit">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-border-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight leading-none mb-0.5 text-text-primary">MINDA Workspace</h1>
            <p className="text-text-secondary text-sm">Chào mừng <strong>{userName}</strong> quay trở lại!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 font-semibold text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{stats.exp || "0"} EXP</span>
          </div>
          <Link href="/login" onClick={() => localStorage.clear()} className="px-4 py-2 border border-border-card hover:bg-bg-hover rounded-full text-sm font-semibold text-text-primary transition-colors">
            Đăng xuất
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-5">

          {/* Student ID Card */}
          <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-indigo-400/50 via-purple-300/20 to-transparent overflow-hidden shadow-lg">
            <div className="relative bg-bg-card rounded-[22px] p-6 flex flex-col border border-border-card">
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg border-2 border-white">
                  <span className="font-bold text-xl text-white">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">MINDA.EDU ID</p>
                  <p className="text-sm font-mono text-indigo-600 tracking-wider font-bold">{stats.student_id as string || "#MND-0000"}</p>
                </div>
              </div>
              
              <div className="mb-5">
                <h3 className="font-black text-xl tracking-tight text-text-primary mb-1 truncate">{userName}</h3>
                <p className="text-sm text-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.7)]"></span>
                  Đang hoạt động trên MINDA
                </p>
              </div>

              <div className="mt-auto space-y-2.5">
                <div className="p-3 rounded-xl bg-bg-hover border border-border-card flex items-center justify-between">
                  <span className="text-xs text-text-secondary uppercase font-bold tracking-widest">Trạng thái</span>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md">Đã kích hoạt</span>
                </div>
                <Link href="/profile" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center">
                  Xem Trang cá nhân 3D
                </Link>
              </div>
            </div>
          </div>
          
          {/* Rank Section */}
          <section className="p-6 rounded-3xl bg-bg-card border border-border-card shadow-sm">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-text-primary">
              <Trophy className="w-5 h-5 text-slate-500" /> Tiến độ Rank
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-400 to-slate-600 flex items-center justify-center border-2 border-white shadow-md">
                <span className="font-black text-white text-sm">S1</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-primary">Sơ cấp</h3>
                <p className="text-sm text-text-secondary">Hoàn thành bài tập để thăng hạng</p>
              </div>
            </div>
            <div className="w-full bg-bg-hover rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-slate-400 to-slate-600 h-2 rounded-full w-0"></div>
            </div>
            <p className="text-xs text-center text-text-secondary">Hoàn thành 1 bài tập hoặc 1 khoá học để nhận ⭐ và điểm EXP!</p>
          </section>

          {/* Drive Section */}
          {renderDriveSection("text-indigo-500")}
        </div>

        {/* Right Column: 3D Math Module */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px] xl:min-h-[700px]">
          <Math3DViewer />
        </div>

      </div>
    </div>
  );
}
