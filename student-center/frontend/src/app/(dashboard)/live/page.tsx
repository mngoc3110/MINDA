"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio, Users, Clock, Loader2, Calendar, Plus, X, Video, Brain, BarChart3 } from "lucide-react";

interface LiveSession {
  id: number;
  course_id: number;
  teacher_id: number;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  room_id: string;
  status: "scheduled" | "live" | "ended";
  teacher_name: string;
  course_thumbnail_url: string | null;
}

export default function LiveSchedulePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("student");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const router = useRouter();

  // Quick Start Form State
  const [quickTitle, setQuickTitle] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);

  // Create Form State
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
     course_id: 1,
     title: "",
     scheduled_at: "",
     duration_minutes: 60,
     room_id: `minda-class-${Math.floor(Math.random() * 10000)}`
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const roleCache = localStorage.getItem("minda_role");
      
      if (roleCache) {
          setUserRole(roleCache);
      } else if (token) {
         try {
             const payload = JSON.parse(atob(token.split('.')[1]));
             setUserRole(payload.role || "student");
         } catch (e) {}
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
     e.preventDefault();
     setFormLoading(true);
     try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/`, {
         method: "POST",
         headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
         },
         body: JSON.stringify(formData)
       });
       if(res.ok) {
          const newSession = await res.json();
          setSessions([...sessions, newSession].sort((a,b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
          setShowCreateModal(false);
          setFormData({ ...formData, room_id: `minda-class-${Math.floor(Math.random() * 10000)}` });
       } else {
          alert("Lỗi khi tạo lớp học. Hãy đảm bảo bạn là Giáo viên liên kết với Khóa học hợp lệ (Course ID).");
       }
     } catch(err) {
       console.error(err);
     } finally {
       setFormLoading(false);
     }
  };

  const handleStartClass = async (session: LiveSession) => {
     try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/${session.id}/status?status=live`, {
         method: "PUT",
         headers: { "Authorization": `Bearer ${token}` }
       });
       if(res.ok) {
          router.push(`/live/${session.room_id}`);
       } else {
          alert("Lỗi khi thiết lập trạng thái LIVE. Vui lòng thử lại!");
       }
     } catch(err) {
       console.error(err);
     }
  };

  const handleEndClass = async (session: LiveSession) => {
     if (!confirm("Bạn có chắc chắn muốn kết thúc buổi học này?")) return;
     try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/${session.id}/status?status=ended`, {
         method: "PUT",
         headers: { "Authorization": `Bearer ${token}` }
       });
       if(res.ok) {
          setSessions(sessions.filter(s => s.id !== session.id));
       } else {
          try {
             const errData = await res.json();
             alert(`Lỗi: ${errData.detail}`);
          } catch {
             alert("Lỗi khi kết thúc lớp học. Có thể bạn không phải giáo viên phụ trách.");
          }
       }
     } catch(err) {
       console.error(err);
     }
  };

  const handleQuickLive = async () => {
     if (!quickTitle.trim()) return alert("Vui lòng nhập tiêu đề buổi học!");
     setQuickLoading(true);
     try {
       const token = localStorage.getItem("minda_token");
       // 1. POST Khởi tạo lớp
       const postRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/`, {
         method: "POST",
         headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
         body: JSON.stringify({
            course_id: null, 
            title: quickTitle,
            scheduled_at: new Date().toISOString(),
            duration_minutes: 120,
            room_id: `minda-live-${Date.now()}`
         })
       });
       if(postRes.ok) {
          const newSession = await postRes.json();
          // 2. Kích hoạt trực tiếp status sang LIVE để học sinh thấy ngay lập tức
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/live-sessions/${newSession.id}/status?status=live`, {
             method: "PUT",
             headers: { "Authorization": `Bearer ${token}` }
          });
          // 3. Routing thẳng Server Teacher vào cấu trúc Iframe P2P
          router.push(`/live/${newSession.room_id}`);
       } else {
          alert("Lỗi khi tạo phòng. Bạn có quyền giáo viên liên kết với Course chưa?");
       }
     } catch(e) {
       console.error(e);
     } finally {
       setQuickLoading(false);
     }
  };

  const fetchAnalytics = async (sessionId: number) => {
    setAnalyticsLoading(true);
    setShowAnalyticsModal(sessionId);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/emotion/session/${sessionId}/summary`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setAnalyticsData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-main">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  const liveNow = sessions.filter(s => s.status === "live");
  const upcoming = sessions.filter(s => s.status === "scheduled");

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-t-primary p-6 md:p-10 font-outfit">
      <header className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 relative">
        <div>
           <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight flex items-center justify-center md:justify-start gap-3">
              <div className="relative">
                 <Radio className="w-8 h-8 text-rose-500 relative z-10" />
                 <div className="absolute inset-0 bg-rose-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
              </div>
              Lịch Học Trực Tuyến
           </h1>
           <p className="text-t-secondary text-sm md:text-base">Tham gia lớp học tương tác Face-to-Face cùng các giảng viên hàng đầu.</p>
        </div>
        {(userRole === "teacher" || userRole === "admin") && (
            <button 
               onClick={() => setShowCreateModal(true)}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all shrink-0"
            >
               <Plus className="w-5 h-5"/> MỞ LỚP LIVE
            </button>
        )}
      </header>

      {/* QUICK START LIVE BAR (Dành cho Giáo viên) */}
      {(userRole === "teacher" || userRole === "admin") && (
          <div className="bg-bg-card border border-rose-500/30 p-5 md:p-6 rounded-2xl mb-12 flex flex-col md:flex-row items-end gap-4 shadow-[0_0_20px_rgba(244,63,94,0.05)]">
              <div className="flex-1 w-full">
                 <label className="text-sm font-black text-rose-500 mb-2 block tracking-wide uppercase">Mời giáo viên ghi tiêu đề buổi học:</label>
                 <input 
                    type="text" 
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="VD: Tổng ôn kiến thức Toán 10..." 
                    className="w-full bg-bg-main border border-border-card px-4 py-3 rounded-xl focus:border-rose-500 outline-none transition-colors" 
                 />
              </div>
              <button 
                 onClick={handleQuickLive}
                 disabled={quickLoading}
                 className="bg-rose-500 hover:bg-rose-600 text-white font-black px-8 py-3 rounded-xl shadow-lg whitespace-nowrap w-full md:w-auto h-[50px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                 {quickLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Radio className="w-5 h-5"/>}
                 BẤM NÚT LIVE NGAY
              </button>
          </div>
      )}

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-bg-card rounded-3xl border border-dashed border-border-card text-center">
            <Radio className="w-16 h-16 text-t-secondary/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">Chưa có lớp học nào</h3>
            <p className="text-t-secondary">Hiện tại không có lớp học trực tuyến nào được lên lịch.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
            
            {/* Lớp Đang Diễn Ra */}
            {liveNow.length > 0 && (
              <section>
                 <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-black tracking-wide text-rose-500">ĐANG DIỄN RA</h2>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {liveNow.map(session => (
                       <div key={session.id} className="bg-bg-card rounded-2xl overflow-hidden shadow-[0_0_20px_rgba(244,63,94,0.1)] border border-rose-500/30 group">
                           <div className="h-40 relative bg-bg-hover">
                              {session.course_thumbnail_url && (
                                <img src={session.course_thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              )}
                              <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
                              <div className="absolute bottom-4 left-4 text-white">
                                  <h3 className="font-bold text-lg mb-1">{session.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-white/80">
                                      <Users className="w-4 h-4" /> Giáo viên: {session.teacher_name}
                                  </div>
                              </div>
                              <div className="absolute top-4 right-4 bg-rose-500 text-white font-black px-3 py-1 rounded-full text-xs shadow-lg animate-pulse flex items-center gap-2">
                                 <Radio className="w-3 h-3" /> LIVE
                              </div>
                           </div>
                           <div className="p-5 flex gap-3">
                              <button 
                                onClick={() => router.push(`/live/${session.room_id}`)}
                                className="flex-1 bg-rose-500 hover:bg-rose-600 shadow-[0_0_15px_rgba(244,63,94,0.4)] text-white font-black py-3 rounded-xl transition-all"
                              >
                                VÀO LỚP NGAY
                              </button>
                              {(userRole === "teacher" || userRole === "admin") && (
                                <button 
                                  onClick={() => fetchAnalytics(session.id)}
                                  className="px-4 py-3 bg-bg-hover hover:bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold rounded-xl transition-all shrink-0"
                                  title="Phân tích cảm xúc AI"
                                >
                                  <Brain className="w-5 h-5" />
                                </button>
                              )}
                              {(userRole === "teacher" || userRole === "admin") && (
                                <button 
                                  onClick={() => handleEndClass(session)}
                                  className="px-4 py-3 bg-bg-hover hover:bg-rose-500/10 border border-rose-500/30 text-rose-500 font-bold rounded-xl transition-all shrink-0"
                                  title="Kết thúc và xóa lớp học"
                                >
                                  Kết Thúc
                                </button>
                              )}
                           </div>
                       </div>
                    ))}
                 </div>
              </section>
            )}

            {/* Sắp Tới */}
            {upcoming.length > 0 && (
              <section>
                 <h2 className="text-xl font-bold mb-6 text-t-secondary flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Sắp Diễn Ra
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map(session => (
                       <div key={session.id} className="bg-bg-card rounded-xl overflow-hidden border border-border-card shadow-sm flex flex-col p-5 group">
                          <h3 className="font-bold text-lg mb-2">{session.title}</h3>
                          <div className="flex flex-col gap-2 mb-6">
                             <div className="flex items-center gap-2 text-sm text-t-secondary">
                                <Users className="w-4 h-4 text-indigo-400" /> Giáo viên: {session.teacher_name}
                             </div>
                             <div className="flex items-center gap-2 text-sm text-t-secondary">
                                <Clock className="w-4 h-4 text-emerald-400" /> Bắt đầu: {new Date(session.scheduled_at).toLocaleString('vi-VN')}
                             </div>
                          </div>
                          
                          {(userRole === "teacher" || userRole === "admin") ? (
                              <button 
                                 onClick={() => handleStartClass(session)}
                                 className="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg shadow-md transition-all text-sm"
                              >
                                 Phát Sóng Ngay
                              </button>
                          ) : (
                              <button 
                                 disabled
                                 className="mt-auto w-full bg-bg-hover text-t-secondary font-bold py-2.5 rounded-lg border border-border-card cursor-not-allowed text-sm"
                              >
                                 Giáo viên chưa mở phòng
                              </button>
                          )}
                       </div>
                    ))}
                 </div>
              </section>
            )}

        </div>
      )}

      {/* MODAL MỎ LỚP */}
      {showCreateModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-indigo-500 to-purple-500"></div>
                <div className="p-6">
                   <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                         <Video className="w-5 h-5 text-indigo-500"/> Thiết lập lớp ảo WebRTC
                      </h2>
                      <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-bg-hover rounded-full text-t-secondary transition-colors">
                         <X className="w-6 h-6" />
                      </button>
                   </div>
                   
                   <form onSubmit={handleCreateSession} className="flex flex-col gap-4">
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Mã Khóa học (ID)</label>
                         <input type="number" required value={formData.course_id} onChange={e => setFormData({...formData, course_id: parseInt(e.target.value)})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Tiêu đề buổi Live</label>
                         <input type="text" placeholder="VD: Giải đề kiểm tra đợt 1" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-bold text-t-secondary mb-1">Thời gian lên sóng</label>
                            <input type="datetime-local" required value={formData.scheduled_at} onChange={e => setFormData({...formData, scheduled_at: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2-[0.55rem] outline-none focus:border-indigo-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert-[var(--tw-invert,0)]" />
                         </div>
                         <div>
                            <label className="block text-sm font-bold text-t-secondary mb-1">Phút (Dự kiến)</label>
                            <input type="number" required value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors" />
                         </div>
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Room ID (Tự động hóa)</label>
                         <input type="text" readOnly value={formData.room_id} className="w-full bg-bg-hover border border-border-card rounded-lg px-4 py-2.5 text-t-secondary font-mono tracking-widest cursor-not-allowed" />
                         <p className="text-xs text-t-secondary/60 mt-1">Chuỗi khóa bí mật định danh máy chủ P2P Jitsi.</p>
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-3">
                         <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-lg border border-border-card font-bold text-t-secondary hover:bg-bg-hover transition-colors">
                            Hủy bỏ
                         </button>
                         <button type="submit" disabled={formLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                            {formLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Khởi Tạo"}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
         </div>
      )}

      {/* MODAL PHÂN TÍCH CẢM XÚC */}
      {showAnalyticsModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 h-[80vh] flex flex-col">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-purple-500 to-indigo-500"></div>
                
                <div className="p-6 border-b border-border-card flex justify-between items-center bg-bg-card/50 backdrop-blur-md sticky top-0 z-10">
                   <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-500"/> Thống Kê Phân Tích Cảm Xúc Real-time
                   </h2>
                   <button onClick={() => { setShowAnalyticsModal(null); setAnalyticsData(null); }} className="p-1 hover:bg-bg-hover rounded-full text-t-secondary transition-colors">
                      <X className="w-6 h-6" />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                   {analyticsLoading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-4">
                         <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
                         <p>Đang truy vấn dữ liệu AI...</p>
                      </div>
                   ) : analyticsData ? (
                      <div className="space-y-8">
                         {/* Tổng quan lớp */}
                         <section>
                            <h3 className="text-sm font-bold text-t-secondary uppercase tracking-widest mb-4">Môi trường cảm xúc lớp học</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                               {['Neutral', 'Enjoyment', 'Confusion', 'Fatigue', 'Distraction'].map((label) => (
                                  <div key={label} className="bg-bg-main p-4 rounded-2xl border border-border-card text-center">
                                     <div className="text-2xl mb-1">
                                        {label === 'Neutral' && '😐'}
                                        {label === 'Enjoyment' && '😊'}
                                        {label === 'Confusion' && '😕'}
                                        {label === 'Fatigue' && '😴'}
                                        {label === 'Distraction' && '📵'}
                                     </div>
                                     <div className="text-lg font-black text-white">{analyticsData.summary[label] || 0}%</div>
                                     <div className="text-[10px] text-t-secondary uppercase font-bold">{label}</div>
                                  </div>
                               ))}
                            </div>
                         </section>

                         {/* Danh sách học sinh */}
                         <section>
                            <h3 className="text-sm font-bold text-t-secondary uppercase tracking-widest mb-4">Chi tiết từng học sinh (Mới nhất)</h3>
                            <div className="space-y-3">
                               {analyticsData.students && analyticsData.students.length > 0 ? (
                                  analyticsData.students.map((s: any) => (
                                     <div key={s.student_id} className="flex items-center gap-4 bg-bg-main p-4 rounded-xl border border-border-card">
                                        <div className="w-10 h-10 rounded-full bg-bg-hover flex items-center justify-center font-bold text-purple-400">
                                           {s.student_id}
                                        </div>
                                        <div className="flex-1">
                                           <div className="text-sm font-bold">Học sinh #{s.student_id}</div>
                                           <div className="text-xs text-t-secondary">Cập nhật: {new Date(s.captured_at).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                           <div className="text-right">
                                              <div className="font-bold text-sm">
                                                {s.emotion === 'Neutral' && '😐 Bình Thường'}
                                                {s.emotion === 'Enjoyment' && '😊 Hào Hứng'}
                                                {s.emotion === 'Confusion' && '😕 Đang Bối Rối'}
                                                {s.emotion === 'Fatigue' && '😴 Đang Mệt'}
                                                {s.emotion === 'Distraction' && '📵 Mất Tập Trung'}
                                              </div>
                                              <div className="text-xs text-t-secondary">{Math.round(s.confidence * 100)}% tin cậy</div>
                                           </div>
                                        </div>
                                     </div>
                                  ))
                               ) : (
                                  <p className="text-center text-t-secondary py-10">Chưa có dữ liệu nào được ghi nhận.</p>
                               )}
                            </div>
                         </section>
                      </div>
                   ) : (
                      <div className="text-center py-20 text-t-secondary">Không tìm thấy dữ liệu cho buổi học này.</div>
                   )}
                </div>
                
                <div className="p-6 bg-bg-card border-t border-border-card flex justify-end">
                   <button 
                      onClick={() => analyticsData && fetchAnalytics(showAnalyticsModal as number)} 
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                   >
                      <Loader2 className={`w-4 h-4 ${analyticsLoading ? 'animate-spin' : 'hidden'}`} />
                      LÀM MỚI DỮ LIỆU
                   </button>
                </div>
             </div>
         </div>
      )}

    </div>
  );
}
