"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name, role }),
      });
      
      if (res.ok) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        window.location.href = "/login";
      } else {
        const err = await res.json();
        alert("Lỗi: " + err.detail);
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-white flex items-center justify-center relative overflow-hidden py-12">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/10 blur-[130px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-4">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Đăng ký Tài khoản</h1>
          <p className="text-gray-400 text-sm text-center">Bắt đầu hành trình học tập tương tác với AI</p>
        </div>

        <div className="p-8 rounded-3xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          
          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.05] transition-colors text-white placeholder-gray-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.05] transition-colors text-white placeholder-gray-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-white/[0.05] transition-colors text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-gray-300">Bạn là ai?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    role === "student" 
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.2)]" 
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  👨‍🎓 Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    role === "teacher" 
                      ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]" 
                      : "bg-white/[0.02] border-white/10 text-gray-400 hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  👩‍🏫 Giáo viên
                </button>
              </div>
            </div>

            <button 
              type="submit"
              className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              Đăng ký ngay <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Đã có tài khoản? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">Đăng nhập</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
