"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowLeft, Upload, FileText, Trash2, Plus, Play, CheckCircle2,
  XCircle, Clock, BookOpen, BrainCircuit, Send, Loader2, RefreshCw, Zap,
  Layers, BarChart2, MessageSquare, ChevronRight, HelpCircle, X
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

  // Drive integration states
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [selectedDriveIds, setSelectedDriveIds] = useState<number[]>([]);
  const [importingDrive, setImportingDrive] = useState(false);

  const fetchDriveFiles = async () => {
    setLoadingDrive(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/drive-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDriveFiles(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrive(false);
    }
  };

  const handleImportDrive = async () => {
    if (selectedDriveIds.length === 0) return;
    setImportingDrive(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks/${notebookId}/import-from-drive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ file_ids: selectedDriveIds })
      });
      if (res.ok) {
        setShowDriveModal(false);
        setSelectedDriveIds([]);
        await fetchNotebook();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setImportingDrive(false);
    }
  };

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
    { role: "ai", text: "Xin chào! Tôi là Trợ lý Ôn tập AI MINDA. Hãy tải lên tài liệu đề cương và hỏi tôi bất kỳ thắc mắc nào, hoặc bấm 'Sinh Đề Ôn Tập' để bắt đầu làm bài chuẩn GDPT nhé!" }
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
      } else {
        const err = await res.json();
        alert("Lỗi upload: " + (err.detail || "Không thể tải lên file"));
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến máy chủ.");
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
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-text-secondary">Đang mở không gian ôn tập đa tài liệu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col" style={{ maxHeight: "100vh", overflow: "hidden" }}>

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-card bg-bg-card/95 backdrop-blur shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/revision" className="p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-black text-base md:text-lg truncate text-text-primary">{notebook?.title}</h1>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/25 text-pink-500 shrink-0">
                {notebook?.subject} · {notebook?.grade}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveCenterTab("configure")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCenterTab === "configure" ? "bg-pink-500/15 text-pink-500 border border-pink-500/30 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
          >
            ⚙️ Cấu hình Ma Trận GDPT
          </button>
          {activeQuiz && (
            <button
              onClick={() => setActiveCenterTab("practice")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeCenterTab === "practice" ? "bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 shadow-sm" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"}`}
            >
              📝 Luyện tập ({activeQuiz.questions?.length} câu)
            </button>
          )}
        </div>
      </div>

      {/* ── 3-Column NotebookLM Workspace ──────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── COLUMN 1 (LEFT): SOURCES / DOCUMENTS ──────────────────── */}
        <div className="w-[320px] shrink-0 border-r border-border-card flex flex-col bg-bg-card overflow-hidden">
          <div className="p-4 border-b border-border-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                Nguồn tài liệu ({notebook?.documents?.length || 0})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  fetchDriveFiles();
                  setShowDriveModal(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-bg-main border border-border-card text-text-primary hover:border-indigo-500 text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
              >
                <span>📁 Từ Drive</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white hover:opacity-90 transition-all text-[11px] font-bold flex items-center gap-1 shadow-md shadow-pink-500/20"
              >
                {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                <span>Upload</span>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUploadFiles}
              multiple
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5 custom-scrollbar">
            {notebook?.documents?.length === 0 ? (
              <div className="py-12 text-center text-text-muted px-4">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-text-primary" />
                <p className="text-xs font-bold text-text-secondary">Chưa có tài liệu nào</p>
                <p className="text-[11px] mt-1 text-text-muted">Tải lên đề cương PDF, Word để AI phân tích tạo câu hỏi</p>
              </div>
            ) : (
              notebook?.documents?.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-2xl border border-border-card bg-bg-main hover:border-pink-500/40 transition-all flex items-center justify-between gap-2.5 group shadow-sm"
                >
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0 text-xs font-bold border border-indigo-500/20">
                      {doc.file_type?.toUpperCase() || "DOC"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">{doc.filename}</p>
                      <p className="text-[10px] text-text-muted">{doc.char_count?.toLocaleString()} ký tự</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Stats */}
          <div className="p-3.5 border-t border-border-card text-xs text-text-secondary font-medium flex items-center justify-between bg-bg-main">
            <span>Đã tạo: <strong className="text-text-primary">{notebook?.quizzes?.length || 0}</strong> bộ đề</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" /> Gemini 2.0
            </span>
          </div>
        </div>


        {/* ── COLUMN 2 (CENTER): QUIZ GENERATOR & PRACTICE CENTER ───── */}
        <div className="flex-1 flex flex-col border-r border-border-card overflow-y-auto custom-scrollbar p-6 bg-bg-main">
          {activeCenterTab === "configure" ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full flex flex-col gap-6">

              {/* Banner GDPT */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-pink-500/30 relative overflow-hidden shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-pink-500/20 shrink-0">
                    ✨
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-black tracking-tight text-text-primary">
                      Ma Trận Đề Ôn Tập Chuẩn GDPT 2018
                    </h2>
                    <p className="text-xs text-text-secondary mt-0.5 font-medium">
                      Căn cứ theo khung năng lực & 4 mức độ nhận thức của Bộ Giáo dục & Đào tạo
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Options */}
              <div className="p-6 rounded-3xl border border-border-card bg-bg-card flex flex-col gap-5 shadow-sm">
                {/* 1. Quiz Type */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-2">1. Định dạng bài ôn tập:</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      onClick={() => setQuizType("mcq_4")}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${quizType === "mcq_4" ? "border-pink-500 bg-pink-500/10 text-pink-500 font-bold shadow-sm" : "border-border-card hover:bg-bg-hover text-text-secondary"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Trắc nghiệm 4 lựa chọn</p>
                      <p className="text-[10px] text-text-muted">A, B, C, D kèm phân tích bẫy</p>
                    </button>
                    <button
                      onClick={() => setQuizType("true_false")}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${quizType === "true_false" ? "border-pink-500 bg-pink-500/10 text-pink-500 font-bold shadow-sm" : "border-border-card hover:bg-bg-hover text-text-secondary"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Đúng / Sai (Mới 2025)</p>
                      <p className="text-[10px] text-text-muted">4 khẳng định a, b, c, d</p>
                    </button>
                    <button
                      onClick={() => setQuizType("flashcard")}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${quizType === "flashcard" ? "border-pink-500 bg-pink-500/10 text-pink-500 font-bold shadow-sm" : "border-border-card hover:bg-bg-hover text-text-secondary"}`}
                    >
                      <p className="text-xs font-bold mb-0.5">Flashcard Ghi Nhớ</p>
                      <p className="text-[10px] text-text-muted">Lật thẻ ôn từ khóa cốt lõi</p>
                    </button>
                  </div>
                </div>

                {/* 2. Number of Questions & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-2">2. Số lượng câu hỏi:</label>
                    <div className="flex gap-2">
                      {[5, 10, 15, 20].map(num => (
                        <button
                          key={num}
                          onClick={() => setTotalQuestions(num)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${totalQuestions === num ? "border-pink-500 bg-pink-500/15 text-pink-500 shadow-sm" : "border-border-card hover:bg-bg-hover text-text-secondary"}`}
                        >
                          {num} câu
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-2">3. Thời gian làm bài:</label>
                    <select
                      value={durationMinutes}
                      onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg-main text-text-primary border border-border-card text-xs font-semibold focus:border-pink-500 focus:outline-none"
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
                  <label className="text-xs font-bold text-text-secondary block mb-2">
                    4. Ma trận phân bổ 4 Mức độ nhận thức (GDPT 2018):
                  </label>
                  <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                      <p className="font-bold text-emerald-500">Nhận biết</p>
                      <p className="text-xl font-black text-text-primary mt-1">{ratioRecall}%</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/25">
                      <p className="font-bold text-blue-500">Thông hiểu</p>
                      <p className="text-xl font-black text-text-primary mt-1">{ratioUnderstanding}%</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                      <p className="font-bold text-amber-500">Vận dụng</p>
                      <p className="text-xl font-black text-text-primary mt-1">{ratioApplication}%</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                      <p className="font-bold text-rose-500">Vận dụng cao</p>
                      <p className="text-xl font-black text-text-primary mt-1">{ratioHighApp}%</p>
                    </div>
                  </div>
                </div>

                {/* 4. Focus Topic */}
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">5. Chủ đề hoặc Chương trọng tâm (Tùy chọn):</label>
                  <input
                    type="text"
                    placeholder="VD: Chương 2 Hàm số lũy thừa, thuật toán BFS, hình học không gian..."
                    value={focusTopic}
                    onChange={e => setFocusTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-main border border-border-card text-xs text-text-primary placeholder:text-text-muted focus:border-pink-500 focus:outline-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleGenerateQuiz("practice")}
                    disabled={generatingQuiz}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs md:text-sm font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {generatingQuiz ? "Gemini 2.0 đang phân tích & sinh đề..." : "✨ Luyện Tập Tức Thì (Chấm & Giải thích ngay)"}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── INTERACTIVE PRACTICE & EXAM VIEW ────────────────────── */
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto w-full flex flex-col gap-6">
              
              <div className="flex items-center justify-between border-b border-border-card pb-4">
                <div>
                  <h2 className="text-base md:text-lg font-black text-text-primary">{activeQuiz?.title}</h2>
                  <p className="text-xs text-text-secondary font-medium mt-0.5">{activeQuiz?.questions?.length} câu hỏi · Chuẩn phân loại GDPT 2018</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveCenterTab("configure")}
                    className="px-3.5 py-2 rounded-xl border border-border-card text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    Đổi cấu hình
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={submittingQuiz}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    {submittingQuiz ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Nộp bài & Chấm điểm
                  </button>
                </div>
              </div>

              {/* Quiz Result Banner if Submitted */}
              {quizResult && (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-emerald-500 uppercase tracking-wider">Kết Quả Đánh Giá Năng Lực</p>
                      <h3 className="text-2xl md:text-3xl font-black text-text-primary mt-1">{quizResult.score} / 10 Điểm</h3>
                      <p className="text-xs text-text-secondary mt-0.5 font-medium">Đúng {quizResult.correct_count} / {quizResult.total_questions} câu</p>
                    </div>
                  </div>

                  {/* Competency Matrix Breakdown */}
                  {quizResult.competency_matrix && (
                    <div className="grid grid-cols-4 gap-2.5 pt-3 border-t border-emerald-500/20">
                      {Object.entries(quizResult.competency_matrix).map(([lvl, data]: [string, any]) => (
                        <div key={lvl} className="p-3 rounded-2xl bg-bg-card border border-border-card text-center text-xs shadow-sm">
                          <p className="text-[11px] font-bold text-text-muted">{lvl}</p>
                          <p className="font-black text-text-primary mt-1 text-sm">{data.correct} / {data.total}</p>
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
                      className="p-6 rounded-3xl border border-border-card bg-bg-card flex flex-col gap-4 relative overflow-hidden shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-xl bg-pink-500/15 text-pink-500 font-black text-xs flex items-center justify-center border border-pink-500/20">
                            {qIdx + 1}
                          </span>
                          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-bg-main border border-border-card text-text-secondary">
                            {q.cognitive_level || "Thông hiểu"}
                          </span>
                        </div>

                        {q.citation && (
                          <span className="text-[11px] text-pink-500 font-semibold italic line-clamp-1 max-w-xs">
                            📖 {q.citation}
                          </span>
                        )}
                      </div>

                      <p className="text-sm md:text-base font-bold text-text-primary leading-relaxed whitespace-pre-wrap">
                        {q.question}
                      </p>

                      {/* Options for MCQ 4 */}
                      {q.options && (
                        <div className="grid grid-cols-1 gap-2.5">
                          {q.options.map((opt: string) => {
                            const optKey = opt.charAt(0);
                            const isSelected = selectedOpt === optKey;
                            const isCorrect = q.correct_answer === optKey;

                            let optStyle = "border-border-card bg-bg-main hover:bg-bg-hover text-text-primary";
                            if (isRevealed) {
                              if (isCorrect) optStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-black";
                              else if (isSelected && !isCorrect) optStyle = "border-red-500 bg-red-500/15 text-red-600 dark:text-red-300 line-through";
                            } else if (isSelected) {
                              optStyle = "border-pink-500 bg-pink-500/15 text-pink-600 dark:text-pink-300 font-black";
                            }

                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  setUserAnswers(prev => ({ ...prev, [qid]: optKey }));
                                  setRevealedAnswers(prev => ({ ...prev, [qid]: true }));
                                }}
                                className={`p-4 rounded-2xl border text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between ${optStyle}`}
                              >
                                <span>{opt}</span>
                                {isRevealed && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Explanation & Citation Dropdown */}
                      {isRevealed && q.explanation && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 text-xs md:text-sm">
                          <p className="font-bold text-indigo-500 mb-1 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> Giải thích chi tiết & Trích dẫn:
                          </p>
                          <p className="text-text-secondary leading-relaxed font-medium">{q.explanation}</p>
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
        <div className="w-[350px] shrink-0 flex flex-col bg-bg-card overflow-hidden border-l border-border-card">
          <div className="p-4 border-b border-border-card flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span className="text-xs font-black uppercase tracking-wider text-text-primary">
                Trợ Lý Hỏi Đáp Tài Liệu
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 font-black">
              NotebookLM
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar text-xs md:text-sm">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white self-end rounded-br-none shadow-md shadow-indigo-600/20 font-medium"
                    : "bg-bg-main border border-border-card text-text-primary self-start rounded-bl-none font-medium"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="p-3.5 rounded-2xl bg-bg-main border border-border-card text-text-muted self-start flex items-center gap-2 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" /> AI đang tra cứu tài liệu...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSendChatMessage} className="p-3.5 border-t border-border-card flex items-center gap-2 bg-bg-card">
            <input
              type="text"
              placeholder="Hỏi AI về nội dung tài liệu..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-bg-main border border-border-card text-xs text-text-primary placeholder:text-text-muted focus:border-pink-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white disabled:opacity-40 transition-colors shrink-0 shadow-md shadow-pink-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

      {/* ── Drive Selection Modal ─────────────────────────────────────── */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl bg-bg-card border border-border-card rounded-3xl p-6 md:p-8 shadow-2xl relative text-text-primary flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between mb-5 border-b border-border-card pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center font-bold text-lg border border-indigo-500/20">
                  📁
                </div>
                <div>
                  <h3 className="font-black text-lg text-text-primary">Nạp Tài Liệu Từ Cặp Xách (Drive)</h3>
                  <p className="text-xs text-text-secondary font-medium">Chọn các đề cương, bài giảng đã tải lên Drive trước đây</p>
                </div>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="w-8 h-8 rounded-full hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            {loadingDrive ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                <p className="text-xs text-text-muted">Đang mở Cặp xách của bạn...</p>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="py-14 text-center text-text-muted">
                <p className="text-sm font-semibold">Cặp xách (Drive) của bạn chưa có file nào</p>
                <p className="text-xs mt-1">Hãy bấm nút "Upload" để tải trực tiếp từ máy tính lên nhé!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-1">
                {driveFiles.map(f => {
                  const isChecked = selectedDriveIds.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedDriveIds(prev =>
                          isChecked ? prev.filter(id => id !== f.id) : [...prev, f.id]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? "border-indigo-500 bg-indigo-500/15 text-text-primary shadow-sm"
                          : "border-border-card bg-bg-main hover:bg-bg-hover text-text-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {f.file_type?.includes("pdf") ? "PDF" : "DOC"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{f.filename}</p>
                          <p className="text-[10px] text-text-muted">{f.file_size || "1.2 MB"}</p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${isChecked ? "bg-indigo-600 border-indigo-500 text-white" : "border-border-card bg-bg-main"}`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border-card pt-4 mt-4">
              <span className="text-xs text-text-muted font-medium">
                Đã chọn: <strong className="text-text-primary">{selectedDriveIds.length}</strong> tài liệu
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDriveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleImportDrive}
                  disabled={selectedDriveIds.length === 0 || importingDrive}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40 flex items-center gap-2"
                >
                  {importingDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {importingDrive ? "Đang nạp..." : `Nạp ${selectedDriveIds.length} Tài Liệu Vào Notebook`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
