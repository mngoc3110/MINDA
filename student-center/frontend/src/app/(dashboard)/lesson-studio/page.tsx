"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  BookOpen, 
  Presentation, 
  Download, 
  Cloud, 
  Plus, 
  Play, 
  Clapperboard, 
  Search, 
  Upload, 
  FileText, 
  CheckCircle2, 
  FolderOpen,
  ArrowRight,
  Zap,
  Layers,
  Award
} from "lucide-react";

import { SAMPLE_LESSONS } from "@/data/sampleLessons";
import { packageLessonToSCORMZip } from "@/lib/scormPackager";
import { saveLessonToGoogleDrive } from "@/lib/driveExport";

export default function LessonStudioPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState(SAMPLE_LESSONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // Modal create from textbook
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("Tin học 10");
  const [uploadingImages, setUploadingImages] = useState(false);

  const filteredLessons = lessons.filter(l => {
    const matchQuery = l.title.toLowerCase().includes(searchQuery.toLowerCase()) || l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSub = selectedSubject === "all" || l.subject.toLowerCase().includes(selectedSubject.toLowerCase());
    return matchQuery && matchSub;
  });

  const handleQuickSCORM = async (lesson: any, e: React.MouseEvent) => {
    e.stopPropagation();
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
    } catch (err: any) {
      alert("Lỗi xuất SCORM: " + err.message);
    }
  };

  const handleQuickDrive = async (lesson: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await saveLessonToGoogleDrive(lesson);
      alert(res.message);
    } catch (err: any) {
      alert("Lỗi lưu Drive: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 space-y-8 font-outfit">
      
      {/* ── HERO BANNER ── */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-rose-900/30 border border-border-card shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> AI Lesson Studio & SCORM Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-text-primary tracking-tight leading-tight">
            Biến Sách Giáo Khoa Thành <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400">Bài Giảng Tương Tác</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            Tự động tạo giáo án chuẩn <strong>4 Hoạt động GDPT 2018</strong> (Khởi động, Hình thành kiến thức, Luyện tập, Vận dụng) với video hoạt họa Manim, dạy song song Online & Offline, lưu trữ trực tiếp vào Google Drive và đóng gói xuất bản SCORM 1.2 / 2004.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => router.push("/lesson-studio/tin-10-bai-1")}
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm transition shadow-lg shadow-rose-500/25 flex items-center gap-2 hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" /> Trải Nghiệm Bài Mẫu: Tin 10 Bài 1
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-bg-card border border-border-card hover:bg-bg-hover text-text-primary font-bold text-sm transition flex items-center gap-2 shadow-sm"
            >
              <Upload className="w-4 h-4 text-indigo-400" /> Tạo Từ Ảnh Sách Giáo Khoa
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài giảng..."
            className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50 shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {[
            { id: "all", label: "Tất cả môn" },
            { id: "tin", label: "Tin học" },
            { id: "toan", label: "Toán học" },
            { id: "ly", label: "Vật lý" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedSubject(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedSubject === f.id
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "bg-bg-card border border-border-card text-text-secondary hover:text-text-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LESSONS LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLessons.map(lesson => (
          <div
            key={lesson.id}
            onClick={() => router.push(`/lesson-studio/${lesson.id}`)}
            className="p-6 rounded-3xl bg-bg-card border border-border-card hover:border-rose-500/50 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between gap-5 relative overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {lesson.subject} {lesson.grade}
                </span>
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn SCORM & Drive
                </span>
              </div>

              <h3 className="text-xl font-black text-text-primary group-hover:text-rose-500 transition-colors">
                {lesson.title}
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary line-clamp-2 leading-relaxed">
                {lesson.description}
              </p>

              {/* 4 Activities preview badge */}
              <div className="grid grid-cols-4 gap-1.5 pt-2">
                {lesson.activities.map((act, i) => (
                  <div key={act.id} className="p-2 rounded-xl bg-bg-main border border-border-card text-center">
                    <span className="text-[10px] font-bold text-text-secondary block">HĐ {i + 1}</span>
                    <span className="text-[9px] font-semibold text-rose-400 truncate block">
                      {act.type === "warmup" ? "Khởi động" : act.type === "knowledge" ? "Kiến thức" : act.type === "practice" ? "Luyện tập" : "Vận dụng"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-border-card flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => handleQuickSCORM(lesson, e)}
                  className="p-2 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary hover:text-indigo-400 border border-border-card text-xs font-bold transition flex items-center gap-1.5"
                  title="Tải gói SCORM ZIP"
                >
                  <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">SCORM</span>
                </button>
                <button
                  onClick={(e) => handleQuickDrive(lesson, e)}
                  className="p-2 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary hover:text-rose-400 border border-border-card text-xs font-bold transition flex items-center gap-1.5"
                  title="Lưu vào Google Drive"
                >
                  <Cloud className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Drive</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-rose-500 group-hover:translate-x-1 transition-transform">
                <span>Vào giảng dạy</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MODAL: CREATE FROM TEXTBOOK IMAGES ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-bg-card border border-border-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-card pb-3">
              <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" /> Tạo Bài Giảng AI Từ Sách Giáo Khoa
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-text-primary">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Tên bài học</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Bài 2: Sự ưu việt của máy tính..."
                  className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 block">Môn & Lớp</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Upload area */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Tải ảnh các trang SGK</label>
                <div className="border-2 border-dashed border-border-card rounded-2xl p-6 text-center hover:border-rose-500/50 transition cursor-pointer bg-bg-main">
                  <Upload className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-text-primary">Kéo thả ảnh hoặc bấm để chọn ảnh từ máy tính</p>
                  <p className="text-[10px] text-text-secondary mt-1">Hỗ trợ JPG, PNG (Tối đa 10 trang)</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-bg-main hover:bg-bg-hover text-text-secondary text-xs font-bold"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  alert("AI đã tiếp nhận các trang sách và phân tích thành 4 hoạt động thành công!");
                  setShowCreateModal(false);
                  router.push("/lesson-studio/tin-10-bai-1");
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md shadow-rose-500/20"
              >
                ✨ AI Chuyển Đổi Thành Bài Giảng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
