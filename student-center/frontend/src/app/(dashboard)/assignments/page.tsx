"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Search, Clock, FileText, User, ChevronDown, ChevronRight, Trophy, PenLine, Trash2, Eye, X, FolderPlus } from "lucide-react";
import QuizBuilderModal from "./QuizBuilderModal";

interface SubmissionGroup {
  student_id: number;
  student_name: string;
  student_avatar: string | null;
  assignment_id: number;
  assignment_title: string;
  course_title: string;
  best_score: number | null;
  max_score: number;
  attempt_count: number;
  attempts: any[];
}

function groupSubmissions(raw: any[]): SubmissionGroup[] {
  const map = new Map<string, SubmissionGroup>();

  for (const item of raw) {
    const key = `${item.student_id}_${item.assignment_id}`;
    if (!map.has(key)) {
      map.set(key, {
        student_id: item.student_id,
        student_name: item.student_name,
        student_avatar: item.student_avatar || null,
        assignment_id: item.assignment_id,
        assignment_title: item.assignment_title,
        course_title: item.course_title,
        best_score: item.score,
        max_score: item.max_score ?? 10,
        attempt_count: 1,
        attempts: [item],
      });
    } else {
      const g = map.get(key)!;
      g.attempt_count++;
      g.attempts.push(item);
      if (item.score != null && (g.best_score == null || item.score > g.best_score)) {
        g.best_score = item.score;
      }
    }
  }

  for (const g of map.values()) {
    g.attempts.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }

  return Array.from(map.values());
}

function ScoreBadge({ score, max }: { score: number | null; max: number }) {
  if (score == null) {
    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">Chưa chấm</span>;
  }
  const pct = max > 0 ? score / max : 0;
  const color = pct >= 0.8
    ? "bg-green-500/10 text-green-400 border-green-500/20"
    : pct >= 0.5
    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
    : "bg-red-500/10 text-red-400 border-red-500/20";
  return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${color}`}>{score}/{max}đ</span>;
}

interface AssignmentGroupItem {
  assignment_id: number;
  assignment_title: string;
  max_score: number;
  students: {
    student_id: number;
    student_name: string;
    student_avatar: string | null;
    best_score: number | null;
    attempt_count: number;
    attempts: any[];
  }[];
}

function groupByAssignment(raw: any[]): AssignmentGroupItem[] {
  const map = new Map<number, AssignmentGroupItem>();
  
  for (const item of raw) {
    if (!map.has(item.assignment_id)) {
      map.set(item.assignment_id, {
        assignment_id: item.assignment_id,
        assignment_title: item.assignment_title,
        max_score: item.max_score ?? 10,
        students: [],
      });
    }
    
    const group = map.get(item.assignment_id)!;
    let student = group.students.find((s) => s.student_id === item.student_id);
    if (!student) {
      student = {
        student_id: item.student_id,
        student_name: item.student_name,
        student_avatar: item.student_avatar || null,
        best_score: item.score,
        attempt_count: 0,
        attempts: [],
      };
      group.students.push(student);
    }
    student.attempt_count++;
    student.attempts.push(item);
    if (item.score != null && (student.best_score == null || item.score > student.best_score)) {
      student.best_score = item.score;
    }
  }
  
  // Sort students by score desc
  for (const g of map.values()) {
    g.students.sort((a, b) => (b.best_score ?? -1) - (a.best_score ?? -1));
    for (const s of g.students) {
      s.attempts.sort((a: any, b: any) => (b.score ?? -1) - (a.score ?? -1));
    }
  }
  
  return Array.from(map.values());
}

export default function AssignmentsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);
  const [viewingQuizData, setViewingQuizData] = useState<any>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [myClasses, setMyClasses] = useState<string[]>([]);
  const [editingFolderClasses, setEditingFolderClasses] = useState<number | null>(null);
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState<Set<number>>(new Set());
  
  // States for folder rename
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>("");

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn';

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const [submissionsRes, assignmentsRes, coursesRes, foldersRes] = await Promise.all([
        fetch(`${API}/api/assignments/teacher/dashboard/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/assignments/teacher/dashboard/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/folders/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/profile/my-classes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const [sData, aData, cData, fData, clData] = await Promise.all([
        submissionsRes.ok ? submissionsRes.json() : [],
        assignmentsRes.ok ? assignmentsRes.json() : [],
        coursesRes.ok ? coursesRes.json() : [],
        foldersRes.ok ? foldersRes.json() : [],
        Promise.resolve(null),
      ]);
      setSubmissions(sData);
      setAssignments(aData);
      setCourses(cData);
      setFolders(fData);
      // clData is from the 5th promise
      try {
        const clRes = await fetch(`${API}/api/profile/my-classes`, { headers: { Authorization: `Bearer ${token}` } });
        if (clRes.ok) setMyClasses(await clRes.json());
      } catch(e) {}
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("minda_role") || "student");
    fetchSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = groupSubmissions(submissions).filter(
    (g) =>
      !search ||
      g.student_name.toLowerCase().includes(search.toLowerCase()) ||
      g.assignment_title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Hành động này sẽ XÓA VĨNH VIỄN bài tập này và TOÀN BỘ điểm của học sinh (nếu có). Bạn có chắc chắn?")) return;
    try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${API}/api/assignments/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
       });
       if (res.ok) {
          fetchSubmissions();
       } else {
          const detail = await res.json();
          alert("Lỗi xoá bài tập: " + detail.detail);
       }
    } catch (err) {
       console.error(err);
       alert("Lỗi kết nối khi cố gắng xoá bài tập");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/folders/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim() }),
      });
      if (res.ok) {
        const newFolder = await res.json();
        setFolders((prev) => [newFolder, ...prev]);
        setNewFolderName("");
        setShowNewFolder(false);
      }
    } catch (e) { console.error(e); }
  };

  const handleToggleFolderClass = async (folderId: number, className: string) => {
    const folder = folders.find((f: any) => f.id === folderId);
    if (!folder) return;
    const current: string[] = folder.assigned_classes || [];
    const newClasses = current.includes(className)
      ? current.filter((c: string) => c !== className)
      : [...current, className];
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/folders/${folderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: folder.name,
          is_assigned_to_all: folder.is_assigned_to_all,
          assignee_ids: folder.assignee_ids,
          assigned_classes: newClasses,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolders((prev) => prev.map((f: any) => f.id === folderId ? updated : f));
      }
    } catch (e) { console.error(e); }
  };

  const handleRenameFolder = async (folderId: number, newName: string) => {
    if (!newName.trim()) return;
    const folder = folders.find((f: any) => f.id === folderId);
    if (!folder || folder.name === newName) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/folders/${folderId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          is_assigned_to_all: folder.is_assigned_to_all,
          assignee_ids: folder.assignee_ids,
          assigned_classes: folder.assigned_classes,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFolders((prev) => prev.map((f: any) => f.id === folderId ? updated : f));
      } else {
         const d = await res.json();
         alert(d.detail || "Lỗi đổi tên");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteFolder = async (folderId: number) => {
    if (!confirm("Xoá folder này? (Các bài tập bên trong sẽ KHÔNG bị xoá, chỉ gỡ liên kết folder)")) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/folders/${folderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchSubmissions();
    } catch (e) { console.error(e); }
  };

  const handleMoveToFolder = async (assignmentId: number, folderId: number | null) => {
    try {
      const token = localStorage.getItem("minda_token");
      await fetch(`${API}/api/folders/move-assignment/${assignmentId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: folderId }),
      });
      fetchSubmissions();
    } catch (e) { console.error(e); }
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleFolder = (folderId: number) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  };

  const handleViewSubmission = async (attempt: any) => {
    setViewingSubmission(attempt);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/assignments/${attempt.assignment_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setViewingQuizData(data.quiz_data);
      }
    } catch (e) { console.error(e); }
  };

  // Nhóm bài tập theo folder
  const folderedAssignments = folders.map((f: any) => ({
    ...f,
    items: assignments.filter((a: any) => a.folder_id === f.id),
  }));
  const unfolderedAssignments = assignments.filter((a: any) => !a.folder_id);

  const renderAssignmentRow = (item: any) => (
    <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border-card hover:bg-bg-hover transition-colors text-sm group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{item.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded text-text-muted border border-white/5">
            {item.assignment_type === "quiz" ? "Trắc nghiệm" : "Tự luận"}
          </span>
          <span className="text-[10px] text-text-muted">{new Date(item.created_at).toLocaleDateString("vi-VN")}</span>
          {item.is_assigned_to_all === false ? (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 font-bold">Riêng: {(item.assignee_ids || []).length} HS</span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded border border-white/10">Giao Chung</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <select
          value={item.folder_id || ""}
          onChange={(e) => handleMoveToFolder(item.id, e.target.value ? parseInt(e.target.value) : null)}
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] bg-white/5 border border-white/10 rounded px-1 py-0.5 text-text-secondary outline-none max-w-[100px] hidden md:block"
          title="Di chuyển vào Folder"
        >
          <option value="">📄 Không folder</option>
          {folders.map((f: any) => (
            <option key={f.id} value={f.id}>📁 {f.name}</option>
          ))}
        </select>
        <button onClick={() => { setEditAssignment(item); setShowCreateModal(true); }} className="p-2 md:p-1 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Sửa Đề">
          <PenLine className="w-4 h-4 md:w-3.5 md:h-3.5"/>
        </button>
        <button onClick={() => handleDeleteAssignment(item.id)} className="p-2 md:p-1 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Xóa Đề">
          <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5"/>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-main text-text-primary p-6 md:p-8 font-outfit selection:bg-pink-500/30">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-border-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <ClipboardCheck className="w-6 h-6 text-text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Quản lý Đề &amp; Chấm điểm</h1>
            <p className="text-text-secondary text-sm">Giao bài tập về nhà, luyện thi và chấm điểm cho học viên</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewFolder(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" /> Tạo Folder
          </button>
          <button
            onClick={() => { setEditAssignment(null); setShowCreateModal(true); }}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            Giao Bài tập Mới
          </button>
        </div>
      </header>

      {/* Create Folder Inline */}
      {showNewFolder && (
        <div className="mb-6 flex items-center gap-3 bg-bg-card border border-indigo-500/30 p-4 rounded-2xl animate-in slide-in-from-top-2">
          <span className="text-lg">📁</span>
          <input
            type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Tên folder mới (VD: Đề 8+ Lớp 12)..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-text-primary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <button onClick={handleCreateFolder} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-colors">Tạo</button>
          <button onClick={() => setShowNewFolder(false)} className="p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-bg-hover border border-border-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-1">Đã Tạo</p>
            <p className="text-3xl font-bold text-text-primary">{assignments.length} Đề</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <FileText className="text-blue-400 w-6 h-6" />
          </div>
        </div>
        <div className="bg-bg-hover border border-border-card p-6 rounded-3xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-500/5 blur-xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-text-secondary text-sm font-medium mb-1">Cần chấm điểm</p>
            <p className="text-3xl font-bold text-text-primary">{submissions.filter((s) => s.status === "pending").length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 relative z-10">
            <Clock className="text-orange-400 w-6 h-6" />
          </div>
        </div>
        <div className="bg-bg-hover border border-border-card p-6 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-sm font-medium mb-1">Đã chấm xong</p>
            <p className="text-3xl font-bold text-text-primary">{submissions.filter((s) => s.status !== "pending").length}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <Trophy className="text-green-400 w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Assignment list - TREE VIEW */}
        <div className="lg:col-span-2 bg-bg-card rounded-3xl border border-border-card overflow-hidden flex flex-col max-h-[650px]">
          <div className="p-6 border-b border-border-card shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Kho Bài Tập
            </h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center p-8 text-text-muted">Đang tải...</div>
            ) : (
              <>
                {/* Folders */}
                {folderedAssignments.map((folder: any) => (
                  <div key={`folder-${folder.id}`} className="border-b border-border-card">
                    <div
                      className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-bg-hover transition-colors"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                      )}
                      <span className="text-base">📁</span>
                      <div className="flex-1 min-w-0">
                        {editingFolderId === folder.id ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingFolderName}
                              onChange={(e) => setEditingFolderName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleRenameFolder(folder.id, editingFolderName);
                                  setEditingFolderId(null);
                                } else if (e.key === "Escape") {
                                  setEditingFolderId(null);
                                }
                              }}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 text-text-primary w-full max-w-[200px]"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                handleRenameFolder(folder.id, editingFolderName);
                                setEditingFolderId(null);
                              }}
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs"
                            >
                              Lưu
                            </button>
                            <button onClick={() => setEditingFolderId(null)} className="p-1 hover:bg-white/10 rounded">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-sm text-text-primary truncate block">{folder.name}</span>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {(folder.assigned_classes || []).length > 0 ? (
                            (folder.assigned_classes || []).map((c: string) => (
                              <span key={c} className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold">
                                🎓 {c}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-text-muted">Giao cho tất cả</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-bold shrink-0">
                        {folder.items.length} đề
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingFolderClasses(editingFolderClasses === folder.id ? null : folder.id); }}
                        className="p-1 text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Giao cho lớp"
                      >
                        🎓
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="p-1 text-orange-400/50 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors"
                        title="Đổi tên"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                        className="p-1 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Xoá Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Class assignment dropdown */}
                    {editingFolderClasses === folder.id && (
                      <div className="px-4 py-3 bg-emerald-500/5 border-t border-emerald-500/10">
                        <p className="text-xs font-bold text-emerald-400 mb-2">🎓 Giao folder này cho lớp:</p>
                        <div className="flex flex-wrap gap-2">
                          {myClasses.length === 0 ? (
                            <p className="text-xs text-text-muted italic">Chưa tạo lớp nào. Vào Quản lý Học sinh để tạo lớp trước!</p>
                          ) : (
                            myClasses.map((c) => {
                              const isActive = (folder.assigned_classes || []).includes(c);
                              return (
                                <button
                                  key={c}
                                  onClick={(e) => { e.stopPropagation(); handleToggleFolderClass(folder.id, c); }}
                                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all border ${isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-text-muted border-white/10 hover:border-emerald-500/20'}`}
                                >
                                  {isActive ? '✅' : '⬜'} {c}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                    {expandedFolders.has(folder.id) && (
                      <div className="pl-6 bg-white/[0.01]">
                        {folder.items.length === 0 ? (
                          <p className="text-xs text-text-muted px-4 py-3 italic">Folder trống</p>
                        ) : (
                          folder.items.map((item: any) => renderAssignmentRow(item))
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Unfoldered assignments */}
                {unfolderedAssignments.length > 0 && (
                  <div className="border-b border-border-card">
                    <div className="px-4 py-2 bg-white/[0.02]">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider">📄 Bài tập lẻ (chưa phân folder)</p>
                    </div>
                    {unfolderedAssignments.map((item: any) => renderAssignmentRow(item))}
                  </div>
                )}

                {assignments.length === 0 && folders.length === 0 && (
                  <div className="text-center p-8 text-text-muted">Sếp chưa giao bài tập nào!</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submissions grouped by ASSIGNMENT */}
        <div className="lg:col-span-3 bg-bg-card rounded-3xl border border-border-card overflow-hidden flex flex-col max-h-[650px]">
          <div className="flex items-center justify-between p-6 border-b border-border-card shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" /> Kết quả theo Đề
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm đề hoặc HS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-border-card rounded-lg text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center p-8 text-text-muted">Đang tải...</div>
            ) : (() => {
              const assignmentGroups = groupByAssignment(submissions).filter(
                (g) =>
                  !search ||
                  g.assignment_title.toLowerCase().includes(search.toLowerCase()) ||
                  g.students.some((s) => s.student_name.toLowerCase().includes(search.toLowerCase()))
              );

              if (assignmentGroups.length === 0) {
                return <div className="text-center p-8 text-text-muted">Chưa có học sinh nào nộp bài.</div>;
              }

              return assignmentGroups.map((ag) => {
                const isOpen = expandedAssignmentIds.has(ag.assignment_id);
                const avgScore = ag.students.length > 0
                  ? (ag.students.reduce((sum, s) => sum + (s.best_score ?? 0), 0) / ag.students.length).toFixed(1)
                  : "0";

                return (
                  <div key={ag.assignment_id} className="border-b border-border-card last:border-0">
                    {/* Assignment header */}
                    <div
                      className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-bg-hover transition-colors"
                      onClick={() => {
                        setExpandedAssignmentIds((prev) => {
                          const next = new Set(prev);
                          next.has(ag.assignment_id) ? next.delete(ag.assignment_id) : next.add(ag.assignment_id);
                          return next;
                        });
                      }}
                    >
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-orange-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-orange-400 shrink-0" />
                      )}
                      <FileText className="w-5 h-5 text-orange-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-text-primary truncate">{ag.assignment_title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[10px] text-text-muted">
                            👤 {ag.students.length} HS đã nộp
                          </span>
                          <span className="text-[10px] text-text-muted">
                            📊 TB: {avgScore}/{ag.max_score}đ
                          </span>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 font-bold shrink-0">
                        {ag.students.length} bài
                      </span>
                    </div>

                    {/* Student list for this assignment */}
                    {isOpen && (
                      <div className="border-t border-border-card bg-white/[0.01]">
                        {ag.students.map((st, idx) => {
                          const studentKey = `${ag.assignment_id}_${st.student_id}`;
                          const isStudentOpen = expandedKeys.has(studentKey);
                          
                          return (
                            <div key={st.student_id} className="border-b border-border-card last:border-0">
                              <div
                                className="flex items-center gap-3 px-6 py-3 hover:bg-bg-hover transition-colors cursor-pointer"
                                onClick={() => {
                                  if (st.attempt_count > 1) {
                                    toggleExpand(studentKey);
                                  } else {
                                    handleViewSubmission(st.attempts[0]);
                                  }
                                }}
                              >
                                <span className="text-xs font-bold w-5 text-center text-text-muted">
                                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                                  {st.student_avatar ? (
                                    <img src={st.student_avatar} alt={st.student_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <User className="w-4 h-4 text-text-secondary" />
                                  )}
                                </div>
                                <p className="font-semibold text-sm text-text-primary flex-1 truncate">{st.student_name}</p>
                                <ScoreBadge score={st.best_score} max={ag.max_score} />
                                {st.attempt_count > 1 ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                                    {st.attempt_count} lần
                                  </span>
                                ) : (
                                  <button onClick={(e) => { e.stopPropagation(); handleViewSubmission(st.attempts[0]); }} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                                    <Eye className="w-3.5 h-3.5" /> Xem
                                  </button>
                                )}
                              </div>
                              {/* Expanded attempts */}
                              {isStudentOpen && st.attempt_count > 1 && (
                                <div className="bg-white/[0.02] border-t border-border-card">
                                  {st.attempts.map((att: any, aIdx: number) => (
                                    <div
                                      key={att.id}
                                      className="flex items-center gap-3 px-8 py-2 hover:bg-bg-hover cursor-pointer transition-colors"
                                      onClick={() => handleViewSubmission(att)}
                                    >
                                      <span className={`text-xs font-bold w-5 text-center ${aIdx === 0 ? "text-yellow-400" : "text-gray-600"}`}>
                                        {aIdx === 0 ? "🏆" : `#${aIdx + 1}`}
                                      </span>
                                      <span className="text-xs text-text-secondary flex-1">
                                        {new Date(att.submitted_at).toLocaleString("vi-VN")}
                                      </span>
                                      <ScoreBadge score={att.score} max={ag.max_score} />
                                      <Eye className="w-3.5 h-3.5 text-indigo-400 opacity-50 hover:opacity-100" />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <QuizBuilderModal
          courses={courses}
          folders={folders}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchSubmissions}
          editAssignment={editAssignment}
        />
      )}

      {/* Modal xem bài làm của học sinh */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setViewingSubmission(null); setViewingQuizData(null); }}>
          <div className="bg-bg-card rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-border-card shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-card shrink-0">
              <div>
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" />
                  Bài làm của {viewingSubmission.student_name}
                </h3>
                <p className="text-sm text-text-secondary mt-0.5">
                  {viewingSubmission.assignment_title} · Điểm: <span className="font-bold text-text-primary">{viewingSubmission.score ?? 'Chưa chấm'}/{viewingSubmission.max_score ?? 10}đ</span>
                  · {new Date(viewingSubmission.submitted_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <button onClick={() => { setViewingSubmission(null); setViewingQuizData(null); }} className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center hover:bg-red-500/20 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5">
              {!viewingQuizData ? (
                <div className="text-center py-10 text-text-muted">Đang tải đề bài...</div>
              ) : (() => {
                const answers = viewingSubmission.quiz_answers || {};
                const sections = viewingQuizData.sections || [];
                let qCount = 0;
                return sections.map((section: any, sIdx: number) => (
                  <div key={sIdx} className="mb-6">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">
                      {section.type === 'mcq' ? '📝 Trắc nghiệm' : section.type === 'true_false' ? '✅ Đúng/Sai' : '✍️ Tự luận ngắn'}
                    </h4>
                    {(section.questions || []).map((q: any, qIdx: number) => {
                      qCount++;
                      const qid = `s${sIdx}_${q.id || qIdx}`;
                      const studentAns = answers[qid];
                      const correctAns = q.correctAnswer;
                      const normalize = (s: string) => String(s || '').trim().toLowerCase().replace(/,/g, '.');
                      const isCorrect = section.type === 'mcq'
                        ? String(studentAns || '').trim() === String(correctAns || '').trim()
                        : section.type === 'short_answer'
                        ? normalize(studentAns) === normalize(correctAns)
                        : null;

                      return (
                        <div key={qid} className={`mb-3 p-4 rounded-xl border ${isCorrect === true ? 'border-green-500/30 bg-green-500/5' : isCorrect === false ? 'border-red-500/30 bg-red-500/5' : 'border-border-card bg-bg-hover'}`}>
                          <p className="font-medium text-sm mb-2">
                            <span className="text-text-muted mr-1">Câu {qCount}.</span>
                            {q.question || q.content}
                          </p>

                          {section.type === 'mcq' && (() => {
                            // Convert numeric index (0,1,2,3) to letter (A,B,C,D) if needed
                            const toLabel = (v: any) => {
                              if (v === null || v === undefined || v === '') return '';
                              const n = Number(v);
                              if (!isNaN(n) && n >= 0 && n <= 25) return String.fromCharCode(65 + n);
                              return String(v).trim().toUpperCase();
                            };
                            const studentLabel = toLabel(studentAns);
                            const correctLabel = toLabel(correctAns);
                            return (
                            <div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2">
                                {(q.options || []).map((opt: string, oIdx: number) => {
                                  const optLabel = String.fromCharCode(65 + oIdx);
                                  const isStudentChoice = studentLabel === optLabel;
                                  const isCorrectChoice = correctLabel === optLabel;
                                  return (
                                    <div key={oIdx} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                                      isStudentChoice && isCorrectChoice ? 'bg-green-500/20 text-green-600 dark:text-green-400 font-bold border-2 border-green-500/50 ring-2 ring-green-500/20'
                                      : isCorrectChoice ? 'bg-green-500/15 text-green-600 dark:text-green-400 font-bold border border-green-500/30'
                                      : isStudentChoice ? 'bg-red-500/15 text-red-600 dark:text-red-400 font-bold border-2 border-red-500/50 ring-2 ring-red-500/20'
                                      : 'bg-bg-hover text-t-secondary border border-transparent'
                                    }`}>
                                      <span className="font-bold shrink-0">{optLabel}.</span>
                                      <span className="flex-1">{opt}</span>
                                      {isStudentChoice && isCorrectChoice && <span className="ml-auto text-green-500 font-bold shrink-0">✓ HS chọn</span>}
                                      {isCorrectChoice && !isStudentChoice && <span className="ml-auto text-green-500 shrink-0">✓ Đáp án</span>}
                                      {isStudentChoice && !isCorrectChoice && <span className="ml-auto text-red-500 shrink-0">✗ HS chọn</span>}
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Summary */}
                              <div className="flex items-center gap-3 text-xs mt-1 px-1">
                                <span className="text-t-secondary">HS chọn: <span className={`font-bold ${studentLabel === correctLabel ? 'text-green-500' : 'text-red-500'}`}>{studentLabel || '(bỏ trống)'}</span></span>
                                <span className="text-t-secondary">|</span>
                                <span className="text-t-secondary">Đáp án: <span className="font-bold text-green-500">{correctLabel}</span></span>
                                {studentLabel === correctLabel ? <span className="text-green-500 font-bold">✓ Đúng</span> : <span className="text-red-500 font-bold">✗ Sai</span>}
                              </div>
                            </div>
                            );
                          })()}

                          {section.type === 'true_false' && (
                            <div className="space-y-1 mb-2">
                              {(q.items || []).map((item: any) => {
                                const tfAnswer = studentAns && typeof studentAns === 'object' ? studentAns[item.label] : undefined;
                                const correctTF = item.isTrue;
                                const isRight = tfAnswer !== undefined && (String(tfAnswer).toLowerCase() === 'true') === Boolean(correctTF);
                                return (
                                  <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${isRight ? 'bg-green-500/10 text-green-400' : tfAnswer !== undefined ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-text-secondary'}`}>
                                    <span className="font-bold">{item.label}.</span>
                                    <span className="flex-1">{item.content}</span>
                                    <span>HS: {tfAnswer !== undefined ? (String(tfAnswer).toLowerCase() === 'true' ? 'Đ' : 'S') : '—'}</span>
                                    <span>| ĐA: {correctTF ? 'Đ' : 'S'}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {section.type === 'short_answer' && (
                            <div className="flex gap-4 text-xs">
                              <span className="text-text-secondary">HS trả lời: <span className={`font-bold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>{studentAns || '(bỏ trống)'}</span></span>
                              <span className="text-text-secondary">Đáp án: <span className="font-bold text-green-400">{correctAns}</span></span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
