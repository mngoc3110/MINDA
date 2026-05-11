import { useState, useRef, useEffect } from "react";
import { X, Upload, Wand2, Loader2, Plus, Trash2, CheckSquare, List, ImagePlus, ChevronDown, AlertTriangle, Clock, FileUp, Check } from "lucide-react";
import MathText from "@/components/MathText";
import LatexToolbar from "@/components/LatexToolbar";

export default function QuizBuilderModal({ 
   courses, 
   folders = [],
   onClose, 
   onSuccess,
   editAssignment = null 
}: { 
   courses: any[], 
   folders?: any[],
   onClose: () => void,
   onSuccess: () => void,
   editAssignment?: any 
}) {
   const [loading, setLoading] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);
   const isEditing = !!editAssignment;
   
   const [courseId, setCourseId] = useState("");
   const [folderId, setFolderId] = useState("");
   const [lessonId, setLessonId] = useState("");
   const [lessons, setLessons] = useState<any[]>([]);
   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   
   const [tab, setTab] = useState<"ai" | "manual">("ai");
   const [quizData, setQuizData] = useState<any>({ sections: [] });
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [isCreatingChapter, setIsCreatingChapter] = useState(false);
   const [newChapterTitle, setNewChapterTitle] = useState("");
   const [isCreatingCourse, setIsCreatingCourse] = useState(false);
   const [newCourseTitle, setNewCourseTitle] = useState("");
   const [localCourses, setLocalCourses] = useState<any[]>([]);
   const [examFormat, setExamFormat] = useState<"standard" | "practice" | "tin_thptqg">("practice");
   const [solutionDocUrl, setSolutionDocUrl] = useState("");
   const [solutionVideoUrl, setSolutionVideoUrl] = useState("");
   const [isUploadingVideo, setIsUploadingVideo] = useState(false);
   const [isUploadingDoc, setIsUploadingDoc] = useState(false);
   const [originalDocUrl, setOriginalDocUrl] = useState("");
   const [isUploadingOrig, setIsUploadingOrig] = useState(false);

   // Batch upload states
   const batchInputRef = useRef<HTMLInputElement>(null);
   interface BatchItem { file: File; status: 'pending' | 'processing' | 'done' | 'error' | 'rate_limited'; error?: string; quizData?: any; }
   const [batchFiles, setBatchFiles] = useState<BatchItem[]>([]);
   const [batchProcessing, setBatchProcessing] = useState(false);
   const [batchDone, setBatchDone] = useState(false);
   const [rateLimitRetry, setRateLimitRetry] = useState<{ fileIndex: number; countdown: number } | null>(null);
   const [showRateLimitDialog, setShowRateLimitDialog] = useState<number | null>(null);
   const retryTimerRef = useRef<any>(null);
   
   const [students, setStudents] = useState<any[]>([]);
   const [assigneeIds, setAssigneeIds] = useState<number[]>([]);
   const [isAssignedToAll, setIsAssignedToAll] = useState(true);

   // Fetch students
   useEffect(() => {
       const fetchStudents = async () => {
           try {
               const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/students`, {
                   headers: { Authorization: `Bearer ${localStorage.getItem("minda_token")}` }
               });
               if (res.ok) {
                   setStudents(await res.json());
               }
           } catch(e) {}
       };
       fetchStudents();
   }, []);

   // Initialize data if in edit mode
   useEffect(() => {
      if (editAssignment) {
         setTitle(editAssignment.title || "");
         setDescription(editAssignment.description || "");
         if (editAssignment.course_id) setCourseId(editAssignment.course_id.toString());
         if (editAssignment.folder_id) setFolderId(editAssignment.folder_id.toString());
         if (editAssignment.lesson_id) setLessonId(editAssignment.lesson_id.toString());
         if (editAssignment.exam_format) setExamFormat(editAssignment.exam_format);
         if (editAssignment.is_assigned_to_all !== undefined) setIsAssignedToAll(editAssignment.is_assigned_to_all);
         if (editAssignment.assignee_ids) setAssigneeIds(editAssignment.assignee_ids);
         
         if (editAssignment.quiz_data) {
             setQuizData(editAssignment.quiz_data);
             if (editAssignment.quiz_data.solutionDocUrl) setSolutionDocUrl(editAssignment.quiz_data.solutionDocUrl);
             if (editAssignment.quiz_data.solutionVideoUrl) setSolutionVideoUrl(editAssignment.quiz_data.solutionVideoUrl);
             if (editAssignment.quiz_data.originalDocUrl) setOriginalDocUrl(editAssignment.quiz_data.originalDocUrl);
         }
      }
   }, [editAssignment]);

   useEffect(() => {
      setLocalCourses(courses);
   }, [courses]);

   const [manualType, setManualType] = useState<"mcq" | "short_answer">("mcq");

   // Fetch curriculum when course changes
   useEffect(() => {
      if (!courseId) {
         setLessons([]);
         setLessonId("");
         return;
      }
      const fetchCurriculum = async () => {
         try {
            const token = localStorage.getItem("minda_token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${courseId}/curriculum`, {
               headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
               const data = await res.json();
               let allLessons: any[] = [];
               data.chapters?.forEach((chap: any) => {
                  chap.lessons?.forEach((less: any) => {
                     allLessons.push({
                        ...less,
                        chapterTitle: chap.title
                     });
                  });
               });
               setLessons(allLessons);
            }
         } catch (e) {
            console.error(e);
         }
      };
      fetchCurriculum();
   }, [courseId]);

   const handleCreateCourse = async () => {
      if (!newCourseTitle) return;
      try {
         const token = localStorage.getItem("minda_token");
         const payload = { title: newCourseTitle };
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/`, {
            method: "POST",
            headers: { 
               "Authorization": `Bearer ${token}`,
               "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
         });
         if (res.ok) {
            const course = await res.json();
            setLocalCourses([...localCourses, course]);
            setCourseId(course.id.toString());
            setNewCourseTitle("");
            setIsCreatingCourse(false);
         }
      } catch (err) {
         console.error(err);
      }
   };

   const handleCreateChapter = async () => {
      if (!courseId || !newChapterTitle) return;
      try {
         const token = localStorage.getItem("minda_token");
         const payload = { title: newChapterTitle, order_index: lessons.length + 1 };
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${courseId}/chapters`, {
            method: "POST",
            headers: { 
               "Authorization": `Bearer ${token}`,
               "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
         });
         if (res.ok) {
            setNewChapterTitle("");
            setIsCreatingChapter(false);
            // Trigger simple re-fetch
            const curRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/courses/${courseId}/curriculum`, {
               headers: { Authorization: `Bearer ${token}` }
            });
            if (curRes.ok) {
               const data = await curRes.json();
               let allLessons: any[] = [];
               data.chapters?.forEach((chap: any) => {
                  chap.lessons?.forEach((less: any) => {
                     allLessons.push({ ...less, chapterTitle: chap.title });
                  });
               });
               setLessons(allLessons);
            }
         }
      } catch (err) {
         console.error(err);
      }
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setAiLoading(true);
      try {
         const token = localStorage.getItem("minda_token");
         const formData = new FormData();
         formData.append("file", file);
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/parse-upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
         });
         
         if (res.ok) {
            const data = await res.json();
            setQuizData(data);
         } else {
            const errorData = await res.json();
            alert("Lỗi AI: " + (errorData.detail || "Không thể phân tích đề"));
         }
      } catch (err) {
         console.error(err);
         alert("Lỗi kết nối tới AI");
      } finally {
         setAiLoading(false);
         if (e.target) {
             e.target.value = '';
         }
      }
   };

   // ── Batch Upload Logic ──
   const handleBatchSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;
      setBatchFiles(selected.map(f => ({ file: f, status: 'pending' as const })));
      setBatchDone(false);
      if (e.target) e.target.value = '';
   };

   const processBatchFile = async (index: number, items: BatchItem[]): Promise<BatchItem[]> => {
      const updated = [...items];
      updated[index] = { ...updated[index], status: 'processing' };
      setBatchFiles([...updated]);
      try {
         const token = localStorage.getItem("minda_token");
         const formData = new FormData();
         formData.append("file", updated[index].file);
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/parse-upload`, {
            method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
         });
         if (res.ok) {
            const data = await res.json();
            updated[index] = { ...updated[index], status: 'done', quizData: data };
            // Auto-create assignment
            const fileName = updated[index].file.name.replace(/\.(pdf|tex|png|jpg|jpeg)$/i, '');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments`, {
               method: 'POST',
               headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
               body: JSON.stringify({
                  title: fileName, description: '', assignment_type: 'quiz', quiz_data: data,
                  exam_format: examFormat, max_score: (examFormat === 'standard' || examFormat === 'tin_thptqg') ? 10 : 100,
                  is_assigned_to_all: isAssignedToAll, assignee_ids: assigneeIds,
                  folder_id: folderId ? parseInt(folderId) : null,
                  course_id: courseId ? parseInt(courseId) : null,
               })
            });
         } else if (res.status === 429 || res.status >= 500) {
            const errText = await res.text();
            const isRL = res.status === 429 || errText.toLowerCase().includes('rate') || errText.toLowerCase().includes('quota');
            updated[index] = { ...updated[index], status: isRL ? 'rate_limited' : 'error', error: isRL ? 'API hết quota tạm thời' : errText.slice(0, 150) };
         } else {
            const errData = await res.json().catch(() => ({ detail: 'Lỗi' }));
            updated[index] = { ...updated[index], status: 'error', error: errData.detail || 'Lỗi' };
         }
      } catch (err: any) {
         updated[index] = { ...updated[index], status: 'error', error: err.message || 'Lỗi mạng' };
      }
      setBatchFiles([...updated]);
      return updated;
   };

   const resumeBatchFrom = async (startIdx: number) => {
      setBatchProcessing(true);
      let items = [...batchFiles];
      for (let i = startIdx; i < items.length; i++) {
         if (items[i].status !== 'pending') continue;
         items = await processBatchFile(i, items);
         if (items[i].status === 'rate_limited') {
            setShowRateLimitDialog(i);
            setBatchProcessing(false);
            return;
         }
      }
      setBatchProcessing(false);
      setBatchDone(true);
      onSuccess();
   };

   const startBatchProcessing = () => resumeBatchFrom(0);

   const handleRateLimitRetry = (fileIndex: number) => {
      setShowRateLimitDialog(null);
      let countdown = 60;
      setRateLimitRetry({ fileIndex, countdown });
      retryTimerRef.current = setInterval(() => {
         countdown--;
         if (countdown <= 0) {
            clearInterval(retryTimerRef.current);
            setRateLimitRetry(null);
            setBatchFiles(prev => {
               const u = [...prev]; u[fileIndex] = { ...u[fileIndex], status: 'pending', error: undefined }; return u;
            });
            setTimeout(() => resumeBatchFrom(fileIndex), 100);
         } else {
            setRateLimitRetry({ fileIndex, countdown });
         }
      }, 1000);
   };

   const handleRateLimitSkip = (fileIndex: number) => {
      setShowRateLimitDialog(null);
      setBatchFiles(prev => {
         const u = [...prev]; u[fileIndex] = { ...u[fileIndex], status: 'error', error: 'Bỏ qua — cần upload LaTeX' }; return u;
      });
      setTimeout(() => resumeBatchFrom(fileIndex + 1), 100);
   };


   const handleUploadOriginalDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingOrig(true);
      try {
         const token = localStorage.getItem("minda_token");
         const formData = new FormData();
         formData.append("file", file);
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/files/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
         });
         
         if (res.ok) {
            const data = await res.json();
            setOriginalDocUrl(data.file_url);
         } else {
            const err = await res.json();
            alert("Lỗi tải đề gốc: " + (err.detail || ""));
         }
      } catch (err) {
         console.error(err);
         alert("Lỗi mạng khi tải file.");
      } finally {
         setIsUploadingOrig(false);
         if (e.target) e.target.value = '';
      }
   };

   const handleUploadSolutionVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingVideo(true);
      try {
         const token = localStorage.getItem("minda_token");
         const formData = new FormData();
         formData.append("file", file);
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/files/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
         });
         
         if (res.ok) {
            const data = await res.json();
            setSolutionVideoUrl(data.file_url);
         } else {
            const err = await res.json();
            alert("Lỗi tải video chữa bài: " + (err.detail || ""));
         }
      } catch (err) {
         console.error(err);
         alert("Lỗi mạng khi tải file.");
      } finally {
         setIsUploadingVideo(false);
         if (e.target) e.target.value = '';
      }
   };

   const handleUploadSolutionDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploadingDoc(true);
      try {
         const token = localStorage.getItem("minda_token");
         const formData = new FormData();
         formData.append("file", file);
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/files/upload`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
         });
         
         if (res.ok) {
            const data = await res.json();
            setSolutionDocUrl(data.file_url);
         } else {
            const err = await res.json();
            alert("Lỗi tải file chữa bài: " + (err.detail || ""));
         }
      } catch (err) {
         console.error(err);
         alert("Lỗi mạng khi tải file.");
      } finally {
         setIsUploadingDoc(false);
         if (e.target) e.target.value = '';
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      setLoading(true);
      try {
         const token = localStorage.getItem("minda_token");
         const payload = {
            title,
            description,
            lesson_id: lessonId ? parseInt(lessonId) : null,
            course_id: courseId ? parseInt(courseId) : null,
            assignment_type: "quiz",
            quiz_data: {
               ...quizData,
               solutionDocUrl,
               solutionVideoUrl,
               originalDocUrl
            },
            exam_format: examFormat,
            max_score: (examFormat === "standard" || examFormat === "tin_thptqg") ? 10 : 100,
            is_assigned_to_all: isAssignedToAll,
            assignee_ids: assigneeIds,
            folder_id: folderId ? parseInt(folderId) : null
         };
         
         let res;
         if (isEditing) {
             res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${editAssignment.id}`, {
                method: "PUT",
                headers: { 
                   "Authorization": `Bearer ${token}`,
                   "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
             });
         } else {
             res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments`, {
                method: "POST",
                headers: { 
                   "Authorization": `Bearer ${token}`,
                   "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
             });
         }
         
         if (res.ok) {
            onSuccess();
            onClose();
         } else {
            const errorData = await res.json();
            alert("Lỗi tạo bài tập: " + (errorData.detail || "Unkown"));
         }
      } catch (err) {
         console.error(err);
         alert("Lỗi kết nối");
      } finally {
         setLoading(false);
      }
   };

   const addManualQuestion = (type: "mcq" | "true_false" | "short_answer") => {
      let newQuestion: any = { id: `${type}_${Date.now()}`, text: "", imageUrl: "" };
      
      let secInstruction = "";
      if (type === "mcq") {
         newQuestion = { ...newQuestion, options: ["","","",""], correctAnswer: 0 };
         secInstruction = "Phần I: Trắc nghiệm khách quan";
      } else if (type === "true_false") {
         newQuestion = { ...newQuestion, items: [
            { label: "a", text: "", isTrue: false },
            { label: "b", text: "", isTrue: false },
            { label: "c", text: "", isTrue: false },
            { label: "d", text: "", isTrue: false }
         ]};
         secInstruction = "Phần II: Câu trắc nghiệm đúng/sai";
      } else if (type === "short_answer") {
         newQuestion = { ...newQuestion, correctAnswer: "" };
         secInstruction = "Phần III: Câu trắc nghiệm trả lời ngắn";
      }

      const currentSections = quizData.sections || [];
      // Tìm section có type tương ứng
      const secIndex = currentSections.findIndex((s: any) => s.type === type);
      
      if (secIndex >= 0) {
         const updatedSections = [...currentSections];
         updatedSections[secIndex].questions = [...(updatedSections[secIndex].questions || []), newQuestion];
         setQuizData({ sections: updatedSections });
      } else {
         const newSection = { type, instruction: secInstruction, questions: [newQuestion] };
         setQuizData({ sections: [...currentSections, newSection] });
      }
   };

   const handleImageUpload = (sIdx: number, qIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { // giới hạn 2MB
         alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB");
         return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
         const updated = {...quizData};
         updated.sections[sIdx].questions[qIdx].imageUrl = reader.result;
         setQuizData(updated);
      };
      reader.readAsDataURL(file);
      // reset input
      e.target.value = '';
   };

   // Simple UI for editing is skipped for brevity (AI parsing creates a complex JSON).
   // But we render the preview so the teacher knows what was parsed.

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto w-full h-full">
         <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-4xl shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-bg-card border-b border-border-card px-6 py-4 flex justify-between items-center rounded-t-2xl shrink-0">
               <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-500"/> {isEditing ? "Cập Nhật Bài Tập Trắc Nghiệm" : "Giao Bài Tập Trắc Nghiệm Mới"}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-bg-hover rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <form id="quiz-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                  {/* Exam format toggle */}
                  <div className="flex items-center gap-3 p-1 bg-bg-hover rounded-2xl border border-border-card w-fit flex-wrap">
                     <button
                        type="button"
                        onClick={() => setExamFormat("practice")}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                           examFormat === "practice"
                              ? "bg-indigo-500 text-text-primary shadow-lg shadow-indigo-500/30"
                              : "text-text-secondary hover:text-text-primary"
                        }`}
                     >
                        Đề Ôn Tập
                     </button>
                     <button
                        type="button"
                        onClick={() => setExamFormat("standard")}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                           examFormat === "standard"
                              ? "bg-amber-500 text-text-primary shadow-lg shadow-amber-500/30"
                              : "text-text-secondary hover:text-text-primary"
                        }`}
                     >
                        Đề Chuẩn (TN-THPT)
                     </button>
                     <button
                        type="button"
                        onClick={() => setExamFormat("tin_thptqg")}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                           examFormat === "tin_thptqg"
                              ? "bg-cyan-500 text-text-primary shadow-lg shadow-cyan-500/30"
                              : "text-text-secondary hover:text-text-primary"
                        }`}
                     >
                        🖥️ Đề Tin THPTQG
                     </button>
                  </div>
                  {examFormat === "standard" && (
                     <p className="-mt-3 text-xs text-amber-400/80 flex items-center gap-1">
                        📋 Thang điểm 10: MCQ=0.25đ, Đúng/Sai=1đ, Tự luận ngắn=0.5đ
                     </p>
                  )}
                  {examFormat === "tin_thptqg" && (
                     <p className="-mt-3 text-xs text-cyan-400/80 flex items-center gap-1">
                        🖥️ Tin THPTQG 2026: P1 MCQ×0.25đ | P2 Đúng/Sai (1/4=0.1, 2/4=0.25, 3/4=0.5, 4/4=1đ) | P3 Ngắn×0.5đ
                     </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2 flex justify-between">
                           Khoá học (Tuỳ chọn)
                           {!isCreatingCourse && (
                              <button type="button" onClick={() => setIsCreatingCourse(true)} className="text-orange-400 hover:text-text-primary flex items-center gap-1 text-xs">
                                 <Plus className="w-3 h-3" /> Tạo Nhanh
                              </button>
                           )}
                        </label>
                        {isCreatingCourse ? (
                           <div className="flex gap-2">
                              <input 
                                 type="text" value={newCourseTitle} onChange={e=>setNewCourseTitle(e.target.value)}
                                 placeholder="Tên khoá học mới..."
                                 className="flex-1 bg-bg-hover border border-orange-500/50 rounded-xl px-3 py-3 outline-none text-text-primary text-sm"
                              />
                              <button type="button" onClick={handleCreateCourse} className="bg-orange-600 px-3 py-2 rounded-xl text-sm font-bold">Lưu</button>
                              <button type="button" onClick={() => setIsCreatingCourse(false)} className="bg-bg-hover px-3 py-2 rounded-xl text-sm"><X className="w-4 h-4"/></button>
                           </div>
                        ) : (
                           <select 
                              value={courseId} onChange={e => setCourseId(e.target.value)}
                              className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-text-primary"
                           >
                              <option value="">-- Bài tập làm thêm (Không thuộc khoá)--</option>
                              {localCourses.map(c => (
                                 <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                           </select>
                        )}
                     </div>

                     {/* FOLDER */}
                     <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">📁 Folder (Tuỳ chọn)</label>
                        <select 
                           value={folderId} onChange={e => setFolderId(e.target.value)}
                           className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-text-primary"
                        >
                           <option value="">-- Không thuộc folder --</option>
                           {folders.map((f: any) => (
                              <option key={f.id} value={f.id}>📁 {f.name}</option>
                           ))}
                        </select>
                     </div>
                     
                     {/* BỘ LỌC ĐỐI TƯỢNG GIAO BÀI */}
                     <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-semibold text-text-secondary mb-2">ĐỐI TƯỢNG GIAO BÀI</label>
                        <div className="flex flex-col gap-3 bg-bg-hover p-3 rounded-xl border border-border-card">
                            <div className="flex gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={isAssignedToAll} onChange={() => setIsAssignedToAll(true)} className="accent-orange-500 w-4 h-4" />
                                    <span className={isAssignedToAll ? "text-text-primary font-bold text-sm" : "text-text-secondary text-sm"}>Giao toàn khoá</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={!isAssignedToAll} onChange={() => setIsAssignedToAll(false)} className="accent-orange-500 w-4 h-4" />
                                    <span className={!isAssignedToAll ? "text-text-primary font-bold text-sm" : "text-text-secondary text-sm"}>Học sinh cụ thể</span>
                                </label>
                            </div>
                            {!isAssignedToAll && (
                                <div className="mt-1 flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {students.map(s => (
                                        <button 
                                            key={s.id} type="button"
                                            onClick={() => setAssigneeIds(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                                            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${assigneeIds.includes(s.id) ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold' : 'bg-bg-hover border-border-card text-text-secondary hover:border-white/30 text-sm'}`}
                                        >
                                            <img src={s.avatar_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(s.full_name)} className="w-5 h-5 rounded-full" alt="" />
                                            {s.full_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2 flex justify-between">
                           Chương / Section (Tuỳ chọn)
                           {!isCreatingChapter && courseId && (
                              <button type="button" onClick={() => setIsCreatingChapter(true)} className="text-orange-400 hover:text-text-primary flex items-center gap-1 text-xs">
                                 <Plus className="w-3 h-3" /> Tạo Nhanh
                              </button>
                           )}
                        </label>
                        {isCreatingChapter ? (
                           <div className="flex gap-2">
                              <input 
                                 type="text" value={newChapterTitle} onChange={e=>setNewChapterTitle(e.target.value)}
                                 placeholder="Tên chương mới..."
                                 className="flex-1 bg-bg-hover border border-orange-500/50 rounded-xl px-3 py-3 outline-none text-text-primary text-sm"
                              />
                              <button type="button" onClick={handleCreateChapter} className="bg-orange-600 px-3 py-2 rounded-xl text-sm font-bold">Lưu</button>
                              <button type="button" onClick={() => setIsCreatingChapter(false)} className="bg-bg-hover px-3 py-2 rounded-xl text-sm"><X className="w-4 h-4"/></button>
                           </div>
                        ) : (
                           <select 
                              value={lessonId} onChange={e => setLessonId(e.target.value)}
                              className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-text-primary disabled:opacity-50"
                              disabled={!courseId}
                           >
                              <option value="">-- Vui lòng chọn --</option>
                              {lessons.map(l => (
                                 <option key={l.id} value={l.id}>{l.chapterTitle} - {l.title}</option>
                              ))}
                           </select>
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-text-secondary mb-2">Tên Bài Tập</label>
                        <input 
                           type="text" required value={title} onChange={e => setTitle(e.target.value)}
                           placeholder="VD: Kiểm tra Toán Giữa kì I 2025"
                           className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-text-primary" 
                        />
                     </div>
                  </div>

                  {/* Tài liệu đính kèm */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/20">
                     <div className="flex flex-col gap-2 bg-bg-card p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-semibold text-text-primary">Đề Gốc (PDF/Ảnh/Drive)</label>
                        <div className="flex bg-bg-hover rounded-xl overflow-hidden border border-border-card mt-1">
                           <input type="text" value={originalDocUrl} onChange={e => setOriginalDocUrl(e.target.value)} placeholder="Dán link Google Drive..." className="flex-1 px-2 py-2 bg-transparent text-xs text-text-primary outline-none" />
                           <label className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer px-3 py-2 text-xs font-bold text-text-primary flex items-center transition-colors">
                              {isUploadingOrig ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3 mr-1" />}
                              {!isUploadingOrig && "Tải file"}
                              <input type="file" onChange={handleUploadOriginalDoc} accept="image/*,application/pdf" className="hidden" />
                           </label>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 bg-bg-card p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-semibold text-indigo-400">Tài Liệu Giải Chi Tiết</label>
                        <div className="flex bg-bg-hover rounded-xl overflow-hidden border border-border-card mt-1">
                           <input type="text" value={solutionDocUrl} onChange={e => setSolutionDocUrl(e.target.value)} placeholder="Dán link Google Drive..." className="flex-1 px-2 py-2 bg-transparent text-xs text-text-primary outline-none" />
                           <label className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer px-3 py-2 text-xs font-bold text-text-primary flex items-center transition-colors">
                              {isUploadingDoc ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3 mr-1" />}
                              {!isUploadingDoc && "Tải file"}
                              <input type="file" onChange={handleUploadSolutionDoc} accept="image/*,application/pdf" className="hidden" />
                           </label>
                        </div>
                     </div>
                     <div className="flex flex-col gap-2 bg-bg-card p-3 rounded-xl border border-white/5">
                        <label className="text-sm font-semibold text-indigo-400">Video Chữa Bài</label>
                        <div className="flex bg-bg-hover rounded-xl overflow-hidden border border-border-card mt-1">
                           <input type="text" value={solutionVideoUrl} onChange={e => setSolutionVideoUrl(e.target.value)} placeholder="Link YT/Drive/Upload..." className="flex-1 px-2 py-2 bg-transparent text-xs text-text-primary outline-none" />
                           <label className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer px-3 py-2 text-xs font-bold text-text-primary flex items-center transition-colors">
                              {isUploadingVideo ? <Loader2 className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3 mr-1" />}
                              {!isUploadingVideo && "Tải lên"}
                              <input type="file" onChange={handleUploadSolutionVideo} accept="video/*" className="hidden" />
                           </label>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex gap-4 border-b border-border-card pb-4">
                     <button type="button" onClick={() => setTab("ai")} className={`font-semibold px-4 py-1.5 rounded-lg transition-colors ${tab === 'ai' ? 'bg-orange-500/20 text-orange-400' : 'text-text-secondary hover:text-text-primary'}`}>Tạo bằng AI (Upload Đề)</button>
                     <button type="button" onClick={() => setTab("manual")} className={`font-semibold px-4 py-1.5 rounded-lg transition-colors ${tab === 'manual' ? 'bg-orange-500/20 text-orange-400' : 'text-text-secondary hover:text-text-primary'}`}>Làm Đề Thủ Công</button>
                  </div>

                   {tab === "ai" && (
                      <>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                               <label className="block text-sm font-semibold text-text-secondary mb-2">📄 Upload 1 Đề (Soạn & Sửa)</label>
                               <div className="border-2 border-dashed border-orange-500/30 bg-orange-500/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-500/10 transition-colors h-full min-h-[140px]" onClick={() => fileInputRef.current?.click()}>
                                  {aiLoading ? (
                                     <>
                                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                                        <p className="font-semibold text-orange-400 text-sm">AI đang phân tích đề...</p>
                                     </>
                                  ) : (
                                     <>
                                        <Wand2 className="w-8 h-8 text-orange-500 mb-2" />
                                        <p className="font-semibold text-orange-400 text-sm">Upload 1 file để Soạn & Sửa</p>
                                        <p className="text-xs text-text-muted mt-1">PDF, Ảnh, hoặc LaTeX (.tex)</p>
                                     </>
                                  )}
                                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.tex" onChange={handleFileUpload} />
                               </div>
                            </div>
                            <div>
                               <label className="block text-sm font-semibold text-text-secondary mb-2">📚 Upload Nhiều Đề (Tự động tạo)</label>
                               <div className="border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-500/10 transition-colors h-full min-h-[140px]" onClick={() => batchInputRef.current?.click()}>
                                  <FileUp className="w-8 h-8 text-indigo-400 mb-2" />
                                  <p className="font-semibold text-indigo-400 text-sm">Upload nhiều PDF/LaTeX cùng lúc</p>
                                  <p className="text-xs text-text-muted mt-1">Hệ thống sẽ tự tạo bài tập cho từng file</p>
                                  <input type="file" ref={batchInputRef} className="hidden" accept="application/pdf,.tex" multiple onChange={handleBatchSelect} />
                               </div>
                            </div>
                         </div>
                         {batchFiles.length > 0 && (
                            <div className="bg-bg-card border border-border-card rounded-xl p-4 space-y-3">
                               <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-sm flex items-center gap-2 text-text-primary">
                                     <FileUp className="w-4 h-4 text-indigo-400" /> Upload hàng loạt — {batchFiles.filter(f => f.status === 'done').length}/{batchFiles.length} đề
                                  </h4>
                                  {!batchProcessing && !batchDone && batchFiles.some(f => f.status === 'pending') && (
                                     <button type="button" onClick={startBatchProcessing} className="bg-indigo-600 hover:bg-indigo-500 text-text-primary font-bold px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
                                        <Wand2 className="w-4 h-4" /> Bắt đầu xử lý
                                     </button>
                                  )}
                                  {batchDone && <span className="text-emerald-400 text-sm font-bold flex items-center gap-1"><Check className="w-4 h-4" /> Hoàn tất!</span>}
                               </div>
                               <div className="w-full bg-bg-hover rounded-full h-2 overflow-hidden">
                                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${(batchFiles.filter(f => f.status === 'done').length / batchFiles.length) * 100}%` }} />
                               </div>
                               <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                  {batchFiles.map((item, idx) => (
                                     <div key={idx} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${item.status === 'done' ? 'bg-emerald-500/10 border border-emerald-500/20' : item.status === 'processing' ? 'bg-indigo-500/10 border border-indigo-500/20' : item.status === 'error' ? 'bg-red-500/10 border border-red-500/20' : item.status === 'rate_limited' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-bg-hover border border-border-card'}`}>
                                        {item.status === 'pending' && <Clock className="w-4 h-4 text-text-muted shrink-0" />}
                                        {item.status === 'processing' && <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />}
                                        {item.status === 'done' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                                        {item.status === 'error' && <X className="w-4 h-4 text-red-400 shrink-0" />}
                                        {item.status === 'rate_limited' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                                        <span className="flex-1 truncate text-text-primary">{item.file.name}</span>
                                        <span className="text-xs text-text-secondary shrink-0">{item.status === 'done' ? '✅ Đã tạo' : item.status === 'processing' ? '🔄 Đang xử lý...' : item.status === 'error' ? `❌ ${item.error?.slice(0,40)}` : item.status === 'rate_limited' ? '⏳ Hết quota' : '⏳ Chờ'}</span>
                                     </div>
                                  ))}
                               </div>
                               {batchDone && <button type="button" onClick={() => { setBatchFiles([]); setBatchDone(false); onSuccess(); onClose(); }} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-text-primary font-bold text-sm">Đóng & Làm mới danh sách</button>}
                            </div>
                         )}
                         {showRateLimitDialog !== null && (
                            <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-5">
                               <div className="flex items-start gap-3 mb-4">
                                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                                  <div>
                                     <h4 className="font-bold text-amber-400">API Gemini hết quota tạm thời</h4>
                                     <p className="text-sm text-text-secondary mt-1">File <strong className="text-text-primary">{batchFiles[showRateLimitDialog]?.file.name}</strong> không thể xử lý.</p>
                                  </div>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <button type="button" onClick={() => handleRateLimitRetry(showRateLimitDialog)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-text-primary font-bold text-sm"><Clock className="w-4 h-4" /> Chờ 60s rồi thử lại</button>
                                  <button type="button" onClick={() => handleRateLimitSkip(showRateLimitDialog)} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-bg-hover text-text-primary font-bold text-sm border border-border-card"><Upload className="w-4 h-4" /> Bỏ qua, upload LaTeX sau</button>
                               </div>
                            </div>
                         )}
                         {rateLimitRetry && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                               <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                               <div className="flex-1">
                                  <p className="text-sm font-semibold text-indigo-300">Đang chờ API phục hồi...</p>
                                  <p className="text-xs text-text-muted">Tự động thử lại sau <strong className="text-text-primary">{rateLimitRetry.countdown}s</strong></p>
                               </div>
                            </div>
                         )}
                      </>
                   )}

                  {/* Manual/AI switch removed, UI is unified */}
                  <LatexToolbar onInsertSnippet={(snippet, offset) => {
                     const el = document.activeElement as HTMLTextAreaElement | HTMLInputElement;
                     if (!el || (el.tagName !== "TEXTAREA" && el.tagName !== "INPUT")) return;

                     const start = el.selectionStart || 0;
                     const end = el.selectionEnd || 0;
                     const val = el.value;
                     const before = val.substring(0, start);
                     const after = val.substring(end, val.length);
                     const newVal = before + snippet + after;

                     // Set value natively to trigger React onChange
                     const desc = Object.getOwnPropertyDescriptor(
                        el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 
                        "value"
                     );
                     desc?.set?.call(el, newVal);
                     el.dispatchEvent(new Event('input', { bubbles: true }));

                     // Set cursor
                     const newCursorPos = before.length + snippet.length - offset;
                     setTimeout(() => {
                        el.focus();
                        el.setSelectionRange(newCursorPos, newCursorPos);
                     }, 10);
                  }} />

                  {quizData.sections && quizData.sections.length > 0 ? (
                     <div className="bg-bg-hover border border-border-card rounded-xl p-6 relative overflow-visible">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold flex items-center gap-2 text-green-400">
                              <CheckSquare className="w-5 h-5"/> Soạn Đề & Đáp Án ({quizData.sections.length} mục)
                           </h3>
                           {!isEditing && tab === 'ai' && (
                              <span className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                 Sếp có thể sửa đề trực tiếp hoặc thêm câu hỏi! 👇
                              </span>
                           )}
                           
                           <div className="relative group">
                              <button type="button" className="bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-orange-500/30">
                                 <Plus className="w-4 h-4"/> Thêm Câu Hỏi <ChevronDown className="w-4 h-4 ml-1"/>
                              </button>
                              <div className="absolute right-0 top-full mt-2 bg-bg-card border border-border-card rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 w-48">
                                 <button type="button" onClick={() => addManualQuestion('mcq')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary border-b border-white/5">Trắc Nghiệm (Phần I)</button>
                                 <button type="button" onClick={() => addManualQuestion('true_false')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary border-b border-white/5">Đúng/Sai (Phần II)</button>
                                 <button type="button" onClick={() => addManualQuestion('short_answer')} className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary">Trả lời Ngắn (Phần III)</button>
                              </div>
                           </div>

                        </div>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg mb-4 text-xs text-indigo-300">
                           <span className="font-bold">💡 Mẹo soạn Toán (LaTeX): </span> 
                           Gõ ký tự <code>$</code> bao quanh để hiển thị công thức chuẩn (VD: <code>$E = mc^2$</code> hoặc <code>{"$\\lim_{x \\to 0} f(x)$"}</code>). Đề sẽ tự render Toán bên dưới.
                        </div>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {quizData.sections.map((sec: any, sIdx: number) => (
                              <div key={sIdx} className="border border-border-card rounded-lg p-4 bg-bg-card">
                                 <textarea 
                                    rows={2} value={sec.instruction || ''} placeholder={`Tên Phần ${sIdx + 1}`}
                                    onChange={(e) => {
                                       const updated = {...quizData};
                                       updated.sections[sIdx].instruction = e.target.value;
                                       setQuizData(updated);
                                    }}
                                    className="font-semibold text-orange-300 mb-1 bg-transparent outline-none w-full border border-border-card rounded-lg p-2 focus:border-orange-500 resize-y"
                                 />
                                 {sec.instruction?.includes('$') && (
                                    <div className="text-xs text-indigo-300 mb-3 ml-2"><MathText>{sec.instruction}</MathText></div>
                                 )}
                                 <div className="space-y-4">
                                    {sec.questions?.map((q: any, qIdx: number) => (
                                       <div key={q.id || qIdx} className="text-sm bg-bg-hover border border-white/5 p-4 rounded-lg relative group">
                                          <div className="pr-8 mb-3">
                                             <textarea 
                                                className="w-full bg-transparent border border-border-card rounded-lg outline-none text-text-primary font-medium focus:border-orange-500 p-3 min-h-[80px] resize-y" 
                                                value={q.text} placeholder="Nhập câu hỏi (VD: $\int x dx$)..."
                                                onChange={e => {
                                                   const updated = {...quizData};
                                                   updated.sections[sIdx].questions[qIdx].text = e.target.value;
                                                   setQuizData(updated);
                                                }}
                                             />

                                             {q.text?.includes('$') && (
                                                <div className="text-sm text-indigo-300 mt-2 p-2 bg-indigo-500/10 rounded-lg"><MathText>{q.text}</MathText></div>
                                             )}

                                             {/* Image Preview */}
                                             {q.imageUrl && (
                                                <div className="mt-3 relative w-fit group/img">
                                                   <img src={q.imageUrl} alt="minh hoa" className="max-h-48 rounded-lg border border-border-card" />
                                                   <button type="button" onClick={() => {
                                                      const updated = {...quizData};
                                                      updated.sections[sIdx].questions[qIdx].imageUrl = "";
                                                      setQuizData(updated);
                                                   }} className="absolute -top-2 -right-2 bg-red-500 text-text-primary p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                      <X className="w-3 h-3"/>
                                                   </button>
                                                </div>
                                             )}

                                             {/* Nút Upload Image */}
                                             <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-hover hover:bg-bg-hover text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer w-fit border border-white/5">
                                                <ImagePlus className="w-3.5 h-3.5" />
                                                {q.imageUrl ? "Đổi ảnh khác" : "Đính kèm ảnh/hình vẽ"}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(sIdx, qIdx, e)} />
                                             </label>

                                          </div>
                                          
                                          {sec.type === 'mcq' && q.options && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-text-secondary mt-2">
                                                {q.options.map((opt: string, i: number) => (
                                                   <div key={i} className="flex flex-col gap-1">
                                                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${q.correctAnswer === i ? 'bg-green-500/10 border-green-500/30' : 'bg-black/20 border-white/5'}`}>
                                                         <input type="radio" checked={q.correctAnswer === i} onChange={() => {
                                                            const updated = {...quizData};
                                                            updated.sections[sIdx].questions[qIdx].correctAnswer = i;
                                                            setQuizData(updated);
                                                         }} className="accent-green-500 w-4 h-4 cursor-pointer" />
                                                         <input type="text" value={opt} placeholder={`Đáp án ${String.fromCharCode(65+i)}`} onChange={e => {
                                                            const updated = {...quizData};
                                                            updated.sections[sIdx].questions[qIdx].options[i] = e.target.value;
                                                            setQuizData(updated);
                                                         }} className={`bg-transparent outline-none flex-1 ${q.correctAnswer === i ? 'text-green-400 font-medium' : 'text-text-primary'}`} />
                                                      </div>
                                                      {opt?.includes('$') && (
                                                         <div className="text-xs text-indigo-300 ml-8 mb-1"><MathText>{opt}</MathText></div>
                                                      )}
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                          
                                          {sec.type === 'true_false' && q.items && (
                                             <div className="flex flex-col gap-2 mt-2">
                                                {q.items.map((item: any, i: number) => (
                                                   <div key={i} className="flex flex-col gap-1">
                                                      <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${item.isTrue ? 'bg-green-500/10 border-green-500/20' : 'bg-black/20 border-white/5 text-text-primary'}`}>
                                                         <span className="font-bold opacity-50">{item.label}.</span>
                                                         <input type="text" value={item.text} onChange={e => {
                                                            const updated = {...quizData};
                                                            updated.sections[sIdx].questions[qIdx].items[i].text = e.target.value;
                                                            setQuizData(updated);
                                                         }} className={`bg-transparent outline-none flex-1 ${item.isTrue ? "text-green-400" : ""}`} />
                                                         <button type="button" onClick={() => {
                                                            const updated = {...quizData};
                                                            updated.sections[sIdx].questions[qIdx].items[i].isTrue = !item.isTrue;
                                                            setQuizData(updated);
                                                         }} className={`text-xs font-bold border px-3 py-1.5 rounded uppercase transition-colors shrink-0 ${item.isTrue ? 'bg-green-600 text-text-primary border-green-500' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                            {item.isTrue ? "Mệnh Đề ĐÚNG" : "Mệnh Đề SAI"}
                                                         </button>
                                                      </div>
                                                      {item.text?.includes('$') && (
                                                         <div className="text-sm text-indigo-300 ml-10 mb-1"><MathText>{item.text}</MathText></div>
                                                      )}
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                          
                                          {sec.type === 'short_answer' && (
                                             <div className="mt-3 text-blue-400 bg-blue-500/10 font-mono px-4 py-2 rounded-lg w-fit border border-blue-500/20 flex gap-2 items-center">
                                                <span className="font-bold">Đáp án Tự điền:</span> 
                                                <input type="text" value={q.correctAnswer} placeholder="Nhập đáp án đúng..." onChange={e => {
                                                   const updated = {...quizData};
                                                   updated.sections[sIdx].questions[qIdx].correctAnswer = e.target.value;
                                                   setQuizData(updated);
                                                }} className="bg-transparent outline-none border-b border-blue-500/50 focus:border-blue-400 flex-1 min-w-[200px]" />
                                             </div>
                                          )}
                                          
                                          <button type="button" onClick={() => {
                                             const updated = {...quizData};
                                             updated.sections[sIdx].questions.splice(qIdx, 1);
                                             setQuizData(updated);
                                          }} className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ) : (
                     <div className="text-center py-12 text-text-muted border-dashed border border-border-card rounded-xl bg-bg-hover">
                        <p>Đề chưa có nội dung. Chọn Upload File Hệ thống AI tự nhận diện cấu trúc, hoặc Bấm "Thêm Trắc Nghiệm" thủ công.</p>
                        
                        <div className="mx-auto mt-4 w-fit relative group">
                           <button type="button" className="bg-orange-500/20 text-orange-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-500/30">
                              <Plus className="w-4 h-4"/> Thêm Câu Hỏi Ngay <ChevronDown className="w-4 h-4"/>
                           </button>
                           <div className="absolute top-full mt-2 bg-bg-card border border-border-card rounded-xl overflow-hidden shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 w-48 text-left left-1/2 -translate-x-1/2">
                                 <button type="button" onClick={() => addManualQuestion('mcq')} className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary border-b border-white/5">Trắc Nghiệm</button>
                                 <button type="button" onClick={() => addManualQuestion('true_false')} className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary border-b border-white/5">Đúng/Sai</button>
                                 <button type="button" onClick={() => addManualQuestion('short_answer')} className="w-full px-4 py-2 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary">Trả lời Ngắn</button>
                           </div>
                        </div>

                     </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-border-card mt-2">
                     <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-text-secondary hover:bg-bg-hover">Hủy</button>
                     <button type="submit" disabled={loading || quizData.sections.length === 0} className="bg-orange-600 hover:bg-orange-500 text-text-primary font-bold px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isEditing ? "Lưu Cập Nhật" : "Giao Bài")}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}
