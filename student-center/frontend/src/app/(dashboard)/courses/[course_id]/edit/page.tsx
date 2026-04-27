"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Plus, Video, Edit3, ClipboardList, Trash2, ArrowLeft, ChevronDown, ChevronUp, PlayCircle, X, Pencil, Check, GripVertical, FileText } from "lucide-react";

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.course_id as string;
  
  const [course, setCourse] = useState<any>(null);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States for modals
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");

  const [showLessonModal, setShowLessonModal] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", video_url: "", document_url: "" });

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", attachment_url: "" });

  const [showExamModal, setShowExamModal] = useState(false);
  const [examForm, setExamForm] = useState({ title: "", duration_minutes: 60 });

  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // SCORM Preview Modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Toggles for accordions
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});
  const [openLessons, setOpenLessons] = useState<Record<number, boolean>>({});

  // Inline editing
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState("");

  const toggleChapter = (id: number) => setOpenChapters(prev => ({...prev, [id]: !prev[id]}));
  const toggleLesson = (id: number) => setOpenLessons(prev => ({...prev, [id]: !prev[id]}));

  const getToken = () => localStorage.getItem("minda_token");
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn';

  const fetchCurriculum = async () => {
    try {
      const res = await fetch(`${apiBase}/api/courses/${courseId}/curriculum`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        const chapters = (data.chapters || []).map((chap: any) => ({
          ...chap,
          lessons: (chap.lessons || []).sort((a: any, b: any) => {
            // Extract number from title like "Bài 5: ..." → 5
            const numA = parseInt((a.title.match(/\d+/) || ["9999"])[0]);
            const numB = parseInt((b.title.match(/\d+/) || ["9999"])[0]);
            return numA - numB;
          })
        }));
        setCurriculum(chapters);
        // Auto-open all chapters
        const opens: Record<number, boolean> = {};
        chapters.forEach((c: any) => { opens[c.id] = true; });
        setOpenChapters(opens);
      }
    } catch(e) { console.error(e); }
  };

  const fetchCourseInfo = async () => {
    try {
      const res = await fetch(`${apiBase}/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setCourse(await res.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchCourseInfo();
      await fetchCurriculum();
      setLoading(false);
    };
    init();
  }, [courseId]);

  const handleFileUpload = async (file: File) => {
    setUploadingMedia(true);
    const formData = new FormData();
    formData.append("file", file);
    
    const isScorm = file.name.toLowerCase().endsWith(".zip");
    const endpoint = isScorm 
        ? `${apiBase}/api/files/upload_scorm` 
        : `${apiBase}/api/files/upload`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setUploadingMedia(false);
        return data.file_url;
      }
    } catch(e) { console.error(e); }
    setUploadingMedia(false);
    return null;
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/courses/${courseId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title: chapterTitle, order_index: curriculum.length })
    });
    if (res.ok) {
      setShowChapterModal(false);
      setChapterTitle("");
      fetchCurriculum();
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${apiBase}/api/courses/chapters/${activeChapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(lessonForm)
    });
    if (res.ok) {
      setShowLessonModal(false);
      setLessonForm({title: "", video_url: "", document_url: ""});
      fetchCurriculum();
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await fetch(`${apiBase}/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({...assignmentForm, lesson_id: activeLessonId})
      });
      if (res.ok) {
        setShowAssignmentModal(false);
        setAssignmentForm({title: "", description: "", attachment_url: ""});
        fetchCurriculum();
      }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
      e.preventDefault();
      const res = await fetch(`${apiBase}/api/courses/${courseId}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({...examForm, lesson_id: activeLessonId})
      });
      if (res.ok) {
        setShowExamModal(false);
        setExamForm({title: "", duration_minutes: 60});
        fetchCurriculum();
      }
  };

  // --- INLINE EDIT HANDLERS ---
  const saveChapterTitle = async (chapId: number) => {
    if (!editChapterTitle.trim()) return;
    const res = await fetch(`${apiBase}/api/courses/chapters/${chapId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title: editChapterTitle.trim() })
    });
    if (res.ok) {
      setCurriculum(prev => prev.map(c => c.id === chapId ? {...c, title: editChapterTitle.trim()} : c));
    }
    setEditingChapterId(null);
  };

  const saveLessonTitle = async (lessonId: number) => {
    if (!editLessonTitle.trim()) return;
    const res = await fetch(`${apiBase}/api/courses/lessons/${lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title: editLessonTitle.trim() })
    });
    if (res.ok) {
      fetchCurriculum();
    }
    setEditingLessonId(null);
  };

  const deleteChapter = async (chapId: number) => {
    if (!confirm("Xoá chương này sẽ xoá tất cả bài học bên trong. Tiếp tục?")) return;
    const res = await fetch(`${apiBase}/api/courses/chapters/${chapId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.ok) fetchCurriculum();
  };

  const deleteLesson = async (lessonId: number) => {
    if (!confirm("Xoá bài học này?")) return;
    const res = await fetch(`${apiBase}/api/courses/lessons/${lessonId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.ok) fetchCurriculum();
  };

  if (loading) return <div className="min-h-screen bg-bg-main flex items-center justify-center text-t-primary font-outfit">Đang tải giáo án...</div>;

  return (
    <div className="min-h-screen bg-bg-main text-t-primary p-6 md:p-8 font-outfit">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-border-card gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-bg-hover rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-t-secondary" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Xây dựng Giáo Án</h1>
            <p className="text-t-secondary text-sm">Khoá học: <span className="text-pink-500 font-semibold">{course?.title}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push(`/courses/${courseId}`)}
            className="flex items-center gap-2 px-5 py-2.5 bg-bg-hover hover:bg-indigo-600/10 text-t-secondary hover:text-indigo-500 rounded-xl text-sm font-semibold transition-all border border-border-card"
          >
            <PlayCircle className="w-4 h-4" /> Xem với tư cách HS
          </button>
          <button 
            onClick={() => setShowChapterModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-500/30"
          >
            <Plus className="w-4 h-4" /> Thêm Chương Mới
          </button>
        </div>
      </div>

      {/* CURRICULUM TREE */}
      <div className="max-w-4xl mx-auto space-y-5">
        {curriculum.length === 0 ? (
           <div className="text-center p-16 bg-bg-card border border-dashed border-border-card rounded-3xl">
              <BookOpen className="w-16 h-16 text-t-secondary/30 mx-auto mb-4" />
              <p className="text-t-secondary mb-6 text-lg">Khóa học này chưa có chương nào.</p>
              <button 
                onClick={() => setShowChapterModal(true)}
                className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
              >Bắt đầu tạo Chương đầu tiên</button>
           </div>
        ) : curriculum.map((chap, chapIndex) => (
           <div key={chap.id} className="bg-bg-card rounded-2xl border border-border-card overflow-hidden shadow-sm">
              {/* Chapter Header */}
              <div className="p-5 flex items-center justify-between hover:bg-bg-hover cursor-pointer transition-colors"
                   onClick={() => toggleChapter(chap.id)}
              >
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/15 text-pink-500 flex items-center justify-center font-bold text-sm shrink-0">
                       {chapIndex + 1}
                    </div>
                    {editingChapterId === chap.id ? (
                      <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={editChapterTitle}
                          onChange={e => setEditChapterTitle(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") saveChapterTitle(chap.id); else if (e.key === "Escape") setEditingChapterId(null); }}
                          className="flex-1 bg-bg-hover border border-pink-500 rounded-lg px-3 py-1.5 text-sm font-bold outline-none"
                        />
                        <button onClick={() => saveChapterTitle(chap.id)} className="p-1.5 bg-emerald-500/15 text-emerald-500 rounded-lg hover:bg-emerald-500/25 transition-colors"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setEditingChapterId(null)} className="p-1.5 bg-red-500/15 text-red-500 rounded-lg hover:bg-red-500/25 transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <h3 className="font-bold text-lg truncate">{chap.title}</h3>
                    )}
                 </div>
                 <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-t-secondary font-medium bg-bg-hover px-2.5 py-1 rounded-full">{chap.lessons?.length || 0} Bài</span>
                    {editingChapterId !== chap.id && (
                      <>
                        <button onClick={e => { e.stopPropagation(); setEditChapterTitle(chap.title); setEditingChapterId(chap.id); }} className="p-1.5 text-t-secondary hover:text-pink-500 hover:bg-pink-500/10 rounded-lg transition-colors" title="Sửa tên chương">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteChapter(chap.id); }} className="p-1.5 text-t-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Xoá chương">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {openChapters[chap.id] ? <ChevronUp className="w-5 h-5 text-t-secondary" /> : <ChevronDown className="w-5 h-5 text-t-secondary" />}
                 </div>
              </div>
              
              {/* Chapter Content */}
              {openChapters[chap.id] && (
                 <div className="px-5 pb-5 border-t border-border-card bg-bg-main/50">
                    <div className="space-y-3 pt-4">
                       {(chap.lessons || []).map((less: any, lessIndex: number) => (
                          <div key={less.id} className="bg-bg-card border border-border-card rounded-xl overflow-hidden">
                             {/* Lesson Header */}
                             <div className="p-4 flex items-center justify-between hover:bg-bg-hover cursor-pointer transition-colors"
                                  onClick={() => toggleLesson(less.id)}
                             >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                   <Video className="w-5 h-5 text-indigo-500 shrink-0" />
                                   {editingLessonId === less.id ? (
                                     <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                                       <input
                                         autoFocus
                                         value={editLessonTitle}
                                         onChange={e => setEditLessonTitle(e.target.value)}
                                         onKeyDown={e => { if (e.key === "Enter") saveLessonTitle(less.id); else if (e.key === "Escape") setEditingLessonId(null); }}
                                         className="flex-1 bg-bg-hover border border-indigo-500 rounded-lg px-3 py-1 text-sm font-medium outline-none"
                                       />
                                       <button onClick={() => saveLessonTitle(less.id)} className="p-1 bg-emerald-500/15 text-emerald-500 rounded-lg"><Check className="w-3.5 h-3.5" /></button>
                                       <button onClick={() => setEditingLessonId(null)} className="p-1 bg-red-500/15 text-red-500 rounded-lg"><X className="w-3.5 h-3.5" /></button>
                                     </div>
                                   ) : (
                                     <div className="font-medium text-sm truncate">{less.title}</div>
                                   )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                   {editingLessonId !== less.id && (
                                     <>
                                       <button onClick={e => { e.stopPropagation(); setEditLessonTitle(less.title); setEditingLessonId(less.id); }} className="p-1 text-t-secondary hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Sửa tên bài">
                                         <Pencil className="w-3 h-3" />
                                       </button>
                                       <button onClick={e => { e.stopPropagation(); deleteLesson(less.id); }} className="p-1 text-t-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Xoá bài">
                                         <Trash2 className="w-3 h-3" />
                                       </button>
                                     </>
                                   )}
                                   {openLessons[less.id] ? <ChevronUp className="w-4 h-4 text-t-secondary" /> : <ChevronDown className="w-4 h-4 text-t-secondary" />}
                                </div>
                             </div>
                             
                             {/* Lesson Content */}
                             {openLessons[less.id] && (
                                <div className="px-4 pb-4 pt-0">
                                   <div className="pl-8 pt-3 border-t border-border-card space-y-3">
                                      {less.video_url && (
                                         <a href={less.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 bg-blue-500/10 hover:bg-blue-500/15 w-fit px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors cursor-pointer">
                                            <Video className="w-3.5 h-3.5" /> Video: Bấm để xem
                                         </a>
                                      )}
                                      {less.document_url && (
                                         <div className="flex flex-col gap-2">
                                           {!less.document_url.endsWith(".html") ? (
                                              <a href={less.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-purple-500 bg-purple-500/10 hover:bg-purple-500/15 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20 transition-colors cursor-pointer">
                                                 <FileText className="w-3.5 h-3.5" /> Tài liệu đính kèm
                                              </a>
                                           ) : (
                                              <div className="flex items-center gap-2 text-xs text-purple-500 bg-purple-500/10 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20">
                                                 <BookOpen className="w-3.5 h-3.5" /> SCORM: Đã nhận diện gói Web
                                              </div>
                                           )}
                                           {less.document_url.endsWith(".html") && (
                                              <button onClick={() => setPreviewUrl(less.document_url)} className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors">
                                                 <PlayCircle className="w-3.5 h-3.5" /> Chạy thử Preview SCORM
                                              </button>
                                           )}
                                         </div>
                                      )}
                                      
                                      {/* Assignments */}
                                      {less.assignments?.map((a: any) => (
                                         <div key={`a-${a.id}`} className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                            <Edit3 className="w-3.5 h-3.5" /> Thực hành: {a.title}
                                         </div>
                                      ))}
                                      
                                      {/* Exams */}
                                      {less.exams?.map((e: any) => (
                                         <div key={`e-${e.id}`} className="flex items-center gap-2 text-xs text-orange-500 bg-orange-500/10 w-fit px-3 py-1.5 rounded-lg border border-orange-500/20">
                                            <ClipboardList className="w-3.5 h-3.5" /> Tự luyện: {e.title} ({e.duration_minutes} phút)
                                         </div>
                                      ))}

                                      <div className="flex gap-2 pt-2">
                                         <button 
                                            onClick={() => { setActiveLessonId(less.id); setShowAssignmentModal(true); }}
                                            className="text-xs bg-bg-hover hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors text-emerald-600 dark:text-emerald-400 border border-border-card"
                                         >+ Bài tập thực hành</button>
                                         <button 
                                            onClick={() => { setActiveLessonId(less.id); setShowExamModal(true); }}
                                            className="text-xs bg-bg-hover hover:bg-orange-500/10 px-3 py-1.5 rounded-lg transition-colors text-orange-600 dark:text-orange-400 border border-border-card"
                                         >+ Trắc nghiệm tự luyện</button>
                                      </div>
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                       
                       <button 
                          onClick={() => { setActiveChapterId(chap.id); setShowLessonModal(true); }}
                          className="w-full py-3 border border-dashed border-border-card rounded-xl text-t-secondary text-sm font-medium hover:bg-bg-hover hover:border-indigo-500/40 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                       >
                          <Plus className="w-4 h-4" /> Thêm Bài học vào Chương này
                       </button>
                    </div>
                 </div>
              )}
           </div>
        ))}
      </div>

      {/* --- MODALS --- */}
      {showChapterModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-sm rounded-2xl p-6 border border-border-card shadow-2xl">
               <h3 className="text-xl font-bold mb-4">Tạo Chương Mới</h3>
               <form onSubmit={handleCreateChapter}>
                  <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} required placeholder="Tên chương (VD: Chương 1: Nhập môn)" className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 mb-4 text-sm focus:border-pink-500 outline-none" />
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={()=>setShowChapterModal(false)} className="px-4 py-2 text-sm text-t-secondary hover:text-t-primary transition-colors">Hủy</button>
                     <button type="submit" className="px-5 py-2 bg-pink-600 hover:bg-pink-500 rounded-xl text-sm font-bold text-white">Lưu Chương</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showLessonModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 border border-border-card shadow-2xl">
               <h3 className="text-xl font-bold mb-4">Thêm Bài học</h3>
               <form onSubmit={handleCreateLesson} className="space-y-4">
                  <input type="text" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required placeholder="Tên bài học" className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" />
                  
                  <div>
                    <label className="block text-xs text-t-secondary mb-1">Tải lên Video (tự động lấy link)</label>
                    <input type="file" accept="video/*" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setLessonForm({...lessonForm, video_url: url});
                       }
                    }} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-2 text-sm" />
                    {uploadingMedia && <p className="text-xs text-indigo-500 mt-1">Đang tải lên, vui lòng đợi...</p>}
                    <input type="url" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} placeholder="Hoặc dán Link Video" className="w-full bg-transparent border-b border-border-card mt-2 py-2 text-sm focus:border-indigo-500 outline-none text-t-secondary" />
                  </div>

                  <div>
                    <label className="block text-xs text-t-secondary mb-1">Tài liệu Bài giảng / Gói SCORM (.zip, PDF...)</label>
                    <input type="file" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setLessonForm({...lessonForm, document_url: url});
                       }
                    }} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-2 text-sm" />
                    {lessonForm.document_url && <p className="text-xs text-emerald-500 mt-1">Đã đính kèm tài liệu!</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowLessonModal(false)} className="px-4 py-2 text-sm text-t-secondary hover:text-t-primary" disabled={uploadingMedia}>Hủy</button>
                     <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white">Thêm Bài học</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showAssignmentModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 border border-border-card shadow-2xl">
               <h3 className="text-xl font-bold mb-4 text-emerald-600 dark:text-emerald-400">Tạo Bài Thực Hành</h3>
               <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <input type="text" value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} required placeholder="Tên bài tập" className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" />
                  <textarea value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} placeholder="Mô tả yêu cầu" className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none h-24 resize-y" />
                  
                  <div>
                    <label className="block text-xs text-t-secondary mb-1">Đính kèm File Bài tập</label>
                    <input type="file" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setAssignmentForm({...assignmentForm, attachment_url: url});
                       }
                    }} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-2 text-sm" />
                    {uploadingMedia && <p className="text-xs text-emerald-500 mt-1">Đang tải lên...</p>}
                    {assignmentForm.attachment_url && !uploadingMedia && <p className="text-xs text-emerald-500 mt-1">Đã đính kèm file!</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowAssignmentModal(false)} className="px-4 py-2 text-sm text-t-secondary hover:text-t-primary" disabled={uploadingMedia}>Hủy</button>
                     <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold text-white">Thêm Bài Thực Hành</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showExamModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-bg-card w-full max-w-md rounded-2xl p-6 border border-border-card shadow-2xl">
               <h3 className="text-xl font-bold mb-4 text-orange-600 dark:text-orange-400">Tạo Trắc Nghiệm Tự Luyện</h3>
               <form onSubmit={handleCreateExam} className="space-y-4">
                  <input type="text" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} required placeholder="Tiêu đề bài trắc nghiệm" className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                  <div>
                     <label className="block text-xs text-t-secondary mb-1">Thời gian làm bài (Phút)</label>
                     <input type="number" value={examForm.duration_minutes} onChange={e => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})} required className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowExamModal(false)} className="px-4 py-2 text-sm text-t-secondary hover:text-t-primary">Hủy</button>
                     <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white">Thêm Trắc Nghiệm</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* SCORM Preview Modal */}
      {previewUrl && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-bg-card w-[1000px] h-[700px] max-w-full max-h-full rounded-2xl border border-border-card overflow-hidden flex flex-col shadow-2xl">
               <div className="flex justify-between items-center p-4 border-b border-border-card bg-bg-hover">
                  <h3 className="font-bold flex items-center gap-2"><PlayCircle className="w-5 h-5 text-emerald-500"/> Xem trước SCORM / HTML tương tác</h3>
                  <button onClick={() => setPreviewUrl(null)} className="text-t-secondary hover:text-t-primary bg-bg-hover hover:bg-bg-card p-2 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <div className="flex-1 w-full h-full bg-white relative">
                  <iframe src={previewUrl} className="absolute inset-0 w-full h-full border-0" allow="autoplay; fullscreen" />
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
