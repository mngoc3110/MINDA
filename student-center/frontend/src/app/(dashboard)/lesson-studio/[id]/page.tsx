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
  HardDrive,
  Presentation,
  Gamepad2,
  FileSpreadsheet,
  Plus,
  StickyNote,
  Tv,
  Palette
} from "lucide-react";

import { SAMPLE_LESSONS } from "@/data/sampleLessons";
import { TIN10_BAI1_SLIDES } from "@/data/sampleSlides";
import { InteractiveLesson, packageLessonToSCORMZip } from "@/lib/scormPackager";
import { saveLessonToGoogleDrive } from "@/lib/driveExport";
import { exportLessonToPPTX, SlideData } from "@/lib/pptxExporter";

import SlideThemePicker, { SlideTheme } from "@/components/lesson-studio/SlideThemePicker";
import InteractiveSlideViewer from "@/components/lesson-studio/InteractiveSlideViewer";
import InteractiveUnitScale from "@/components/lesson-studio/InteractiveUnitScale";
import DragDropGame from "@/components/lesson-studio/DragDropGame";
import PresenterToolkit from "@/components/lesson-studio/PresenterToolkit";
import ManimVideoEmbed from "@/components/lesson-studio/ManimVideoEmbed";

export default function LessonPlayerPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [lesson, setLesson] = useState<InteractiveLesson | null>(null);
  const [slides, setSlides] = useState<SlideData[]>(TIN10_BAI1_SLIDES);
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [currentActivityIdx, setCurrentActivityIdx] = useState<number>(0);

  // Theme template state
  const [slideTheme, setSlideTheme] = useState<SlideTheme>("cyber-neon");

  // View Mode: 'slides' vs 'activities'
  const [viewMode, setViewMode] = useState<"slides" | "activities">("slides");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showTeacherNotes, setShowTeacherNotes] = useState<boolean>(false);

  // Export states
  const [isExportingPPTX, setIsExportingPPTX] = useState<boolean>(false);
  const [isExportingSCORM, setIsExportingSCORM] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [driveMsg, setDriveMsg] = useState<{ text: string; url?: string; type: "success" | "error" } | null>(null);

  // Custom added slide modal
  const [showAddSlideModal, setShowAddSlideModal] = useState<boolean>(false);
  const [newSlideTopic, setNewSlideTopic] = useState<string>("");

  useEffect(() => {
    const found = SAMPLE_LESSONS.find(l => l.id === id) || SAMPLE_LESSONS[0];
    setLesson(found);
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlideIdx(prev => Math.max(0, prev - 1));
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 1. Export PPTX
  const handleDownloadPPTX = async () => {
    if (!lesson) return;
    setIsExportingPPTX(true);
    try {
      const blob = await exportLessonToPPTX(
        lesson.title,
        lesson.subject,
        lesson.grade,
        lesson.author,
        slides
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MINDA_${lesson.id}_Presentation.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch (e: any) {
      alert("Lỗi xuất PowerPoint: " + e.message);
    } finally {
      setIsExportingPPTX(false);
    }
  };

  // 2. Export SCORM Zip
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

  // 3. Save to Google Drive
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

  // Add custom slide
  const handleAddExpandedSlide = () => {
    if (!newSlideTopic.trim()) return;
    const newSlide: SlideData = {
      id: `slide-custom-${Date.now()}`,
      slideNumber: slides.length + 1,
      activityType: "expansion",
      badge: "🚀 Mở rộng Chuyên sâu",
      title: newSlideTopic,
      subtitle: "Chủ đề kiến thức bổ trợ và công nghệ thực tiễn",
      cards: [
        { title: "Khái niệm & Ứng dụng", desc: `Tìm hiểu sâu về ${newSlideTopic} và tác động đến chuyển đổi số toàn cầu.`, icon: "💡" },
        { title: "Liên hệ thực tiễn", desc: "Ví dụ thực tế trong đời sống, doanh nghiệp và xu hướng công nghệ tương lai.", icon: "🌐" },
        { title: "Bài tập tư duy", desc: "Thảo luận nhóm và phân tích các cơ hội / thách thức công nghệ.", icon: "🎯" }
      ],
      callout: {
        title: "Điểm mở rộng",
        content: `Nâng cao năng lực số với chủ đề: ${newSlideTopic}`
      },
      notes: `Giáo viên giảng giải chi tiết về ${newSlideTopic} và đặt câu hỏi mở cho học sinh.`
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIdx(slides.length);
    setNewSlideTopic("");
    setShowAddSlideModal(false);
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center text-text-primary">
        <Loader2 className="w-10 h-10 animate-spin text-rose-500" />
      </div>
    );
  }

  const currentSlide = slides[currentSlideIdx] || slides[0];

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col font-outfit pb-20 relative">
      
      {/* ── TOP CONTROL BAR ── */}
      <header className="sticky top-0 z-30 bg-bg-card/90 backdrop-blur-xl border-b border-border-card px-4 sm:px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3 shadow-sm">
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
              <span className="text-xs text-text-secondary truncate">{slides.length} Slide</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-text-primary truncate mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Theme Picker + View Mode + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end xl:self-auto shrink-0">
          
          {/* Slide Theme Picker */}
          <SlideThemePicker
            currentTheme={slideTheme}
            onSelectTheme={setSlideTheme}
          />

          {/* View Mode Switcher */}
          <div className="bg-bg-main border border-border-card p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode("slides")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "slides" ? "bg-rose-500 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Presentation className="w-3.5 h-3.5" /> Slide PPT
            </button>
            <button
              onClick={() => setViewMode("activities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "activities" ? "bg-indigo-600 text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> 4 Hoạt Động
            </button>
          </div>

          {/* Export PPTX */}
          <button
            onClick={handleDownloadPPTX}
            disabled={isExportingPPTX}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50"
            title="Tải bài giảng file PowerPoint .pptx"
          >
            {isExportingPPTX ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
            <span>Xuất PPTX</span>
          </button>

          {/* Export SCORM */}
          <button
            onClick={handleDownloadSCORM}
            disabled={isExportingSCORM}
            className="px-3 py-2 rounded-xl bg-bg-main border border-border-card hover:border-indigo-500/40 text-text-secondary hover:text-indigo-400 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            title="Xuất file SCORM 1.2 ZIP"
          >
            {isExportingSCORM ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">SCORM</span>
          </button>

          {/* Save to Drive */}
          <button
            onClick={handleSaveToDrive}
            disabled={isSavingToDrive}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
            title="Lưu trực tiếp vào Google Drive"
          >
            {isSavingToDrive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Lưu Drive</span>
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODE 1: POWERPOINT SLIDE DECK WITH THEMES & GAMES ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "slides" && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-6 max-w-7xl w-full mx-auto">
          
          {/* ── LEFT SIDEBAR: SLIDE THUMBNAILS ── */}
          <aside className="w-full lg:w-72 bg-bg-card border border-border-card rounded-3xl p-3 flex flex-col gap-2 shrink-0 max-h-[320px] lg:max-h-[750px] overflow-y-auto custom-scrollbar shadow-lg">
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border-card">
              <span className="text-[11px] font-black text-text-secondary uppercase tracking-wider">
                Slides ({slides.length})
              </span>
              <button
                onClick={() => setShowAddSlideModal(true)}
                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition flex items-center gap-1 text-[10px] font-bold"
                title="Thêm chủ đề mở rộng ngoài SGK"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Slide
              </button>
            </div>

            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1">
              {slides.map((s, idx) => {
                const isActive = currentSlideIdx === idx;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`w-48 lg:w-full p-3 rounded-2xl border text-left transition-all shrink-0 flex flex-col gap-1.5 relative ${
                      isActive
                        ? "bg-rose-500/15 border-rose-500 shadow-md ring-2 ring-rose-500/40"
                        : "bg-bg-main border-border-card hover:border-rose-500/40 hover:bg-bg-hover"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-text-secondary">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded-md font-black truncate max-w-[130px] ${
                        s.activityType === "expansion" ? "bg-purple-500/20 text-purple-400" : "bg-bg-card text-rose-400"
                      }`}>
                        {s.badge}
                      </span>
                    </div>
                    <p className={`text-xs font-bold truncate ${isActive ? "text-rose-400" : "text-text-primary"}`}>
                      {s.title}
                    </p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── CENTER: PRESENTATION STAGE WITH INTERACTIVE SLIDE VIEWER ── */}
          <main className="flex-1 flex flex-col gap-3">
            
            <InteractiveSlideViewer
              slide={currentSlide}
              slideIndex={currentSlideIdx}
              totalSlides={slides.length}
              theme={slideTheme}
            />

            {/* Slide Navigation Controller */}
            <div className="flex items-center justify-between bg-bg-card border border-border-card p-3 rounded-2xl shadow-sm">
              <button
                onClick={() => setCurrentSlideIdx(prev => Math.max(0, prev - 1))}
                disabled={currentSlideIdx === 0}
                className="px-4 py-2 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary disabled:opacity-30 text-xs font-bold transition flex items-center gap-1.5 border border-border-card"
              >
                <ChevronLeft className="w-4 h-4" /> Slide Trước
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTeacherNotes(!showTeacherNotes)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    showTeacherNotes ? "bg-amber-500 text-white" : "bg-bg-main text-text-secondary hover:text-text-primary border border-border-card"
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" /> Ghi chú giáo viên
                </button>
                <span className="text-xs font-mono font-bold text-text-secondary">
                  {currentSlideIdx + 1} / {slides.length}
                </span>
              </div>

              <button
                onClick={() => setCurrentSlideIdx(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlideIdx === slides.length - 1}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-30 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                Slide Tiếp <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Teacher Speaker Notes */}
            {showTeacherNotes && currentSlide.notes && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 animate-in fade-in space-y-1">
                <span className="font-bold uppercase tracking-wider block">📝 Lời khuyên giảng dạy cho giáo viên:</span>
                <p className="leading-relaxed">{currentSlide.notes}</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── VIEW MODE 2: 4-STEP INTERACTIVE ACTIVITIES VIEW ── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewMode === "activities" && (
        <div className="flex-1 flex flex-col gap-6 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4">
          
          {/* 4 Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { idx: 0, label: "1. 🎬 Khởi Động" },
              { idx: 1, label: "2. 💡 Kiến Thức" },
              { idx: 2, label: "3. 🎮 Luyện Tập" },
              { idx: 3, label: "4. 🚀 Vận Dụng" },
            ].map(tab => (
              <button
                key={tab.idx}
                onClick={() => setCurrentActivityIdx(tab.idx)}
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  currentActivityIdx === tab.idx
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105"
                    : "bg-bg-card border border-border-card text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {currentActivityIdx === 0 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl space-y-6 animate-in fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">
                Hoạt động 1: Khởi động
              </span>
              <h2 className="text-2xl font-black text-text-primary">Tình huống thực tế & Thiết bị số</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-bg-main border border-border-card text-center">
                  <span className="text-3xl block mb-1">💾</span>
                  <p className="text-xs font-bold text-emerald-400">Thẻ nhớ 1 TB</p>
                  <p className="text-[10px] text-text-secondary mt-1">Thiết bị số</p>
                </div>
                <div className="p-4 rounded-2xl bg-bg-main border border-border-card text-center">
                  <span className="text-3xl block mb-1">🕰️</span>
                  <p className="text-xs font-bold text-amber-400">Đồng hồ cơ cót</p>
                  <p className="text-[10px] text-text-secondary mt-1">Thiết bị truyền thống</p>
                </div>
                <div className="p-4 rounded-2xl bg-bg-main border border-border-card text-center">
                  <span className="text-3xl block mb-1">📻</span>
                  <p className="text-xs font-bold text-amber-400">Đĩa hát than</p>
                  <p className="text-[10px] text-text-secondary mt-1">Thiết bị truyền thống</p>
                </div>
              </div>
            </div>
          )}

          {currentActivityIdx === 1 && (
            <div className="space-y-6 animate-in fade-in">
              <ManimVideoEmbed lessonTitle={lesson.title} />
              <InteractiveUnitScale />
            </div>
          )}

          {currentActivityIdx === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <DragDropGame />
            </div>
          )}

          {currentActivityIdx === 3 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-bg-card border border-border-card shadow-2xl space-y-6 animate-in fade-in">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                Hoạt động 4: Vận dụng
              </span>
              <h2 className="text-2xl font-black text-text-primary">Ứng dụng Thẻ CCCD Gắn Chip & Chuyển đổi số</h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Mã QR in trên mặt thẻ giúp quét nhanh thông tin nhân thân bằng smartphone; trong khi chip nhớ chìm lưu trữ dữ liệu sinh trắc học mã hóa mức độ cao, chống làm giả tuyệt đối.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── FLOATING PRESENTER TOOLKIT ── */}
      <PresenterToolkit
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* ── MODAL: ADD EXPANDED SLIDE ── */}
      {showAddSlideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-bg-card border border-border-card rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-card pb-3">
              <h3 className="text-base font-black text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Thêm Slide Mở Rộng Ngoài SGK
              </h3>
              <button onClick={() => setShowAddSlideModal(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wider block">Chủ đề mở rộng</label>
              <input
                type="text"
                value={newSlideTopic}
                onChange={(e) => setNewSlideTopic(e.target.value)}
                placeholder="VD: Máy tính lượng tử (Quantum Computing), Blockchain..."
                className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-rose-500/50"
              />

              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-text-secondary font-bold uppercase tracking-wider block">Gợi ý chủ đề hot:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Máy tính Lượng tử (Quantum Qubit)",
                    "Blockchain & Hợp đồng thông minh",
                    "Xe tự lái & Xử lý dữ liệu thời gian thực",
                    "Internet vạn vật (IoT) trong Smart Home"
                  ].map(sug => (
                    <button
                      key={sug}
                      onClick={() => setNewSlideTopic(sug)}
                      className="px-2.5 py-1 rounded-lg bg-bg-main hover:bg-purple-500/10 text-text-secondary hover:text-purple-400 text-[11px] font-semibold transition border border-border-card"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowAddSlideModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary text-xs font-bold"
              >
                Huỷ
              </button>
              <button
                onClick={handleAddExpandedSlide}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold transition shadow-md shadow-purple-500/20"
              >
                ✨ Tạo Slide Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
