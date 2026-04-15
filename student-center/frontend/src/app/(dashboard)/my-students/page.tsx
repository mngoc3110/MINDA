"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, UserPlus, UserMinus, CheckCircle, X } from "lucide-react";

interface Student {
  id: number;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone?: string;
  already_linked?: boolean;
}

export default function MyStudentsPage() {
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const getToken = () => localStorage.getItem("minda_token");

  const fetchMyStudents = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/profile/my-offline-students`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setMyStudents(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchMyStudents();
  }, [fetchMyStudents]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    try {
      const res = await fetch(`${API}/api/profile/search-students?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setSearchResults(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddStudents = async () => {
    if (selectedIds.size === 0) return;
    try {
      const res = await fetch(`${API}/api/profile/add-student-to-class`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setSelectedIds(new Set());
        setShowAddModal(false);
        fetchMyStudents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveStudent = async (id: number, name: string) => {
    if (!confirm(`Bạn có chắc muốn xoá "${name}" khỏi lớp?`)) return;
    try {
      const res = await fetch(`${API}/api/profile/remove-student/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchMyStudents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-primary p-6 md:p-8 font-outfit">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-border-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Quản lý Học sinh</h1>
            <p className="text-text-secondary text-sm">Thêm hoặc xoá học sinh khỏi lớp của bạn</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAddModal(true); handleSearch(""); }}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" /> Thêm Học sinh
        </button>
      </header>

      {/* Stats */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Users className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-500">{myStudents.length} học sinh trong lớp</span>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-bg-card rounded-2xl border border-border-card overflow-hidden">
        {loading ? (
          <div className="text-center p-12 text-text-muted">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : myStudents.length === 0 ? (
          <div className="text-center p-12 text-text-muted">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-1">Chưa có học sinh nào</p>
            <p className="text-sm">Bấm "Thêm Học sinh" để thêm học sinh vào lớp</p>
          </div>
        ) : (
          <div className="divide-y divide-border-card">
            {myStudents.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-bg-hover transition-colors">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white/20">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-white text-sm">{s.full_name[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{s.email}</p>
                </div>
                {s.phone && (
                  <span className="text-xs text-text-secondary hidden md:block">{s.phone}</span>
                )}
                <button
                  onClick={() => handleRemoveStudent(s.id, s.full_name)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Xoá khỏi lớp"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Students Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-bg-card rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden border border-border-card shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-card shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Thêm Học sinh vào Lớp
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-border-card">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-hover border border-border-card rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>
              {selectedIds.size > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-500 font-bold">Đã chọn {selectedIds.size} học sinh</span>
                  <button
                    onClick={handleAddStudents}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    Thêm vào lớp
                  </button>
                </div>
              )}
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {searchResults.length === 0 ? (
                <div className="text-center p-8 text-text-muted text-sm">
                  {searchQuery ? "Không tìm thấy học sinh nào" : "Nhập tên hoặc email để tìm kiếm"}
                </div>
              ) : (
                <div className="divide-y divide-border-card">
                  {searchResults.map((s) => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                        s.already_linked
                          ? "opacity-50 cursor-default"
                          : selectedIds.has(s.id)
                          ? "bg-emerald-500/10"
                          : "hover:bg-bg-hover"
                      }`}
                      onClick={() => !s.already_linked && toggleSelect(s.id)}
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center overflow-hidden shrink-0">
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt={s.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-white text-xs">{s.full_name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.full_name}</p>
                        <p className="text-xs text-text-muted truncate">{s.email}</p>
                      </div>
                      {s.already_linked ? (
                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Đã trong lớp
                        </span>
                      ) : selectedIds.has(s.id) ? (
                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-border-card rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
