"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldAlert, BrainCircuit, Grid, Users, Settings, LogOut,
  LayoutDashboard, BookOpen, GraduationCap, ClipboardCheck, Trophy, Wallet,
  Radio, Dumbbell, User } from "lucide-react";
import Link from "next/link";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [portal, setPortal] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();

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
    { name: "Hệ thống", href: "/admin/settings", icon: Settings },
  ];

  const TEACHER_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Khoá học", href: "/courses", icon: BookOpen },
    { name: "Lớp Live", href: "/live", icon: Radio },
    { name: "Bài tập", href: "/assignments", icon: ClipboardCheck },
    { name: "Luyện tập", href: "/practice", icon: Dumbbell },
    { name: "Bảng xếp hạng", href: "/leaderboard", icon: Trophy },
    { name: "Học phí", href: "/tuition", icon: Wallet },
    { name: "Hồ sơ", href: "/profile", icon: User },
  ];

  const navItems = isAdminMode ? ADMIN_ITEMS : TEACHER_ITEMS;
  const accentColor = isAdminMode ? "text-red-600" : "text-pink-600";
  const activeBg = isAdminMode ? "bg-red-50 border-red-200 text-red-700" : "bg-pink-50 border-pink-200 text-pink-700";

  return (
    <>
      {/* Mobile Top Header — chỉ hiện dưới lg */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-bg-main/95 backdrop-blur-xl border-b border-border-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          {isAdminMode ? (
            <ShieldAlert className="w-6 h-6 text-red-500" />
          ) : (
            <BrainCircuit className="w-6 h-6 text-pink-500" />
          )}
          <span className="font-black text-base tracking-tight text-[#1A1410]">
            MINDA{isAdminMode && <span className="text-red-500 text-xs ml-1 font-bold uppercase">Admin</span>}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-xl bg-[#EEE9E1] border border-[#E2D9CE] flex items-center justify-center"
        >
          <Menu className="w-5 h-5 text-[#1A1410]" />
        </button>
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
            {isAdminMode ? (
              <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="font-black text-sm text-[#1A1410]">
                {isAdminMode ? "Admin Console" : "MINDA.EDU"}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${accentColor}`}>
                {userName || "User"}
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-[#EEE9E1] flex items-center justify-center">
            <X className="w-4 h-4 text-[#1A1410]" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard" && item.href !== "/admin");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm border ${
                  isActive ? activeBg : "text-[#5C4F42] border-transparent hover:bg-[#EEE9E1] hover:text-[#1A1410]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-card">
          <Link
            href="/login"
            onClick={() => { localStorage.clear(); }}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </Link>
        </div>
      </div>
    </>
  );
}
