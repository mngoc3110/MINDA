"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("minda_token", data.access_token);
        localStorage.setItem("minda_role", data.role);
        localStorage.setItem("minda_user_name", data.full_name || "");
        if (data.user_id) localStorage.setItem("minda_user_id", data.user_id);
        if (data.avatar_url) localStorage.setItem("minda_avatar_url", data.avatar_url);
        if (data.cover_url) localStorage.setItem("minda_cover_url", data.cover_url);
        
        // Redirect: Admin goes to /admin, others to /dashboard
        // Redirect everyone back to Homepage
        window.location.href = "/";
      } else {
        alert("Tài khoản hoặc mật khẩu không đúng!");
      }
    } catch (err) {
      alert("Lỗi máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group z-20">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowRight className="w-4 h-4 text-gray-400 rotate-180" />
        </div>
        <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Trang chủ</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Đăng nhập</h1>
          <p className="text-gray-400 text-sm text-center">Chào mừng bạn trở lại Cổng học trực tuyến MINDA</p>
        </div>

        <div className="p-8 rounded-3xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email hoặc Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-colors text-white placeholder-gray-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
                <Link href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-colors text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              Đăng nhập <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Chưa có tài khoản? <Link href="/register" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">Đăng ký ngay</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
