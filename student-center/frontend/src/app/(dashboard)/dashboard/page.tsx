"use client";

import { useEffect, useState, useRef } from "react";
import { BrainCircuit, HardDrive, Star, Trophy, Users, BookOpen, Clock, Activity, FileText, UploadCloud, Loader2, ExternalLink } from "lucide-react";
import Math3DViewer from "@/features/3d-math/Math3DViewer";
import Link from "next/link";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [files, setFiles] = useState<any[]>([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async (savedRole: string) => {
    const token = localStorage.getItem("minda_token");
    if (!token) return;
    try {
      // Check file list
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/files/my-drive`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
      
      // Check auth status
      const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        setIsGoogleConnected(authData.is_google_connected);
      }

      // Lấy API Backend hiển thị dữ liệu bảng 0 nếu không có
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dashboard/${savedRole === 'teacher' ? 'teacher-stats' : 'student-stats'}`, {
         headers: { "Authorization": `Bearer ${token}` }
      });
      if (statsRes.ok) {
         setStats(await statsRes.json());
      }
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem("minda_token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/files/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        // Refresh danh sách
        fetchFiles(role || "student");
      } else {
        alert("Lỗi khi tải file lên.");
      }
    } catch (err) {
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderDriveSection = (themeColor: string) => {
    return (
      <section className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HardDrive className={`w-5 h-5 ${themeColor}`} /> MINDA_Storage Của Tôi
          </h2>
          <span className="text-xs text-gray-400">{files.length} Tệp</span>
        </div>
        
        {files.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <HardDrive className="w-12 h-12 mb-3 text-gray-500" />
            <p className="text-sm">Trống. Hãy bắt đầu tải lên tài liệu!</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[250px] pr-2">
            {files.map((file, i) => (
              <a 
                key={file.id} 
                href={file.file_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/20 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold`}>
                    <FileText className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate w-32 md:w-48 text-gray-300 group-hover:text-white">{file.filename}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{file.file_type.split('/')[1] || 'FILE'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500">{file.file_size}</span>
                  <ExternalLink className="w-3 h-3 text-transparent group-hover:text-indigo-400 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        )}
        
        {/* Hidden input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <button 
          onClick={() => isGoogleConnected ? handleUploadClick() : alert("Vui lòng vào Trang cá nhân (Profile) để Liên kết Google Drive trước khi tải tài liệu lên!")}
          disabled={uploading || !isGoogleConnected}
          className="w-full mt-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Đang đồng bộ Drive...</>
          ) : (
            <><UploadCloud className="w-4 h-4" /> Tải lên tài liệu (+10 EXP)</>
          )}
        </button>
      </section>
    );
  };

  if (role === null) return <div className="min-h-screen bg-bg-main"></div>;

  if (role === "teacher") {
    // ══════════════ GIÁO VIÊN VIEW ══════════════
    return (
      <div className="min-h-screen bg-bg-main text-white p-6 md:p-8 font-outfit selection:bg-pink-500/30">
        <header className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Teacher Dashboard</h1>
              <p className="text-gray-400 text-sm">Chào mừng thầy/cô {userName}!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login" onClick={() => localStorage.clear()} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-full text-sm font-medium transition-colors">
              Đăng xuất
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Tổng số Học sinh", value: stats.total_students || "0", icon: Users, color: "text-blue-400" },
            { label: "Khoá học đang mở", value: stats.active_courses || "0", icon: BookOpen, color: "text-emerald-400" },
            { label: "Bài nộp chờ chấm", value: stats.pending_assignments || "0", icon: FileText, color: "text-amber-400" },
            { label: "Giờ dạy tuần này", value: `${stats.teaching_hours || "0"}h`, icon: Clock, color: "text-pink-400" },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
              <div className={`p-4 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-400" /> Bảng tin hệ thống
            </h2>
            <div className="text-gray-400 text-sm border-l-2 border-pink-500 pl-4 py-1">
              <p className="font-medium text-white mb-1">Cập nhật lúc 08:00 AM</p>
              <p>Hệ thống tự động chấm điểm bài tập trắc nghiệm đã được bật.</p>
            </div>
          </section>

          {/* Drive Của Giáo Viên */}
          {renderDriveSection("text-pink-400")}
        </div>
      </div>
    );
  }

  // ══════════════ HỌC SINH VIEW ══════════════
  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-8 font-outfit selection:bg-indigo-500/30">
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">MINDA Workspace</h1>
            <p className="text-gray-400 text-sm">Chào mừng {userName} quay trở lại!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 font-medium text-sm">
            <Star className="w-4 h-4 fill-current" />
            <span>{stats.exp || "0"} EXP</span>
          </div>
          <Link href="/login" onClick={() => localStorage.clear()} className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-full text-sm font-medium transition-colors">
            Đăng xuất
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Modules & Rank */}
        <div className="lg:col-span-1 flex flex-col gap-6">

          {/* Thẻ Học Sinh (Student ID Card) */}
          <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-indigo-500/50 via-purple-500/20 to-transparent overflow-hidden shadow-2xl shadow-indigo-500/10 shrink-0 group">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-[#0a0a0a] rounded-[22px] p-6 flex flex-col h-full border border-white/5 group-hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] border-2 border-white/10">
                  <span className="font-bold text-xl text-white">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">MINDA.EDU ID</p>
                  <p className="text-sm font-mono text-indigo-400 tracking-wider">{stats.student_id || "#MND-0000"}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-black text-2xl tracking-tight text-white mb-1 truncate">{userName}</h3>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
                  Đang hoạt động trên MINDA
                </p>
              </div>

              <div className="mt-auto space-y-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-widest">Trạng thái</span>
                  <span className="text-xs font-bold text-white bg-indigo-500/20 px-2 py-1 rounded-md text-indigo-300">Đã kích hoạt</span>
                </div>
                <Link href="/profile" className="w-full mt-2 py-3 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-transparent text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center">
                  Xem Trang cá nhân 3D
                </Link>
              </div>
            </div>
          </div>
          
          {/* Rank Section */}
          <section className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px]" />
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-purple-400" /> Tiến độ Rank
            </h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center border-4 border-[#0a0a0a] shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                <span className="font-black text-white text-xl">B1</span>
              </div>
              <div>
                <h3 className="font-bold text-xl text-cyan-400">Bạch Kim I</h3>
                <p className="text-sm text-gray-400">Còn 550 EXP để lên Kim Cương</p>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-cyan-400 to-blue-600 h-2 rounded-full w-[80%]"></div>
            </div>
            <p className="text-xs text-center text-gray-500">Giữ sự tập trung 100% khi xem video bài giảng để nhận x2 EXP!</p>
          </section>

          {/* Drive Section Của Học Sinh */}
          {renderDriveSection("text-blue-400")}

        </div>

        {/* Right Column: 3D Math Module */}
        <div className="lg:col-span-2 flex flex-col min-h-[500px] xl:min-h-[700px]">
          <Math3DViewer />
        </div>

      </div>
    </div>
  );
}
