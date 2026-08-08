"use client";

import { motion } from "framer-motion";
import { BrainCircuit, Mail, Lock, User, ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBJECTS = [
  "Toán", "Vật Lý", "Hóa Học", "Sinh Học",
  "Tiếng Anh", "Tin Học", "Ngữ Văn", "Lịch Sử",
  "Địa Lý", "Kinh Tế & Pháp Luật", "Khác",
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("student");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);

  // Parent student selection states
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  useEffect(() => {
    if (role === "parent" && studentQuery.trim().length >= 1 && !selectedStudent) {
      setSearchingStudents(true);
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/search-students?q=${encodeURIComponent(studentQuery)}`);
          if (res.ok) {
            setStudentResults(await res.json());
          }
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingStudents(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setStudentResults([]);
    }
  }, [studentQuery, role, selectedStudent]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: name,
          role,
          phone,
          subject: role === "teacher" ? subject : undefined,
          student_email: role === "parent" ? (selectedStudent?.email || studentQuery || undefined) : undefined,
          student_name: role === "parent" ? (selectedStudent?.full_name || studentQuery || undefined) : undefined
        }),
      });
      
      if (res.ok) {
        if (role === "teacher") {
          alert("Đăng ký Giáo viên thành công!\n\n⚠️ Tài khoản của bạn đang chờ Admin phê duyệt. Bạn sẽ nhận được thông báo sau khi được chấp thuận.");
          router.push("/login?registered=teacher");
        } else if (role === "parent") {
          alert("Đăng ký tài khoản Phụ huynh thành công!\n\nTài khoản của bạn đã được kết nối với con em để theo dõi kết quả học tập.");
          router.push("/login?registered=parent");
        } else {
          router.push("/login?registered=student");
        }
      } else {
        const err = await res.json();
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                    role === "student" 
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_15px_rgba(79,70,229,0.2)]" 
                      : "bg-transparent border-border-card text-text-secondary hover:bg-bg-main hover:border-border-hover"
                  }`}
                >
                  👨‍🎓 Học sinh
                </button>
                <button
                  type="button"
                  onClick={() => setRole("parent")}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                    role === "parent" 
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                      : "bg-transparent border-border-card text-text-secondary hover:bg-bg-main hover:border-border-hover"
                  }`}
                >
                  👨‍👩‍👧 Phụ huynh
                </button>
                <button
                  type="button"
                  onClick={() => setRole("teacher")}
                  className={`py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                    role === "teacher" 
                      ? "bg-pink-600/20 border-pink-500 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]" 
                      : "bg-transparent border-border-card text-text-secondary hover:bg-bg-main hover:border-border-hover"
                  }`}
                >
                  👩‍🏫 Giáo viên
                </button>
              </div>

              {/* Child Student selector for parents */}
              {role === "parent" && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-emerald-400 flex items-center gap-1.5">
                      <span>🎒</span> Bạn là phụ huynh của học sinh nào?
                    </label>
                  </div>

                  {selectedStudent ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/30">
                          {selectedStudent.full_name?.[0]?.toUpperCase() || "H"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{selectedStudent.full_name}</p>
                          <p className="text-[10px] text-text-muted truncate">{selectedStudent.email} {selectedStudent.phone ? `· ${selectedStudent.phone}` : ""}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => { setSelectedStudent(null); setStudentQuery(""); }}
                        className="px-2 py-1 rounded-lg bg-white/8 hover:bg-white/12 text-[11px] text-text-muted hover:text-text-primary transition-colors shrink-0"
                      >
                        Đổi học sinh
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-text-muted text-xs">🔍</span>
                      </div>
                      <input
                        type="text"
                        value={studentQuery}
                        onChange={e => setStudentQuery(e.target.value)}
                        placeholder="Nhập tên, email hoặc SĐT của con..."
                        className="w-full pl-9 pr-4 py-2.5 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-emerald-500/50 focus:bg-bg-main transition-colors text-xs text-text-primary placeholder-gray-500"
                      />

                      {/* Dropdown search suggestions */}
                      {studentResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-neutral-900 border border-white/12 shadow-2xl z-30 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                          {studentResults.map(st => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setSelectedStudent(st);
                                setStudentQuery(st.full_name);
                                setStudentResults([]);
                              }}
                              className="p-2 rounded-xl hover:bg-white/8 flex items-center justify-between text-left transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0">
                                  {st.full_name?.[0]?.toUpperCase() || "H"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-text-primary truncate">{st.full_name}</p>
                                  <p className="text-[10px] text-text-muted truncate">{st.email}</p>
                                </div>
                              </div>
                              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 shrink-0">
                                Chọn
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-text-muted leading-relaxed">
                    💡 Hệ thống sẽ tự động kết nối tài khoản của bạn với học sinh này để theo dõi điểm danh, báo cáo buổi học và tiến độ làm bài tập.
                  </p>
                </div>
              )}

              {/* Subject selector for teachers */}
              {role === "teacher" && (
                <div className="space-y-2 pt-1">
                  <label className="text-sm font-medium text-text-secondary">Môn học bạn giảng dạy</label>
                  <div className="relative">
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      className="w-full pl-4 pr-10 py-3 bg-transparent border border-border-card rounded-xl focus:outline-none focus:border-pink-500/50 focus:bg-bg-main transition-colors text-text-primary appearance-none"
                    >
                      <option value="" disabled>-- Chọn môn học --</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s} className="bg-bg-card text-text-primary">{s}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Cảnh báo chờ phê duyệt */}
              {role === "teacher" && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <span className="text-base mt-0.5">&#9888;&#65039;</span>
                  <span>
                    <strong>Yêu cầu phê duyệt:</strong> Tài khoản Giáo viên sẽ được xem xét bởi Admin trước khi có thể đăng nhập vào hệ thống.
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
