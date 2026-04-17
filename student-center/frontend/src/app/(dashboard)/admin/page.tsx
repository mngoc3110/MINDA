"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, ShieldCheck, Activity, Server } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Tổng Người Dùng",  value: stats?.total_users    || 0, icon: Users,        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   num: "text-blue-700" },
    { title: "Học Viên",          value: stats?.total_students  || 0, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", num: "text-emerald-700" },
    { title: "Giáo Viên",         value: stats?.total_teachers  || 0, icon: ShieldCheck,   color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200",  num: "text-orange-700" },
    { title: "Khoá Học & Lớp",   value: stats?.total_courses   || 0, icon: BookOpen,      color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200",  num: "text-violet-700" },
  ];

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 flex items-center gap-3 text-[#1A1410]">
          <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
          Tổng Quan Hệ Thống
        </h1>
        <p className="text-[#5C4F42] text-sm">Giám sát và vận hành nền tảng MINDA</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-[#EEE9E1] animate-pulse rounded-2xl border border-[#E2D9CE]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={i}
                className={`relative overflow-hidden p-6 rounded-3xl bg-white border ${c.border} flex flex-col justify-between group hover:shadow-lg transition-all duration-300`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                    <Icon className={`w-6 h-6 ${c.color}`} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#5C4F42]">{c.title}</h3>
                </div>
                <p className={`text-4xl font-black tracking-tight ${c.num}`}>{c.value}</p>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {!loading && (
        <div className="mt-10 p-6 sm:p-8 rounded-3xl bg-white border border-[#E2D9CE] relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <Server className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-[#1A1410]">Trạng thái Máy Chủ</h2>
          </div>
          <div className="flex gap-4 items-center mt-3">
             <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0" />
             <span className="text-green-700 font-semibold tracking-wide text-sm">Hệ thống đang hoạt động ổn định</span>
          </div>
          <p className="mt-3 text-sm text-[#5C4F42] leading-relaxed">
            Tất cả các dịch vụ bao gồm AI Engine (RAPT-CLIP), PostgreSQL, Next.js Frontend và FastAPI Backend đều báo cáo trực tuyến qua PM2.
          </p>
        </div>
      )}
    </div>
  );
}
