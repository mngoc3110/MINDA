"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Search, Clock, FileText, User, ChevronDown, ChevronRight, Trophy, PenLine, Trash2 } from "lucide-react";
import QuizBuilderModal from "./QuizBuilderModal";

interface SubmissionGroup {
  student_id: number;
  student_name: string;
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

export default function AssignmentsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState<any>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const [submissionsRes, assignmentsRes, coursesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/teacher/dashboard/submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/teacher/dashboard/assignments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
      if (coursesRes.ok) setCourses(await coursesRes.json());
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
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${id}`, {
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

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Tất cả role được truy cập, backend sẽ phân quyền theo role

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
        <button
          onClick={() => { setEditAssignment(null); setShowCreateModal(true); }}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
        >
          Giao Bài tập Mới
        </button>
      </header>

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
        {/* Assignment list */}
        <div className="lg:col-span-2 bg-bg-card rounded-3xl border border-border-card overflow-hidden flex flex-col max-h-[600px]">
          <div className="p-6 border-b border-border-card shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Kho Bài Tập Đã Giao
            </h2>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-bg-card z-10">
                <tr className="border-b border-border-card text-sm text-text-secondary">
                  <th className="p-4 pl-6 font-medium">Tên Bài tập</th>
                  <th className="p-4 font-medium">Loại</th>
                  <th className="p-4 font-medium">Ngày tạo</th>
                  <th className="p-4 font-medium">Phân loại</th>
                  <th className="p-4 pr-6 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={4} className="text-center p-8 text-text-muted">Đang tải...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={4} className="text-center p-8 text-text-muted">Sếp chưa giao bài tập nào!</td></tr>
                ) : assignments.map((item) => (
                  <tr key={item.id} className="border-b border-border-card hover:bg-bg-hover transition-colors">
                    <td className="p-4 pl-6 font-medium text-text-primary">{item.title}</td>
                    <td className="p-4 text-text-secondary">{item.assignment_type === "quiz" ? "Trắc nghiệm" : "Tự luận"}</td>
                    <td className="p-4 text-text-secondary">{new Date(item.created_at).toLocaleDateString("vi-VN")}</td>
                    <td className="p-4">
                      {item.course_id ? (
                        <span className="text-xs px-2 py-1 bg-white/5 rounded text-text-secondary border border-border-card">Khoá học</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 rounded border border-orange-500/20">Làm thêm tự do</span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-2">
                       <button onClick={() => { setEditAssignment(item); setShowCreateModal(true); }} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Sửa Đề">
                          <PenLine className="w-4 h-4"/>
                       </button>
                       <button onClick={() => handleDeleteAssignment(item.id)} className="p-1.5 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors" title="Xóa Đề (Kèm Điểm)">
                          <Trash2 className="w-4 h-4"/>
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submissions grouped */}
        <div className="lg:col-span-3 bg-bg-card rounded-3xl border border-border-card overflow-hidden flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between p-6 border-b border-border-card shrink-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-400" /> Kết quả học sinh
              <span className="text-xs font-normal text-text-muted ml-1">— điểm cao nhất</span>
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Tìm học sinh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-border-card rounded-lg text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="text-center p-8 text-text-muted">Đang tải...</div>
            ) : grouped.length === 0 ? (
              <div className="text-center p-8 text-text-muted">Chưa có học sinh nào nộp bài.</div>
            ) : grouped.map((g) => {
              const key = `${g.student_id}_${g.assignment_id}`;
              const isOpen = expandedKeys.has(key);
              const canExpand = g.attempt_count > 1;

              return (
                <div key={key} className="border-b border-border-card last:border-0">
                  {/* Summary row */}
                  <div
                    className={`flex items-center gap-3 p-4 pl-6 pr-5 transition-colors ${canExpand ? "cursor-pointer hover:bg-bg-hover" : ""}`}
                    onClick={() => canExpand && toggleExpand(key)}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{g.student_name}</p>
                      <p className="text-xs text-text-muted truncate">{g.assignment_title}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <ScoreBadge score={g.best_score} max={g.max_score} />
                      {canExpand ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                            {g.attempt_count} lần
                          </span>
                          {isOpen
                            ? <ChevronDown className="w-4 h-4 text-text-secondary" />
                            : <ChevronRight className="w-4 h-4 text-text-secondary" />}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">1 lần</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded attempts list */}
                  {isOpen && (
                    <div className="bg-white/1.5 border-t border-border-card">
                      <p className="text-xs text-text-muted font-bold uppercase tracking-wider px-6 pt-3 pb-1">
                        Lịch sử {g.attempt_count} lần làm
                      </p>
                      {g.attempts.map((att, idx) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-3 px-6 py-2.5 border-b border-border-card last:border-0 last:pb-3"
                        >
                          <span className={`text-xs font-bold w-5 text-center ${idx === 0 ? "text-yellow-400" : "text-gray-600"}`}>
                            {idx === 0 ? "🏆" : `#${idx + 1}`}
                          </span>
                          <span className="text-xs text-text-secondary flex-1">
                            {new Date(att.submitted_at).toLocaleString("vi-VN")}
                          </span>
                          <ScoreBadge score={att.score} max={g.max_score} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <QuizBuilderModal
          courses={courses}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchSubmissions}
        />
      )}
    </div>
  );
}
