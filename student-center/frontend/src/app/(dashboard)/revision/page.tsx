"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BookOpen, Plus, FileText, BrainCircuit, ArrowRight, Loader2, Search, CheckCircle2, Clock } from "lucide-react";

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
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-pink-600/6 blur-[130px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/6 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Header ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-pink-500/25">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">Ôn Tập AI (NotebookLM)</h1>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400">
                    GDPT 2018
                  </span>
                </div>
                <p className="text-text-muted text-xs mt-0.5">
                  Tải lên tài liệu & đề cương để AI tự động phân tích sâu và tạo bộ câu hỏi 4 mức độ nhận thức
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-500/25 flex items-center gap-2 transition-all shrink-0 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Tạo Không Gian Ôn Tập Mới
            </button>
          </div>
        </motion.div>

        {/* ── Search bar ────────────────────────────────────────── */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm không gian ôn tập hoặc môn học..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/8 text-sm focus:border-pink-500/50 focus:outline-none transition-all placeholder:text-text-muted"
          />
        </div>

        {/* ── Notebooks Grid ────────────────────────────────────── */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-xs text-text-muted">Đang tải không gian ôn tập...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-white/8 bg-white/[0.01] p-8">
            <BrainCircuit className="w-12 h-12 mx-auto text-pink-400/40 mb-3" />
            <h3 className="font-bold text-base text-text-primary mb-1">Chưa có không gian ôn tập nào</h3>
            <p className="text-xs text-text-muted max-w-md mx-auto mb-5 leading-relaxed">
              Tạo ngay một Notebook cho môn học hoặc kỳ thi của bạn, tải lên file đề cương (PDF/Word) để AI phân tích và sinh câu hỏi trắc nghiệm thông minh.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/12 text-xs font-bold text-text-primary transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Bắt đầu tạo Notebook
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((nb, i) => (
              <motion.div
                key={nb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/revision/${nb.id}`}
                  className="block p-5 rounded-3xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-pink-500/30 transition-all group relative overflow-hidden shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      {nb.subject}
                    </span>
                    <span className="text-[10px] font-medium text-text-muted">
                      {nb.grade}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-text-primary group-hover:text-pink-300 transition-colors line-clamp-1 mb-1.5">
                    {nb.title}
                  </h3>

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-4">
                    {nb.description || "Ôn tập kiến thức trọng tâm, trắc nghiệm 4 mức độ nhận thức GDPT."}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/8 text-xs text-text-muted">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-indigo-400" /> {nb.doc_count} tài liệu</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {nb.quiz_count} bộ đề</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Create Notebook Modal ───────────────────────────────── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg bg-neutral-900 border border-white/12 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/8 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                    +
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-text-primary">Tạo Không Gian Ôn Tập Mới</h3>
                    <p className="text-[11px] text-text-muted">Học tập đa tài liệu chuẩn GDPT 2018</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/8 flex items-center justify-center text-text-muted hover:text-text-primary text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Tên không gian ôn tập *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ôn Thi Giữa Kỳ 1 - Tin Học 11"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Môn học</label>
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-pink-500 focus:outline-none"
                    >
                      {["Toán học", "Vật lý", "Hóa học", "Sinh học", "Tin học", "Ngữ văn", "Lịch sử & Địa lý", "Tiếng Anh", "Giáo dục Kinh tế & Pháp luật"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">Khối lớp</label>
                    <select
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-white/10 text-xs focus:border-pink-500 focus:outline-none"
                    >
                      {["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học / Ôn Chuyên"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted block mb-1">Mô tả hoặc mục tiêu ôn tập</label>
                  <textarea
                    rows={3}
                    placeholder="VD: Tập trung ôn các dạng bài tập hàm số, giải thuật đệ quy và cấu trúc dữ liệu..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs leading-relaxed focus:border-pink-500 focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2 border-t border-white/8 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-indigo-600 hover:opacity-90 text-white text-xs font-bold shadow-lg shadow-pink-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
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
