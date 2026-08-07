"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image, Loader2, CheckCircle2, ChevronDown, BookOpen, Folder, AlertCircle, Sparkles, X, Save, Eye, EyeOff, Zap } from "lucide-react";
import MathText from "@/components/MathText";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

type ParseState = "idle" | "uploading" | "done" | "error";

function QuestionPreview({ q, idx }: { q: any; idx: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  if (q.items) {
    // True/False type
    return (
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
        <p className="text-sm font-semibold text-text-secondary mb-1">Câu {idx + 1} · Đúng/Sai</p>
        <div className="text-sm text-text-primary mb-3"><MathText>{q.text}</MathText></div>
        <div className="flex flex-col gap-1.5">
          {q.items?.map((item: any) => (
            <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${item.isTrue ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300" : "border-white/8 text-text-muted"}`}>
              <span className="font-bold uppercase w-4">{item.label}.</span>
              <span className="flex-1"><MathText>{item.text}</MathText></span>
              {item.isTrue && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (q.options) {
    // MCQ type
    return (
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
        <p className="text-sm font-semibold text-text-secondary mb-1">Câu {idx + 1} · Trắc nghiệm</p>
        <div className="text-sm text-text-primary mb-3"><MathText>{q.text}</MathText></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {q.options?.map((opt: string, i: number) => (
            <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl text-xs border ${i === q.correctAnswer ? "border-emerald-500/30 bg-emerald-500/8 text-emerald-300" : "border-white/8 text-text-muted"}`}>
              <span className="font-bold shrink-0 w-5">{["A", "B", "C", "D"][i]}.</span>
              <span className="flex-1"><MathText>{opt}</MathText></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Short answer
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8">
      <p className="text-sm font-semibold text-text-secondary mb-1">Câu {idx + 1} · Trả lời ngắn</p>
      <div className="text-sm text-text-primary mb-2"><MathText>{q.text}</MathText></div>
      <button onClick={() => setShowAnswer(v => !v)} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
        {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        {showAnswer ? "Ẩn đáp án" : "Xem đáp án"}
      </button>
      {showAnswer && q.correctAnswer && (
        <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20 text-xs text-emerald-300">
          <MathText>{q.correctAnswer}</MathText>
        </div>
      )}
    </div>
  );
}

export default function QuickUploadPage() {
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [quizData, setQuizData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Save form
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [examFormat, setExamFormat] = useState<"practice" | "standard" | "tin_thptqg">("practice");
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCourses = async () => {
    if (coursesLoaded) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/courses/my-courses`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCourses(await res.json());
      setCoursesLoaded(true);
    } catch {}
  };

  const handleFile = useCallback(async (file: File) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp", "text/x-tex"];
    const isLatex = file.name.endsWith(".tex");
    if (!allowed.includes(file.type) && !isLatex) {
      setErrorMsg("Chỉ hỗ trợ PDF, ảnh (PNG/JPG/WebP) hoặc file LaTeX (.tex)");
      setParseState("error");
      return;
    }

    setParseState("uploading");
    setQuizData(null);
    setErrorMsg("");
    setFileName(file.name);
    setSaved(false);
    // Pre-fill title from filename
    setTitle(file.name.replace(/\.(pdf|tex|png|jpg|jpeg|webp)$/i, ""));
    await loadCourses();

    try {
      const token = localStorage.getItem("minda_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/api/assignments/parse-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        setQuizData(await res.json());
        setParseState("done");
      } else {
        const err = await res.json().catch(() => ({ detail: "Lỗi không xác định" }));
        setErrorMsg(err.detail || "Lỗi parse đề");
        setParseState("error");
      }
    } catch (e: any) {
      setErrorMsg("Lỗi kết nối máy chủ: " + e.message);
      setParseState("error");
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = async () => {
    if (!quizData || !title.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("minda_token");
      const body: any = {
        title: title.trim(),
        description: "",
        assignment_type: "quiz",
        quiz_data: quizData,
        exam_format: examFormat,
        max_score: examFormat === "practice" ? 100 : 10,
        is_assigned_to_all: true,
      };
      if (courseId) body.course_id = parseInt(courseId);

      const res = await fetch(`${API}/api/assignments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          setParseState("idle");
          setQuizData(null);
          setSaved(false);
          setTitle("");
          setCourseId("");
          setFileName("");
        }, 2500);
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Lỗi lưu: " + (err.detail || "Thử lại sau"));
      }
    } catch (e: any) {
      alert("Lỗi mạng: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalQ = quizData?.sections?.reduce((acc: number, s: any) => acc + (s.questions?.length ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* BG glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-600/6 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Upload Đề Nhanh</h1>
              <p className="text-text-muted text-xs">PDF / Ảnh chụp đề → AI parse → Lưu ngay · Không cần LaTeX</p>
            </div>
          </div>
        </motion.div>

        {/* ── UPLOAD ZONE ── */}
        <AnimatePresence mode="wait">
          {parseState === "idle" && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
            >
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center py-20 px-8 text-center select-none ${isDragging ? "border-violet-400 bg-violet-500/8 scale-[1.01]" : "border-white/15 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]"}`}
              >
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mb-5">
                  <Upload className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-lg font-bold text-text-primary mb-2">Kéo thả file vào đây</p>
                <p className="text-sm text-text-muted mb-4">hoặc nhấp để chọn file</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {[
                    { icon: FileText, label: "PDF", color: "text-red-400" },
                    { icon: Image, label: "PNG / JPG / WebP", color: "text-blue-400" },
                    { icon: FileText, label: "LaTeX (.tex)", color: "text-green-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <span key={label} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${color}`}>
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </span>
                  ))}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.tex,.png,.jpg,.jpeg,.webp,image/*,application/pdf,text/x-tex" className="hidden" onChange={onInputChange} />
              </div>

              {/* How it works */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                  { step: "1", label: "Upload file", desc: "PDF, ảnh chụp đề, hoặc LaTeX" },
                  { step: "2", label: "AI parse tự động", desc: "Gemini đọc và tạo cấu trúc câu hỏi + đáp án" },
                  { step: "3", label: "Lưu lên hệ thống", desc: "Chỉ cần đặt tên và bấm Lưu" },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 text-center">
                    <span className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-black text-sm flex items-center justify-center mx-auto mb-2">{step}</span>
                    <p className="text-xs font-semibold text-text-primary mb-1">{label}</p>
                    <p className="text-[11px] text-text-muted leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── UPLOADING / PARSING ── */}
          {parseState === "uploading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-28 gap-5"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-9 h-9 text-violet-400" />
                </div>
                <Loader2 className="w-6 h-6 text-violet-400 animate-spin absolute -bottom-2 -right-2" />
              </div>
              <div className="text-center">
                <p className="font-bold text-text-primary mb-1">Gemini AI đang phân tích đề...</p>
                <p className="text-sm text-text-muted">{fileName}</p>
                <p className="text-xs text-text-muted mt-2">Thường mất 10–30 giây tuỳ độ dài đề</p>
              </div>
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {parseState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-text-primary mb-1">Không thể parse đề</p>
                <p className="text-sm text-red-400 max-w-md">{errorMsg}</p>
              </div>
              <button onClick={() => setParseState("idle")} className="px-5 py-2.5 rounded-xl bg-white/8 border border-white/12 text-sm font-semibold hover:bg-white/12 transition-colors">
                Thử lại
              </button>
            </motion.div>
          )}

          {/* ── DONE: Preview + Save form ── */}
          {parseState === "done" && quizData && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-5"
            >
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-300">AI parse thành công!</p>
                  <p className="text-xs text-text-muted">Tìm thấy <strong className="text-text-primary">{totalQ} câu hỏi</strong> trong {quizData.sections?.length} phần · {fileName}</p>
                </div>
                <button onClick={() => { setParseState("idle"); setQuizData(null); }} className="p-1.5 rounded-lg hover:bg-white/8 text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Save form */}
              <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col gap-4">
                <p className="text-sm font-bold text-text-primary flex items-center gap-2"><Save className="w-4 h-4 text-violet-400" /> Thông tin lưu</p>

                {/* Title */}
                <div>
                  <label className="text-xs text-text-muted font-semibold block mb-1.5">Tên đề thi *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="VD: Đề kiểm tra giữa kỳ Toán 12..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/12 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Exam format */}
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">Loại đề</label>
                    <select
                      value={examFormat}
                      onChange={e => setExamFormat(e.target.value as any)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/12 text-sm text-text-primary focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
                    >
                      <option value="practice">Tự luyện (100đ)</option>
                      <option value="standard">Kiểm tra chuẩn (10đ)</option>
                      <option value="tin_thptqg">Tin THPTQG (10đ)</option>
                    </select>
                  </div>

                  {/* Course */}
                  <div>
                    <label className="text-xs text-text-muted font-semibold block mb-1.5">Khoá học (tuỳ chọn)</label>
                    <select
                      value={courseId}
                      onChange={e => setCourseId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/12 text-sm text-text-primary focus:outline-none focus:border-violet-500/50 transition-colors appearance-none"
                    >
                      <option value="">— Không gắn khoá học —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || saving || saved}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                    saved
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                      : "bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-violet-500/20"
                  }`}
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                   : saved ? <><CheckCircle2 className="w-4 h-4" /> Đã lưu! Sẵn sàng upload tiếp</>
                   : <><Save className="w-4 h-4" /> Lưu lên hệ thống</>}
                </button>
              </div>

              {/* Preview questions */}
              <div>
                <p className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" /> Xem trước đề ({totalQ} câu)
                </p>
                <div className="flex flex-col gap-3">
                  {quizData.sections?.map((section: any, si: number) => (
                    <div key={si}>
                      {quizData.sections.length > 1 && (
                        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">{section.instruction || `Phần ${si + 1}`}</p>
                      )}
                      <div className="flex flex-col gap-2">
                        {section.questions?.map((q: any, qi: number) => (
                          <QuestionPreview key={q.id || qi} q={q} idx={qi} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload another */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 rounded-xl border border-dashed border-white/15 text-sm text-text-muted hover:text-text-secondary hover:border-white/25 transition-colors flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" /> Upload đề khác
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.tex,.png,.jpg,.jpeg,.webp,image/*,application/pdf" className="hidden" onChange={onInputChange} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
