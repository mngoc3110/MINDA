"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Lock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (password.length < 4) {
      setError("Mật khẩu phải có ít nhất 4 ký tự.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/reset-password?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: password }),
        }
      );
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        const data = await res.json();
        setError(typeof data.detail === "string" ? data.detail : "Token không hợp lệ hoặc đã hết hạn.");
      }
    } catch {
      setError("Không thể kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-text-secondary text-sm">Liên kết không hợp lệ. Vui lòng yêu cầu liên kết mới.</p>
        <Link href="/forgot-password" className="text-indigo-400 hover:underline text-sm">← Quên mật khẩu</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-6">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-400" />
        </div>
        <h2 className="text-lg font-bold">Đặt lại thành công!</h2>
        <p className="text-text-secondary text-sm">Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Mật khẩu mới</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
            placeholder="Tối thiếu 4 ký tự"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Xác nhận mật khẩu</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-indigo-500/50 focus:bg-bg-main transition-colors text-text-primary placeholder-gray-500"
            placeholder="Nhập lại mật khẩu"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all"
      >
        {loading ? "Đang cập nhật..." : (<>Đặt lại mật khẩu <ArrowRight className="w-4 h-4" /></>)}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex items-center justify-center relative overflow-hidden py-12">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full pointer-events-none" />

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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Đặt Lại Mật Khẩu</h1>
          <p className="text-text-secondary text-sm text-center">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <div className="p-8 rounded-3xl bg-bg-card backdrop-blur-xl border border-border-card shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <Suspense fallback={<div className="text-center text-text-secondary text-sm py-4">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 hover:underline transition-all">← Quay về đăng nhập</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
