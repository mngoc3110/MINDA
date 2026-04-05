"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Mail, Lock, LogIn, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AdminLoginPage() {
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
        
        // Strict Role Check for Admin Portal
        if (data.role !== "admin") {
          alert("Truy cập bị từ chối: Tài khoản của bạn không có thẩm quyền truy cập Cổng Quản Trị.");
          setLoading(false);
          return;
        }

        localStorage.setItem("minda_token", data.access_token);
        localStorage.setItem("minda_role", data.role);
        localStorage.setItem("minda_portal", "admin"); // Flag: logged in via admin portal
        localStorage.setItem("minda_user_name", data.full_name || "");
        if (data.user_id) localStorage.setItem("minda_user_id", data.user_id);
        if (data.avatar_url) localStorage.setItem("minda_avatar_url", data.avatar_url);
        if (data.cover_url) localStorage.setItem("minda_cover_url", data.cover_url);
        
        // Cấp thẩm quyền thành công, tiến vào thánh địa
        window.location.href = "/admin";
      } else {
        alert("Tài khoản hoặc mật khẩu không chính xác!");
      }
    } catch (err) {
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      if(loading) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center relative overflow-hidden font-outfit">
      {/* Background Gradients for Admin Theme (Red/Orange) */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-red-600/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-600/5 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />

      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 group z-20">
        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </div>
        <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Quay lại Cổng thường</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-600/30 mb-5 relative group">
            <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldAlert className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-white">Admin Portal</h1>
          <p className="text-gray-500 text-sm text-center font-medium uppercase tracking-widest">Khu vực hạn chế truy cập</p>
        </div>

        <div className="p-8 rounded-[2rem] bg-[#0f0f0f]/90 backdrop-blur-2xl border border-red-500/20 shadow-2xl relative overflow-hidden">
          {/* Top Edge Highlight */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-300">Credentials</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-red-500/50 focus:bg-red-500/5 transition-all text-white placeholder-gray-600"
                  placeholder="admin@minda.io.vn"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 mt-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  disabled={loading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-red-500/50 focus:bg-red-500/5 transition-all text-white placeholder-gray-600 font-mono tracking-widest"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Truy cập Hệ thống <LogIn className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600" />
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-600 font-medium">
          MINDA EduCenter AI • Secure Admin Gateway
        </div>
      </motion.div>
    </div>
  );
}
