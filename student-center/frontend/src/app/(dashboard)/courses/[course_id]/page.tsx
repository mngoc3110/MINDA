"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
   BookOpen, PlayCircle, Loader2, CheckCircle2, ChevronLeft, 
   FileText, ClipboardList, PenTool, LayoutTemplate, Send, Clock, HelpCircle, Timer, AlertCircle
} from "lucide-react";

interface Lesson {
  id: number;
  title: string;
  description: string;
  video_url: string;
  document_url?: string;
  order_index: number;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_score: number;
}

interface CourseData {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
}

interface Exam {
  id: number;
  title: string;
  duration_minutes: number;
}

interface ExamQuestion {
  id: number;
  question_text: string;
  options: string[];
}

type ContentType = "lesson" | "assignment" | "exam";

export default function CoursePlayerPage() {
  const { course_id } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Thriving state for UI switching 
  const [activeType, setActiveType] = useState<ContentType>("lesson");
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  // Submissions state
  const [submittingAss, setSubmittingAss] = useState(false);
  const [assContent, setAssContent] = useState("");
  const [submittedIds, setSubmittedIds] = useState<Record<number, boolean>>({});
  const [completedLessons, setCompletedLessons] = useState<Record<number, boolean>>({});

  // Exam States
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<ExamQuestion[]>([]);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examScore, setExamScore] = useState<number | null>(null);
  const [examTimeLeft, setExamTimeLeft] = useState<number>(0);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isTakingExam && examTimeLeft > 0) {
      timer = setInterval(() => setExamTimeLeft(prev => prev - 1), 1000);
    } else if (isTakingExam && examTimeLeft <= 0) {
      handleAutoSubmitExam();
    }
    return () => clearInterval(timer);
  }, [isTakingExam, examTimeLeft]);

  useEffect(() => {
    fetchCourseCurriculum();
  }, [course_id]);

  const fetchCourseCurriculum = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const headers = { "Authorization": `Bearer ${token}` };

      const urls = [
        `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${course_id}`,
        `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${course_id}/curriculum`
      ];

      const [courseRes, curRes] = await Promise.all(
         urls.map(url => fetch(url, { headers }).catch(() => null))
      );

      if (courseRes && courseRes.ok) setCourse(await courseRes.json());
      
      if (curRes && curRes.ok) {
         const curData = await curRes.json();
         const chapters = curData.chapters || [];
         
         let flatLessons: any[] = [];
         let flatAssignments: any[] = [];
         let flatExams: any[] = [];

         chapters.forEach((chap: any) => {
             if (chap.lessons) {
                 chap.lessons.forEach((less: any) => {
                     flatLessons.push({ ...less, chapterTitle: chap.title });
                     if (less.assignments) {
                         less.assignments.forEach((a: any) => flatAssignments.push({ ...a, lessonTitle: less.title }));
                     }
                     if (less.exams) {
                         less.exams.forEach((e: any) => flatExams.push({ ...e, lessonTitle: less.title }));
                     }
                 });
             }
         });

         setLessons(flatLessons);
         setAssignments(flatAssignments);
         setExams(flatExams);

         if (flatLessons.length > 0) setActiveItemId(flatLessons[0].id);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkLessonComplete = async (lessonId: number) => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/lessons/${lessonId}/progress?completed=true`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setCompletedLessons(prev => ({ ...prev, [lessonId]: true }));
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSubmitAssignment = async (assignmentId: number) => {
    if (!assContent.trim()) return alert("Vui lòng nhập nội dung bài làm!");
    setSubmittingAss(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${assignmentId}/submit`, {
        method: "POST",
        headers: { 
           "Authorization": `Bearer ${token}`,
           "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: assContent,
            file_url: ""
        })
      });
      
      if (res.ok) {
        alert("Nộp bài thành công!");
        setSubmittedIds(prev => ({ ...prev, [assignmentId]: true }));
        setAssContent("");
      } else {
        const error = await res.json();
        alert(error.detail || "Lỗi khi nộp bài");
      }
    } catch(e) {
      alert("Mạng lỗi");
    } finally {
      setSubmittingAss(false);
    }
  };

  const loadExamQuestions = async (examId: number, durationMinutes: number) => {
    setLoading(true);
    setIsTakingExam(false);
    setExamScore(null);
    setExamAnswers({});
    try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/exams/${examId}/questions`, {
         headers: { "Authorization": `Bearer ${token}` }
       });
       if (res.ok) {
          const qs = await res.json();
          setActiveQuestions(qs);
          setExamTimeLeft(durationMinutes * 60);
          setIsTakingExam(true);
       }
    } catch (e) {
       console.error(e);
    } finally {
       setLoading(false);
    }
  };

  const handleAutoSubmitExam = async () => {
     if (activeType !== "exam" || !activeItemId) return;
     setSubmittingExam(true);
     try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/exams/${activeItemId}/submit`, {
         method: "POST",
         headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
         },
         body: JSON.stringify({ answers: examAnswers })
       });
       if(res.ok) {
          const data = await res.json();
          setExamScore(data.score);
          setIsTakingExam(false);
       }
     } catch(e) {
       console.error(e);
     } finally {
       setSubmittingExam(false);
     }
  };

  const selectExamSwitch = (examId: number) => {
      // Prevent leaving if taking exam
      if (isTakingExam && confirm("Bạn đang làm bài thi. Thoát sẽ hủy kết quả hiện tại. Bạn chắc chứ?")) {
         setIsTakingExam(false);
         setActiveType("exam");
         setActiveItemId(examId);
         setExamScore(null);
      } else if (!isTakingExam) {
         setActiveType("exam");
         setActiveItemId(examId);
         setExamScore(null);
      }
  };

  const selectSidebarItem = (type: ContentType, id: number) => {
      if (isTakingExam) {
         if (!confirm("Bạn đang làm đề thi. Việc chuyển bài học sẽ hủy bài thi hiện tại. Tiếp tục?")) return;
      }
      setIsTakingExam(false);
      setActiveType(type);
      setActiveItemId(id);
  };

  // Safe YouTube embed parser
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1];
    
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : url;
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-bg-main">
      <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
    </div>
  );

  if (!course) return (
     <div className="flex flex-col items-center justify-center p-20 text-center h-screen bg-bg-main">
       <h1 className="text-3xl font-black text-red-500 mb-4">Lỗi tải khóa học</h1>
       <p className="text-t-secondary mb-8">Khoá học này không tồn tại hoặc bạn không có quyền truy cập.</p>
       <button onClick={() => router.push('/courses')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Quay lại</button>
     </div>
  );

  // Active rendering targets
  const activeLesson = activeType === "lesson" ? lessons.find(l => l.id === activeItemId) : null;
  const activeAssignment = activeType === "assignment" ? assignments.find(a => a.id === activeItemId) : null;
  const activeExam = activeType === "exam" ? exams.find(e => e.id === activeItemId) : null;

  return (
    <div className="min-h-[calc(100vh-60px)] h-full bg-bg-main text-t-primary flex flex-col md:flex-row overflow-hidden font-outfit">
       
       {/* ─── SIDEBAR MỤC LỤC ─── */}
       <aside className="w-full md:w-80 lg:w-96 bg-bg-card border-b md:border-b-0 md:border-r border-border-card shrink-0 flex flex-col h-auto md:h-[calc(100vh-60px)] shadow-lg overflow-y-auto z-20">
          <div className="sticky top-0 bg-bg-card/95 backdrop-blur z-10 p-5 border-b border-border-card">
              <button onClick={() => router.push('/courses')} className="text-t-secondary hover:text-indigo-500 transition-colors flex items-center gap-2 mb-3 text-sm font-bold w-max">
                 <ChevronLeft className="w-4 h-4" /> Bảng điều khiển
              </button>
              <h1 className="text-lg md:text-xl font-black leading-tight bg-clip-text text-transparent bg-linear-to-br from-indigo-400 to-purple-600">{course.title}</h1>
              <div className="w-full bg-border-card h-2 rounded-full mt-4 overflow-hidden shadow-inner">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${lessons.length > 0 ? (Object.keys(completedLessons).length / lessons.length) * 100 : 0}%` }}></div>
              </div>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-6">
             {/* Section: Video Lessons */}
             <div>
                <h3 className="text-sm font-black text-t-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                   <PlayCircle className="w-4 h-4" /> Bài Giảng Video
                </h3>
                {lessons.length === 0 && <p className="text-sm text-t-secondary/60 italic ml-6">Chưa có bài giảng</p>}
                <div className="flex flex-col gap-2">
                   {lessons.map((lesson, idx) => {
                      const isActive = activeType === "lesson" && activeItemId === lesson.id;
                      const isCompleted = completedLessons[lesson.id];
                      return (
                         <div 
                           key={lesson.id} 
                           onClick={() => { setActiveType("lesson"); setActiveItemId(lesson.id); }}
                           className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3 group ${isActive ? 'bg-indigo-600/10 border-indigo-500 shadow-md' : 'bg-transparent border-transparent hover:bg-bg-hover hover:border-border-card'}`}
                         >
                            <div className="mt-0.5 shrink-0">
                               {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.4)]" />
                               ) : (
                                  <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-indigo-500' : 'border-slate-500 group-hover:border-slate-400'} flex items-center justify-center text-[10px] font-bold text-slate-500`}>{idx + 1}</div>
                               )}
                            </div>
                            <div className="flex flex-col flex-1">
                               <span className={`font-bold text-sm ${isActive ? 'text-indigo-400' : 'text-t-primary'}`}>{lesson.title}</span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>

             {/* Section: Assignments */}
             <div>
                <h3 className="text-sm font-black text-t-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                   <ClipboardList className="w-4 h-4" /> Bài Tập Thực Hành
                </h3>
                {assignments.length === 0 && <p className="text-sm text-t-secondary/60 italic ml-6">Chưa có bài tập</p>}
                <div className="flex flex-col gap-2">
                   {assignments.map(ass => {
                      const isActive = activeType === "assignment" && activeItemId === ass.id;
                      const isSubmitted = submittedIds[ass.id];
                      return (
                         <div 
                           key={ass.id} 
                           onClick={() => { setActiveType("assignment"); setActiveItemId(ass.id); }}
                           className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3 group ${isActive ? 'bg-amber-500/10 border-amber-500 shadow-md' : 'bg-transparent border-transparent hover:bg-bg-hover hover:border-border-card'}`}
                         >
                            <div className="mt-0.5 shrink-0">
                               {isSubmitted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                               ) : (
                                  <PenTool className={`w-5 h-5 ${isActive ? 'text-amber-500' : 'text-slate-500'}`} />
                               )}
                            </div>
                            <div className="flex flex-col flex-1">
                               <span className={`font-bold text-sm ${isActive ? 'text-amber-500' : 'text-t-primary'}`}>{ass.title}</span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
              {/* Section: Exams */}
             <div>
                <h3 className="text-sm font-black text-t-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
                   <HelpCircle className="w-4 h-4" /> Đề Thi & Đánh Giá
                </h3>
                {exams.length === 0 && <p className="text-sm text-t-secondary/60 italic ml-6">Chưa có đề thi</p>}
                <div className="flex flex-col gap-2">
                   {exams.map(exam => {
                      const isActive = activeType === "exam" && activeItemId === exam.id;
                      return (
                         <div 
                           key={exam.id} 
                           onClick={() => selectExamSwitch(exam.id)}
                           className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3 group ${isActive ? 'bg-rose-500/10 border-rose-500 shadow-md' : 'bg-transparent border-transparent hover:bg-bg-hover hover:border-border-card'}`}
                         >
                            <div className="mt-0.5 shrink-0">
                               <Timer className={`w-5 h-5 ${isActive ? 'text-rose-500' : 'text-slate-500'}`} />
                            </div>
                            <div className="flex flex-col flex-1">
                               <span className={`font-bold text-sm ${isActive ? 'text-rose-500' : 'text-t-primary'}`}>{exam.title}</span>
                               <span className="text-xs text-t-secondary">{exam.duration_minutes} Phút</span>
                            </div>
                         </div>
                      );
                   })}
                </div>
             </div>
          </div>
       </aside>

       {/* ─── MAIN CONTENT VIEWPORT ─── */}
       <main className="flex-1 bg-bg-main relative flex flex-col h-auto md:h-[calc(100vh-60px)] overflow-y-auto">
          {(!activeLesson && !activeAssignment && !activeExam) ? (
             <div className="m-auto flex flex-col items-center justify-center text-center p-10 opacity-60">
                 <LayoutTemplate className="w-20 h-20 text-t-secondary mb-4" />
                 <h2 className="text-xl font-bold">Hãy chọn Bài học hoặc Bài tập từ Cột bên</h2>
             </div>
          ) : (
             <div className="w-full max-w-5xl mx-auto p-4 md:p-8">
                 
                 {/* VIEW: VIDEO LESSON */}
                 {activeType === "lesson" && activeLesson && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                       {activeLesson.video_url && (
                          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6 group relative">
                             <iframe 
                                src={getEmbedUrl(activeLesson.video_url)} 
                                className="w-full h-full border-0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen 
                             />
                          </div>
                       )}

                       {activeLesson.document_url && activeLesson.document_url.endsWith(".html") && (
                          <div className="w-full h-[600px] bg-white rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 mb-6 group relative">
                             <iframe 
                                src={activeLesson.document_url} 
                                className="w-full h-full border-0" 
                                allow="autoplay; fullscreen" 
                             />
                          </div>
                       )}

                       <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-bg-card p-6 md:p-8 rounded-2xl border border-border-card shadow-sm">
                          <div className="flex-1 flex flex-col items-start gap-4">
                             <div>
                                <h2 className="text-2xl md:text-3xl font-black mb-4">{activeLesson.title}</h2>
                                <p className="text-t-secondary leading-relaxed whitespace-pre-wrap">{activeLesson.description || "Bài giảng chưa có mô tả chi tiết."}</p>
                             </div>
                             {activeLesson.document_url && !activeLesson.document_url.endsWith(".html") && (
                                <a href={activeLesson.document_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 rounded-xl text-sm font-bold transition-all shadow-lg shadow-purple-500/10 w-fit">
                                   <BookOpen className="w-4 h-4" /> Tải xuống Tài Liệu Bài Giảng đính kèm
                                </a>
                             )}
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                             <button 
                               onClick={() => handleMarkLessonComplete(activeLesson.id)}
                               disabled={completedLessons[activeLesson.id]}
                               className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 ${completedLessons[activeLesson.id] ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'}`}
                             >
                                <CheckCircle2 className="w-5 h-5" /> 
                                {completedLessons[activeLesson.id] ? "Đã Hoàn Thành" : "Đánh Dấu Hoàn Thành"}
                             </button>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* VIEW: ASSIGNMENT FORM */}
                 {activeType === "assignment" && activeAssignment && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-bg-card border border-border-card rounded-2xl shadow-xl overflow-hidden">
                       <div className="bg-linear-to-r from-amber-600 to-orange-500 p-8 text-white relative overflow-hidden">
                           <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                           <h2 className="text-3xl md:text-4xl font-black mb-2 relative z-10">{activeAssignment.title}</h2>
                           <div className="flex items-center gap-4 text-white/90 font-medium relative z-10">
                              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full"><Clock className="w-4 h-4"/> Deadline: {new Date(activeAssignment.due_date).toLocaleDateString("vi-VN")}</span>
                              <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full"><Trophy className="w-4 h-4"/> Max: {activeAssignment.max_score} điểm</span>
                           </div>
                       </div>
                       
                       <div className="p-6 md:p-8">
                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-t-secondary"><FileText className="w-5 h-5"/> Mô Tả Bài Tập</h3>
                          <div className="bg-bg-hover p-5 rounded-xl text-t-primary leading-relaxed whitespace-pre-wrap border border-border-card mb-8">
                             {activeAssignment.description}
                          </div>

                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-t-secondary"><PenTool className="w-5 h-5"/> Bài Làm Của Bạn</h3>
                          {submittedIds[activeAssignment.id] ? (
                              <div className="bg-emerald-500/10 border-l-4 border-emerald-500 p-6 rounded-lg flex items-center gap-4">
                                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                                     <CheckCircle2 className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                     <h4 className="font-bold text-emerald-500 text-lg">Đã nộp bài thành công!</h4>
                                     <p className="text-t-secondary text-sm">Giáo viên sẽ xem xét và chấm điểm cho bạn bằng hệ thống. Hãy theo dõi bảng điểm nhé!</p>
                                  </div>
                              </div>
                          ) : (
                              <div className="flex flex-col gap-4">
                                 <textarea 
                                    className="w-full bg-bg-main border border-border-card rounded-xl p-4 min-h-[200px] outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium resize-y"
                                    placeholder="Nhập câu trả lời hoặc dán đường dẫn file Drive của bạn vào đây..."
                                    value={assContent}
                                    onChange={(e) => setAssContent(e.target.value)}
                                 ></textarea>
                                 <div className="flex justify-end">
                                    <button 
                                      onClick={() => handleSubmitAssignment(activeAssignment.id)}
                                      disabled={submittingAss}
                                      className="bg-amber-500 hover:bg-amber-400 text-white font-black px-8 py-3 rounded-full flex items-center gap-2 shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
                                    >
                                       {submittingAss ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/> }
                                       NỘP BÀI NGAY
                                    </button>
                                 </div>
                              </div>
                          )}
                       </div>
                    </div>
                 )}

                 {/* VIEW: EXAM QUIZ */}
                 {activeType === "exam" && activeExam && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="bg-linear-to-r from-rose-600 to-pink-500 p-8 text-white rounded-t-2xl relative overflow-hidden">
                           <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                           <div className="flex justify-between items-start relative z-10">
                              <div>
                                 <h2 className="text-3xl md:text-4xl font-black mb-2">{activeExam.title}</h2>
                                 <div className="flex items-center gap-4 text-white/90 font-medium">
                                    <span className="flex items-center gap-1.5"><Timer className="w-4 h-4"/> Thời gian: {activeExam.duration_minutes} phút</span>
                                 </div>
                              </div>
                              {isTakingExam && (
                                <div className="bg-black/30 backdrop-blur px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/20 shadow-xl">
                                   <Clock className="w-6 h-6 animate-pulse text-amber-300" />
                                   <span className="text-3xl font-black font-mono tracking-widest text-amber-300">
                                      {Math.floor(examTimeLeft / 60).toString().padStart(2, '0')}:{(examTimeLeft % 60).toString().padStart(2, '0')}
                                   </span>
                                </div>
                              )}
                           </div>
                       </div>
                       
                       <div className="bg-bg-card border-x border-b border-border-card rounded-b-2xl p-6 md:p-8 min-h-[400px]">
                           {examScore !== null ? (
                               // SCORE RESULT CARD
                               <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in duration-500">
                                  <Trophy className="w-24 h-24 text-amber-500 mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                  <h3 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-linear-to-r from-amber-500 to-orange-400">Hoàn Thành Bài Thi!</h3>
                                  <p className="text-t-secondary text-lg mb-8">Điểm số tự động (Auto-grade) từ hệ thống:</p>
                                  <div className="text-6xl font-black text-emerald-500 tracking-tighter drop-shadow-lg mb-8">
                                     {examScore} <span className="text-2xl text-t-secondary font-bold tracking-normal">Điểm</span>
                                  </div>
                                  <button onClick={() => setExamScore(null)} className="px-6 py-2 rounded-full border border-border-card hover:bg-bg-hover text-sm font-bold transition-all text-t-secondary">
                                      Xem lại thông tin đề
                                  </button>
                               </div>
                           ) : !isTakingExam ? (
                               // START EXAM SCREEN
                               <div className="flex flex-col items-center justify-center py-16 text-center">
                                  <AlertCircle className="w-16 h-16 text-rose-500 mb-4 opacity-80" />
                                  <h3 className="text-2xl font-bold mb-3">Sẵn sàng để bắt đầu làm bài?</h3>
                                  <p className="text-t-secondary max-w-md mb-8">
                                     Khi bấm bắt đầu, đồng hồ sẽ chạy và không thể tạm dừng. 
                                     Hãy chắc chắn bạn đã ôn tập kỹ và có kết nối mạng ổn định. Thời gian làm bài sẽ tự động chốt đáp án!
                                  </p>
                                  <button 
                                     onClick={() => loadExamQuestions(activeExam.id, activeExam.duration_minutes)}
                                     className="bg-rose-500 hover:bg-rose-600 text-white font-black px-10 py-4 rounded-full shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105 transition-all flex items-center gap-2 text-lg"
                                  >
                                     <PlayCircle className="w-6 h-6" /> BẮT ĐẦU LÀM BÀI
                                  </button>
                               </div>
                           ) : (
                               // ACTIVE EXAM VIEWPORT (Questions Loop)
                               <div className="flex flex-col gap-10">
                                   {activeQuestions.length === 0 ? (
                                      <div className="text-center py-10 opacity-60">Không có dữ liệu câu hỏi cho đề này.</div>
                                   ) : (
                                      activeQuestions.map((q, idx) => (
                                         <div key={q.id} className="bg-bg-hover p-6 md:p-8 rounded-2xl border border-border-card relative">
                                             <div className="absolute top-0 left-8 -translate-y-1/2 bg-rose-500 text-white font-black px-4 py-1 rounded-full text-sm shadow-md">
                                                CÂU HỎI SỐ {idx + 1}
                                             </div>
                                             <h4 className="text-xl font-bold text-t-primary mb-6 mt-2">{q.question_text}</h4>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {q.options && q.options.map((optText: string, oIdx: number) => {
                                                   const key = String.fromCharCode(65 + oIdx);
                                                   const isSelected = examAnswers[q.id] === optText;
                                                   return (
                                                      <label 
                                                         key={key} 
                                                         className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-600/10 border-indigo-500 shadow-inner' : 'bg-bg-main border-border-card hover:border-indigo-500/50 hover:bg-indigo-600/5'}`}
                                                      >
                                                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                            {isSelected && <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>}
                                                         </div>
                                                         <span className={`font-bold shrink-0 ${isSelected ? 'text-indigo-500' : 'text-t-secondary'}`}>{key}.</span>
                                                         <span className={`text-base ${isSelected ? 'font-medium text-t-primary' : 'text-t-secondary'}`}>{optText}</span>
                                                      </label>
                                                   );
                                                })}
                                             </div>
                                         </div>
                                      ))
                                   )}

                                   <div className="flex justify-end mt-4 pt-6 border-t border-border-card">
                                      <button 
                                         onClick={handleAutoSubmitExam}
                                         disabled={submittingExam}
                                         className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-4 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105 transition-all text-lg disabled:opacity-50"
                                      >
                                         {submittingExam ? <Loader2 className="animate-spin w-6 h-6" /> : <Send className="w-6 h-6" />} 
                                         NỘP BÀI THI NGAY
                                      </button>
                                   </div>
                               </div>
                           )}
                       </div>
                    </div>
                 )}

             </div>
          )}
       </main>
    </div>
  );
}

// Temporary internal component for Trophy icon mapping absent from lucid import
function Trophy(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
  );
}
