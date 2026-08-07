"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, User as UserIcon, PlayCircle, Loader2, Plus, X, Pencil,
  Search, Sparkles, GraduationCap, CheckCircle2, ChevronRight, Star,
  Filter, Layers, Award, Code, Compass, Zap, Users
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

const SUBJECT_CATEGORIES = [
  { id: "all", label: "Tất Cả Môn", icon: Layers, color: "from-indigo-500 to-purple-600", border: "border-indigo-500/30" },
  { id: "coding", label: "Lập Trình & AI", icon: Code, color: "from-pink-500 to-rose-600", border: "border-pink-500/30" },
  { id: "math", label: "Toán Học", icon: Compass, color: "from-blue-500 to-cyan-600", border: "border-blue-500/30" },
  { id: "physics", label: "Vật Lý & STEM", icon: Zap, color: "from-amber-500 to-orange-600", border: "border-amber-500/30" },
  { id: "other", label: "Môn Học Khác", icon: GraduationCap, color: "from-emerald-500 to-teal-600", border: "border-emerald-500/30" },
];

function getCourseCategory(title: string, desc: string = ""): string {
  const text = (title + " " + desc).toLowerCase();
  if (text.includes("code") || text.includes("lập trình") || text.includes("python") || text.includes("ai") || text.includes("robot") || text.includes("web") || text.includes("scratch")) {
    return "coding";
  }
  if (text.includes("toán") || text.includes("math") || text.includes("hình") || text.includes("đại")) {
    return "math";
  }
  if (text.includes("lý") || text.includes("vật lý") || text.includes("physics") || text.includes("stem")) {
    return "physics";
  }
  return "other";
}

export default function CoursesDiscoveryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<number, boolean>>({});
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("student");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", price: 0 });
  const [offlineTeachers, setOfflineTeachers] = useState<any[]>([]);
  const [connectingTeacher, setConnectingTeacher] = useState<any | null>(null);
  const router = useRouter();

  const fetchOfflineTeachers = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/my-offline-teachers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOfflineTeachers(await res.json());
    } catch (e) {
      console.error("Error fetching offline teachers:", e);
    }
  };

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
    const token = localStorage.getItem("minda_token");
    setUserRole(minda_role);
    if (minda_role === "student" && token) {
      fetchOfflineTeachers(token);
    }
    fetchData();
  }, []);

  const handleTeacherClick = (teacher: any) => {
    if (userRole === 'teacher' || userRole === 'admin') return;
    const isOffline = offlineTeachers.some(t => t.id === teacher.id);
    if (!isOffline) {
      setConnectingTeacher(teacher);
    } else {
      setSelectedTeacher(selectedTeacher === teacher.id.toString() ? "all" : teacher.id.toString());
    }
  };

  const confirmConnectTeacher = async () => {
    if (!connectingTeacher) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/connect-teacher/${connectingTeacher.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Kết nối lớp Offline thành công!");
        await fetchOfflineTeachers(token!);
        setSelectedTeacher(connectingTeacher.id.toString());
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Lỗi kết nối giáo viên");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConnectingTeacher(null);
    }
  };

  const handleEnroll = async (courseId: number) => {
    setEnrollingMap(prev => ({ ...prev, [courseId]: true }));
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        let errorMsg = "Ghi danh thất bại";
        if (typeof error.detail === 'string') {
          errorMsg = error.detail;
        } else if (Array.isArray(error.detail)) {
          errorMsg = "Lỗi dữ liệu: " + (error.detail[0]?.msg || "");
        }
        alert(errorMsg);
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

  // Enrolled courses
  const myEnrolledIds = enrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myEnrolledIds.includes(c.id));
  const availableCourses = courses.filter(c => !myEnrolledIds.includes(c.id));

  // Filter courses by selected subject & search query
  const subjectFilteredCourses = availableCourses.filter(c => {
    const cat = getCourseCategory(c.title, c.description);
    const matchesSubject = selectedSubject === "all" || cat === selectedSubject;
    const matchesSearch = searchQuery === "" || 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.teacher_name && c.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Get unique teacher IDs that teach the selected subject
  const subjectTeacherIds = new Set(subjectFilteredCourses.map(c => c.teacher_id));
  const filteredTeachers = teachers.filter(t => selectedSubject === "all" || subjectTeacherIds.has(t.id));

  // Final displayed courses (filtered by teacher if teacher filter active)
  const finalDisplayedCourses = selectedTeacher === "all"
    ? subjectFilteredCourses
    : subjectFilteredCourses.filter(c => c.teacher_id.toString() === selectedTeacher);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-main">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-t-primary p-6 md:p-10 font-outfit space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-border-card pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-rose-500" />
            {userRole === "teacher" ? "Quản Lý Khóa Học" : "Khám Phá Môn Học & Giáo Viên"}
          </h1>
          <p className="text-t-secondary text-sm md:text-base mt-1">
            Chọn môn học yêu thích → Chọn giáo viên phù hợp → Bắt đầu lộ trình học tập hiệu quả.
          </p>
        </div>

        {userRole === "teacher" && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all shrink-0"
          >
            <Plus className="w-5 h-5"/> TẠO KHOÁ HỌC
          </button>
        )}
      </header>

      {/* GIÁO VIÊN VIEW */}
      {(userRole === "teacher" || userRole === "admin") ? (
        <section>
          <h2 className="text-2xl font-bold mb-6">Khoá học bạn đang trực tiếp giảng dạy</h2>
          {courses.filter(c => c.teacher_id === currentUserId).length === 0 ? (
            <div className="text-center py-16 text-t-secondary bg-bg-card rounded-3xl border border-dashed border-border-card">
              <p>Bạn chưa tạo khoá học nào. Hãy bấm &quot;Tạo Khoá Học&quot; để lập lớp nhé!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.filter(c => c.teacher_id === currentUserId).map(course => (
                <div key={course.id} className="bg-bg-card rounded-2xl overflow-hidden border border-indigo-500/30 shadow-lg group flex flex-col">
                  <div className="w-full h-40 bg-bg-hover relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-indigo-400/50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-indigo-500 text-white font-black px-3 py-1 rounded-full text-xs shadow-md">
                      Của Bạn
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-t-secondary text-sm line-clamp-2 mb-4">{course.description || "Chưa có mô tả."}</p>
                    <div className="mt-auto flex flex-col gap-2">
                      <button 
                        onClick={() => router.push(`/courses/${course.id}/edit`)}
                        className="w-full bg-bg-hover text-t-primary font-bold py-2.5 rounded-xl border border-border-card hover:bg-indigo-600/20 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Pencil className="w-4 h-4"/> Sửa chương trình
                      </button>
                      <button 
                        onClick={() => router.push(`/courses/${course.id}`)}
                        className="w-full bg-emerald-500/10 text-emerald-500 font-bold py-2.5 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <PlayCircle className="w-4 h-4"/> Xem với tư cách học sinh
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* HỌC SINH WORKFLOW: 1. Chọn Môn Học -> 2. Chọn Giáo Viên -> 3. Chọn Khóa Học */
        <>
          {/* ĐANG THEO HỌC (NẾU CÓ) */}
          {myCourses.length > 0 && (
            <section className="p-6 rounded-3xl bg-bg-card border border-border-card space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> Các Khóa Bạn Đang Học
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold">{myCourses.length}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {myCourses.map(course => (
                  <div key={course.id} onClick={() => router.push(`/courses/${course.id}`)}
                    className="p-4 rounded-2xl bg-bg-main border border-border-card hover:border-emerald-500/50 transition cursor-pointer flex items-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400 group-hover:scale-110 transition">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-primary truncate">{course.title}</p>
                      <p className="text-xs text-text-secondary truncate">{course.teacher_name || `GV #${course.teacher_id}`}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 🎯 BƯỚC 1: CHỌN MÔN HỌC (SUBJECT CAROUSEL / GRID) */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-500 text-white font-black text-xs flex items-center justify-center">1</span>
                  <h2 className="text-2xl font-black text-text-primary">Chọn Môn Học</h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">Bấm vào môn học bên dưới để lọc danh sách giáo viên giảng dạy môn này.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Gõ tên môn học hoặc giáo viên..."
                  className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50 shadow-sm"
                />
              </div>
            </div>

            {/* Subject Selector Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SUBJECT_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedSubject === cat.id;
                const count = availableCourses.filter(c => cat.id === "all" || getCourseCategory(c.title, c.description) === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedSubject(cat.id);
                      setSelectedTeacher("all"); // Reset teacher filter when subject changes
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-28 group ${
                      isSelected
                        ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-lg shadow-rose-500/20 scale-[1.02]`
                        : `bg-bg-card ${cat.border} hover:bg-bg-hover text-text-primary`
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`p-2 rounded-xl ${isSelected ? "bg-white/20" : "bg-bg-main"}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-rose-400"}`} />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-bg-main text-text-secondary"}`}>
                        {count} lớp
                      </span>
                    </div>

                    <div>
                      <p className={`font-black text-sm ${isSelected ? "text-white" : "text-text-primary"}`}>{cat.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 👨‍🏫 BƯỚC 2: CHỌN GIÁO VIÊN CỦA MÔN HỌC NÀY */}
          <section className="space-y-4 pt-4 border-t border-border-card">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
                  <h2 className="text-2xl font-black text-text-primary">
                    Giáo Viên Giảng Dạy {selectedSubject !== "all" ? `(${SUBJECT_CATEGORIES.find(s => s.id === selectedSubject)?.label})` : ""}
                  </h2>
                </div>
                <p className="text-xs text-text-secondary mt-1">Chọn giáo viên để xem các khóa học do thầy/cô đó mở.</p>
              </div>

              {selectedTeacher !== "all" && (
                <button
                  onClick={() => setSelectedTeacher("all")}
                  className="text-xs font-bold text-rose-400 hover:underline"
                >
                  ✕ Hiện tất cả giáo viên
                </button>
              )}
            </div>

            {/* Teachers list horizontal grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Card "Tất cả giáo viên" */}
              <div
                onClick={() => setSelectedTeacher("all")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                  selectedTeacher === "all"
                    ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10"
                    : "border-border-card bg-bg-card hover:bg-bg-hover"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-text-primary">Tất cả Giáo Viên</p>
                  <p className="text-xs text-text-secondary">{filteredTeachers.length} giảng viên</p>
                </div>
              </div>

              {filteredTeachers.map((t) => {
                const isOfflineTeacher = offlineTeachers.some(ot => ot.id === t.id);
                const isSelected = selectedTeacher === t.id.toString();
                return (
                  <div
                    key={t.id}
                    onClick={() => handleTeacherClick(t)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-center gap-3.5 group ${
                      isSelected
                        ? "border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10"
                        : "border-border-card bg-bg-card hover:border-rose-500/30 hover:bg-bg-hover"
                    }`}
                  >
                    {isOfflineTeacher && (
                      <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                        ĐÃ KẾT NỐI
                      </span>
                    )}

                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden shrink-0 flex items-center justify-center text-white font-black">
                      {t.avatar_url ? (
                        <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                      ) : (
                        t.full_name.split(" ").pop()?.charAt(0) || "?"
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-primary truncate">{t.full_name}</p>
                      <p className="text-[11px] text-rose-400 font-semibold tracking-wide uppercase truncate">
                        Chuyên gia MINDA
                      </p>
                    </div>
                  </div>
                );
              })}

              {filteredTeachers.length === 0 && (
                <div className="col-span-full py-8 text-center text-text-secondary text-sm bg-bg-card rounded-2xl border border-dashed border-border-card">
                  Chưa có giáo viên nào giảng dạy môn này.
                </div>
              )}
            </div>
          </section>

          {/* 📚 BƯỚC 3: DANH SÁCH CÁC KHÓA HỌC KHỚP VỚI MÔN & GIÁO VIÊN */}
          <section className="space-y-4 pt-4 border-t border-border-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">3</span>
                <h2 className="text-2xl font-black text-text-primary">
                  Danh Sách Khóa Học Khả Dụng ({finalDisplayedCourses.length})
                </h2>
              </div>
            </div>

            {finalDisplayedCourses.length === 0 ? (
              <div className="text-center py-16 text-text-secondary bg-bg-card rounded-3xl border border-dashed border-border-card">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30 text-rose-400" />
                <p className="font-bold text-base">Không tìm thấy khóa học nào phù hợp.</p>
                <p className="text-xs mt-1">Thử chọn môn khác hoặc bấm &quot;Tất cả môn&quot; ở trên nhé!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {finalDisplayedCourses.map(course => (
                  <div key={course.id} className="bg-bg-card rounded-3xl overflow-hidden border border-border-card shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
                    <div className="w-full h-44 bg-bg-hover relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-rose-500/20 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-rose-400/50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-black px-3 py-1 rounded-full text-xs shadow-md">
                        {course.price === 0 ? "Miễn Phí" : `${course.price.toLocaleString()}đ`}
                      </div>
                      <div className="absolute top-3 left-3 bg-rose-500 text-white font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-md uppercase tracking-wider">
                        {SUBJECT_CATEGORIES.find(s => s.id === getCourseCategory(course.title, course.description))?.label || "Môn Học"}
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight text-text-primary group-hover:text-rose-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-text-secondary text-xs line-clamp-2 mb-4">
                        {course.description || "Mô tả khóa học chi tiết từ giáo viên..."}
                      </p>
                      
                      <div className="flex items-center gap-2 text-text-secondary text-xs mt-auto mb-4 p-2.5 rounded-xl bg-bg-main border border-border-card">
                        <UserIcon className="w-4 h-4 text-rose-400" />
                        <span className="font-semibold">{course.teacher_name || `Giáo viên #${course.teacher_id}`}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingMap[course.id]}
                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                      >
                        {enrollingMap[course.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ghi danh học ngay"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* MODAL TẠO KHÓA HỌC (GIÁO VIÊN) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-bg-card border border-border-card rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500"/> Tạo Khóa Học Mới
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-bg-hover rounded-full text-text-secondary">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Tên Khoá Học</label>
                  <input type="text" placeholder="VD: Lập trình Python & AI Cơ bản" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500/50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Mô tả</label>
                  <textarea rows={3} placeholder="Mô tả nội dung khoá học..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500/50 resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Học Phí định danh (VNĐ)</label>
                  <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-2.5 text-sm outline-none focus:border-rose-500/50" />
                </div>
                
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl border border-border-card font-bold text-text-secondary hover:bg-bg-hover text-sm">Hủy</button>
                  <button type="submit" disabled={formLoading} className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                    {formLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Khởi Tạo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Connect Teacher Modal */}
      {connectingTeacher && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-primary">Kết Nối Lớp Offline</h3>
              <button onClick={() => setConnectingTeacher(null)} className="p-2 hover:bg-bg-hover rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4 py-2 text-center">
              <div className="w-20 h-20 rounded-2xl border-2 border-rose-500/50 p-1">
                <img src={connectingTeacher.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(connectingTeacher.full_name) + "&background=ec4899&color=fff"} className="w-full h-full rounded-xl object-cover" alt="" />
              </div>
              <div>
                <p className="text-text-secondary text-xs mb-1">Đăng ký lớp với thầy/cô</p>
                <p className="font-bold text-text-primary text-base">{connectingTeacher.full_name}</p>
              </div>
              <p className="text-xs text-text-secondary px-3 py-2 rounded-xl bg-bg-main border border-border-card">
                Sau khi kết nối, bạn và thầy/cô sẽ chính thức được ghép cặp hệ thống để điểm danh & nhận báo cáo.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setConnectingTeacher(null)}
                className="px-4 py-2 rounded-xl text-text-secondary hover:bg-bg-hover text-xs font-semibold"
              >Hủy</button>
              <button 
                onClick={confirmConnectTeacher}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20"
              >Xác Nhận Kết Nối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
