"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Plus, FileText, BrainCircuit, ArrowRight, Loader2, Search, CheckCircle2, Clock, X } from "lucide-react";

export default function RevisionHubPage() {
  const [notebooks, setNotebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Toán học");
  const [grade, setGrade] = useState("Lớp 12");
  const [description, setDescription] = useState("");

  const fetchNotebooks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setNotebooks(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/revision/notebooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, subject, grade, description })
      });

      if (res.ok) {
        setShowModal(false);
        setTitle("");
        setDescription("");
        await fetchNotebooks();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const filtered = notebooks.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg-main text-text-primary relative overflow-hidden">
      {/* Background gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-pink-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-pink-500/25 shrink-0">
                <Sparkles className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-text-primary">
                    Ôn Tập AI (NotebookLM)
                  </h1>
                  <span className="text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-500">
                    GDPT 2018
                  </span>
                </div>
                <p className="text-text-secondary text-xs md:text-sm mt-1 font-medium">
                  Tải lên đề cương (PDF/Word) để AI phân tích chuyên sâu và tạo bộ câu hỏi theo 4 mức độ nhận thức
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs md:text-sm font-bold shadow-lg shadow-pink-500/25 flex items-center gap-2 transition-all shrink-0 self-start md:self-auto hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Tạo Không Gian Ôn Tập Mới
            </button>
          </div>
        </motion.div>

        {/* ── Search bar ────────────────────────────────────────── */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm không gian ôn tập theo tên hoặc môn học..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-bg-card border border-border-card text-sm text-text-primary focus:border-pink-500 focus:outline-none transition-all placeholder:text-text-muted shadow-sm"
          />
        </div>

        {/* ── Notebooks Grid ────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <p className="text-xs font-semibold text-text-muted">Đang tải không gian ôn tập...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-border-card bg-bg-card p-8 shadow-sm">
            <BrainCircuit className="w-14 h-14 mx-auto text-pink-500/50 mb-3" />
            <h3 className="font-bold text-lg text-text-primary mb-1">Chưa có không gian ôn tập nào</h3>
            <p className="text-xs md:text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
              Tạo ngay một Notebook cho môn học của bạn, tải lên đề cương (PDF/Word) để AI Gemini 2.0 phân tích và tạo bộ đề ôn tập thông minh.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-600 text-white text-xs md:text-sm font-bold shadow-lg shadow-pink-500/20 hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Bắt đầu tạo Notebook đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((nb, i) => (
              <motion.div
                key={nb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/revision/${nb.id}`}
                  className="block p-6 rounded-3xl border border-border-card bg-bg-card hover:border-pink-500/50 transition-all group relative overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20">
                      {nb.subject}
                    </span>
                    <span className="text-xs font-semibold text-text-muted px-2.5 py-0.5 rounded-full bg-bg-hover border border-border-card">
                      {nb.grade}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-text-primary group-hover:text-pink-500 transition-colors line-clamp-1 mb-2">
                    {nb.title}
                  </h3>

                  <p className="text-xs md:text-sm text-text-secondary line-clamp-2 leading-relaxed mb-5 min-h-[2.5rem]">
                    {nb.description || "Ôn tập kiến thức trọng tâm, trắc nghiệm 4 mức độ nhận thức GDPT 2018."}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border-card text-xs text-text-muted font-medium">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500" /> {nb.doc_count} tài liệu</span>
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> {nb.quiz_count} bộ đề</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-pink-500 group-hover:translate-x-1.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Create Notebook Modal ───────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-lg bg-bg-card border border-border-card rounded-3xl p-6 md:p-8 shadow-2xl relative text-text-primary"
            >
              <div className="flex items-center justify-between mb-6 border-b border-border-card pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-pink-500/20">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-text-primary">Tạo Không Gian Ôn Tập Mới</h3>
                    <p className="text-xs text-text-secondary font-medium">Học tập đa tài liệu chuẩn GDPT 2018</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-9 h-9 rounded-xl hover:bg-bg-hover flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Tên không gian ôn tập *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ôn Thi Giữa Kỳ 1 - Tin Học 11"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-main border border-border-card text-sm text-text-primary placeholder:text-text-muted focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1.5">Môn học</label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg-main text-text-primary border border-border-card text-xs font-semibold focus:border-pink-500 focus:outline-none"
                    >
                      {["Toán học", "Vật lý", "Hóa học", "Sinh học", "Tin học", "Ngữ văn", "Lịch sử & Địa lý", "Tiếng Anh", "Giáo dục Kinh tế & Pháp luật"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary block mb-1.5">Khối lớp</label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-bg-main text-text-primary border border-border-card text-xs font-semibold focus:border-pink-500 focus:outline-none"
                    >
                      {["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học / Ôn Chuyên"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary block mb-1.5">Mô tả hoặc mục tiêu ôn tập</label>
                  <textarea
                    rows={3}
                    placeholder="VD: Tập trung ôn các dạng bài tập hàm số, giải thuật đệ quy và cấu trúc dữ liệu..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-bg-main border border-border-card text-xs leading-relaxed text-text-primary placeholder:text-text-muted focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-3 border-t border-border-card pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold shadow-lg shadow-pink-500/25 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {creating ? "Đang tạo..." : "Tạo Không Gian"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
