"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Upload, FileText, Trash2, Plus, Play, CheckCircle2,
  XCircle, Clock, BookOpen, BrainCircuit, Send, Loader2, RefreshCw, Zap,
  Layers, BarChart2, MessageSquare, ChevronRight, HelpCircle
} from "lucide-react";

export default function NotebookWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params?.notebook_id;

  const [notebook, setNotebook] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [activeCenterTab, setActiveCenterTab] = useState<"configure" | "practice" | "exam">("configure");

  // Document Upload States
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quiz Generation States
  const [quizType, setQuizType] = useState<"mcq_4" | "true_false" | "flashcard">("mcq_4");
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [ratioRecall, setRatioRecall] = useState(40);
  const [ratioUnderstanding, setRatioUnderstanding] = useState(30);
  const [ratioApplication, setRatioApplication] = useState(20);
  const [ratioHighApp, setRatioHighApp] = useState(10);
  const [focusTopic, setFocusTopic] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  // Active Quiz & Attempt States
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any | null>(null);
  const [examTimer, setExamTimer] = useState(0);

  // AI Chat Assistant States
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    { role: "ai", text: "Xin chào! Tôi là MINDA AI Study Companion. Hãy tải lên tài liệu đề cương và hỏi tôi bất kỳ thắc mắc nào, hoặc bấm 'Sinh Đề Ôn Tập' để bắt đầu luyện tập chuẩn GDPT nhé!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchNotebook = async () => {
    if (!notebookId) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks/${notebookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotebook(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebook();
  }, [notebookId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Handle Multi-Document Upload
  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks/${notebookId}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        await fetchNotebook();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Delete Document
  const handleDeleteDoc = async (docId: number) => {
    if (!confirm("Bạn có chắc muốn xoá tài liệu này khỏi không gian ôn tập?")) return;
    try {
      const token = localStorage.getItem("minda_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchNotebook();
    } catch (e) {
      console.error(e);
    }
  };

  // Generate Smart Quiz via Gemini 2.0 GDPT
  const handleGenerateQuiz = async (mode: "practice" | "exam") => {
    if (!notebook?.documents?.length) {
      alert("Vui lòng tải lên ít nhất 1 tài liệu đề cương ở cột bên trái trước khi tạo đề ôn tập!");
      return;
    }
    setGeneratingQuiz(true);
    setQuizResult(null);
    setUserAnswers({});
    setRevealedAnswers({});

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks/${notebookId}/generate-quiz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_type: quizType,
          total_questions: totalQuestions,
          duration_minutes: durationMinutes,
          ratio_recall: ratioRecall,
          ratio_understanding: ratioUnderstanding,
          ratio_application: ratioApplication,
          ratio_high_application: ratioHighApp,
          focus_topic: focusTopic || undefined
        })
      });

      if (res.ok) {
        const quizData = await res.json();
        setActiveQuiz(quizData);
        setActiveCenterTab(mode);
        if (mode === "exam") {
          setExamTimer(durationMinutes * 60);
        }
        await fetchNotebook();
      } else {
        const err = await res.json();
        alert("Lỗi tạo đề: " + (err.detail || "Không thể sinh câu hỏi"));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // Submit Quiz for Grading & Competency Analysis
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setSubmittingQuiz(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_answers: userAnswers,
          time_spent_seconds: (activeQuiz.duration_minutes * 60) - examTimer
        })
      });

      if (res.ok) {
        const result = await res.json();
        setQuizResult(result);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // Handle NotebookLM AI Chat
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks/${notebookId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      }
    } catch (e) {
      console.error(e);
      setChatMessages(prev => [...prev, { role: "ai", text: "Xin lỗi, đã xảy ra lỗi kết nối với máy chủ AI." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center text-text-primary">
        <Loader2 className="w-8 h-8 text-pink-400 animate-spin mb-3" />
        <p className="text-sm text-text-muted">Đang mở không gian ôn tập đa tài liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col" style={{ maxHeight: "100vh", overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-bg-main/95 backdrop-blur shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/revision" className="p-1.5 rounded-xl hover:bg-white/8 text-text-muted hover:text-text-primary transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm truncate text-text-primary">{notebook?.title}</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 shrink-0">
                {notebook?.subject} · {notebook?.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCenterTab("configure")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCenterTab === "configure" ? "bg-white/12 text-white" : "text-text-muted hover:text-text-primary"}`}
          >
            ⚙️ Cấu hình đề GDPT
          </button>
          {activeQuiz && (
            <button
              onClick={() => setActiveCenterTab("practice")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeCenterTab === "practice" ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" : "text-text-muted hover:text-text-primary"}`}
            >
              📝 Luyện tập ({activeQuiz.questions?.length} câu)
            </button>
          )}
        </div>
      </div>

      {/* ── 3-Column NotebookLM Workspace ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── COLUMN 1 (LEFT): SOURCES / DOCUMENTS ──────────────────── */}
        <div className="w-[300px] shrink-0 border-r border-white/8 flex flex-col bg-white/[0.01] overflow-hidden">
          <div className="p-3.5 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Nguồn tài liệu ({notebook?.documents?.length || 0})</span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 hover:bg-pink-500/25 transition-all text-xs font-semibold flex items-center gap-1"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              <span>Upload</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFiles}
              multiple
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
            {notebook?.documents?.length === 0 ? (
              <div className="py-12 text-center text-text-muted px-4">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-semibold">Chưa có tài liệu nào</p>
                <p className="text-[10px] mt-1 opacity-70">Tải lên đề cương PDF, Word để AI phân tích tạo câu hỏi</p>
              </div>
            ) : (
              notebook?.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-2.5 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] transition-all flex items-center justify-between gap-2 group"
                >
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                  >
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 text-xs font-bold">
                      {doc.file_type?.toUpperCase() || "DOC"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">{doc.filename}</p>
                      <p className="text-[10px] text-text-muted">{doc.char_count?.toLocaleString()} ký tự</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="p-3 border-t border-white/8 text-[11px] text-text-muted flex items-center justify-between bg-white/[0.01]">
            <span>Đã tạo: {notebook?.quizzes?.length || 0} bộ đề</span>
            <span className="text-emerald-400 font-mono">Gemini 2.0 Active</span>
          </div>
        </div>


        {/* ── COLUMN 2 (CENTER): QUIZ GENERATOR & PRACTICE CENTER ───── */}
        <div className="flex-1 flex flex-col border-r border-white/8 overflow-y-auto custom-scrollbar p-6 bg-bg-main">
          {activeCenterTab === "configure" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full flex flex-col gap-6">

              {/* Banner GDPT */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-pink-500/15 via-purple-500/10 to-indigo-500/15 border border-pink-500/30 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-2xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-black">
                    ✨
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight text-white">Ma Trận Đề Ôn Tập Chuẩn GDPT 2018</h2>
                    <p className="text-xs text-text-muted">Căn cứ theo khung năng lực & 4 mức độ nhận thức của Bộ Giáo dục & Đào tạo</p>
                  </div>
                </div>
              </div>

              {/* Form Options */}
              <div className="p-6 rounded-3xl border border-white/8 bg-white/[0.02] flex flex-col gap-5">
                {/* 1. Quiz Type */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-2">1. Định dạng bài ôn tập:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setQuizType("mcq_4")}
                      className={`p-3 rounded-2xl border text-left transition-all ${quizType === "mcq_4" ? "border-pink-500 bg-pink-500/15 text-white" : "border-white/8 hover:bg-white/5 text-text-muted"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Trắc nghiệm 4 lựa chọn</p>
                      <p className="text-[10px] opacity-70">A, B, C, D kèm phân tích bẫy</p>
                    </button>
                    <button
                      onClick={() => setQuizType("true_false")}
                      className={`p-3 rounded-2xl border text-left transition-all ${quizType === "true_false" ? "border-pink-500 bg-pink-500/15 text-white" : "border-white/8 hover:bg-white/5 text-text-muted"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Đúng / Sai (Mới 2025)</p>
                      <p className="text-[10px] opacity-70">4 khẳng định a, b, c, d</p>
                    </button>
                    <button
                      onClick={() => setQuizType("flashcard")}
                      className={`p-3 rounded-2xl border text-left transition-all ${quizType === "flashcard" ? "border-pink-500 bg-pink-500/15 text-white" : "border-white/8 hover:bg-white/5 text-text-muted"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Flashcard Ghi Nhớ</p>
                      <p className="text-[10px] opacity-70">Lật thẻ ôn từ khóa cốt lõi</p>
                    </button>
                  </div>
                </div>

                {/* 2. Number of Questions & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-primary block mb-2">2. Số lượng câu hỏi:</label>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(num => (
                        <button
                          key={num}
                          onClick={() => setTotalQuestions(num)}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${totalQuestions === num ? "border-pink-500 bg-pink-500/20 text-pink-300" : "border-white/8 hover:bg-white/5 text-text-muted"}`}
                        >
                          {num} câu
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-primary block mb-2">3. Thời gian làm bài:</label>
                    <select
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-pink-500 focus:outline-none"
                    >
                      <option value={10}>10 Phút</option>
                      <option value={15}>15 Phút</option>
                      <option value={20}>20 Phút</option>
                      <option value={45}>45 Phút (Chuẩn 1 tiết)</option>
                    </select>
                  </div>
                </div>

                {/* 3. GDPT Cognitive Level Matrix */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-2">
                    4. Ma trận phân bổ 4 Mức độ nhận thức (GDPT 2018):
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="font-bold text-emerald-400">Nhận biết</p>
                      <p className="text-lg font-black text-white mt-1">{ratioRecall}%</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <p className="font-bold text-blue-400">Thông hiểu</p>
                      <p className="text-lg font-black text-white mt-1">{ratioUnderstanding}%</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <p className="font-bold text-amber-400">Vận dụng</p>
                      <p className="text-lg font-black text-white mt-1">{ratioApplication}%</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <p className="font-bold text-rose-400">Vận dụng cao</p>
                      <p className="text-lg font-black text-white mt-1">{ratioHighApp}%</p>
                    </div>
                  </div>
                </div>

                {/* 4. Focus Topic */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1.5">5. Chủ đề hoặc Chương trọng tâm (Tùy chọn):</label>
                  <input
                    type="text"
                    placeholder="VD: Chương 2 Hàm số lũy thừa, thuật toán BFS, hình học không gian..."
                    value={focusTopic}
                    onChange={e => setFocusTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-pink-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleGenerateQuiz("practice")}
                    disabled={generatingQuiz}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {generatingQuiz ? "Gemini AI đang sinh câu hỏi..." : "Luyện Tập Tức Thì (Chấm & Giải thích ngay)"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── INTERACTIVE PRACTICE & EXAM VIEW ────────────────────── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto w-full flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white">{activeQuiz?.title}</h2>
                  <p className="text-xs text-text-muted">{activeQuiz?.questions?.length} câu hỏi · Chuẩn phân loại GDPT 2018</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveCenterTab("configure")}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-text-muted hover:text-white transition-colors"
                  >
                    Đổi cấu hình
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    {submittingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Nộp bài & Chấm điểm
                  </button>
                </div>
              </div>

              {/* Quiz Result Banner if Submitted */}
              {quizResult && (
                <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Kết Quả Đánh Giá Năng Lực</p>
                      <h3 className="text-2xl font-black text-white mt-0.5">{quizResult.score} / 10 Điểm</h3>
                      <p className="text-xs text-text-muted mt-0.5">Đúng {quizResult.correct_count} / {quizResult.total_questions} câu</p>
                    </div>
                  </div>

                  {/* Competency Matrix Breakdown */}
                  {quizResult.competency_matrix && (
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20">
                      {Object.entries(quizResult.competency_matrix).map(([lvl, data]: [string, any]) => (
                        <div key={lvl} className="p-2.5 rounded-2xl bg-black/40 border border-white/8 text-center text-xs">
                          <p className="text-[10px] font-semibold text-text-muted">{lvl}</p>
                          <p className="font-bold text-white mt-0.5">{data.correct} / {data.total}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Questions List */}
              <div className="flex flex-col gap-5">
                {activeQuiz?.questions?.map((q: any, qIdx: number) => {
                  const qid = String(q.id || qIdx + 1);
                  const isRevealed = revealedAnswers[qid] || quizResult;
                  const selectedOpt = userAnswers[qid];

                  return (
                    <div
                      key={qid}
                      className="p-5 rounded-3xl border border-white/8 bg-white/[0.02] flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 font-bold text-xs flex items-center justify-center">
                            {qIdx + 1}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/6 border border-white/10 text-text-muted">
                            {q.cognitive_level || "Thông hiểu"}
                          </span>
                        </div>

                        {q.citation && (
                          <span className="text-[10px] text-pink-400/80 italic line-clamp-1 max-w-xs">
                            📖 {q.citation}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-text-primary leading-relaxed whitespace-pre-wrap">
                        {q.question}
                      </p>

                      {/* Options for MCQ 4 */}
                      {q.options && (
                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((opt: string) => {
                            const optKey = opt.charAt(0);
                            const isSelected = selectedOpt === optKey;
                            const isCorrect = q.correct_answer === optKey;

                            let optStyle = "border-white/8 bg-white/[0.02] hover:bg-white/[0.06] text-text-secondary";
                            if (isRevealed) {
                              if (isCorrect) optStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-300 font-bold";
                              else if (isSelected && !isCorrect) optStyle = "border-red-500 bg-red-500/15 text-red-300 line-through";
                            } else if (isSelected) {
                              optStyle = "border-pink-500 bg-pink-500/15 text-white font-bold";
                            }

                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  setUserAnswers(prev => ({ ...prev, [qid]: optKey }));
                                  setRevealedAnswers(prev => ({ ...prev, [qid]: true }));
                                }}
                                className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {isRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation & Citation Dropdown */}
                      {isRevealed && q.explanation && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-3.5 rounded-2xl bg-indigo-500/8 border border-indigo-500/20 text-xs">
                          <p className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Giải thích chi tiết & Trích dẫn:
                          </p>
                          <p className="text-text-secondary leading-relaxed">{q.explanation}</p>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>


        {/* ── COLUMN 3 (RIGHT): NOTEBOOKLM AI CHAT ASSISTANT ─────────── */}
        <div className="w-[340px] shrink-0 flex flex-col bg-white/[0.01] overflow-hidden">
          <div className="p-3.5 border-b border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Trợ Lý Hỏi Đáp Tài Liệu</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 font-mono">NotebookLM</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar text-xs">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white self-end rounded-br-none shadow-md shadow-indigo-600/20"
                    : "bg-white/5 border border-white/8 text-text-primary self-start rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-text-muted self-start flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-pink-400" /> AI đang tra cứu tài liệu...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t border-white/8 flex items-center gap-2 bg-white/[0.01]">
            <input
              type="text"
              placeholder="Hỏi AI về nội dung tài liệu..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs focus:border-pink-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* ── Document Preview Modal ───────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-neutral-900 border border-white/12 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/8 pb-3">
              <div>
                <h3 className="font-bold text-sm text-text-primary truncate">{previewDoc.filename}</h3>
                <p className="text-[11px] text-text-muted">Đã trích xuất {previewDoc.char_count?.toLocaleString()} ký tự</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-text-muted hover:text-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar rounded-2xl border border-white/10 bg-black/60 p-4">
              <pre className="text-xs font-mono text-text-secondary leading-relaxed whitespace-pre-wrap select-all">
                {previewDoc.content_text || previewDoc.snippet}
              </pre>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
