"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, User as UserIcon, PlayCircle, Loader2, Plus, X, Pencil } from "lucide-react";

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

export default function CoursesDiscoveryPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<number, boolean>>({});
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
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
    
    // Check if already an offline teacher
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
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData(); // Refresh data!
      } else {
        const error = await res.json();
        alert(error.detail || "Ghi danh thất bại");
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
       if(res.ok) {
          await fetchData();
          setShowCreateModal(false);
          setFormData({ title: "", description: "", price: 0 });
       } else {
          alert("Lỗi khi tạo khoá học.");
       }
     } catch(err) {
       console.error(err);
     } finally {
       setFormLoading(false);
     }
  };

  const myEnrolledIds = enrollments.map(e => e.course_id);
  const myCourses = courses.filter(c => myEnrolledIds.includes(c.id));
  const availableCourses = courses.filter(c => !myEnrolledIds.includes(c.id));
  
  const displayedAvailableCourses = selectedTeacher === "all" 
      ? availableCourses 
      : availableCourses.filter(c => c.teacher_id.toString() === selectedTeacher);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-main">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-t-primary p-6 md:p-10 font-outfit">
      <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight flex items-center justify-center md:justify-start gap-3">
              <BookOpen className="w-8 h-8 text-indigo-500" />
              {userRole === "teacher" ? "Quản Lý Khóa Học" : "Thư Viện Khóa Học"}
           </h1>
           <p className="text-t-secondary text-sm md:text-base">Mở khóa tri thức, nâng tầm tư duy cùng MINDA EduCenter.</p>
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

      {/* HIỂN THỊ DÀNH CHO GIÁO VIÊN */}
      {(userRole === "teacher" || userRole === "admin") ? (
         <section className="mb-16">
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
                           <div className="w-full h-full bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
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
         <>
         {/* KHÓA HỌC CỦA TÔI (HỌC SINH) */}
         {myCourses.length > 0 && (
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-emerald-400 to-cyan-500">
               Đang Theo Học
            </h2>
            <span className="bg-bg-hover text-t-secondary text-xs px-2 py-1 rounded-full font-bold">{myCourses.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myCourses.map(course => (
              <div key={course.id} className="bg-bg-card rounded-2xl overflow-hidden border border-border-card shadow-lg hover:shadow-2xl transition-all duration-300 group flex flex-col cursor-pointer" onClick={() => router.push(`/courses/${course.id}`)}>
                <div className="w-full h-40 bg-bg-hover relative overflow-hidden">
                   {course.thumbnail_url ? (
                     <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="w-full h-full bg-linear-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-indigo-400/50" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                       <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" />
                   </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                  <div className="flex items-center gap-2 text-t-secondary text-sm mt-auto">
                    <UserIcon className="w-4 h-4" /> {course.teacher_name || `Giáo viên #${course.teacher_id}`}
                  </div>
                  <button className="mt-4 w-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-500 font-bold py-2.5 rounded-xl border border-indigo-500/30 transition-colors">
                     Tiếp tục học
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KHÁM PHÁ KHÓA MỚI */}
      <section>
        {/* BỘ LỌC GIÁO VIÊN */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
               Giảng Viên Tiêu Biểu
            </h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            <div 
              onClick={() => setSelectedTeacher("all")}
              className={`shrink-0 flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer min-w-[240px] 
                ${selectedTeacher === "all" ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]" : "border-border-card bg-bg-card hover:border-white/20"}`}
            >
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h3 className="font-bold text-t-primary">Tất cả Khóa học</h3>
                  <p className="text-xs text-t-secondary">Khám phá toàn bộ</p>
               </div>
            </div>

            {teachers.map(t => {
              const isOfflineTeacher = offlineTeachers.some(ot => ot.id === t.id);
              return (
              <div 
                key={t.id}
                onClick={() => handleTeacherClick(t)}
                className={`shrink-0 flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer min-w-[260px] relative overflow-hidden
                  ${selectedTeacher === t.id.toString() ? "border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.2)]" : "border-border-card bg-bg-card hover:border-white/20"}`}
              >
                 {isOfflineTeacher && (
                    <div className="absolute top-0 right-0 bg-pink-600 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg shadow-sm z-10">
                      Của bạn
                    </div>
                  )}
                 <div className="w-12 h-12 rounded-full bg-bg-hover flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent">
                    {t.avatar_url ? (
                       <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-gradient-to-tr from-slate-600 to-slate-800 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                       </div>
                    )}
                 </div>
                 <div>
                    <h3 className="font-bold text-t-primary leading-tight">{t.full_name}</h3>
                    <p className="text-[11px] text-pink-400 font-semibold tracking-wide uppercase mt-1">Chuyên gia MINDA</p>
                 </div>
              </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">Danh sách Lớp học</h2>
            <span className="bg-bg-hover text-t-secondary text-xs px-2 py-1 rounded-full font-bold">{displayedAvailableCourses.length}</span>
          </div>
        </div>
        
        {displayedAvailableCourses.length === 0 ? (
           <div className="text-center py-16 text-t-secondary bg-bg-card rounded-3xl border border-dashed border-border-card">
              <p>Bạn đã đăng ký tất cả các khóa học hiện có!</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedAvailableCourses.map(course => (
              <div key={course.id} className="bg-bg-card rounded-2xl overflow-hidden border border-border-card shadow-sm hover:shadow-xl transition-shadow flex flex-col group">
                <div className="w-full h-40 bg-bg-hover relative overflow-hidden">
                   {course.thumbnail_url ? (
                     <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   ) : (
                     <div className="w-full h-full bg-linear-to-br from-slate-600/20 to-slate-800/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-slate-500/50" />
                     </div>
                   )}
                   <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-white font-black px-3 py-1 rounded-full text-sm shadow-md">
                      {course.price === 0 ? "Miễn Phí" : `${course.price.toLocaleString()}đ`}
                   </div>
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2 leading-tight">{course.title}</h3>
                  <p className="text-t-secondary text-sm line-clamp-2 mb-4">{course.description || "Chưa có mô tả chi tiết."}</p>
                  
                  <div className="flex items-center gap-2 text-t-secondary text-sm mt-auto mb-4">
                    <UserIcon className="w-4 h-4" /> {course.teacher_name || `Giáo viên #${course.teacher_id}`}
                  </div>
                  
                  <button 
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingMap[course.id]}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                     {enrollingMap[course.id] ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ghi danh ngay"}
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
             <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500"></div>
                <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                         <BookOpen className="w-5 h-5 text-indigo-500"/> Tạo Khóa Học Mới
                      </h2>
                      <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-bg-hover rounded-full text-t-secondary">
                         <X className="w-6 h-6" />
                      </button>
                   </div>
                   
                   <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Tên Khoá Học</label>
                         <input type="text" placeholder="VD: Lập trình Cơ bản" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Mô tả (Không bắt buộc)</label>
                         <textarea rows={3} placeholder="Mô tả nội dung khoá học..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 resize-none"></textarea>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Học Phí định danh (VNĐ)</label>
                         <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500" />
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-3">
                         <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-lg border border-border-card font-bold text-t-secondary hover:bg-bg-hover">Hủy</button>
                         <button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
          <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Kết Nối Lớp Offline</h3>
              <button onClick={() => setConnectingTeacher(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
               <div className="w-20 h-20 rounded-full border-2 border-pink-500/50 p-1">
                 <img src={connectingTeacher.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(connectingTeacher.full_name) + "&background=ec4899&color=fff"} className="w-full h-full rounded-full object-cover" alt="" />
               </div>
               <div>
                  <p className="text-gray-400 text-sm mb-2">Đăng ký lớp Offline của thầy cô?</p>
                  <p className="font-bold text-white text-lg">{connectingTeacher.full_name}</p>
               </div>
               <p className="text-xs text-gray-400 px-4 bg-white/5 py-2 rounded-xl mt-2 border border-white/5">
                 Sau khi xác nhận, bạn và thầy/cô sẽ chính thức được ghép cặp hệ thống, có thể nhận bài tập và phiếu thu học phí cá nhân hóa.
               </p>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setConnectingTeacher(null)}
                className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold transition-colors"
              >Hủy</button>
              <button 
                onClick={confirmConnectTeacher}
                className="px-6 py-2.5 bg-linear-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-pink-500/25 transition-all"
              >Đồng Ý Cấp Phép</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
