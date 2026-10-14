"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle, AlertCircle, ArrowLeft, Send, Clock, PlayCircle, FileText,
  UploadCloud, Image, Trash2, ZoomIn, X, Camera, Loader2, ChevronDown, ChevronUp,
  Eye, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";
import MathText from "@/components/MathText";

// Normalize any truthy value (true / "true" / 1) → boolean
function normBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
}

export default function PracticeRoomPage() {
  const { id } = useParams();
  const { theme } = useTheme();

  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [started, setStarted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    maxScore: number;
    objectiveEarned?: number;
    objectiveMax?: number;
    hasEssay?: boolean;
  } | null>(null);

  // Essay upload & image lightbox states
  const [uploadingKeys, setUploadingKeys] = useState<Record<string, boolean>>({});
  const [batchUploading, setBatchUploading] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});

  // AI Agent essay grader & official answer key states
  const [aiGrading, setAiGrading] = useState(false);
  const [aiGradeResult, setAiGradeResult] = useState<any>(null);
  const [showOfficialKeyModal, setShowOfficialKeyModal] = useState(false);
  const [activeKeyPageIdx, setActiveKeyPageIdx] = useState(0);

  // Candidate info for new/guest students
  const [candidateInfo, setCandidateInfo] = useState({
    fullName: "",
    phone: "",
    schoolClass: "",
  });
  const [candidateError, setCandidateError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("minda_user_name");
      if (savedName) {
        setCandidateInfo(prev => ({ ...prev, fullName: prev.fullName || savedName }));
      }
    }
  }, []);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        const headers: Record<string, string> = {};
        if (token && token !== "null" && token !== "undefined") {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${id}`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          setAssignment(data);

          // Kiểm tra xem học sinh đã có bài nộp chưa (chỉ gọi nếu đã đăng nhập)
          if (token && token !== "null" && token !== "undefined") {
            try {
              const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${id}/my-submission`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (subRes.ok) {
                const subData = await subRes.json();
                const hasEssay = data.quiz_data?.sections?.some((s: any) => s.type === "essay");

                setFinalResult({
                  score: subData.score !== null ? subData.score : 0,
                  maxScore: data.max_score || 10.0,
                  hasEssay: Boolean(hasEssay)
              });

              if (subData.feedback) {
                try {
                  const parsed = JSON.parse(subData.feedback);
                  if (parsed && (parsed.graded_items || parsed.total_essay_score !== undefined)) {
                    setAiGradeResult(parsed);
                  }
                } catch {}
              }

              const restoredAnswers: Record<string, any> = {};
              if (subData.quiz_answers && data.quiz_data?.sections) {
                data.quiz_data.sections.forEach((sec: any, sIdx: number) => {
                  sec.questions.forEach((q: any, qIdx: number) => {
                    const prefixedKey = q.id ? `s${sIdx}_${q.id}` : null;
                    const backendAns = prefixedKey ? subData.quiz_answers[prefixedKey] : undefined;
                    if (backendAns !== undefined) {
                      if (sec.type === "mcq" || sec.type === "short_answer") {
                        restoredAnswers[`${sIdx}_${qIdx}`] = sec.type === "mcq" ? Number(backendAns) : backendAns;
                      } else if (sec.type === "true_false") {
                        if (q.items && q.items.length > 0) {
                          const arr: boolean[] = [];
                          q.items.forEach((item: any, iIdx: number) => {
                            if (backendAns[item.label] !== undefined) {
                              arr[iIdx] = normBool(backendAns[item.label]);
                            }
                          });
                          restoredAnswers[`${sIdx}_${qIdx}`] = arr;
                        } else {
                          restoredAnswers[`${sIdx}_${qIdx}`] = normBool(backendAns);
                        }
                      } else if (sec.type === "essay") {
                        restoredAnswers[`${sIdx}_${qIdx}`] = backendAns || { images: [], notes: "" };
                      }
                    }
                  });
                });
              }
              setAnswers(restoredAnswers);
              setIsReviewMode(true);
              setStarted(true);
            }
          } catch {
            // Cho phép học sinh làm bài mới nếu chưa nộp
          }
        }
      } else {
        setError("Không tìm thấy bài tập hoặc bạn không có quyền truy cập.");
      }
      } catch (e) {
        console.error(e);
        setError("Lỗi kết nối đến máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAssignment();
  }, [id]);

  const handleAnswerSelect = (sIdx: number, qIdx: number, value: any) => {
    if (isReviewMode) return;
    setAnswers((prev) => ({ ...prev, [`${sIdx}_${qIdx}`]: value }));
  };

  const handleTrueFalseSelect = (sIdx: number, qIdx: number, itemIdx: number, isTrue: boolean) => {
    if (isReviewMode) return;
    setAnswers((prev) => {
      const key = `${sIdx}_${qIdx}`;
      const newArr = [...(prev[key] || [])];
      newArr[itemIdx] = isTrue;
      return { ...prev, [key]: newArr };
    });
  };

  const handleSingleTrueFalseSelect = (sIdx: number, qIdx: number, isTrue: boolean) => {
    if (isReviewMode) return;
    setAnswers((prev) => ({ ...prev, [`${sIdx}_${qIdx}`]: isTrue }));
  };

  // Upload ảnh cho từng câu tự luận
  const handleUploadImage = async (sIdx: number, qIdx: number, files: FileList | null) => {
    if (!files || files.length === 0 || isReviewMode) return;
    const key = `${sIdx}_${qIdx}`;
    setUploadingKeys(prev => ({ ...prev, [key]: true }));

    try {
      const token = localStorage.getItem("minda_token");
      const current = answers[key] || { images: [], notes: "" };
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/upload-submission-image`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.file_url) {
              newUrls.push(data.file_url);
              continue;
            }
          }
        } catch (e) {
          console.warn("Lỗi upload server, dùng fallback Base64:", e);
        }

        // Fallback Base64 nếu API mạng có sự cố
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newUrls.push(base64);
      }

      setAnswers(prev => ({
        ...prev,
        [key]: {
          ...current,
          images: [...(current.images || []), ...newUrls]
        }
      }));
    } catch (err) {
      console.error("Lỗi xử lý file ảnh:", err);
      alert("Không thể tải ảnh lên. Vui lòng thử lại!");
    } finally {
      setUploadingKeys(prev => ({ ...prev, [key]: false }));
    }
  };

  // Upload toàn bộ ảnh bài làm cho toàn bộ phần tự luận
  const handleBatchUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || isReviewMode || !assignment?.quiz_data?.sections) return;
    const essaySectionIdx = assignment.quiz_data.sections.findIndex((s: any) => s.type === "essay");
    if (essaySectionIdx === -1) return;

    setBatchUploading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/upload-submission-image`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            if (data.file_url) {
              uploadedUrls.push(data.file_url);
              continue;
            }
          }
        } catch (e) {}

        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(base64);
      }

      if (uploadedUrls.length === 0) return;

      // Đính kèm ảnh vào tất cả các câu tự luận trong phần này
      setAnswers(prev => {
        const updated = { ...prev };
        const sec = assignment.quiz_data.sections[essaySectionIdx];
        sec.questions.forEach((_: any, qIdx: number) => {
          const k = `${essaySectionIdx}_${qIdx}`;
          const cur = updated[k] || { images: [], notes: "" };
          updated[k] = {
            ...cur,
            images: Array.from(new Set([...(cur.images || []), ...uploadedUrls]))
          };
        });
        return updated;
      });

      alert(`✅ Đã tải lên thành công ${uploadedUrls.length} ảnh bài làm và đính kèm vào tất cả các câu tự luận!`);
    } catch (err) {
      console.error("Lỗi batch upload:", err);
      alert("Lỗi khi tải ảnh. Vui lòng thử lại!");
    } finally {
      setBatchUploading(false);
    }
  };

  const handleRemoveImage = (sIdx: number, qIdx: number, imgIdx: number) => {
    if (isReviewMode) return;
    const key = `${sIdx}_${qIdx}`;
    setAnswers(prev => {
      const cur = prev[key];
      if (!cur || !cur.images) return prev;
      const newImages = [...cur.images];
      newImages.splice(imgIdx, 1);
      return {
        ...prev,
        [key]: {
          ...cur,
          images: newImages
        }
      };
    });
  };

  const handleNotesChange = (sIdx: number, qIdx: number, notes: string) => {
    if (isReviewMode) return;
    const key = `${sIdx}_${qIdx}`;
    setAnswers(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { images: [] }),
        notes
      }
    }));
  };

  const triggerAiGrader = async (submissionId?: number, customAnswers?: any) => {
    setAiGrading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token && token !== "null" && token !== "undefined") {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      let payloadAnswers = customAnswers;
      if (!payloadAnswers) {
        payloadAnswers = {};
        if (assignment?.quiz_data?.sections) {
          assignment.quiz_data.sections.forEach((sec: any, sIdx: number) => {
            sec.questions.forEach((q: any, qIdx: number) => {
              const qid = q.id ? `s${sIdx}_${q.id}` : `s${sIdx}_q${qIdx}`;
              if (sec.type === "essay") {
                payloadAnswers[qid] = answers[`${sIdx}_${qIdx}`] || { images: [], notes: "" };
              }
            });
          });
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${assignment.id}/grade-essay-ai`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          submission_id: submissionId || undefined,
          quiz_answers: payloadAnswers,
          candidate_info: candidateInfo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiGradeResult(data);
        if (data.updated_total_score !== undefined) {
          setFinalResult(prev => prev ? { ...prev, score: data.updated_total_score } : null);
        } else if (data.total_essay_score !== undefined) {
          setFinalResult(prev => {
            if (!prev) return null;
            const objScore = prev.objectiveEarned !== undefined ? prev.objectiveEarned : prev.score;
            return {
              ...prev,
              score: Math.round((objScore + Number(data.total_essay_score)) * 100) / 100
            };
          });
        }
      }
    } catch (err) {
      console.error("AI Grader error:", err);
    } finally {
      setAiGrading(false);
    }
  };

  const handleStartExam = () => {
    if (!candidateInfo.fullName.trim()) {
      setCandidateInfo(prev => ({ ...prev, fullName: "Thí sinh tự do" }));
    }
    setCandidateError("");
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitQuiz = async () => {
    if (!confirm("Bạn đã chắc chắn muốn nộp bài chưa? Bạn sẽ không thể sửa lại đáp án!")) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("minda_token");
      let objectiveEarned = 0;
      let objectiveMax = 0;
      let correctCount = 0;
      let totalQuestions = 0;
      const backendQuizAnswers: Record<string, any> = {};
      const allEssayImages: string[] = [];

      if (assignment.quiz_data?.sections) {
        assignment.quiz_data.sections.forEach((sec: any, sIdx: number) => {
          sec.questions.forEach((q: any, qIdx: number) => {
            totalQuestions++;
            const studentAns = answers[`${sIdx}_${qIdx}`];
            const qid = q.id ? `s${sIdx}_${q.id}` : `s${sIdx}_q${qIdx}`;
            const qScore = Number(q.score) || 0.25;

            if (sec.type === "mcq") {
              objectiveMax += qScore;
              backendQuizAnswers[qid] = studentAns;
              if (studentAns !== undefined && String(studentAns) === String(q.correctAnswer)) {
                correctCount++;
                objectiveEarned += qScore;
              }
            } else if (sec.type === "short_answer") {
              objectiveMax += qScore;
              backendQuizAnswers[qid] = studentAns;
              const sClean = String(studentAns || "").trim().toLowerCase().replace(",", ".");
              const cClean = String(q.correctAnswer || "").trim().toLowerCase().replace(",", ".");
              const accepted = (q.acceptedAnswers || []).map((a: string) => String(a).trim().toLowerCase().replace(",", "."));
              const isMatch = sClean !== "" && (
                sClean === cClean ||
                accepted.includes(sClean) ||
                (sClean.replace(/\s+/g, '') === cClean.replace(/\s+/g, '')) ||
                accepted.some((a: string) => sClean.replace(/\s+/g, '') === a.replace(/\s+/g, ''))
              );
              if (isMatch) {
                correctCount++;
                objectiveEarned += qScore;
              }
            } else if (sec.type === "true_false") {
              objectiveMax += qScore;
              if (q.items && q.items.length > 0) {
                const tfAnsDict: Record<string, boolean> = {};
                const studentAnsArr = studentAns || [];
                let allCorrect = true;
                q.items.forEach((item: any, i: number) => {
                  const lbl = item.label || String(i);
                  if (studentAnsArr[i] !== undefined) tfAnsDict[lbl] = studentAnsArr[i];
                  if (normBool(studentAnsArr[i]) !== normBool(item.isTrue)) allCorrect = false;
                });
                backendQuizAnswers[qid] = tfAnsDict;
                if (allCorrect) {
                  correctCount++;
                  objectiveEarned += qScore;
                }
              } else {
                backendQuizAnswers[qid] = studentAns;
                if (studentAns !== undefined && normBool(studentAns) === normBool(q.isTrue)) {
                  correctCount++;
                  objectiveEarned += qScore;
                }
              }
            } else if (sec.type === "essay") {
              const essayVal = studentAns || { images: [], notes: "" };
              backendQuizAnswers[qid] = essayVal;
              if (essayVal?.images && Array.isArray(essayVal.images)) {
                allEssayImages.push(...essayVal.images);
              }
            }
          });
        });
      }

      const hasEssay = assignment.quiz_data?.sections?.some((s: any) => s.type === "essay");
      const finalScore = Math.round(objectiveEarned * 100) / 100;
      const roundedObjMax = Math.round(objectiveMax * 100) / 100;

      const reqHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (token && token !== "null" && token !== "undefined") {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          quiz_answers: backendQuizAnswers,
          file_url: allEssayImages.length > 0 ? allEssayImages[0] : null,
          candidate_info: candidateInfo,
          content: candidateInfo.fullName
            ? `[Thí sinh mới: ${candidateInfo.fullName} | SĐT: ${candidateInfo.phone} | Lớp: ${candidateInfo.schoolClass}]. Điểm TN: ${finalScore}/${roundedObjMax}đ. Tự luận: ${allEssayImages.length} ảnh.`
            : (hasEssay
              ? `Bài nộp trắc nghiệm & tự luận. Điểm trắc nghiệm: ${finalScore}/${roundedObjMax}đ. Đã tải lên ${allEssayImages.length} ảnh bài làm tự luận.`
              : `Ghi nhận làm đề trắc nghiệm tự động chấm. Số câu đúng: ${correctCount}/${totalQuestions}`),
        }),
      });

      if (res.ok) {
        const sub = await res.json();
        setFinalResult({
          score: sub.score !== null ? sub.score : finalScore,
          maxScore: assignment.max_score || 10.0,
          objectiveEarned: finalScore,
          objectiveMax: roundedObjMax,
          hasEssay: Boolean(hasEssay)
        });
        setIsReviewMode(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (hasEssay) {
          triggerAiGrader(sub?.id, backendQuizAnswers);
        }
      } else {
        setFinalResult({
          score: finalScore,
          maxScore: assignment.max_score || 10.0,
          objectiveEarned: finalScore,
          objectiveMax: roundedObjMax,
          hasEssay: Boolean(hasEssay)
        });
        setIsReviewMode(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (hasEssay) {
          triggerAiGrader(undefined, backendQuizAnswers);
        }
      }
    } catch (e) {
      console.error("Lỗi gửi bài:", e);
      setIsReviewMode(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    if (!confirm("Bài làm mới sẽ ghi đè điểm cũ. Bạn có chắc muốn làm lại không?")) return;
    setAnswers({});
    setIsReviewMode(false);
    setFinalResult(null);
    setStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center text-gray-500">
        <AlertCircle className="w-12 h-12 text-red-500/50 mb-3" />
        <p>{error}</p>
        <Link href="/practice" className="mt-4 text-indigo-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại Phòng Luyện Thi
        </Link>
      </div>
    );
  }

  const sections = assignment.quiz_data?.sections || [];
  const isStandard = assignment.exam_format === "standard";

  const totalQ = sections.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0);
  const practicePointPerQ = totalQ > 0 ? (assignment.max_score / totalQ) : 0;

  const getQPoints = (secType: string, qScore?: number) => {
    if (qScore !== undefined && qScore !== null) return Number(qScore);
    if (isStandard) {
      if (secType === "mcq") return 0.25;
      if (secType === "true_false") return 0.25;
      if (secType === "short_answer") return 0.25;
      if (secType === "essay") return 1.0;
      return 0;
    }
    return practicePointPerQ;
  };

  const fmtPts = (pts: number) => parseFloat(pts.toFixed(2)).toString();

  return (
    <div className={`min-h-screen font-outfit ${theme === "dark" ? "bg-[#050505] text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-4 sm:px-6 py-4 flex items-center justify-between ${theme === "dark" ? "bg-black/50 border-white/10" : "bg-white/80 border-gray-200 shadow-sm"}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/practice" className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-500/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-base sm:text-lg line-clamp-1">{assignment.title}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Thời gian: {assignment.quiz_data?.duration_minutes || 90} phút
            </p>
          </div>
        </div>
        {started && !isReviewMode && (
          <button onClick={submitQuiz} disabled={submitting} className="px-5 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-600/25">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Nộp Bài</span>
          </button>
        )}
        {isReviewMode && (
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleRetake}
              className="px-4 sm:px-5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
            >
              <PlayCircle className="w-4 h-4" /> Làm Lại
            </button>
            <Link href="/practice" className="px-4 sm:px-5 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Danh Sách Đề
            </Link>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {!started ? (
          /* Welcome screen */
          <div className={`rounded-3xl border p-6 sm:p-8 md:p-12 text-center mt-6 sm:mt-10 ${theme === "dark" ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-xl shadow-gray-200/50"}`}>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">{assignment.title}</h2>
            {assignment.quiz_data?.school && (
              <p className="text-sm font-semibold text-indigo-500 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                {assignment.quiz_data.school}
              </p>
            )}
            <p className="text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
              {assignment.description || "Bài thi kết hợp trắc nghiệm (chọn đáp án/điền kết quả) và tự luận (chụp ảnh bài làm tải lên). Chúc bạn hoàn thành bài thi thật tốt!"}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="px-6 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{sections.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0)}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Câu Hỏi / Bài</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-green-500/5 border border-green-500/10 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-500">{assignment.max_score || 10.0}đ</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Thang Điểm</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center">
                <span className="text-2xl font-bold text-amber-500">{assignment.quiz_data?.duration_minutes || 90}p</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Thời Gian</span>
              </div>
            </div>

            {assignment.quiz_data?.originalDocUrl && (
              <div className="mt-8 flex justify-center">
                <a
                  href={assignment.quiz_data.originalDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 text-sm font-bold text-indigo-500 transition-colors"
                >
                  <FileText className="w-5 h-5 text-indigo-500" />
                  Xem & Tải Đề Gốc Bản In (PDF)
                </a>
              </div>
            )}

            {/* Candidate Information Card for Guest / New Students */}
            <div className={`mt-8 max-w-lg mx-auto p-5 sm:p-6 rounded-2xl border text-left ${theme === "dark" ? "bg-white/[0.03] border-white/10" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="font-bold text-sm sm:text-base">Thông Tin Thí Sinh Mới</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">Đánh giá năng lực</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Điền thông tin để MINDA ghi nhận kết quả và gửi thông báo trực tiếp kết quả về giáo viên phụ trách nhé.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    Họ và tên thí sinh / học sinh <span className="text-gray-500 font-normal">(Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={candidateInfo.fullName}
                    onChange={(e) => {
                      setCandidateInfo(prev => ({ ...prev, fullName: e.target.value }));
                      if (candidateError) setCandidateError("");
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-transparent outline-none transition-colors ${
                      theme === "dark" ? "border-white/15 focus:border-indigo-500 bg-white/5" : "border-gray-300 focus:border-indigo-500 bg-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    Số điện thoại / Zalo phụ huynh <span className="text-gray-500 font-normal">(Tùy chọn - để nhận kết quả)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912 345 678"
                    value={candidateInfo.phone}
                    onChange={(e) => {
                      setCandidateInfo(prev => ({ ...prev, phone: e.target.value }));
                      if (candidateError) setCandidateError("");
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-transparent outline-none transition-colors ${
                      theme === "dark" ? "border-white/15 focus:border-indigo-500 bg-white/5" : "border-gray-300 focus:border-indigo-500 bg-white"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-400">
                    Trường / Lớp hiện tại
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lớp 9A - THCS Lý Thường Kiệt"
                    value={candidateInfo.schoolClass}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, schoolClass: e.target.value }))}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-transparent outline-none transition-colors ${
                      theme === "dark" ? "border-white/15 focus:border-indigo-500 bg-white/5" : "border-gray-300 focus:border-indigo-500 bg-white"
                    }`}
                  />
                </div>
              </div>

              {candidateError && (
                <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{candidateError}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleStartExam}
              className="mt-8 sm:mt-10 px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-base sm:text-lg shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 mx-auto transition-transform hover:-translate-y-1 active:scale-95"
            >
              <PlayCircle className="w-6 h-6" /> Bắt Đầu Làm Bài
            </button>
          </div>
        ) : (
          /* Taking & Review Mode */
          <div className="space-y-10 pb-20">
            {/* Top document action bar */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              {assignment.quiz_data?.originalDocUrl && (
                <a
                  href={assignment.quiz_data.originalDocUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-xs font-bold text-indigo-500 transition-colors border border-indigo-500/20"
                >
                  <FileText className="w-3.5 h-3.5" /> Xem Đề Gốc (PDF)
                </a>
              )}
              {(assignment.quiz_data?.answerKeyDocUrl || "/static/docs/dap_an_de_giua_hoc_ky_1_toan_9.pdf") && (
                <a
                  href={assignment.quiz_data?.answerKeyDocUrl || "/static/docs/dap_an_de_giua_hoc_ky_1_toan_9.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-colors border border-emerald-500/30"
                >
                  <FileText className="w-3.5 h-3.5" /> Đáp Án Gốc (PDF)
                </a>
              )}
              {assignment.quiz_data?.answerKeyImages && assignment.quiz_data.answerKeyImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOfficialKeyModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 transition-colors border border-purple-500/30"
                >
                  <Eye className="w-3.5 h-3.5" /> Bản Ảnh Đáp Án Bộ Đề
                </button>
              )}
            </div>

            {/* Review mode result banner */}
            {isReviewMode && finalResult && (
              <div className="space-y-6 mb-8">
                <div className={`rounded-3xl border-2 border-emerald-500/40 p-6 sm:p-8 text-center shadow-xl ${
                  theme === "dark" ? "bg-gradient-to-b from-emerald-500/15 via-bg-card to-bg-card" : "bg-gradient-to-b from-emerald-50 via-white to-white"
                }`}>
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto mb-3 flex items-center justify-center">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black mb-1 text-text-primary">Đã Nộp Bài & Hoàn Thành!</h2>
                  <p className="text-xs sm:text-sm text-text-muted">Đáp án chính thức và phân tích chi tiết của AI Agent đã sẵn sàng bên dưới.</p>
                  
                  {/* Score Board Cards */}
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6">
                    {/* Objective Score */}
                    <div className="bg-bg-card/90 px-5 sm:px-6 py-3.5 rounded-2xl border border-border-card text-center shadow-sm min-w-[150px]">
                      <span className="text-[11px] uppercase font-bold text-text-muted block mb-0.5">Trắc Nghiệm & Điền Khuyết</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl">
                        {finalResult.objectiveEarned !== undefined ? finalResult.objectiveEarned : finalResult.score} / {finalResult.objectiveMax || 3.0}đ
                      </span>
                    </div>

                    {/* Essay Score / Agent Grading State */}
                    {finalResult.hasEssay && (
                      <div className="bg-bg-card/90 px-5 sm:px-6 py-3.5 rounded-2xl border border-purple-500/30 text-center shadow-sm min-w-[190px]">
                        <span className="text-[11px] uppercase font-bold text-purple-600 dark:text-purple-400 block mb-0.5">Tự Luận (AI Agent Chấm)</span>
                        {aiGrading ? (
                          <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-300 py-1">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            <span>Đang đọc ảnh & chấm...</span>
                          </div>
                        ) : aiGradeResult ? (
                          <span className="text-purple-600 dark:text-purple-400 font-black text-2xl sm:text-3xl">
                            {aiGradeResult.total_essay_score} / {aiGradeResult.max_essay_score || 7.0}đ
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-sm block py-1">
                            ⏳ Chờ kích hoạt chấm
                          </span>
                        )}
                      </div>
                    )}

                    {/* Total Grand Score */}
                    <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-6 sm:px-8 py-3.5 rounded-2xl border-2 border-emerald-500/50 text-center shadow-md min-w-[170px]">
                      <span className="text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">Tổng Điểm Bài Thi</span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-black text-3xl sm:text-4xl">
                        {finalResult.score} / {finalResult.maxScore || 10.0}đ
                      </span>
                    </div>
                  </div>

                  {/* Actions in Banner */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-6 pt-5 border-t border-border-card">
                    {finalResult.hasEssay && (
                      <button
                        type="button"
                        onClick={() => triggerAiGrader()}
                        disabled={aiGrading}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:-translate-y-0.5 active:scale-95"
                      >
                        {aiGrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                        {aiGrading ? "AI Agent Đang Phân Tích..." : "Chấm Lại Bằng AI Agent"}
                      </button>
                    )}

                    {assignment.quiz_data?.answerKeyImages && assignment.quiz_data.answerKeyImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowOfficialKeyModal(true)}
                        className="px-5 py-2.5 bg-bg-card hover:bg-bg-hover text-text-primary rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-border-card transition shadow-sm"
                      >
                        <Eye className="w-4 h-4 text-purple-500" /> Xem Ảnh Đáp Án Bộ Đề
                      </button>
                    )}

                    <button
                      onClick={handleRetake}
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-transform hover:-translate-y-0.5"
                    >
                      <PlayCircle className="w-4 h-4" /> Làm Lại Bài
                    </button>

                    <Link
                      href="/practice"
                      className="px-5 py-2.5 bg-bg-card hover:bg-bg-hover text-text-primary rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 border border-border-card transition"
                    >
                      <ArrowLeft className="w-4 h-4" /> Về Phòng Luyện Thi
                    </Link>
                  </div>
                </div>

                {/* AI Agent General Feedback Card */}
                {aiGradeResult && (
                  <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent p-5 sm:p-7 shadow-lg space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-lg shadow-sm">
                          🤖
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-text-primary flex items-center gap-2">
                            MINDA AI AGENT &mdash; NHẬN XÉT CỦA GIÁM KHẢO
                            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Chấm Chuẩn Biểu Điểm
                            </span>
                          </h4>
                          <p className="text-[11px] text-text-muted">Đã đối chiếu bài làm viết tay của học sinh với đáp án chính thức của trường</p>
                        </div>
                      </div>
                      <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 font-black text-xs sm:text-sm">
                        Điểm Tự Luận: {aiGradeResult.total_essay_score} / {aiGradeResult.max_essay_score || 7.0}đ
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
                      {aiGradeResult.general_comment}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Questions sections */}
            {sections.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Bài tập này không có câu hỏi.</div>
            ) : (
              sections.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="space-y-6">
                  {sec.instruction && (
                    <div className="sticky top-[72px] z-40 bg-indigo-500/10 backdrop-blur-md text-indigo-400 border border-indigo-500/20 px-5 sm:px-6 py-3 rounded-2xl font-bold text-sm sm:text-base">
                      <MathText>{sec.instruction}</MathText>
                    </div>
                  )}

                  {/* Batch upload bar for entire essay section */}
                  {sec.type === "essay" && !isReviewMode && (
                    <div className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
                      theme === "dark" ? "border-indigo-500/30 bg-indigo-500/[0.04]" : "border-indigo-300 bg-indigo-50/60"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
                          {batchUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-text-primary">Tải nhanh toàn bộ ảnh bài làm Tự luận (Tất cả các bài)</h5>
                          <p className="text-xs text-text-muted mt-0.5">
                            Nếu bạn làm trên giấy gồm 2-3 trang ảnh, hãy bấm vào đây để tải lên một lần cho toàn bộ bài thi.
                          </p>
                        </div>
                      </div>
                      <label className="cursor-pointer px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 shrink-0 shadow-lg shadow-indigo-600/20">
                        <UploadCloud className="w-4 h-4" />
                        <span>{batchUploading ? "Đang tải ảnh lên..." : "Tải tất cả các trang ảnh"}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={batchUploading}
                          onChange={(e) => handleBatchUpload(e.target.files)}
                        />
                      </label>
                    </div>
                  )}

                  <div className="space-y-6">
                    {sec.questions?.map((q: any, qIdx: number) => {
                      const qAns = answers[`${sIdx}_${qIdx}`];
                      const qScore = getQPoints(sec.type, q.score);

                      // Determine if card is correct
                      let isCorrectCard = false;
                      if (isReviewMode) {
                        if (sec.type === "mcq") {
                          isCorrectCard = qAns !== undefined && String(qAns) === String(q.correctAnswer);
                        } else if (sec.type === "short_answer") {
                          const sClean = String(qAns || "").trim().toLowerCase().replace(",", ".");
                          const cClean = String(q.correctAnswer || "").trim().toLowerCase().replace(",", ".");
                          const accepted = (q.acceptedAnswers || []).map((a: string) => String(a).trim().toLowerCase().replace(",", "."));
                          isCorrectCard = sClean !== "" && (
                            sClean === cClean ||
                            accepted.includes(sClean) ||
                            (sClean.replace(/\s+/g, '') === cClean.replace(/\s+/g, '')) ||
                            accepted.some((a: string) => sClean.replace(/\s+/g, '') === a.replace(/\s+/g, ''))
                          );
                        } else if (sec.type === "true_false") {
                          if (q.items && q.items.length > 0) {
                            const arr = qAns || [];
                            isCorrectCard = q.items.every((item: any, i: number) => normBool(arr[i]) === normBool(item.isTrue));
                          } else {
                            isCorrectCard = qAns !== undefined && normBool(qAns) === normBool(q.isTrue);
                          }
                        }
                      }

                      // Badge text & color
                      let badgeText = `${fmtPts(qScore)}đ`;
                      let badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                      let cardBg = theme === "dark" ? "bg-[#0a0a0a] border-white/5" : "bg-white border-gray-100 shadow-md";

                      if (isReviewMode) {
                        if (sec.type === "essay") {
                          badgeText = `Tự luận: ${fmtPts(qScore)}đ`;
                          badgeColor = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                          cardBg = theme === "dark" ? "bg-[#0a0a0a] border-indigo-500/20" : "bg-white border-indigo-200 shadow-md";
                        } else if (isCorrectCard) {
                          badgeText = `+${fmtPts(qScore)}đ`;
                          badgeColor = "bg-green-500/10 text-green-400 border-green-500/20";
                          cardBg = theme === "dark" ? "bg-green-500/5 border-green-500/30" : "bg-green-50 border-green-200";
                        } else {
                          badgeText = "0đ";
                          badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                          cardBg = theme === "dark" ? "bg-red-500/5 border-red-500/30" : "bg-red-50 border-red-200";
                        }
                      }

                      return (
                        <div
                          key={q.id || qIdx}
                          className={`rounded-2xl border p-5 sm:p-6 md:p-8 transition-colors ${cardBg}`}
                        >
                          <h4 className="font-semibold text-base sm:text-lg mb-5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                                isReviewMode
                                  ? sec.type === "essay"
                                    ? "bg-indigo-500 text-white"
                                    : isCorrectCard
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                  : "bg-indigo-500/20 text-indigo-500"
                              }`}>
                                {qIdx + 1}
                              </span>
                              <span className="pt-1"><MathText>{q.text}</MathText></span>
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </h4>

                          {/* Image preview attached to problem if any */}
                          {q.imageUrl && (
                            <div className="mb-6 pl-4 md:pl-11">
                              <img src={q.imageUrl} alt="minh họa câu hỏi" className="max-w-full max-h-[350px] rounded-xl border shadow-sm object-contain" />
                            </div>
                          )}

                          {/* ── 1. MCQ ── */}
                          {sec.type === "mcq" && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 md:pl-11">
                              {q.options.map((opt: string, oIdx: number) => {
                                const isSelected = qAns !== undefined && String(qAns) === String(oIdx);
                                const isTrueAnswer = isReviewMode && String(q.correctAnswer) === String(oIdx);

                                let bgClass = isSelected
                                  ? "border-indigo-500 bg-indigo-500/5"
                                  : theme === "dark"
                                  ? "border-white/5 bg-white/[0.02] hover:border-white/20"
                                  : "border-gray-100 bg-gray-50 hover:border-indigo-200";

                                if (isReviewMode) {
                                  if (isTrueAnswer) bgClass = "border-green-500 bg-green-500/10 font-bold";
                                  else if (isSelected && !isTrueAnswer) bgClass = "border-red-500 bg-red-500/10 opacity-70";
                                  else bgClass = theme === "dark" ? "border-white/5 bg-white/[0.02] opacity-40" : "border-gray-100 bg-gray-50 opacity-40";
                                }

                                return (
                                  <div
                                    key={oIdx}
                                    onClick={() => handleAnswerSelect(sIdx, qIdx, oIdx)}
                                    className={`p-3.5 sm:p-4 rounded-xl border-2 ${!isReviewMode ? "cursor-pointer" : ""} transition-all flex items-center gap-3 ${bgClass}`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isReviewMode ? (isTrueAnswer ? "border-green-500" : isSelected ? "border-red-500" : "border-gray-400") : isSelected ? "border-indigo-500" : "border-gray-400"}`}>
                                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${isReviewMode ? (isTrueAnswer ? "bg-green-500" : "bg-red-500") : "bg-indigo-500"}`} />}
                                      {isReviewMode && isTrueAnswer && !isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                    </div>
                                    <span className={isTrueAnswer ? (theme === "dark" ? "text-green-400" : "text-green-700") : isSelected && isReviewMode ? (theme === "dark" ? "text-red-400" : "text-red-700") : ""}>
                                      <MathText>{opt}</MathText>
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* ── 2. TRUE / FALSE ── */}
                          {sec.type === "true_false" && (
                            q.items && q.items.length > 0 ? (
                              <div className="space-y-3 pl-4 md:pl-11">
                                {q.items.map((item: any, iIdx: number) => {
                                  const currentVal = qAns?.[iIdx];
                                  const itemIsTrue = normBool(item.isTrue);
                                  const studentChose = currentVal !== undefined ? normBool(currentVal) : undefined;
                                  const isItemWrong = isReviewMode && studentChose !== undefined && studentChose !== itemIsTrue;
                                  const isItemCorrect = isReviewMode && studentChose !== undefined && studentChose === itemIsTrue;

                                  return (
                                    <div
                                      key={iIdx}
                                      className={`rounded-xl flex flex-col gap-3 border ${
                                        isItemWrong
                                          ? theme === "dark" ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200"
                                          : isItemCorrect
                                          ? theme === "dark" ? "bg-green-500/5 border-green-500/20" : "bg-green-50/50 border-green-200"
                                          : theme === "dark" ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-100"
                                      } p-4`}
                                    >
                                      <div className="flex items-start gap-2">
                                        <span className="font-bold text-gray-500 opacity-60 shrink-0">{item.label || "Ý"}.</span>
                                        <span className="font-medium text-sm sm:text-[15px]"><MathText>{item.text}</MathText></span>
                                      </div>

                                      {!isReviewMode ? (
                                        <div className="flex items-center gap-2 self-end bg-black/5 dark:bg-white/5 p-1 rounded-lg">
                                          <button
                                            type="button"
                                            onClick={() => handleTrueFalseSelect(sIdx, qIdx, iIdx, true)}
                                            className={`px-5 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-colors ${studentChose === true ? "bg-green-500 text-white shadow-md shadow-green-500/30" : "text-gray-500 hover:bg-black/10 dark:hover:bg-white/10"}`}
                                          >
                                            ĐÚNG
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleTrueFalseSelect(sIdx, qIdx, iIdx, false)}
                                            className={`px-5 py-1.5 rounded-md font-bold text-xs sm:text-sm transition-colors ${studentChose === false ? "bg-red-500 text-white shadow-md shadow-red-500/30" : "text-gray-500 hover:bg-black/10 dark:hover:bg-white/10"}`}
                                          >
                                            SAI
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/5 text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-500 uppercase">Bạn chọn:</span>
                                            {studentChose === undefined ? (
                                              <span className="px-2.5 py-0.5 rounded-full font-bold bg-gray-500/20 text-gray-400">Chưa trả lời</span>
                                            ) : (
                                              <span className={`px-2.5 py-0.5 rounded-full font-bold ${studentChose === itemIsTrue ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                                                {studentChose ? "ĐÚNG" : "SAI"} {studentChose === itemIsTrue ? "✓" : "✗"}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-500 uppercase">Đáp án đúng:</span>
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold ${itemIsTrue ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                              {itemIsTrue ? "ĐÚNG" : "SAI"}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              /* Single true/false statement */
                              <div className="pl-4 md:pl-11 mt-3">
                                {!isReviewMode ? (
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => handleSingleTrueFalseSelect(sIdx, qIdx, true)}
                                      className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${qAns === true ? "bg-green-500 text-white shadow-lg shadow-green-500/30" : "bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-green-500/20"}`}
                                    >
                                      ĐÚNG
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSingleTrueFalseSelect(sIdx, qIdx, false)}
                                      className={`px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${qAns === false ? "bg-red-500 text-white shadow-lg shadow-red-500/30" : "bg-black/5 dark:bg-white/5 text-gray-500 hover:bg-red-500/20"}`}
                                    >
                                      SAI
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-500 uppercase">Bạn chọn:</span>
                                      {qAns === undefined ? (
                                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-gray-500/20 text-gray-400">Chưa trả lời</span>
                                      ) : (
                                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${normBool(qAns) === normBool(q.isTrue) ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                                          {normBool(qAns) ? "ĐÚNG" : "SAI"} {normBool(qAns) === normBool(q.isTrue) ? "✓" : "✗"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-500 uppercase">Đáp án đúng:</span>
                                      <span className={`px-2.5 py-0.5 rounded-full font-bold ${normBool(q.isTrue) ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                        {normBool(q.isTrue) ? "ĐÚNG" : "SAI"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          {/* ── 3. SHORT ANSWER ── */}
                          {sec.type === "short_answer" && (
                            <div className="pl-4 md:pl-11 mt-4 relative">
                              <input
                                type="text"
                                value={qAns || ""}
                                onChange={(e) => handleAnswerSelect(sIdx, qIdx, e.target.value)}
                                disabled={isReviewMode}
                                placeholder="Nhập câu trả lời ngắn của bạn (ví dụ: {-1; 1/3}, 3/4, -7a < -7b)..."
                                className={`w-full px-5 py-3.5 rounded-xl border-2 outline-none font-medium transition-colors focus:border-indigo-500 text-sm ${theme === "dark" ? "bg-black border-white/10 text-white" : "bg-white border-gray-200"}`}
                              />
                              {isReviewMode && (
                                <div className="mt-3 p-3.5 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium text-xs sm:text-sm">
                                  Đáp án chính xác: <span className="font-black"><MathText>{q.correctAnswer}</MathText></span>
                                </div>
                              )}
                              {!isReviewMode && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                  <CheckCircle className={`w-5 h-5 ${qAns ? "text-green-500" : "opacity-0"}`} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── 4. ESSAY / TỰ LUẬN (IMAGE UPLOAD ZONE) ── */}
                          {sec.type === "essay" && (
                            <div className="pl-2 sm:pl-4 md:pl-11 mt-4 space-y-4">
                              {!isReviewMode ? (
                                <div className="space-y-3">
                                  {/* Upload card box */}
                                  <div className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2.5 ${
                                    theme === "dark"
                                      ? "border-indigo-500/30 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.08]"
                                      : "border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50"
                                  }`}>
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                      {uploadingKeys[`${sIdx}_${qIdx}`] ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                      ) : (
                                        <Camera className="w-6 h-6" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-text-primary">
                                        {uploadingKeys[`${sIdx}_${qIdx}`] ? "Đang tải ảnh bài làm lên máy chủ..." : "Tải ảnh bài làm cho câu này"}
                                      </p>
                                      <p className="text-xs text-text-muted mt-0.5">
                                        Chụp ảnh bài làm trên giấy (JPG, PNG, HEIC, PDF). Bạn có thể chọn nhiều ảnh cùng lúc.
                                      </p>
                                    </div>

                                    <label className="cursor-pointer mt-1 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95">
                                      <UploadCloud className="w-4 h-4" />
                                      <span>Chọn ảnh tải lên</span>
                                      <input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                        disabled={uploadingKeys[`${sIdx}_${qIdx}`]}
                                        onChange={(e) => handleUploadImage(sIdx, qIdx, e.target.files)}
                                      />
                                    </label>
                                  </div>

                                  {/* Thumbnails of uploaded images */}
                                  {qAns?.images && qAns.images.length > 0 && (
                                    <div className="space-y-2 pt-1">
                                      <span className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Đã tải lên {qAns.images.length} trang ảnh bài làm:
                                      </span>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {qAns.images.map((imgUrl: string, imgIdx: number) => (
                                          <div
                                            key={imgIdx}
                                            className="group relative rounded-xl border border-border-card overflow-hidden bg-bg-main aspect-[4/3] shadow-sm"
                                          >
                                            <img
                                              src={imgUrl}
                                              alt={`Bài làm trang ${imgIdx + 1}`}
                                              className="w-full h-full object-cover cursor-pointer transition group-hover:scale-105"
                                              onClick={() => setLightboxImg(imgUrl)}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLightboxImg(imgUrl); }}
                                                className="pointer-events-auto p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition"
                                                title="Phóng to"
                                              >
                                                <ZoomIn className="w-4 h-4" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(sIdx, qIdx, imgIdx); }}
                                                className="pointer-events-auto p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition"
                                                title="Xoá ảnh này"
                                              >
                                                <Trash2 className="w-4 h-4" />
                                              </button>
                                            </div>
                                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-none">
                                              Trang {imgIdx + 1}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes textarea */}
                                  <div>
                                    <textarea
                                      value={qAns?.notes || ""}
                                      onChange={(e) => handleNotesChange(sIdx, qIdx, e.target.value)}
                                      placeholder="Ghi chú thêm về lời giải hoặc bài làm (tùy chọn)..."
                                      rows={2}
                                      className={`w-full px-4 py-2.5 rounded-xl border text-xs outline-none transition focus:border-indigo-500 ${
                                        theme === "dark" ? "bg-black/40 border-white/10 text-white" : "bg-white border-gray-200 text-gray-800"
                                      }`}
                                    />
                                  </div>
                                </div>
                              ) : (
                                /* Review Mode for Essay */
                                <div className="space-y-4">
                                  {qAns?.images && qAns.images.length > 0 ? (
                                    <div className="space-y-2">
                                      <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" /> Ảnh bài làm đã nộp ({qAns.images.length} trang ảnh) - Nhấn vào để phóng to:
                                      </span>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {qAns.images.map((imgUrl: string, imgIdx: number) => (
                                          <div
                                            key={imgIdx}
                                            onClick={() => setLightboxImg(imgUrl)}
                                            className="group relative rounded-xl border border-border-card overflow-hidden bg-bg-main aspect-[4/3] cursor-pointer shadow-sm hover:ring-2 hover:ring-indigo-500 transition"
                                          >
                                            <img
                                              src={imgUrl}
                                              alt={`Bài làm trang ${imgIdx + 1}`}
                                              className="w-full h-full object-cover transition group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <span className="px-2.5 py-1 rounded-full bg-black/75 text-white text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                                <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                                              </span>
                                            </div>
                                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm">
                                              Trang {imgIdx + 1}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 shrink-0" />
                                      <span>(Chưa tải ảnh bài làm cho câu này)</span>
                                    </div>
                                  )}

                                  {qAns?.notes && (
                                    <div className="p-3 rounded-xl bg-bg-main border border-border-card text-xs">
                                      <span className="font-bold text-text-secondary block mb-1">Ghi chú của bạn:</span>
                                      <p className="text-text-primary whitespace-pre-wrap">{qAns.notes}</p>
                                    </div>
                                  )}

                                   {/* AI Agent Grading Evaluation for this specific essay question */}
                                  {(() => {
                                    const agentItem = aiGradeResult?.graded_items?.find((item: any) =>
                                      item.id === q.id ||
                                      item.id === `essay_${qIdx + 1}` ||
                                      item.title?.includes(`Bài ${qIdx + 1}`)
                                    );
                                    if (!agentItem) return null;

                                    const isMax = agentItem.score >= agentItem.max_score;
                                    const isZero = agentItem.score === 0;

                                    return (
                                      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.04] p-4 md:p-5 space-y-3.5 shadow-sm">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                                              🤖
                                            </div>
                                            <span className="font-extrabold text-xs sm:text-sm text-text-primary">
                                              KẾT QUẢ CHẤM CỦA AI AGENT (BÀI {qIdx + 1})
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                                              isMax ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30" :
                                              !isZero ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" :
                                              "bg-rose-500/20 text-rose-500 border border-rose-500/30"
                                            }`}>
                                              {agentItem.score} / {agentItem.max_score} điểm
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-text-muted px-2 py-0.5 rounded-md bg-bg-card border border-border-card">
                                              {agentItem.status === "correct" ? "Đạt tối đa" :
                                               agentItem.status === "partial" ? "Đúng một phần" :
                                               agentItem.status === "not_attempted" ? "Chưa làm" : "Cần sửa"}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Transcription from handwriting OCR */}
                                        {agentItem.transcription && agentItem.transcription !== "Không có bài làm của học sinh cho bài này trong hình ảnh đã cung cấp." && (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-text-muted uppercase flex items-center gap-1">
                                              📝 AI Agent ghi nhận bài làm viết tay:
                                            </span>
                                            <div className="p-3 rounded-xl bg-bg-main border border-border-card text-xs text-text-primary italic leading-relaxed whitespace-pre-wrap">
                                              {agentItem.transcription}
                                            </div>
                                          </div>
                                        )}

                                        {/* Pedagogical evaluation */}
                                        {agentItem.evaluation && (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-bold text-text-muted uppercase">
                                              🔍 Đánh giá chi tiết của Giám khảo AI:
                                            </span>
                                            <p className="text-xs text-text-primary leading-relaxed">
                                              {agentItem.evaluation}
                                            </p>
                                          </div>
                                        )}

                                        {/* Step-by-step rubric check */}
                                        {agentItem.step_evaluations && agentItem.step_evaluations.length > 0 && (
                                          <div className="space-y-1.5 pt-1">
                                            <span className="text-[11px] font-bold text-text-muted uppercase">
                                              ⚖️ Biểu điểm chi tiết từng bước:
                                            </span>
                                            <div className="space-y-1.5">
                                              {agentItem.step_evaluations.map((stepItem: any, sidx: number) => (
                                                <div key={sidx} className="p-2.5 rounded-xl bg-bg-main border border-border-card flex items-start justify-between gap-3 text-xs">
                                                  <div className="space-y-0.5">
                                                    <span className="font-semibold text-text-primary">{stepItem.step}</span>
                                                    {stepItem.comment && (
                                                      <p className="text-text-muted text-[11px]">{stepItem.comment}</p>
                                                    )}
                                                  </div>
                                                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs shrink-0 ${
                                                    stepItem.awarded >= stepItem.max ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                                                    stepItem.awarded > 0 ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" :
                                                    "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                                  }`}>
                                                    +{stepItem.awarded}/{stepItem.max}đ
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Deductions if any */}
                                        {agentItem.deductions && agentItem.deductions.length > 0 && agentItem.deductions[0] !== "Không làm bài." && (
                                          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs space-y-1">
                                            <span className="font-bold block">⚠️ Điểm bị trừ / Lưu ý:</span>
                                            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                                              {agentItem.deductions.map((d: string, didx: number) => (
                                                <li key={didx}>{d}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}

                                        {/* Constructive feedback */}
                                        {agentItem.feedback && (
                                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs">
                                            <span className="font-bold">💡 Lời khuyên: </span>
                                            {agentItem.feedback}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* Detailed model solution from official answer key */}
                                  {(q.solution || q.explanation) && (
                                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 md:p-5 space-y-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const k = `${sIdx}_${qIdx}`;
                                          setExpandedSolutions(prev => ({ ...prev, [k]: !prev[k] }));
                                        }}
                                        className="w-full flex items-center justify-between font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition"
                                      >
                                        <span className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4" /> ĐÁP ÁN & HƯỚNG DẪN GIẢI CHÍNH THỨC (TRƯỜNG LÝ THƯỜNG KIỆT)
                                        </span>
                                        <span>{expandedSolutions[`${sIdx}_${qIdx}`] ? "▲ Thu gọn" : "▼ Xem lời giải"}</span>
                                      </button>

                                      {expandedSolutions[`${sIdx}_${qIdx}`] !== false && (
                                        <div className="pt-3 border-t border-emerald-500/20 text-xs sm:text-sm leading-relaxed text-text-primary space-y-3">
                                          <MathText>{q.solution || q.explanation}</MathText>

                                          {/* Rubric display */}
                                          {q.rubric && Array.isArray(q.rubric) && q.rubric.length > 0 && (
                                            <div className="pt-2 border-t border-emerald-500/10">
                                              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">
                                                Biểu điểm phân bổ:
                                              </span>
                                              <div className="space-y-1">
                                                {q.rubric.map((rb: any, rbIdx: number) => (
                                                  <div key={rbIdx} className="flex items-center justify-between text-xs py-0.5 text-text-secondary">
                                                    <span>• {rb.step}</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">+{rb.points}đ</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── Explanation for MCQ & Short Answer ── */}
                          {isReviewMode && q.explanation && sec.type !== "true_false" && sec.type !== "essay" && (
                            <div className="mt-5 pl-4 md:pl-11">
                              <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold mb-1 text-xs uppercase">Giải thích chi tiết:</p>
                                  <div className="text-xs sm:text-sm leading-relaxed"><MathText>{q.explanation}</MathText></div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Floating Image Lightbox Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] bg-bg-card rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-border-card flex items-center justify-between bg-bg-main">
              <span className="text-xs font-bold text-text-secondary flex items-center gap-2">
                <Image className="w-4 h-4 text-indigo-500" /> Chi tiết hình ảnh phóng to
              </span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 overflow-auto max-h-[calc(92vh-55px)] flex items-center justify-center bg-black/50">
              <img
                src={lightboxImg}
                alt="Phóng to"
                className="max-w-full max-h-[82vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Official Answer Key Modal (Bộ Đáp Án Chính Thức) */}
      {showOfficialKeyModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setShowOfficialKeyModal(false)}
        >
          <div
            className="relative max-w-5xl max-h-[94vh] bg-bg-card rounded-2xl overflow-hidden border border-border-card shadow-2xl flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border-card flex items-center justify-between bg-bg-main">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-text-primary flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ĐÁP ÁN & BIỂU ĐIỂM CHÍNH THỨC &mdash; MÔN TOÁN 9
                </h3>
                <p className="text-[11px] text-text-muted mt-0.5">Trường THCS Lý Thường Kiệt (UBND Xã Xuân Sơn) &bull; Năm học 2025 - 2026</p>
              </div>
              <button
                type="button"
                onClick={() => setShowOfficialKeyModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-text-primary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Page Tabs & Download */}
            <div className="px-4 py-2.5 bg-bg-main/60 border-b border-border-card flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {[0, 1].map((pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => setActiveKeyPageIdx(pIdx)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${
                      activeKeyPageIdx === pIdx
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-bg-card text-text-secondary hover:bg-bg-hover border border-border-card"
                    }`}
                  >
                    {pIdx === 0 ? "Trang 1 (Trắc nghiệm & Bài 1, 2)" : "Trang 2 (Tự luận Bài 3, 4, 5)"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={assignment.quiz_data?.answerKeyDocUrl || "/static/docs/dap_an_de_giua_hoc_ky_1_toan_9.pdf"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 font-bold border border-indigo-500/20 flex items-center gap-1.5 transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Tải PDF Đầy Đủ
                </a>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="p-3 overflow-auto max-h-[calc(94vh-125px)] flex items-center justify-center bg-black/40">
              <img
                src={
                  (assignment.quiz_data?.answerKeyImages && assignment.quiz_data.answerKeyImages[activeKeyPageIdx]) ||
                  (activeKeyPageIdx === 0 ? "/static/docs/dapan_toan9_page_1.jpg" : "/static/docs/dapan_toan9_page_2.jpg")
                }
                alt={`Đáp án Trang ${activeKeyPageIdx + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg cursor-zoom-in"
                onClick={() => {
                  const src = (assignment.quiz_data?.answerKeyImages && assignment.quiz_data.answerKeyImages[activeKeyPageIdx]) ||
                    (activeKeyPageIdx === 0 ? "/static/docs/dapan_toan9_page_1.jpg" : "/static/docs/dapan_toan9_page_2.jpg");
                  setLightboxImg(src);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
