import { useState, useRef, useEffect } from "react";
import { X, Upload, Wand2, Loader2, Plus, Trash2, CheckSquare, List } from "lucide-react";
import MathText from "@/components/MathText";
import LatexToolbar from "@/components/LatexToolbar";

export default function QuizBuilderModal({ 
   courses, 
   onClose, 
   onSuccess,
   editAssignment = null 
}: { 
   courses: any[], 
   onClose: () => void,
   onSuccess: () => void,
   editAssignment?: any 
}) {
   const [loading, setLoading] = useState(false);
   const [aiLoading, setAiLoading] = useState(false);
   const isEditing = !!editAssignment;
   
   const [courseId, setCourseId] = useState("");
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
   const [examFormat, setExamFormat] = useState<"standard" | "practice">("practice");

   // Initialize data if in edit mode
   useEffect(() => {
      if (editAssignment) {
         setTitle(editAssignment.title || "");
         setDescription(editAssignment.description || "");
         if (editAssignment.course_id) setCourseId(editAssignment.course_id.toString());
         if (editAssignment.lesson_id) setLessonId(editAssignment.lesson_id.toString());
         if (editAssignment.exam_format) setExamFormat(editAssignment.exam_format);
         if (editAssignment.quiz_data) setQuizData(editAssignment.quiz_data);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/curriculum`, {
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
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/`, {
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
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/chapters`, {
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
            const curRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/curriculum`, {
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
         
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/assignments/parse-upload`, {
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
            quiz_data: quizData,
            exam_format: examFormat,
            max_score: examFormat === "standard" ? 10 : 100
         };
         
         
         let res;
         if (isEditing) {
             res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${editAssignment.id}`, {
                method: "PUT",
                headers: { 
                   "Authorization": `Bearer ${token}`,
                   "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
             });
         } else {
             res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments`, {
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

   const addManualQuestion = () => {
      const newQuestion = { id: `q${Date.now()}`, text: "", options: ["","","",""], correctAnswer: 0 };
      const currentSections = quizData.sections || [];
      if (currentSections.length === 0) {
         setQuizData({ sections: [{ type: "mcq", instruction: "Phần 1: Trắc nghiệm", questions: [newQuestion] }] });
      } else {
         const updatedSections = [...currentSections];
         updatedSections[0].questions.push(newQuestion);
         setQuizData({ sections: updatedSections });
      }
   };

   // Simple UI for editing is skipped for brevity (AI parsing creates a complex JSON).
   // But we render the preview so the teacher knows what was parsed.

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto w-full h-full">
         <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl relative my-8 flex flex-col max-h-[90vh]">
            <div className="sticky top-0 z-10 bg-[#111] border-b border-white/10 px-6 py-4 flex justify-between items-center rounded-t-2xl shrink-0">
               <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-orange-500"/> {isEditing ? "Cập Nhật Bài Tập Trắc Nghiệm" : "Giao Bài Tập Trắc Nghiệm Mới"}
               </h2>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
               <form id="quiz-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                  {/* Exam format toggle */}
                  <div className="flex items-center gap-3 p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
                     <button
                        type="button"
                        onClick={() => setExamFormat("practice")}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                           examFormat === "practice"
                              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                              : "text-gray-400 hover:text-white"
                        }`}
                     >
                        Đề Ôn Tập
                     </button>
                     <button
                        type="button"
                        onClick={() => setExamFormat("standard")}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                           examFormat === "standard"
                              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                              : "text-gray-400 hover:text-white"
                        }`}
                     >
                        Đề Chuẩn (TN-THPT)
                     </button>
                  </div>
                  {examFormat === "standard" && (
                     <p className="-mt-3 text-xs text-amber-400/80 flex items-center gap-1">
                        📋 Thang điểm 10: MCQ=0.25đ, Đúng/Sai=1đ, Tự luận ngắn=0.5đ
                     </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2 flex justify-between">
                           Khoá học (Tuỳ chọn)
                           {!isCreatingCourse && (
                              <button type="button" onClick={() => setIsCreatingCourse(true)} className="text-orange-400 hover:text-white flex items-center gap-1 text-xs">
                                 <Plus className="w-3 h-3" /> Tạo Nhanh
                              </button>
                           )}
                        </label>
                        {isCreatingCourse ? (
                           <div className="flex gap-2">
                              <input 
                                 type="text" value={newCourseTitle} onChange={e=>setNewCourseTitle(e.target.value)}
                                 placeholder="Tên khoá học mới..."
                                 className="flex-1 bg-[#1a1a1a] border border-orange-500/50 rounded-xl px-3 py-3 outline-none text-white text-sm"
                              />
                              <button type="button" onClick={handleCreateCourse} className="bg-orange-600 px-3 py-2 rounded-xl text-sm font-bold">Lưu</button>
                              <button type="button" onClick={() => setIsCreatingCourse(false)} className="bg-white/10 px-3 py-2 rounded-xl text-sm"><X className="w-4 h-4"/></button>
                           </div>
                        ) : (
                           <select 
                              value={courseId} onChange={e => setCourseId(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-white"
                           >
                              <option value="">-- Bài tập làm thêm (Không thuộc khoá)--</option>
                              {localCourses.map(c => (
                                 <option key={c.id} value={c.id}>{c.title}</option>
                              ))}
                           </select>
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-400 mb-2 flex justify-between">
                           Chương / Section (Tuỳ chọn)
                           {!isCreatingChapter && courseId && (
                              <button type="button" onClick={() => setIsCreatingChapter(true)} className="text-orange-400 hover:text-white flex items-center gap-1 text-xs">
                                 <Plus className="w-3 h-3" /> Tạo Nhanh
                              </button>
                           )}
                        </label>
                        {isCreatingChapter ? (
                           <div className="flex gap-2">
                              <input 
                                 type="text" value={newChapterTitle} onChange={e=>setNewChapterTitle(e.target.value)}
                                 placeholder="Tên chương mới..."
                                 className="flex-1 bg-[#1a1a1a] border border-orange-500/50 rounded-xl px-3 py-3 outline-none text-white text-sm"
                              />
                              <button type="button" onClick={handleCreateChapter} className="bg-orange-600 px-3 py-2 rounded-xl text-sm font-bold">Lưu</button>
                              <button type="button" onClick={() => setIsCreatingChapter(false)} className="bg-white/10 px-3 py-2 rounded-xl text-sm"><X className="w-4 h-4"/></button>
                           </div>
                        ) : (
                           <select 
                              value={lessonId} onChange={e => setLessonId(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-white disabled:opacity-50"
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
                        <label className="block text-sm font-semibold text-gray-400 mb-2">Tên Bài Tập</label>
                        <input 
                           type="text" required value={title} onChange={e => setTitle(e.target.value)}
                           placeholder="VD: Kiểm tra Toán Giữa kì I 2025"
                           className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-white" 
                        />
                     </div>
                  </div>
                  
                  <div className="flex gap-4 border-b border-white/10 pb-4">
                     <button type="button" onClick={() => setTab("ai")} className={`font-semibold px-4 py-1.5 rounded-lg transition-colors ${tab === 'ai' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'}`}>Tạo bằng AI (Upload Đề)</button>
                     <button type="button" onClick={() => setTab("manual")} className={`font-semibold px-4 py-1.5 rounded-lg transition-colors ${tab === 'manual' ? 'bg-orange-500/20 text-orange-400' : 'text-gray-400 hover:text-white'}`}>Làm Đề Thủ Công</button>
                  </div>

                  {tab === "ai" && (
                     <>
                        <div>
                           <label className="block text-sm font-semibold text-gray-400 mb-2">Bóc tách Đề Cương AI (PDF/Image)</label>
                           <div className="border-2 border-dashed border-orange-500/30 bg-orange-500/5 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-orange-500/10 transition-colors" onClick={() => fileInputRef.current?.click()}>
                              {aiLoading ? (
                                 <>
                                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
                                    <p className="font-semibold text-orange-400">Gemini đang phân tích mặt chữ và cấu trúc đề...</p>
                                 </>
                              ) : (
                                 <>
                                    <Wand2 className="w-10 h-10 text-orange-500 mb-3" />
                                    <p className="font-semibold text-orange-400">Click để Upload Ảnh Đề hoặc PDF</p>
                                    <p className="text-xs text-gray-500 mt-1">Hệ thống hỗ trợ cấu trúc Trắc nghiệm 4 đáp án, Đúng/Sai đa mệnh đề, và Điền Số Ngắn.</p>
                                 </>
                              )}
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                           </div>
                        </div>
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
                     <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-6 relative overflow-visible">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="font-bold flex items-center gap-2 text-green-400">
                              <CheckSquare className="w-5 h-5"/> Soạn Đề & Đáp Án ({quizData.sections.length} mục)
                           </h3>
                           {!isEditing && tab === 'ai' && (
                              <span className="text-xs text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                 Sếp có thể sửa đề trực tiếp hoặc thêm câu hỏi! 👇
                              </span>
                           )}
                           <button type="button" onClick={addManualQuestion} className="bg-orange-500/20 text-orange-500 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-orange-500/30">
                              <Plus className="w-4 h-4"/> Thêm Trắc Nghiệm
                           </button>
                        </div>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg mb-4 text-xs text-indigo-300">
                           <span className="font-bold">💡 Mẹo soạn Toán (LaTeX): </span> 
                           Gõ ký tự <code>$</code> bao quanh để hiển thị công thức chuẩn (VD: <code>$E = mc^2$</code> hoặc <code>{"$\\lim_{x \\to 0} f(x)$"}</code>). Đề sẽ tự render Toán bên dưới.
                        </div>
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                           {quizData.sections.map((sec: any, sIdx: number) => (
                              <div key={sIdx} className="border border-white/10 rounded-lg p-4 bg-[#111]">
                                 <textarea 
                                    rows={2} value={sec.instruction || ''} placeholder={`Tên Phần ${sIdx + 1}`}
                                    onChange={(e) => {
                                       const updated = {...quizData};
                                       updated.sections[sIdx].instruction = e.target.value;
                                       setQuizData(updated);
                                    }}
                                    className="font-semibold text-orange-300 mb-1 bg-transparent outline-none w-full border border-white/10 rounded-lg p-2 focus:border-orange-500 resize-y"
                                 />
                                 {sec.instruction?.includes('$') && (
                                    <div className="text-xs text-indigo-300 mb-3 ml-2"><MathText>{sec.instruction}</MathText></div>
                                 )}
                                 <div className="space-y-4">
                                    {sec.questions?.map((q: any, qIdx: number) => (
                                       <div key={q.id || qIdx} className="text-sm bg-white/5 border border-white/5 p-4 rounded-lg relative group">
                                          <div className="pr-8 mb-3">
                                             <textarea 
                                                className="w-full bg-transparent border border-white/10 rounded-lg outline-none text-white font-medium focus:border-orange-500 p-3 min-h-[80px] resize-y" 
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
                                          </div>
                                          
                                          {sec.type === 'mcq' && q.options && (
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-400 mt-2">
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
                                                         }} className={`bg-transparent outline-none flex-1 ${q.correctAnswer === i ? 'text-green-400 font-medium' : 'text-gray-300'}`} />
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
                                                      <div className={`flex items-center gap-3 p-2.5 rounded-lg border ${item.isTrue ? 'bg-green-500/10 border-green-500/20' : 'bg-black/20 border-white/5 text-gray-300'}`}>
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
                                                         }} className={`text-xs font-bold border px-3 py-1.5 rounded uppercase transition-colors shrink-0 ${item.isTrue ? 'bg-green-600 text-white border-green-500' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
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
                     <div className="text-center py-12 text-gray-500 border-dashed border border-white/10 rounded-xl bg-[#1a1a1a]">
                        <p>Đề chưa có nội dung. Chọn Upload File Hệ thống AI tự nhận diện cấu trúc, hoặc Bấm "Thêm Trắc Nghiệm" thủ công.</p>
                        <button type="button" onClick={addManualQuestion} className="mx-auto mt-4 bg-orange-500/20 text-orange-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-500/30">
                           <Plus className="w-4 h-4"/> Thêm Câu Hỏi Ngay
                        </button>
                     </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-2">
                     <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-white/5">Hủy</button>
                     <button type="submit" disabled={loading || quizData.sections.length === 0} className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (isEditing ? "Lưu Cập Nhật" : "Giao Bài")}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      </div>
   );
}
