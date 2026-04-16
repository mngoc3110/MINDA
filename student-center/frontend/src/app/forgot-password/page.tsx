"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mail, ArrowRight, ArrowLeft, Link2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
      if (data.reset_link) {
        setResetLink(data.reset_link);
      }
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex items-center justify-center relative overflow-hidden py-12">
      {/* Background */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />

      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 group z-20">
        <div className="w-8 h-8 rounded-lg bg-bg-card border border-border-card flex items-center justify-center group-hover:bg-bg-hover transition-colors">
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </div>
        <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">Đăng nhập</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10 px-6"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Quên Mật Khẩu</h1>
          <p className="text-text-secondary text-sm text-center">Nhập email để nhận liên kết đặt lại mật khẩu</p>
        </div>

        <div className="p-8 rounded-3xl bg-bg-card backdrop-blur-xl border border-border-card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {!resetLink ? (
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Email tài khoản</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-text-muted" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
              {message && !resetLink && (
                <p className="text-green-400 text-sm text-center">{message}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
              >
                {loading ? "Đang xử lý..." : (<>Gửi liên kết <ArrowRight className="w-4 h-4" /></>)}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary mb-1">Liên kết đã sẵn sàng!</h2>
                <p className="text-sm text-text-secondary">{message}</p>
              </div>

              {/* Hiển thị link tạm thời */}
              <div className="w-full p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Liên kết đặt lại mật khẩu</span>
                </div>
                <p className="text-xs text-text-secondary break-all leading-relaxed mb-3">{resetLink}</p>
                <Link
                  href={resetLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
                >
                  Đặt lại mật khẩu ngay <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-xs text-text-muted">⏱️ Liên kết có hiệu lực trong 30 phút</p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-text-secondary">
            Nhớ mật khẩu rồi? <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">Đăng nhập</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
