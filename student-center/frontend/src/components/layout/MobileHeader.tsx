"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu, X, ShieldAlert, BrainCircuit, Grid, Users, Settings, LogOut,
  LayoutDashboard, BookOpen, Radio, ClipboardCheck, Trophy, Wallet,
  Dumbbell, Sun, Moon, UserCircle, FolderOpen, Heart, Presentation,
  Sparkles, Terminal, Calendar, ClipboardList, FileText, Zap,
  Clapperboard, FileUser, BarChart3, MessageSquareQuote
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [portal, setPortal] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setRole(localStorage.getItem("minda_role"));
    setPortal(localStorage.getItem("minda_portal"));
    setUserName(localStorage.getItem("minda_user_name"));
  }, []);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  const isAdminMode = role === "admin" && portal === "admin" && pathname.startsWith("/admin");

  const ADMIN_ITEMS = [
    { name: "Tổng quan", href: "/admin", icon: Grid },
    { name: "Người dùng", href: "/admin/users", icon: Users },
    { name: "Bảng Vinh Danh", href: "/honors", icon: Trophy },
    { name: "Cảm nhận học sinh", href: "/testimonials", icon: MessageSquareQuote },
    { name: "Hệ thống", href: "/admin/settings", icon: Settings },
  ];

  const TEACHER_ITEMS = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bài Giảng Tương Tác", href: "/lesson-studio", icon: Presentation, badge: "SCORM" },
    { name: "Ôn tập AI (Notebook)", href: "/revision", icon: Sparkles, badge: "AI" },
    { name: "MINDA Code", href: "/code", icon: Terminal, badge: "NEW" },
    { name: "Bảng thành tích", href: "/leaderboard", icon: Trophy },
    { name: "Lịch học", href: "/schedule", icon: Calendar },
    { name: "Trang cá nhân", href: "/profile", icon: UserCircle },
    { name: "Hồ sơ CV", href: "/cv", icon: FileUser },
    { name: "Quản lý Khoá học", href: "/courses", icon: BookOpen },
    { name: "Quản lý Học sinh", href: "/my-students", icon: Users },
    { name: "Điểm Danh & Báo Cáo", href: "/session-reports", icon: ClipboardList },
    { name: "Lớp học Live", href: "/live", icon: Radio },
    { name: "Chấm điểm & Bài tập", href: "/assignments", icon: ClipboardCheck },
    { name: "Bảng Vinh Danh", href: "/honors", icon: Trophy },
    { name: "Lưu Bút Kỷ Yếu", href: "/yearbook/", icon: Heart },
    { name: "Công cụ PDF", href: "/pdf-tools", icon: FileText },
    { name: "Upload Đề Nhanh", href: "/quick-upload", icon: Zap, badge: "NEW" },
    { name: "Manim Studio", href: "/manim-studio", icon: Clapperboard, badge: "AI" },
    { name: "Quản lý Học phí", href: "/tuition", icon: Wallet },
  ];

  const STUDENT_ITEMS = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bài Giảng Tương Tác", href: "/lesson-studio", icon: Presentation, badge: "SCORM" },
    { name: "Ôn tập AI (Notebook)", href: "/revision", icon: Sparkles, badge: "AI" },
    { name: "MINDA Code", href: "/code", icon: Terminal, badge: "NEW" },
    { name: "Thư viện Lớp học", href: "/courses", icon: BookOpen },
    { name: "Lịch học", href: "/schedule", icon: Calendar },
    { name: "Nhật Ký Học Tập", href: "/my-reports", icon: BarChart3 },
    { name: "Phòng học Live", href: "/live", icon: Radio },
    { name: "Phòng Luyện Thi", href: "/practice", icon: Dumbbell },
    { name: "Cặp xách (Drive)", href: "/drive", icon: FolderOpen },
    { name: "Lưu Bút Kỷ Yếu", href: "/yearbook/", icon: Heart },
    { name: "Bảng Vàng (Hall of Fame)", href: "/hall-of-fame", icon: Trophy, badge: "HOT" },
    { name: "Bảng Thành tích", href: "/leaderboard", icon: Trophy },
    { name: "Học phí", href: "/tuition", icon: Wallet },
  ];

  const navItems = isAdminMode ? ADMIN_ITEMS : role === "teacher" ? TEACHER_ITEMS : STUDENT_ITEMS;
  const accentColor = isAdminMode ? "text-red-500" : role === "teacher" ? "text-rose-500" : "text-indigo-500";
  const activeBg = isAdminMode
    ? "bg-red-500/10 border-red-500/30 text-red-500 font-bold"
    : role === "teacher"
    ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold"
    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold";

  return (
    <>
      {/* Ẩn hoàn toàn MobileHeader khi trong phòng Live */}
      {pathname.match(/^\/live\/[^/]+/) ? null : (
      <>
      {/* Mobile Top Header — chỉ hiện dưới lg */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-bg-main/95 backdrop-blur-xl border-b border-border-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="MINDA" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-black text-base tracking-tight text-text-primary">
            MINDA{isAdminMode && <span className="text-red-500 text-xs ml-1 font-bold uppercase">Admin</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle on Mobile Header */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-bg-hover border border-border-card flex items-center justify-center transition-colors"
            title={theme === "dark" ? "Chuyển sang sáng" : "Chuyển sang tối"}
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 text-amber-500" />
              : <Moon className="w-4 h-4 text-text-secondary" />
            }
          </button>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-xl bg-bg-hover border border-border-card flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </header>

      {/* Overlay Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in Drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 bg-bg-main border-r border-border-card flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden">
              <img src="/logo.png" alt="MINDA" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-sm text-text-primary">
                {isAdminMode ? "Admin Console" : "MINDA.EDU"}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>
                {userName || "User"}
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center">
            <X className="w-4 h-4 text-text-primary" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/admin");
            const Icon = item.icon;
            const isExternal = item.href === "/yearbook/";

            if (isExternal) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm border text-text-secondary border-transparent hover:bg-bg-hover hover:text-text-primary"
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {(item as any).badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-widest shrink-0">
                      {(item as any).badge}
                    </span>
                  )}
                </a>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm border ${
                  isActive ? activeBg : "text-text-secondary border-transparent hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? (role === "teacher" ? "text-rose-500" : "text-indigo-400") : ""}`} />
                <span className="flex-1">{item.name}</span>
                {(item as any).badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 tracking-widest shrink-0">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-card flex flex-col gap-2">
          {/* Theme toggle in drawer too */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-bg-hover border border-border-card transition-colors"
          >
            {theme === "dark"
              ? <><Sun className="w-4 h-4 text-amber-500" /> Chuyển sang Sáng</>
              : <><Moon className="w-4 h-4" /> Chuyển sang Tối</>
            }
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-text-primary hover:bg-bg-hover border border-transparent hover:border-border-card transition-colors"
          >
            🏠 Về Trang chủ MINDA
          </Link>
          <button
            onClick={async () => {
              if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(r => r.unregister()));
              }
              window.location.reload();
            }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-500 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-colors"
          >
            🔄 Cập nhật phiên bản mới
          </button>
          <button
            onClick={() => { localStorage.clear(); window.location.href='/login'; }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </div>
      </>
      )}
    </>
  );
}
