"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name, role, phone }),
      });
      
      if (res.ok) {
        if (role === "teacher") {
          alert("Đăng ký Giáo viên thành công!\n\n⚠️ Tài khoản của bạn đang chờ Admin phê duyệt. Bạn sẽ nhận được thông báo sau khi được chấp thuận.");
          router.push("/login?registered=teacher");
        } else {
          router.push("/login?registered=student");
        }
      } else {
        const err = await res.json();
        // err.detail có thể là string hoặc array object từ Pydantic validation
        let errMsg = "Đăng ký thất bại.";
        if (typeof err.detail === "string") {
          errMsg = err.detail;
        } else if (Array.isArray(err.detail)) {
          errMsg = err.detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
        } else if (err.detail) {
          errMsg = JSON.stringify(err.detail);
        }
        alert("Lỗi: " + errMsg);
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex items-center justify-center relative overflow-hidden py-12">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-pink-600/10 blur-[130px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group z-20">
        <div className="w-8 h-8 rounded-lg bg-bg-card border border-border-card flex items-center justify-center group-hover:bg-bg-hover transition-colors">
          <ArrowRight className="w-4 h-4 text-text-secondary rotate-180" />
        </div>
        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Trang chủ</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/20 mb-4">
            <BrainCircuit className="w-6 h-6 text-text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Đăng ký Tài khoản</h1>
          <p className="text-text-secondary text-sm text-center">Bắt đầu hành trình học tập tương tác với AI</p>
        </div>

        <div className="p-8 rounded-3xl bg-bg-card backdrop-blur-xl border border-border-card shadow-2xl relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
          
          <form className="flex flex-col gap-5" onSubmit={handleRegister}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-text-muted" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-text-muted text-sm font-medium">📱</span>
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
                  placeholder="0912 345 678"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-text-secondary">Bạn là ai?</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    role === "student" 
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.2)]" 
                      : "bg-transparent border-border-card text-text-secondary hover:bg-bg-main hover:border-border-hover"
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
                      : "bg-transparent border-border-card text-text-secondary hover:bg-bg-main hover:border-border-hover"
                  }`}
                >
                  👩‍🏫 Giáo viên
                </button>
              </div>

              {/* Cảnh báo chờ phê duyệt */}
              {role === "teacher" && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <span className="text-base mt-0.5">&#9888;&#65039;</span>
                  <span>
                    <strong>Yêu cầu phê duyệt:</strong> Tài khoản Giáo viên sẽ được xém xét bởi Admin trước khi có thể đăng nhập vào hệ thống.
                  </span>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-text-primary font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
            >
              Đăng ký ngay <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-secondary">
            Đã có tài khoản? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">Đăng nhập</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
