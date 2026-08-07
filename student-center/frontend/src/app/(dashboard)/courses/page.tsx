"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Loader2, Plus, X, Pencil, Search,
  GraduationCap, CheckCircle2, ChevronRight, Users, ArrowLeft
} from "lucide-react";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  teacher_id: number;
  teacher_name?: string;
  price: number;
}

interface Enrollment {
  course_id: number;
  status: string;
  enrolled_at: string;
}

interface Teacher {
  id: number;
  full_name: string;
  avatar_url: string | null;
  email: string;
  subject: string;      // legacy single
  subjects: string[];   // new multi-subject array
}

// Danh sách môn học chuẩn chương trình THPT
const SUBJECTS = [
  { id: "all",                    label: "Tất cả",                emoji: "📚" },
  { id: "Toán",                   label: "Toán",                  emoji: "🔢" },
  { id: "Vật Lý",                 label: "Vật Lý",                emoji: "⚡" },
  { id: "Hóa Học",                label: "Hóa Học",               emoji: "🧪" },
  { id: "Sinh Học",               label: "Sinh Học",              emoji: "🌱" },
  { id: "Tiếng Anh",              label: "Tiếng Anh",             emoji: "🇬🇧" },
  { id: "Tin Học",                label: "Tin Học",               emoji: "💻" },
  { id: "Ngữ Văn",                label: "Ngữ Văn",               emoji: "📖" },
  { id: "Lịch Sử",                label: "Lịch Sử",               emoji: "🏛️" },
  { id: "Địa Lý",                 label: "Địa Lý",                emoji: "🌍" },
  { id: "Kinh Tế & Pháp Luật",   label: "Kinh Tế & Pháp Luật",  emoji: "⚖️" },
  { id: "Khác",                   label: "Khác",                  emoji: "✨" },
];

// ─── COURSE CARD ─────────────────────────────────────────────
function CourseCard({
  course, isEnrolled, isOwner, enrolling, onEnroll, onClick, onEdit, userRole
}: {
  course: Course;
  isEnrolled: boolean;
  isOwner: boolean;
  enrolling: boolean;
  onEnroll: () => void;
  onClick: () => void;
  onEdit: () => void;
  userRole: string;
}) {
  return (
    <div
      className="group flex flex-col bg-bg-card border border-border-card rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="w-full h-36 bg-bg-hover relative overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-400/40" />
          </div>
        )}
        {isEnrolled && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-sm text-white text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" /> Đã học
          </div>
        )}
      </div>
      <div className="flex flex-col flex-1 p-4 gap-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{course.title}</h3>
        {course.teacher_name && <p className="text-text-muted text-xs">{course.teacher_name}</p>}
        {course.description && <p className="text-text-secondary text-xs line-clamp-2 mt-0.5">{course.description}</p>}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-400">
            {course.price === 0 ? "Miễn phí" : `${course.price.toLocaleString("vi-VN")}đ`}
          </span>
          {isOwner ? (
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-bg-hover hover:bg-border-card border border-border-card transition-colors"
            >
              <Pencil className="w-3 h-3" /> Chỉnh sửa
            </button>
          ) : isEnrolled ? (
            <button
              onClick={e => { e.stopPropagation(); onClick(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
            >
              Vào học <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            userRole === "student" && (
              <button
                disabled={enrolling}
                onClick={e => { e.stopPropagation(); onEnroll(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-60"
              >
                {enrolling ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ghi danh"}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CREATE COURSE MODAL ────────────────────────────────────
function CreateCourseModal({ formData, setFormData, formLoading, onSubmit, onClose }: {
  formData: { title: string; description: string; price: number };
  setFormData: (d: any) => void;
  formLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border-card">
          <h2 className="font-bold text-lg">Tạo Khoá Học Mới</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Tên khoá học</label>
            <input
              required type="text" value={formData.title}
              onChange={e => setFormData((p: any) => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-main border border-border-card text-text-primary text-sm focus:outline-none focus:border-indigo-500/50"
              placeholder="VD: Toán 12 – Luyện thi THPT"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Mô tả</label>
            <textarea
              rows={3} value={formData.description}
              onChange={e => setFormData((p: any) => ({ ...p, description: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-main border border-border-card text-text-primary text-sm resize-none focus:outline-none focus:border-indigo-500/50"
              placeholder="Mô tả ngắn về khoá học..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-secondary">Học phí (VND)</label>
            <input
              type="number" min={0} value={formData.price}
              onChange={e => setFormData((p: any) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
              className="w-full px-4 py-2.5 rounded-xl bg-bg-main border border-border-card text-text-primary text-sm focus:outline-none focus:border-indigo-500/50"
              placeholder="0 = Miễn phí"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border-card text-sm text-text-secondary hover:bg-bg-hover transition-colors">
              Huỷ
            </button>
            <button
              type="submit" disabled={formLoading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo khoá học"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<number, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("student");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", price: 0 });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.role) setUserRole(payload.role);
          if (payload.sub) setCurrentUserId(parseInt(payload.sub));
        } catch (e) {}
      }
      const roleCache = localStorage.getItem("minda_role");
      if (roleCache) setUserRole(roleCache);

      const headers = { "Authorization": `Bearer ${token}` };
      const [coursesRes, enrollmentsRes, teachersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/my-enrollments`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/teachers`, { headers })
      ]);
      if (coursesRes.ok) setCourses(await coursesRes.json());
      if (enrollmentsRes.ok) setEnrollments(await enrollmentsRes.json());
      if (teachersRes.ok) setTeachers(await teachersRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const minda_role = localStorage.getItem("minda_role") || "student";
    setUserRole(minda_role);
    fetchData();
  }, []);

  const handleEnroll = async (courseId: number) => {
    setEnrollingMap(prev => ({ ...prev, [courseId]: true }));
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        alert(typeof error.detail === "string" ? error.detail : "Ghi danh thất bại");
      }
    } catch (err) {
      alert("Lỗi kết nối");
    } finally {
      setEnrollingMap(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        await fetchData();
        setShowCreateModal(false);
        setFormData({ title: "", description: "", price: 0 });
      } else {
        alert("Lỗi khi tạo khoá học.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const myEnrolledIds = enrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myEnrolledIds.includes(c.id));

  // Helper: get subjects for a teacher (supports both legacy string and new array)
  const getSubjects = (t: Teacher): string[] =>
    t.subjects?.length ? t.subjects : (t.subject ? [t.subject] : []);

  const filteredTeachers = selectedSubject === "all"
    ? teachers
    : teachers.filter(t => getSubjects(t).includes(selectedSubject));
  const teacherCourses = selectedTeacher
    ? courses.filter(c => c.teacher_id === selectedTeacher.id)
    : [];

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-main">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // ─── TEACHER / ADMIN VIEW ─────────────────────────────────
  if (userRole === "teacher" || userRole === "admin") {
    const myCourseList = courses.filter(c => c.teacher_id === currentUserId);
    return (
      <div className="min-h-[calc(100vh-60px)] bg-bg-main text-text-primary p-6 md:p-10 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Khoá học của tôi</h1>
            <p className="text-text-secondary text-sm mt-1">Quản lý các khoá học bạn đang giảng dạy</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_0_16px_rgba(79,70,229,0.3)]"
          >
            <Plus className="w-4 h-4" /> Tạo khoá học
          </button>
        </header>
        {myCourseList.length === 0 ? (
          <div className="text-center py-20 text-text-secondary bg-bg-card rounded-2xl border border-dashed border-border-card">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Bạn chưa tạo khoá học nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myCourseList.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={myEnrolledIds.includes(course.id)}
                isOwner={course.teacher_id === currentUserId}
                enrolling={enrollingMap[course.id]}
                onEnroll={() => handleEnroll(course.id)}
                onClick={() => router.push(`/courses/${course.id}`)}
                onEdit={() => router.push(`/courses/${course.id}/edit`)}
                userRole={userRole}
              />
            ))}
          </div>
        )}
        {showCreateModal && (
          <CreateCourseModal
            formData={formData}
            setFormData={setFormData}
            formLoading={formLoading}
            onSubmit={handleCreateCourse}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    );
  }

  // ─── STUDENT VIEW ─────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-text-primary p-5 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Khám phá Khoá học</h1>
          <p className="text-text-secondary text-sm mt-1">Chọn môn học → Chọn giáo viên → Bắt đầu học</p>
        </div>
        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm khoá học..."
            className="pl-9 pr-4 py-2 rounded-xl bg-bg-card border border-border-card text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-indigo-500/50 w-48"
          />
        </div>
      </div>

      {/* My enrolled courses */}
      {myCourses.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Khoá học của tôi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.filter(c =>
              searchQuery === "" || c.title.toLowerCase().includes(searchQuery.toLowerCase())
            ).map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={true}
                isOwner={false}
                enrolling={false}
                onEnroll={() => {}}
                onClick={() => router.push(`/courses/${course.id}`)}
                onEdit={() => {}}
                userRole={userRole}
              />
            ))}
          </div>
        </section>
      )}

      {/* Step 1: Subject picker */}
      <section>
        <h2 className="text-base font-semibold text-text-secondary mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          {selectedTeacher ? (
            <button className="hover:text-text-primary flex items-center gap-1" onClick={() => setSelectedTeacher(null)}>
              <ArrowLeft className="w-3.5 h-3.5" /> Chọn lại môn học
            </button>
          ) : "Bước 1 — Chọn môn học"}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map(sub => (
            <button
              key={sub.id}
              onClick={() => { setSelectedSubject(sub.id); setSelectedTeacher(null); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                selectedSubject === sub.id
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.35)]"
                  : "bg-bg-card border-border-card text-text-secondary hover:border-indigo-500/40 hover:text-text-primary"
              }`}
            >
              <span>{sub.emoji}</span> {sub.label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Teacher picker */}
      {!selectedTeacher && (
        <section>
          <h2 className="text-base font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            Bước 2 — Chọn giáo viên
            <span className="ml-1 text-xs text-text-muted font-normal">({filteredTeachers.length} giáo viên)</span>
          </h2>
          {filteredTeachers.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm bg-bg-card rounded-2xl border border-border-card">
              Chưa có giáo viên nào cho môn này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTeachers.map(teacher => (
                <button
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="group flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-border-card hover:border-indigo-500/40 hover:bg-bg-hover text-left transition-all duration-200"
                >
                  <div className="relative shrink-0">
                    {teacher.avatar_url ? (
                      <img src={teacher.avatar_url} alt={teacher.full_name} className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-indigo-500/20">
                        <GraduationCap className="w-5 h-5 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-text-primary truncate">{teacher.full_name}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {getSubjects(teacher).map(s => (
                        <span key={s} className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">{s}</span>
                      ))}
                    </div>
                    <p className="text-text-muted text-xs truncate mt-0.5">{teacher.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted ml-auto shrink-0 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Courses for selected teacher */}
      {selectedTeacher && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setSelectedTeacher(null)}
              className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Giáo viên khác
            </button>
            <div className="h-4 w-px bg-border-card" />
            <div className="flex items-center gap-2">
              {selectedTeacher.avatar_url ? (
                <img src={selectedTeacher.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              )}
              <span className="text-sm font-semibold">{selectedTeacher.full_name}</span>
              <div className="flex flex-wrap gap-1">
                {(selectedTeacher.subjects?.length ? selectedTeacher.subjects : (selectedTeacher.subject ? [selectedTeacher.subject] : [])).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <h2 className="text-base font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Bước 3 — Chọn khoá học
            <span className="ml-1 text-xs text-text-muted font-normal">({teacherCourses.length} khoá học)</span>
          </h2>
          {teacherCourses.length === 0 ? (
            <div className="py-10 text-center text-text-muted text-sm bg-bg-card rounded-2xl border border-border-card">
              Giáo viên chưa có khoá học nào.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherCourses.filter(c =>
                searchQuery === "" || c.title.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isEnrolled={myEnrolledIds.includes(course.id)}
                  isOwner={false}
                  enrolling={enrollingMap[course.id]}
                  onEnroll={() => handleEnroll(course.id)}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  onEdit={() => {}}
                  userRole={userRole}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
