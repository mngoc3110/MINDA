"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, Plus, Video, Edit3, ClipboardList, Trash2, ArrowLeft, ChevronDown, ChevronUp, PlayCircle, X } from "lucide-react";

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

  const toggleChapter = (id: number) => setOpenChapters(prev => ({...prev, [id]: !prev[id]}));
  const toggleLesson = (id: number) => setOpenLessons(prev => ({...prev, [id]: !prev[id]}));

  const fetchCurriculum = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/curriculum`);
      if (res.ok) {
        const data = await res.json();
        setCurriculum(data.chapters);
      }
    } catch(e) { console.error(e); }
  };

  const fetchCourseInfo = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}`);
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
    const token = localStorage.getItem("minda_token");
    const formData = new FormData();
    formData.append("file", file);
    
    const isScorm = file.name.toLowerCase().endsWith(".zip");
    const endpoint = isScorm 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload_scorm` 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/files/upload`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem("minda_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem("minda_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/chapters/${activeChapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/exams`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({...examForm, lesson_id: activeLessonId})
      });
      if (res.ok) {
        setShowExamModal(false);
        setExamForm({title: "", duration_minutes: 60});
        fetchCurriculum();
      }
  };

  if (loading) return <div className="min-h-screen bg-bg-main flex items-center justify-center text-white">Đang tải giáo án...</div>;

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-8 font-outfit">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Xây dựng Giáo Án</h1>
            <p className="text-gray-400 text-sm">Khoá học: <span className="text-pink-400 font-semibold">{course?.title}</span></p>
          </div>
        </div>
        <button 
          onClick={() => setShowChapterModal(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-500/30"
        >
          <Plus className="w-4 h-4" /> Thêm Chương Mới
        </button>
      </div>

      {/* CURRICULUM TREE */}
      <div className="max-w-4xl mx-auto space-y-6">
        {curriculum.length === 0 ? (
           <div className="text-center p-12 bg-white/[0.02] border border-white/5 rounded-3xl">
              <p className="text-gray-400 mb-4">Khóa học này chưa có chương nào.</p>
              <button 
                onClick={() => setShowChapterModal(true)}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-all"
              >Bắt đầu tạo Chương đầu tiên</button>
           </div>
        ) : curriculum.map((chap, chapIndex) => (
           <div key={chap.id} className="bg-[#111111] rounded-2xl border border-white/10 overflow-hidden">
              <div 
                 className="p-5 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
                 onClick={() => toggleChapter(chap.id)}
              >
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-sm">
                       {chapIndex + 1}
                    </div>
                    <h3 className="font-bold text-lg">{chap.title}</h3>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 font-medium">{chap.lessons.length} Bài học</span>
                    {openChapters[chap.id] ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                 </div>
              </div>
              
              {openChapters[chap.id] && (
                 <div className="p-5 border-t border-white/5 bg-[#0a0a0a]">
                    <div className="space-y-4">
                       {chap.lessons.map((less: any, lessIndex: number) => (
                          <div key={less.id} className="bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden">
                             <div 
                                className="p-4 flex items-center justify-between hover:bg-white/[0.05] cursor-pointer"
                                onClick={() => toggleLesson(less.id)}
                             >
                                <div className="flex items-center gap-3">
                                   <Video className="w-5 h-5 text-indigo-400" />
                                   <div className="font-medium text-sm">Bài {lessIndex + 1}: {less.title}</div>
                                </div>
                                {openLessons[less.id] ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                             </div>
                             
                             {openLessons[less.id] && (
                                <div className="p-4 pt-0">
                                   <div className="pl-8 pt-3 border-t border-white/5 space-y-3">
                                      {less.video_url && (
                                         <a href={less.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 w-fit px-3 py-1.5 rounded-lg border border-blue-500/20 transition-colors cursor-pointer">
                                            <Video className="w-3.5 h-3.5" /> Video: Bấm để xem Video bài giảng
                                         </a>
                                      )}
                                      {less.document_url && (
                                         <div className="flex flex-col gap-2 mt-2">
                                           {!less.document_url.endsWith(".html") ? (
                                              <a href={less.document_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20 transition-colors cursor-pointer">
                                                 <BookOpen className="w-3.5 h-3.5" /> Tài liệu: Bấm để xem File đính kèm
                                              </a>
                                           ) : (
                                              <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 w-fit px-3 py-1.5 rounded-lg border border-purple-500/20">
                                                 <BookOpen className="w-3.5 h-3.5" /> SCORM: Đã nhận diện gói Web
                                              </div>
                                           )}
                                           {less.document_url.endsWith(".html") && (
                                              <button onClick={() => setPreviewUrl(less.document_url)} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-colors">
                                                 <PlayCircle className="w-3.5 h-3.5" /> Chạy thử bản Preview SCORM
                                              </button>
                                           )}
                                         </div>
                                      )}
                                      
                                      {/* Assignments */}
                                      {less.assignments?.map((a: any) => (
                                         <div key={`a-${a.id}`} className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                            <Edit3 className="w-3.5 h-3.5" /> Thực hành: {a.title}
                                         </div>
                                      ))}
                                      
                                      {/* Exams */}
                                      {less.exams?.map((e: any) => (
                                         <div key={`e-${e.id}`} className="flex items-center gap-2 text-xs text-orange-400 bg-orange-500/10 w-fit px-3 py-1.5 rounded-lg border border-orange-500/20">
                                            <ClipboardList className="w-3.5 h-3.5" /> Tự luyện: {e.title} ({e.duration_minutes} phút)
                                         </div>
                                      ))}

                                      <div className="flex gap-2 pt-2">
                                         <button 
                                            onClick={() => { setActiveLessonId(less.id); setShowAssignmentModal(true); }}
                                            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-emerald-300"
                                         >+ Bài tập thực hành</button>
                                         <button 
                                            onClick={() => { setActiveLessonId(less.id); setShowExamModal(true); }}
                                            className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-orange-300"
                                         >+ Trắc nghiệm tự luyện</button>
                                      </div>
                                   </div>
                                </div>
                             )}
                          </div>
                       ))}
                       
                       <button 
                          onClick={() => { setActiveChapterId(chap.id); setShowLessonModal(true); }}
                          className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 text-sm font-medium hover:bg-white/5 hover:border-white/40 transition-colors flex items-center justify-center gap-2"
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
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
            <div className="bg-[#111111] w-full max-w-sm rounded-3xl p-6 border border-white/10">
               <h3 className="text-xl font-bold mb-4">Tạo Chương Mới</h3>
               <form onSubmit={handleCreateChapter}>
                  <input type="text" value={chapterTitle} onChange={e => setChapterTitle(e.target.value)} required placeholder="Tên chương (VD: Chương 1: Nhập môn)" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 mb-4 text-sm focus:border-pink-500 outline-none" />
                  <div className="flex justify-end gap-2">
                     <button type="button" onClick={()=>setShowChapterModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Hủy</button>
                     <button type="submit" className="px-5 py-2 bg-pink-600 hover:bg-pink-500 rounded-xl text-sm font-bold">Lưu Chương</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showLessonModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
            <div className="bg-[#111111] w-full max-w-md rounded-3xl p-6 border border-white/10">
               <h3 className="text-xl font-bold mb-4">Thêm Bài học</h3>
               <form onSubmit={handleCreateLesson} className="space-y-4">
                  <input type="text" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} required placeholder="Tên bài học" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none" />
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tải lên Video (tự động lấy link)</label>
                    <input type="file" accept="video/*" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setLessonForm({...lessonForm, video_url: url});
                       }
                    }} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300" />
                    {uploadingMedia && <p className="text-xs text-indigo-400 mt-1">Đang tải lên, vui lòng đợi...</p>}
                    <input type="url" value={lessonForm.video_url} onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})} placeholder="Hoặc dán Link Video" className="w-full bg-transparent border-b border-white/10 mt-2 py-2 text-sm focus:border-indigo-500 outline-none text-gray-500" />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Tài liệu Bài giảng / Gói SCORM (.zip, PDF...)</label>
                    <input type="file" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setLessonForm({...lessonForm, document_url: url});
                       }
                    }} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300" />
                    {lessonForm.document_url && <p className="text-xs text-emerald-400 mt-1">Đã đính kèm tài liệu!</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowLessonModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white" disabled={uploadingMedia}>Hủy</button>
                     <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl text-sm font-bold text-white">Thêm Bài học</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showAssignmentModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
            <div className="bg-[#111111] w-full max-w-md rounded-3xl p-6 border border-white/10">
               <h3 className="text-xl font-bold mb-4 text-emerald-400">Tạo Bài Thực Hành</h3>
               <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <input type="text" value={assignmentForm.title} onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})} required placeholder="Tên bài tập" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" />
                  <textarea value={assignmentForm.description} onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})} placeholder="Mô tả yêu cầu" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none h-24" />
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Đính kèm File Bài tập</label>
                    <input type="file" onChange={async (e) => {
                       if (e.target.files && e.target.files[0]) {
                          const url = await handleFileUpload(e.target.files[0]);
                          if (url) setAssignmentForm({...assignmentForm, attachment_url: url});
                       }
                    }} className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300" />
                    {uploadingMedia && <p className="text-xs text-emerald-400 mt-1">Đang tải lên, vui lòng đợi...</p>}
                    {assignmentForm.attachment_url && !uploadingMedia && <p className="text-xs text-emerald-400 mt-1">Đã đính kèm file!</p>}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowAssignmentModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white" disabled={uploadingMedia}>Hủy</button>
                     <button type="submit" disabled={uploadingMedia} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 rounded-xl text-sm font-bold text-white">Thêm Bài Thực Hành</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {showExamModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4">
            <div className="bg-[#111111] w-full max-w-md rounded-3xl p-6 border border-white/10">
               <h3 className="text-xl font-bold mb-4 text-orange-400">Tạo Trắc Nghiệm Tự Luyện</h3>
               <form onSubmit={handleCreateExam} className="space-y-4">
                  <input type="text" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} required placeholder="Tiêu đề bài trắc nghiệm" className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                  <div>
                     <label className="block text-xs text-gray-400 mb-1">Thời gian làm bài (Phút)</label>
                     <input type="number" value={examForm.duration_minutes} onChange={e => setExamForm({...examForm, duration_minutes: parseInt(e.target.value)})} required className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                     <button type="button" onClick={()=>setShowExamModal(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Hủy</button>
                     <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl text-sm font-bold text-white">Thêm Trắc Nghiệm</button>
                  </div>
               </form>
            </div>
         </div>
      )}



      {/* SCORM Preview Modal */}
      {previewUrl && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#121212] w-[1000px] h-[700px] max-w-full max-h-full rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
               <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1a1a1a]">
                  <h3 className="font-bold flex items-center gap-2"><PlayCircle className="w-5 h-5 text-emerald-400"/> Xem trước SCORM / HTML tương tác</h3>
                  <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
               </div>
               <div className="flex-1 w-full h-full bg-white relative">
                  <iframe src={previewUrl} className="absolute inset-0 w-full h-full border-0" allow="autoplay; fullscreen" />
               </div>
            </div>
         </div>
      )}



      {/* SCORM Preview Modal */}
      {previewUrl && (
         <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#121212] w-[1000px] h-[700px] max-w-full max-h-full rounded-2xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
               <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#1a1a1a]">
                  <h3 className="font-bold flex items-center gap-2"><PlayCircle className="w-5 h-5 text-emerald-400"/> Xem trước SCORM / HTML tương tác</h3>
                  <button onClick={() => setPreviewUrl(null)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-colors"><X className="w-5 h-5"/></button>
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
