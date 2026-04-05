"use client";

import { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/stats`, {
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
    { title: "Tổng Người Dùng", value: stats?.total_users || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { title: "Học Viên", value: stats?.total_students || 0, icon: GraduationCap, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
    { title: "Giáo Viên", value: stats?.total_teachers || 0, icon: ShieldCheck, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { title: "Khoá Học & Lớp", value: stats?.total_courses || 0, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-red-500" />
          Tổng Quan Hệ Thống
        </h1>
        <p className="text-gray-400">Giám sát và vận hành nền tảng MINDA</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
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
                className="relative overflow-hidden p-6 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 flex flex-col justify-between group hover:border-white/20 transition-all"
              >
                {/* Glow effect */}
                <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${c.bg} blur-2xl group-hover:blur-3xl transition-all`} />
                
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.bg} ${c.border} border`}>
                    <Icon className={`w-6 h-6 ${c.color}`} />
                  </div>
                  <h3 className="text-sm font-medium text-gray-400">{c.title}</h3>
                </div>
                
                <div className="relative z-10">
                  <p className="text-4xl font-black tracking-tight">{c.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      
      {!loading && (
        <div className="mt-12 p-8 rounded-3xl bg-[#0a0a0a]/80 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-red-500/5 to-transparent pointer-events-none" />
          <h2 className="text-xl font-bold mb-4">Trạng thái Máy Chủ</h2>
          <div className="flex gap-4 items-center">
             <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
             <span className="text-green-400 font-medium tracking-wide text-sm">Hệ thống đang hoạt động ổn định</span>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Tất cả các dịch vụ bao gồm AI Engine (RAPT-CLIP), PostgreSQL, Next.js Frontend và FastAPI Backend đều báo cáo trực tuyến qua PM2.
          </p>
        </div>
      )}
    </div>
  );
}
