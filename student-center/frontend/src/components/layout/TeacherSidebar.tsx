"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Grid, BookOpen, GraduationCap, ClipboardCheck, Wallet, LogOut, Sun, Moon, User } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

const NAV_ITEMS = [
  { name: "Tổng quan", href: "/dashboard", icon: Grid },
  { name: "Trang Cá nhân", href: "/profile", icon: User },
  { name: "Quản lý Khoá học", href: "/courses", icon: BookOpen },
  { name: "Lớp học Live", href: "/live", icon: GraduationCap },
  { name: "Chấm điểm & Bài tập", href: "/assignments", icon: ClipboardCheck },
  { name: "Quản lý Học phí", href: "/tuition", icon: Wallet },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-[280px] h-screen border-r border-border-card bg-bg-main/95 backdrop-blur-3xl flex-col hidden lg:flex shrink-0 relative z-50">
      {/* Hiệu ứng ánh sáng */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent -z-10 pointer-events-none" />
      
      {/* App Logo */}
      <Link href="/" className="p-8 pb-6 flex items-center gap-4 hover:opacity-80 transition-opacity">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,72,0.5)]">
          <BrainCircuit className="w-7 h-7 text-white" />
        </div>
        <div>
           <span className="font-bold text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 block leading-none">MINDA</span>
           <span className="text-xs text-pink-400 font-semibold tracking-widest uppercase mt-1 block">Teacher Portal</span>
        </div>
      </Link>

      {/* Điều hướng Menu */}
      <nav className="flex-1 py-6 px-5 flex flex-col gap-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2">Công cụ giảng dạy</span>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? "bg-pink-500/10 text-pink-400 border border-pink-500/20 shadow-[0_4px_20px_rgba(225,29,72,0.1)] relative" 
                  : "text-gray-400 hover:bg-white-[0.04] hover:text-white border border-transparent"
              }`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full" />}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? '' : 'group-hover:scale-110'}`} />
              <span className="font-semibold text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Thông tin Cá nhân ở Footer */}
      <div className="p-5 border-t border-white-[0.05]">
        <div className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.06] mb-4 flex gap-4 items-center">
             <div className="w-12 h-12 rounded-full border-2 border-pink-500/50 p-0.5 shrink-0 shadow-[0_0_15px_rgba(225,29,72,0.3)]">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">GV</span>
                </div>
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-bold text-white truncate">Giáo viên</p>
               <p className="text-[11px] text-pink-400 mt-0.5 font-bold tracking-wide uppercase">Teacher Account</p>
             </div>
        </div>
        <div className="flex flex-col gap-2">
            <button onClick={toggleTheme} className="flex items-center justify-between w-full py-2.5 px-4 mb-2 rounded-xl text-t-secondary hover:text-t-primary hover:bg-b-hover transition-colors font-medium border border-transparent hover:border-b-border">
              <span className="text-sm">Giao diện: {theme === 'dark' ? 'Tối' : 'Sáng'}</span>
              {theme === 'dark' ? <Moon className="w-4 h-4 text-gray-400" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            </button>
            <Link href="/" className="flex items-center justify-center w-full py-2.5 rounded-xl text-gray-400 hover:text-t-primary hover:bg-b-hover transition-colors font-medium border border-transparent hover:border-white/10">
              <span className="text-sm">Về Trang chủ MINDA</span>
            </Link>
            <Link href="/login" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium border border-transparent hover:border-red-500/20">
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Đăng xuất an toàn</span>
            </Link>
        </div>
      </div>
    </aside>
  );
}
