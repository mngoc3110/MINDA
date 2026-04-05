"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Grid, BookOpen, GraduationCap, ClipboardCheck, Wallet, LogOut, Sun, Moon, FileUser } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/dashboard", icon: Grid },
  { name: "Hồ sơ CV", href: "/profile", icon: FileUser },
  { name: "Quản lý Khoá học", href: "/courses", icon: BookOpen },
  { name: "Lớp học Live", href: "/live", icon: GraduationCap },
  { name: "Chấm điểm & Bài tập", href: "/assignments", icon: ClipboardCheck },
  { name: "Quản lý Học phí", href: "/tuition", icon: Wallet },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserName(localStorage.getItem("minda_user_name") || "Giáo viên");
    setUserId(localStorage.getItem("minda_user_id"));
  }, []);

  return (
    <aside className="w-[280px] h-screen border-r border-border-card bg-bg-main/95 backdrop-blur-3xl flex-col hidden lg:flex shrink-0 relative z-50">
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent -z-10 pointer-events-none" />
      
      {/* Logo */}
      <Link href="/" className="p-8 pb-6 flex items-center gap-4 hover:opacity-80 transition-opacity">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center shadow-md shadow-rose-500/20">
          <BrainCircuit className="w-7 h-7 text-white" />
        </div>
        <div>
           <span className="font-black text-2xl tracking-tighter text-text-primary block leading-none">MINDA</span>
           <span className="text-xs text-pink-500 font-semibold tracking-widest uppercase mt-1 block">Teacher Portal</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-6 px-5 flex flex-col gap-1.5">
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 ml-2">Công cụ giảng dạy</span>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative border ${
                isActive 
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm" 
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary border-transparent"
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-rose-500 rounded-r-full" />}
              <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? "text-rose-500" : "group-hover:scale-110"}`} />
              <span className="font-semibold text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-5 border-t border-border-card">
        <div className="p-4 rounded-2xl bg-bg-card border border-border-card mb-4 flex gap-3 items-center shadow-sm">
          <div className="w-10 h-10 rounded-full border-2 border-rose-400/50 shrink-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">GV</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-text-primary truncate">{userName}</p>
            <Link
              href={userId ? `/teachers/${userId}` : "/profile"}
              className="text-[10px] text-rose-500 font-semibold tracking-wide uppercase hover:text-rose-400 transition-colors"
            >
              Xem CV công khai →
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <button onClick={toggleTheme} className="flex items-center justify-between w-full py-2.5 px-4 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-medium border border-transparent hover:border-border-card">
            <span className="text-sm">Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>
          <Link href="/" className="flex items-center justify-center w-full py-2.5 rounded-xl text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors font-medium border border-transparent hover:border-border-card text-sm">
            Về Trang chủ MINDA
          </Link>
          <Link href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors font-medium border border-transparent hover:border-red-500/20 text-sm">
            <LogOut className="w-4 h-4" />
            Đăng xuất an toàn
          </Link>
        </div>
      </div>
    </aside>
  );
}
