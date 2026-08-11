"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Cloud, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Share2, 
  BookOpen, 
  Cpu, 
  Award,
  Layers,
  Send,
  Loader2,
  HardDrive
} from "lucide-react";

import { SAMPLE_LESSONS } from "@/data/sampleLessons";
import { InteractiveLesson, packageLessonToSCORMZip } from "@/lib/scormPackager";
import { saveLessonToGoogleDrive } from "@/lib/driveExport";
import InteractiveUnitScale from "@/components/lesson-studio/InteractiveUnitScale";
import DragDropGame from "@/components/lesson-studio/DragDropGame";
import PresenterToolkit from "@/components/lesson-studio/PresenterToolkit";
import ManimVideoEmbed from "@/components/lesson-studio/ManimVideoEmbed";

export default function LessonPlayerPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [currentActivityIdx, setCurrentActivityIdx] = useState<number>(0);
  const [mode, setMode] = useState<"presenter" | "learner">("presenter");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Export state
  const [isExportingSCORM, setIsExportingSCORM] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [driveMsg, setDriveMsg] = useState<{ text: string; url?: string; type: "success" | "error" } | null>(null);

  // Sorter game state in Activity 1
  const [classifiedItems, setClassifiedItems] = useState<Record<string, "digital" | "analog">>({});

  // Quiz state in Activity 3
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Discussion state in Activity 4
  const [discussionInputs, setDiscussionInputs] = useState<Record<number, string>>({});
  const [submittedDiscussion, setSubmittedDiscussion] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Find lesson in sample or localStorage
    const found = SAMPLE_LESSONS.find(l => l.id === id) || SAMPLE_LESSONS[0];
    setLesson(found);
  }, [id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleDownloadSCORM = async () => {
    if (!lesson) return;
    setIsExportingSCORM(true);
    try {
      const zipBlob = await packageLessonToSCORMZip(lesson);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MINDA_${lesson.id}_SCORM12.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e: any) {
      alert("Lỗi khi đóng gói SCORM: " + e.message);
    } finally {
      setIsExportingSCORM(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!lesson) return;
    setIsSavingToDrive(true);
    setDriveMsg(null);
    try {
      const res = await saveLessonToGoogleDrive(lesson);
      if (res.success) {
        setDriveMsg({ text: res.message, url: res.driveUrl, type: "success" });
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } else {
        setDriveMsg({ text: res.message, type: "error" });
      }
    } catch (e: any) {
      setDriveMsg({ text: "Lỗi kết nối Google Drive: " + e.message, type: "error" });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-primary">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    );
  }

  const currentAct = lesson.activities[currentActivityIdx] || lesson.activities[0];
  const progressPercent = Math.round(((currentActivityIdx + 1) / lesson.activities.length) * 100);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col font-outfit pb-24 relative">
      
      {/* ── TOP CONTROL BAR ── */}
      <header className="sticky top-0 z-30 bg-bg-card/90 backdrop-blur-xl border-b border-border-card px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/lesson-studio")}
            className="p-2 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary hover:text-text-primary transition shrink-0"
            title="Quay lại danh sách bài giảng"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                {lesson.subject} {lesson.grade}
              </span>
              <span className="text-xs text-text-secondary truncate">{lesson.author}</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-text-primary truncate mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons: SCORM & Google Drive */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleDownloadSCORM}
            disabled={isExportingSCORM}
            className="px-3.5 py-2 rounded-xl bg-bg-main border border-border-card hover:border-indigo-500/40 text-text-secondary hover:text-indigo-400 text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            title="Xuất bài giảng thành file SCORM 1.2 ZIP chuẩn LMS"
          >
            {isExportingSCORM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">Xuất gói SCORM (.zip)</span>
            <span className="sm:hidden">SCORM</span>
          </button>

          <button
            onClick={handleSaveToDrive}
            disabled={isSavingToDrive}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
            title="Lưu trực tiếp toàn bộ bài giảng vào Google Drive"
          >
            {isSavingToDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>Lưu Google Drive</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-bg-main border border-border-card text-text-secondary hover:text-text-primary transition"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Google Drive Status Notification */}
      {driveMsg && (
        <div className={`mx-4 sm:mx-8 mt-3 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in ${
          driveMsg.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {driveMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <span>⚠️</span>}
            <span>{driveMsg.text}</span>
          </div>
          {driveMsg.url && (
            <a href={driveMsg.url} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
              Mở trên Drive →
            </a>
          )}
        </div>
      )}

      {/* ── ACTIVITIES 4-STEP TABS ── */}
      <div className="bg-bg-card/50 border-b border-border-card px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
          {[
            { idx: 0, label: "1. 🎬 Khởi Động", color: "rose" },
            { idx: 1, label: "2. 💡 Kiến Thức", color: "indigo" },
            { idx: 2, label: "3. 🎮 Luyện Tập", color: "emerald" },
            { idx: 3, label: "4. 🚀 Vận Dụng", color: "amber" },
          ].map(tab => (
            <button
              key={tab.idx}
              onClick={() => setCurrentActivityIdx(tab.idx)}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                currentActivityIdx === tab.idx
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                  : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Progress percent */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="text-xs font-bold text-text-secondary font-mono">Tiến độ: {progressPercent}%</span>
          <div className="w-28 h-2.5 bg-bg-main rounded-full overflow-hidden border border-border-card">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-500 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── MAIN ACTIVITY CONTENT VIEWPORT ── */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 flex-1 flex flex-col gap-6">

        {/* ── 1. KHỞI ĐỘNG (WARM-UP) ── */}
        {currentActivityIdx === 0 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl relative overflow-hidden">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase tracking-widest">
                Hoạt động 1: Khởi động & Gợi mở
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary mt-3">
                {currentAct.title}
              </h2>
              <p className="text-sm sm:text-base text-text-secondary mt-2 leading-relaxed">
                {currentAct.content}
              </p>

              {/* Sorter Mini-game */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-base font-black text-text-primary flex items-center gap-2">
                    <span>🎯</span> Đố vui: Bấm vào từng đồ vật để phân loại
                  </h3>
                  <span className="text-xs text-text-secondary font-mono">
                    Đã phân loại: {Object.keys(classifiedItems).length} / 6
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {currentAct.interactiveData?.items?.map((item: any) => {
                    const status = classifiedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setClassifiedItems(prev => ({
                            ...prev,
                            [item.id]: item.type
                          }));
                          if (Object.keys(classifiedItems).length === 5) {
                            confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
                          }
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left flex flex-col justify-between gap-3 ${
                          status === "digital"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                            : status === "analog"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                            : "bg-bg-main border-border-card hover:border-rose-500/50 hover:bg-bg-hover"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-3xl">{item.icon}</span>
                          {status ? (
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              status === "digital" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {status === "digital" ? "✅ Thiết bị số" : "📻 Thiết bị truyền thống"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-text-secondary font-bold">Chạm để xem</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-text-primary">{item.name}</h4>
                          <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Inquiry Prompt */}
              <div className="mt-8 p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-rose-500/20 flex items-center gap-4">
                <span className="text-3xl">💡</span>
                <div>
                  <h4 className="text-sm font-black text-rose-500">Vấn đề cần giải quyết:</h4>
                  <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                    Dữ liệu được chuyển thành thông tin trong máy tính như thế nào? Cùng bước vào Hoạt động 2 để tìm hiểu!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. HÌNH THÀNH KIẾN THỨC (KNOWLEDGE) ── */}
        {currentActivityIdx === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 3 Bước Xử Lý Thông Tin */}
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                Hoạt động 2: Hình thành kiến thức
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary">
                Quá trình Xử lý Thông tin & Đơn vị Đo lường
              </h2>

              {/* Sơ đồ 3 Bước */}
              <div>
                <h3 className="text-sm sm:text-base font-black text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>🧠</span> 1. Sơ đồ 3 Bước Xử lý Thông tin của Máy Tính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-indigo-300">Tiếp nhận dữ liệu (Input)</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Từ bàn phím, chuột, camera, máy quét... chuyển đổi thành các dãy bit (0 và 1).
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 scale-105 shadow-xl">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-purple-500/30">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-purple-300">Xử lí dữ liệu (Processing)</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      CPU tính toán, biến đổi các dãy bit trong bộ nhớ RAM để rút ra thông tin hữu ích.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-emerald-300">Đưa ra kết quả (Output)</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      Xuất ra màn hình, loa, máy in hoặc lưu trữ lâu dài vào ổ cứng, thẻ nhớ, Google Drive.
                    </p>
                  </div>
                </div>
              </div>

              {/* Manim Animation Video Embed */}
              <ManimVideoEmbed lessonTitle={lesson.title} />

              {/* Phân Biệt Dữ Liệu vs Thông Tin */}
              <div className="p-6 rounded-2xl bg-bg-main border border-border-card space-y-4">
                <h3 className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-2">
                  <span>⚖️</span> 2. Phân biệt Dữ liệu và Thông tin (Tính toàn vẹn)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="p-4 rounded-xl bg-bg-card border border-border-card space-y-1.5">
                    <span className="font-bold text-rose-400">📄 Dữ liệu (Data):</span>
                    <p className="text-text-secondary leading-relaxed">
                      Là các yếu tố thô (chữ viết, con số, âm thanh, hình ảnh) được đưa vào máy tính dưới dạng bit. Ví dụ: Con số <strong>"39°C"</strong>.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-bg-card border border-border-card space-y-1.5">
                    <span className="font-bold text-emerald-400">💡 Thông tin (Information):</span>
                    <p className="text-text-secondary leading-relaxed">
                      Là ý nghĩa mà dữ liệu mang lại. "39°C" ở bản tin thời tiết mang thông tin <em>"Trời nóng"</em>; trong bệnh án y tế mang thông tin <em>"Sốt cao"</em>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Unit Scale */}
              <InteractiveUnitScale />

              {/* 4 Ưu Điểm của Thiết Bị Số */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-black text-text-primary uppercase tracking-wider">
                  3. Bốn Ưu Điểm Vượt Trội Của Thiết Bị Số
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentAct.interactiveData?.advantages?.map((adv: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-bg-main border border-border-card flex items-start gap-3.5">
                      <span className="text-2xl">{adv.icon}</span>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-text-primary">{adv.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5">{adv.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. LUYỆN TẬP (PRACTICE) ── */}
        {currentActivityIdx === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Drag Drop Game */}
            <DragDropGame />

            {/* Quiz Show 2 Câu Hỏi Chuẩn SGK */}
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                Đấu Trường Trắc Nghiệm
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">
                Kiểm tra kiến thức cốt lõi (SGK Trang 8 & 10)
              </h2>

              <div className="space-y-6">
                {currentAct.interactiveData?.quizQuestions?.map((q: any, qIdx: number) => {
                  const selected = selectedAnswers[qIdx];
                  const isCorrect = selected === q.correctIndex;
                  return (
                    <div key={qIdx} className="p-5 rounded-2xl bg-bg-main border border-border-card space-y-3">
                      <h4 className="font-bold text-sm sm:text-base text-text-primary">
                        Câu {qIdx + 1}: {q.question}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt: string, optIdx: number) => {
                          const isThisSelected = selected === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => {
                                setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                                if (optIdx === q.correctIndex) {
                                  confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
                                }
                              }}
                              className={`p-3.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                                isThisSelected
                                  ? optIdx === q.correctIndex
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-md"
                                    : "bg-red-500/20 border-red-500 text-red-400 font-bold shadow-md"
                                  : "bg-bg-card border-border-card text-text-secondary hover:border-emerald-500/40 hover:text-text-primary"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {selected !== undefined && (
                        <div className={`p-3 rounded-xl text-xs font-medium ${
                          isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {isCorrect ? "✅ Chính xác! " : "❌ Chưa chính xác. "}
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. VẬN DỤNG (APPLICATION) ── */}
        {currentActivityIdx === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl space-y-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                Hoạt động 4: Vận dụng thực tế & Chuyển đổi số
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary">
                Ứng dụng Thực tiễn & Thảo luận Mở
              </h2>

              {/* Case Studies 1 & 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-bg-main border border-border-card space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪪</span>
                    <h3 className="font-bold text-sm sm:text-base text-amber-400">Thẻ Căn Cước Công Dân Gắn Chip</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    • <strong>Mã QR code:</strong> Giúp camera điện thoại quét nhanh thông tin nhân thân cơ bản.<br />
                    • <strong>Chip nhớ điện tử:</strong> Lưu trữ mã hóa bảo mật thông tin sinh trắc học (vân tay, khuôn mặt), chống làm giả và phục vụ xác thực mức độ cao.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-bg-main border border-border-card space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📚</span>
                    <h3 className="font-bold text-sm sm:text-base text-amber-400">Số Hóa 2.000 Cuốn Sách Thư Viện</h3>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    2.000 cuốn sách × 50 MB = 100.000 MB ≈ 97.65 GB.<br />
                    <strong>Kết luận:</strong> Thẻ nhớ 256 GB hoàn toàn có thể lưu trữ toàn bộ thư viện sách của cả một trường học với giá thành cực rẻ!
                  </p>
                </div>
              </div>

              {/* Interactive Discussion Form */}
              <div className="space-y-4 pt-4 border-t border-border-card">
                <h3 className="text-sm sm:text-base font-black text-text-primary flex items-center gap-2">
                  <span>💬</span> Diễn đàn Thảo luận tại Lớp & Trực tuyến
                </h3>

                {currentAct.interactiveData?.questions?.map((q: string, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-bg-main border border-border-card space-y-3">
                    <p className="text-xs sm:text-sm font-bold text-text-primary">{q}</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discussionInputs[i] || ""}
                        onChange={(e) => setDiscussionInputs(prev => ({ ...prev, [i]: e.target.value }))}
                        placeholder="Nhập ý kiến thảo luận của em tại đây..."
                        className="flex-1 px-4 py-2.5 rounded-xl bg-bg-card border border-border-card text-xs text-text-primary focus:outline-none focus:border-rose-500/50"
                      />
                      <button
                        onClick={() => {
                          if (!discussionInputs[i]?.trim()) return;
                          setSubmittedDiscussion(prev => ({ ...prev, [i]: true }));
                          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                        }}
                        className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-500/20"
                      >
                        <Send className="w-3.5 h-3.5" /> Gửi
                      </button>
                    </div>
                    {submittedDiscussion[i] && (
                      <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã gửi câu trả lời lên màn hình bài giảng!
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Finish Lesson Button */}
              <div className="text-center pt-6">
                <button
                  onClick={() => {
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                    alert("🎉 Chúc mừng bạn đã hoàn thành xuất sắc bài học Tin học 10 Bài 1!");
                  }}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:opacity-95 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition hover:scale-105"
                >
                  🎉 Hoàn Thành Bài Giảng & Lưu Điểm SCORM
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAVIGATION CONTROLLER ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-bg-card/95 backdrop-blur-xl border-t border-border-card px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xl">
        <button
          onClick={() => setCurrentActivityIdx(i => Math.max(0, i - 1))}
          disabled={currentActivityIdx === 0}
          className="px-4 py-2 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary disabled:opacity-30 text-xs font-bold transition flex items-center gap-1.5 border border-border-card"
        >
          <ChevronLeft className="w-4 h-4" /> Hoạt động trước
        </button>

        <span className="text-xs font-bold text-text-secondary hidden sm:inline font-mono">
          Hoạt động {currentActivityIdx + 1} / {lesson.activities.length}
        </span>

        <button
          onClick={() => setCurrentActivityIdx(i => Math.min(lesson.activities.length - 1, i + 1))}
          disabled={currentActivityIdx === lesson.activities.length - 1}
          className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
        >
          Tiếp theo <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* ── FLOATING PRESENTER TOOLKIT (FOR OFFLINE / SMARTBOARD) ── */}
      <PresenterToolkit
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
