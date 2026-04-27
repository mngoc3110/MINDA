"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, UserPlus, UserMinus, CheckCircle, X, ChevronDown, ChevronRight, GraduationCap, ArrowRight, CheckSquare, Square } from "lucide-react";

interface Student {
  id: number;
  full_name: string;
  avatar_url: string | null;
  email: string;
  phone?: string;
  class_name?: string;
  already_linked?: boolean;
}

export default function MyStudentsPage() {
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set(["__all__"]));
  const [addClassName, setAddClassName] = useState("");
  const [showNewClass, setShowNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [movingStudent, setMovingStudent] = useState<Student | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
  const getToken = () => localStorage.getItem("minda_token");

  const fetchMyStudents = useCallback(async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        fetch(`${API}/api/profile/my-offline-students`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
        fetch(`${API}/api/profile/my-classes`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        }),
      ]);
      if (studentsRes.ok) setMyStudents(await studentsRes.json());
      if (classesRes.ok) {
        const cls = await classesRes.json();
        setClasses(cls);
        setExpandedClasses(new Set(["__all__", "__unclassified__", ...cls]));
      }
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

  const toggleBulkSelect = (id: number) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllInGroup = (students: Student[]) => {
    setBulkSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = students.every((s) => next.has(s.id));
      if (allSelected) {
        students.forEach((s) => next.delete(s.id));
      } else {
        students.forEach((s) => next.add(s.id));
      }
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
        body: JSON.stringify({ student_ids: Array.from(selectedIds), class_name: addClassName }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(data.message);
        setSelectedIds(new Set());
        setShowAddModal(false);
        setAddClassName("");
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

  const handleMoveStudent = async (studentId: number, className: string) => {
    try {
      await fetch(`${API}/api/profile/update-student-class/${studentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ class_name: className }),
      });
      setMovingStudent(null);
      fetchMyStudents();
    } catch (e) { console.error(e); }
  };

  const handleBulkAssign = async (className: string) => {
    if (bulkSelectedIds.size === 0) return;
    try {
      await fetch(`${API}/api/profile/batch-update-class`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ student_ids: Array.from(bulkSelectedIds), class_name: className }),
      });
      setBulkSelectedIds(new Set());
      setBulkMode(false);
      setShowBulkAssign(false);
      fetchMyStudents();
    } catch (e) { console.error(e); }
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    if (!classes.includes(newClassName.trim())) {
      setClasses((prev) => [...prev, newClassName.trim()]);
      setExpandedClasses((prev) => new Set([...prev, newClassName.trim()]));
    }
    setNewClassName("");
    setShowNewClass(false);
  };

  const toggleClass = (name: string) => {
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Group students by class
  const studentsByClass = new Map<string, Student[]>();
  const unclassifiedStudents: Student[] = [];

  myStudents.forEach((s) => {
    if (s.class_name) {
      if (!studentsByClass.has(s.class_name)) studentsByClass.set(s.class_name, []);
      studentsByClass.get(s.class_name)!.push(s);
    } else {
      unclassifiedStudents.push(s);
    }
  });

  classes.forEach((c) => {
    if (!studentsByClass.has(c)) studentsByClass.set(c, []);
  });

  const allClassNames = [...classes, ...Array.from(studentsByClass.keys())].filter((v, i, a) => a.indexOf(v) === i);

  const renderStudent = (s: Student) => (
    <div key={s.id} className={`flex items-center gap-4 px-4 py-3 transition-colors group ${bulkMode ? 'cursor-pointer' : ''} ${bulkSelectedIds.has(s.id) ? 'bg-indigo-500/10' : 'hover:bg-bg-hover'}`}
      onClick={() => bulkMode && toggleBulkSelect(s.id)}
    >
      {bulkMode && (
        <div className="shrink-0">
          {bulkSelectedIds.has(s.id) ? (
            <CheckSquare className="w-5 h-5 text-indigo-400" />
          ) : (
            <Square className="w-5 h-5 text-text-muted" />
          )}
        </div>
      )}
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
      {!bulkMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setMovingStudent(s); }}
            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
            title="Đổi lớp"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveStudent(s.id, s.full_name); }}
            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Xoá khỏi lớp"
          >
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  const renderGroupHeader = (title: string, students: Student[], icon: React.ReactNode, colorClass: string, groupKey: string) => {
    const isExpanded = expandedClasses.has(groupKey);
    const allInGroupSelected = students.length > 0 && students.every((s) => bulkSelectedIds.has(s.id));

    return (
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-bg-hover transition-colors"
        onClick={() => toggleClass(groupKey)}
      >
        {isExpanded ? (
          <ChevronDown className={`w-4 h-4 ${colorClass} shrink-0`} />
        ) : (
          <ChevronRight className={`w-4 h-4 ${colorClass} shrink-0`} />
        )}
        {bulkMode && students.length > 0 && (
          <div className="shrink-0" onClick={(e) => { e.stopPropagation(); selectAllInGroup(students); }}>
            {allInGroupSelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            ) : (
              <Square className="w-5 h-5 text-text-muted" />
            )}
          </div>
        )}
        {icon}
        <span className="font-bold text-text-primary flex-1">{title}</span>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${colorClass === 'text-indigo-400' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-text-muted border border-white/10'}`}>
          {students.length} HS
        </span>
      </div>
    );
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
            <p className="text-text-secondary text-sm">Phân lớp và quản lý học sinh của bạn</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewClass(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" /> Tạo Lớp
          </button>
          <button
            onClick={() => { setShowAddModal(true); handleSearch(""); }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Thêm HS
          </button>
        </div>
      </header>

      {/* Create Class Inline */}
      {showNewClass && (
        <div className="mb-6 flex items-center gap-3 bg-bg-card border border-indigo-500/30 p-4 rounded-2xl">
          <GraduationCap className="w-5 h-5 text-indigo-400" />
          <input
            type="text" value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            placeholder="Tên lớp mới (VD: Lớp 12-2026)..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-text-primary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
            autoFocus
          />
          <button onClick={handleCreateClass} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-colors">Tạo</button>
          <button onClick={() => setShowNewClass(false)} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Stats + Bulk Mode Toggle */}
      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Users className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-bold text-emerald-500">{myStudents.length} học sinh</span>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-400">{allClassNames.length} lớp</span>
        </div>
        <div className="flex-1" />
        {bulkMode ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-400">
              ✅ Đã chọn {bulkSelectedIds.size} HS
            </span>
            <button
              onClick={() => { if (bulkSelectedIds.size > 0) setShowBulkAssign(true); }}
              disabled={bulkSelectedIds.size === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
            >
              <GraduationCap className="w-4 h-4" /> Gán vào lớp
            </button>
            <button
              onClick={() => { setBulkMode(false); setBulkSelectedIds(new Set()); }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors"
            >
              Huỷ
            </button>
          </div>
        ) : (
          <button
            onClick={() => setBulkMode(true)}
            className="px-4 py-2 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 text-text-secondary hover:text-indigo-400"
          >
            <CheckSquare className="w-4 h-4" /> Chọn nhiều HS
          </button>
        )}
      </div>

      {/* Student List grouped by class */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-bg-card rounded-2xl border border-border-card text-center p-12 text-text-muted">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : myStudents.length === 0 && allClassNames.length === 0 ? (
          <div className="bg-bg-card rounded-2xl border border-border-card text-center p-12 text-text-muted">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold mb-1">Chưa có học sinh nào</p>
            <p className="text-sm">Bấm &quot;Thêm Học sinh&quot; để thêm học sinh vào lớp</p>
          </div>
        ) : (
          <>
            {/* Classes */}
            {allClassNames.map((className) => {
              const students = studentsByClass.get(className) || [];
              const isExpanded = expandedClasses.has(className);

              return (
                <div key={className} className="bg-bg-card rounded-2xl border border-border-card overflow-hidden">
                  {renderGroupHeader(className, students, <GraduationCap className="w-5 h-5 text-indigo-400 shrink-0" />, "text-indigo-400", className)}
                  {isExpanded && (
                    <div className="border-t border-border-card divide-y divide-border-card">
                      {students.length === 0 ? (
                        <p className="text-sm text-text-muted px-6 py-4 italic">Chưa có học sinh nào trong lớp này. Bấm &quot;Chọn nhiều HS&quot; để gán hàng loạt!</p>
                      ) : (
                        students.map((s) => renderStudent(s))
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unclassified */}
            {unclassifiedStudents.length > 0 && (
              <div className="bg-bg-card rounded-2xl border border-border-card overflow-hidden">
                {renderGroupHeader("Chưa phân lớp", unclassifiedStudents, <Users className="w-5 h-5 text-gray-400 shrink-0" />, "text-gray-400", "__unclassified__")}
                {expandedClasses.has("__unclassified__") && (
                  <div className="border-t border-border-card divide-y divide-border-card">
                    {unclassifiedStudents.map((s) => renderStudent(s))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Assign Modal */}
      {showBulkAssign && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowBulkAssign(false)}>
          <div className="bg-bg-card rounded-2xl w-full max-w-sm border border-border-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border-card">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                Gán {bulkSelectedIds.size} HS vào lớp
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleBulkAssign("")}
                className="w-full text-left px-4 py-3 rounded-xl border border-border-card hover:bg-bg-hover transition-colors text-sm"
              >
                Không phân lớp
              </button>
              {allClassNames.map((c) => (
                <button
                  key={c}
                  onClick={() => handleBulkAssign(c)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-border-card hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors text-sm flex items-center gap-2"
                >
                  <GraduationCap className="w-4 h-4 text-indigo-400" /> {c}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border-card">
              <button onClick={() => setShowBulkAssign(false)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Move Student Modal */}
      {movingStudent && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setMovingStudent(null)}>
          <div className="bg-bg-card rounded-2xl w-full max-w-sm border border-border-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-border-card">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-indigo-400" />
                Chuyển lớp: {movingStudent.full_name}
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleMoveStudent(movingStudent.id, "")}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${!movingStudent.class_name ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
              >
                Không phân lớp
              </button>
              {allClassNames.map((c) => (
                <button
                  key={c}
                  onClick={() => handleMoveStudent(movingStudent.id, c)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm flex items-center gap-2 ${movingStudent.class_name === c ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-bold' : 'border-border-card hover:bg-bg-hover'}`}
                >
                  <GraduationCap className="w-4 h-4" /> {c}
                  {movingStudent.class_name === c && <CheckCircle className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border-card">
              <button onClick={() => setMovingStudent(null)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-colors">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Students Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-bg-card rounded-2xl w-full max-w-xl max-h-[80vh] overflow-hidden border border-border-card shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border-card shrink-0">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" />
                Thêm Học sinh vào Lớp
              </h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 pt-4">
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Thêm vào lớp</label>
              <select
                value={addClassName}
                onChange={(e) => setAddClassName(e.target.value)}
                className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Chưa phân lớp --</option>
                {allClassNames.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="p-4 border-b border-border-card">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text" placeholder="Tìm theo tên hoặc email..." value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-hover border border-border-card rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                  autoFocus
                />
              </div>
              {selectedIds.size > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-emerald-500 font-bold">Đã chọn {selectedIds.size} học sinh</span>
                  <button onClick={handleAddStudents} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors">
                    Thêm vào lớp
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {searchResults.length === 0 ? (
                <div className="text-center p-8 text-text-muted text-sm">
                  {searchQuery ? "Không tìm thấy học sinh nào" : "Nhập tên hoặc email để tìm kiếm"}
                </div>
              ) : (
                <div className="divide-y divide-border-card">
                  {searchResults.map((s) => (
                    <div key={s.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${s.already_linked ? "opacity-50 cursor-default" : selectedIds.has(s.id) ? "bg-emerald-500/10" : "hover:bg-bg-hover"}`}
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
