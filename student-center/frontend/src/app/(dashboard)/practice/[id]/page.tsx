"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, AlertCircle, ArrowLeft, Send, Clock, PlayCircle, FileText } from "lucide-react";
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
  const [finalResult, setFinalResult] = useState<{ score: number; maxScore: number } | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAssignment(data);

          // Kiểm tra xem học sinh đã có bài nộp chưa (silent – không crash nếu lỗi)
          try {
            const subRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${id}/my-submission`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              setFinalResult({ score: subData.score !== null ? subData.score : 0, maxScore: data.max_score });

              const restoredAnswers: Record<string, any> = {};
              if (subData.quiz_answers && data.quiz_data?.sections) {
                data.quiz_data.sections.forEach((sec: any, sIdx: number) => {
                  sec.questions.forEach((q: any, qIdx: number) => {
                    // Use section-prefixed key to match what we stored on submit
                    const prefixedKey = q.id ? `s${sIdx}_${q.id}` : null;
                    const backendAns = prefixedKey ? subData.quiz_answers[prefixedKey] : undefined;
                    if (backendAns !== undefined) {
                      if (sec.type === "mcq" || sec.type === "short_answer") {
                        restoredAnswers[`${sIdx}_${qIdx}`] = sec.type === "mcq" ? Number(backendAns) : backendAns;
                      } else if (sec.type === "true_false" && q.items) {
                        const arr: boolean[] = [];
                        q.items.forEach((item: any, iIdx: number) => {
                          if (backendAns[item.label] !== undefined) {
                            arr[iIdx] = normBool(backendAns[item.label]);
                          }
                        });
                        restoredAnswers[`${sIdx}_${qIdx}`] = arr;
                      }
                    }
                  });
                });
              }
              setAnswers(restoredAnswers);
              setIsReviewMode(true);
              setStarted(true);
            }
            // 404 = chưa nộp → hiển thị màn hình bắt đầu bình thường
          } catch {
            // Bỏ qua lỗi mạng trên my-submission, cho phép học sinh làm bài mới
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

  const submitQuiz = async () => {
    if (!confirm("Bạn đã chắc chắn muốn nộp bài chưa? Bạn sẽ không thể sửa lại đáp án!")) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("minda_token");
      let correctCount = 0;
      let totalQuestions = 0;
      const backendQuizAnswers: Record<string, any> = {};

      if (assignment.quiz_data?.sections) {
        assignment.quiz_data.sections.forEach((sec: any, sIdx: number) => {
          sec.questions.forEach((q: any, qIdx: number) => {
            totalQuestions++;
            const studentAns = answers[`${sIdx}_${qIdx}`];
            // Prefix qid with section index to avoid collision across sections
            const qid = q.id ? `s${sIdx}_${q.id}` : `s${sIdx}_q${qIdx}`;
            if (sec.type === "mcq" || sec.type === "short_answer") {
              backendQuizAnswers[qid] = studentAns;
              if (sec.type === "mcq" && String(studentAns) === String(q.correctAnswer)) correctCount++;
              if (sec.type === "short_answer" && String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) correctCount++;
            } else if (sec.type === "true_false" && q.items) {
              const tfAnsDict: Record<string, boolean> = {};
              const studentAnsArr = studentAns || [];
              let allCorrect = true;
              q.items.forEach((item: any, i: number) => {
                const lbl = item.label;
                if (studentAnsArr[i] !== undefined) tfAnsDict[lbl] = studentAnsArr[i];
                if (normBool(studentAnsArr[i]) !== normBool(item.isTrue)) allCorrect = false;
              });
              backendQuizAnswers[qid] = tfAnsDict;
              if (allCorrect) correctCount++;
            }
          });
        });
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quiz_answers: backendQuizAnswers,
          content: `Ghi nhận làm đề trắc nghiệm tự động chấm. Số câu đúng: ${correctCount}/${totalQuestions}`,
        }),
      });

      if (res.ok) {
        const sub = await res.json();
        setFinalResult({ score: sub.score !== null ? sub.score : 0, maxScore: assignment.max_score });
        setIsReviewMode(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const errorData = await res.json();
        console.error("Lỗi:", errorData);
        alert("Nộp bài thất bại. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi mạng.");
    } finally {
      setSubmitting(false);
    }
  };

  /** Reset to retake the quiz from scratch */
  const handleRetake = () => {
    if (!confirm("Bài làm mới sẽ ghi đè điểm cũ. Điểm EXP chỉ được cộng 1 lần khi đạt ≥80%. Bạn có chắc muốn làm lại không?")) return;
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

  // Per-question score display
  // Standard: MCQ=0.25đ, TF=1đ (max), SA=0.5đ
  // Practice: equal split of max_score across all questions
  const totalQ = sections.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0);
  const practicePointPerQ = totalQ > 0 ? (assignment.max_score / totalQ) : 0;

  const getQPoints = (secType: string) => {
    if (isStandard) {
      if (secType === "mcq") return 0.25;
      if (secType === "true_false") return 1.0; // max (partial inside)
      if (secType === "short_answer") return 0.5;
      return 0;
    }
    return practicePointPerQ;
  };

  const fmtPts = (pts: number) => parseFloat(pts.toFixed(2)).toString();

  return (
    <div className={`min-h-screen font-outfit ${theme === "dark" ? "bg-[#050505] text-white" : "bg-gray-50 text-gray-900"}`}>
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between ${theme === "dark" ? "bg-black/50 border-white/10" : "bg-white/80 border-gray-200 shadow-sm"}`}>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 hover:bg-indigo-500/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-lg">{assignment.title}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Không giới hạn thời gian
            </p>
          </div>
        </div>
        {started && !isReviewMode && (
          <button onClick={submitQuiz} disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
            {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
            Nộp Bài Lấy Điểm
          </button>
        )}
        {isReviewMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetake}
              className="px-5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-full font-bold text-sm flex items-center gap-2 transition-colors"
            >
              <PlayCircle className="w-4 h-4" /> Làm Lại
            </button>
            <Link href="/practice" className="px-5 py-2 bg-white/10 hover:bg-white/15 text-gray-300 rounded-full font-bold text-sm flex items-center gap-2 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Phòng Luyện Thi
            </Link>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto p-6 md:p-8">
        {!started ? (
          <div className={`rounded-3xl border p-8 md:p-12 text-center mt-10 ${theme === "dark" ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200 shadow-xl shadow-gray-200/50"}`}>
            <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-3xl font-black mb-3">{assignment.title}</h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">{assignment.description || "Bài tập rèn luyện kỹ năng. Chúc bạn làm bài tốt!"}</p>
            <div className="flex justify-center gap-4">
              <div className="px-6 py-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col items-center">
                <span className="text-2xl font-bold text-indigo-500">{sections.reduce((acc: number, sec: any) => acc + (sec.questions?.length || 0), 0)}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Câu Hỏi</span>
              </div>
              <div className="px-6 py-3 rounded-2xl bg-green-500/5 border border-green-500/10 flex flex-col items-center">
                <span className="text-2xl font-bold text-green-500">{assignment.max_score}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Điểm Tối Đa</span>
              </div>
            </div>
            
            {assignment.quiz_data?.originalDocUrl && (
               <div className="mt-8">
                  <a href={assignment.quiz_data.originalDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 text-sm font-bold text-indigo-500 transition-colors">
                     <FileText className="w-5 h-5 text-indigo-500" />
                     Xem Xem & Tải Đề Gốc Bản In
                  </a>
               </div>
            )}
            
            <button onClick={() => setStarted(true)} className="mt-10 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(99,102,241,0.4)] flex items-center justify-center gap-3 mx-auto transition-transform hover:-translate-y-1">
              <PlayCircle className="w-6 h-6" /> Bắt Đầu Làm Bài
            </button>
          </div>
        ) : (
          <div className="space-y-10 pb-20">
            {assignment.quiz_data?.originalDocUrl && (
               <div className="flex justify-end pt-4">
                  <a href={assignment.quiz_data.originalDocUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-sm font-bold text-indigo-500 transition-colors border border-indigo-500/20">
                     <FileText className="w-4 h-4"/> Xem Đề Gốc (Bản PDF/Ảnh)
                  </a>
               </div>
            )}
            
            {isReviewMode && finalResult && (
              <div className={`rounded-3xl border-2 border-green-500/30 p-8 text-center mb-10 ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"}`}>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-black mb-2">Đã Hoàn Thành Bài Tập!</h2>
                <div className="text-green-600 font-bold text-4xl mt-4 bg-white/50 inline-block px-8 py-4 rounded-2xl border border-green-500/20">
                  Điểm: {finalResult.score} / {finalResult.maxScore}
                </div>
                <p className="mt-4 text-sm text-gray-500">Xem lại đáp án và giải thích chi tiết ở bên dưới.</p>
                <div className="flex justify-center gap-3 mt-6">
                  <button
                    onClick={handleRetake}
                    className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-transform hover:-translate-y-0.5"
                  >
                    <PlayCircle className="w-5 h-5" /> Làm Lại Bài
                  </button>
                  <Link
                    href="/practice"
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center gap-2 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" /> Về Danh Sách Đề
                  </Link>
                </div>
              </div>
            )}

            {isReviewMode && (
              <div className={`rounded-3xl border-2 border-indigo-500/30 p-8 mb-10 ${theme === "dark" ? "bg-indigo-500/5 text-white" : "bg-white shadow-xl"}`}>
                <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-indigo-500">
                  <FileText className="w-8 h-8" /> GIẢI ĐÁP TỪ GIÁO VIÊN
                </h2>
                {(!assignment.quiz_data?.solutionDocUrl && !assignment.quiz_data?.solutionVideoUrl) ? (
                  <div className="flex flex-col items-center justify-center py-10 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 border-dashed">
                    <Clock className="w-12 h-12 text-indigo-400 mb-3 opacity-80" />
                    <p className="text-xl font-bold text-indigo-500">Bài sửa sẽ được cập nhật lên sớm!</p>
                    <p className="text-sm text-gray-500 mt-2">Giáo viên sẽ sớm đăng tải lời giải chi tiết và video giải đáp cho bài tập này.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {assignment.quiz_data?.solutionDocUrl && (
                      <div className="flex flex-col gap-3">
                        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm">Tài Liệu Đính Kèm</h3>
                        <a href={assignment.quiz_data.solutionDocUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-2xl border border-indigo-500/20 text-indigo-500 transition-transform hover:-translate-y-1">
                          <FileText className="w-8 h-8" />
                          <span className="font-bold text-lg">Mở Lời Giải PDF / Ảnh</span>
                        </a>
                      </div>
                    )}
                    {assignment.quiz_data?.solutionVideoUrl && (
                      <div className="flex flex-col gap-3">
                        <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm">Video Chữa Bài</h3>
                        {assignment.quiz_data.solutionVideoUrl.includes("youtube.com") || assignment.quiz_data.solutionVideoUrl.includes("youtu.be") ? (
                          <iframe 
                              className="w-full aspect-video rounded-2xl border border-white/10 shadow-lg"
                              src={assignment.quiz_data.solutionVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} 
                              allowFullScreen
                          />
                        ) : (
                          <a href={assignment.quiz_data.solutionVideoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 bg-red-500/10 hover:bg-red-500/20 rounded-2xl border border-red-500/20 text-red-500 transition-transform hover:-translate-y-1">
                            <PlayCircle className="w-8 h-8" />
                            <span className="font-bold text-lg">Mở Xem Video Giải Thích</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {sections.length === 0 ? (
              <div className="text-center py-20 text-gray-500">Bài tập này không có câu hỏi.</div>
            ) : (
              sections.map((sec: any, sIdx: number) => (
                <div key={sIdx} className="space-y-6">
                  {sec.instruction && (
                    <div className="sticky top-[72px] z-40 bg-indigo-500/10 backdrop-blur-md text-indigo-400 border border-indigo-500/20 px-6 py-3 rounded-2xl font-bold">
                      <MathText>{sec.instruction}</MathText>
                    </div>
                  )}

                  <div className="space-y-6">
                    {sec.questions?.map((q: any, qIdx: number) => {
                      const qAns = answers[`${sIdx}_${qIdx}`];

                      // ---- Determine if the card is correct (all comparisons use String/normBool) ----
                      let isCorrectCard = false;
                      if (isReviewMode) {
                        if (sec.type === "mcq") {
                          // qAns is a Number (index), q.correctAnswer might be number or string
                          isCorrectCard = String(qAns) === String(q.correctAnswer);
                        } else if (sec.type === "short_answer") {
                          isCorrectCard = String(qAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                        } else if (sec.type === "true_false" && q.items) {
                          const arr = qAns || [];
                          isCorrectCard = q.items.every((item: any, i: number) => normBool(arr[i]) === normBool(item.isTrue));
                        }
                      }

                      // For TF: compute partial score earned for display
                      let tfEarnedPts = 0;
                      let tfIsPartial = false; // earned some but not all
                      if (isReviewMode && sec.type === "true_false" && q.items) {
                        const arr = qAns || [];
                        const correctCount = q.items.filter((item: any, i: number) => normBool(arr[i]) === normBool(item.isTrue)).length;
                        if (isStandard) {
                          if (correctCount === 4) tfEarnedPts = 1.0;
                          else if (correctCount === 3) tfEarnedPts = 0.5;
                          else if (correctCount === 2) tfEarnedPts = 0.25;
                        } else {
                          // practice: same ratio logic
                          if (correctCount === 4) tfEarnedPts = getQPoints(sec.type);
                          else if (correctCount === 3) tfEarnedPts = getQPoints(sec.type) * 0.5;
                          else if (correctCount === 2) tfEarnedPts = getQPoints(sec.type) * 0.25;
                          else if (correctCount === 1) tfEarnedPts = getQPoints(sec.type) * 0.1;
                        }
                        tfIsPartial = tfEarnedPts > 0 && !isCorrectCard;
                      }

                      // Badge text & color
                      const badgeText = isReviewMode
                        ? sec.type === "true_false"
                          ? tfEarnedPts > 0 ? `+${fmtPts(tfEarnedPts)}đ` : "0đ"
                          : isCorrectCard ? `+${fmtPts(getQPoints(sec.type))}đ` : "0đ"
                        : `${fmtPts(getQPoints(sec.type))}đ`;

                      const badgeColor = isReviewMode
                        ? isCorrectCard
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : tfIsPartial
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                      // Card border color (partial TF = orange)
                      const cardBg = isReviewMode
                        ? isCorrectCard
                          ? theme === "dark" ? "bg-green-500/5 border-green-500/30" : "bg-green-50 border-green-200"
                          : tfIsPartial
                          ? theme === "dark" ? "bg-orange-500/5 border-orange-500/25" : "bg-orange-50 border-orange-200"
                          : theme === "dark" ? "bg-red-500/5 border-red-500/30" : "bg-red-50 border-red-200"
                        : theme === "dark" ? "bg-[#0a0a0a] border-white/5" : "bg-white border-gray-100 shadow-md";

                      return (
                        <div
                          key={q.id || qIdx}
                          className={`rounded-2xl border p-6 md:p-8 transition-colors ${cardBg}`}
                        >
                          <h4 className="font-semibold text-lg mb-6 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${isReviewMode ? (isCorrectCard ? "bg-green-500 text-white" : tfIsPartial ? "bg-orange-500 text-white" : "bg-red-500 text-white") : "bg-indigo-500/20 text-indigo-500"}`}>
                                {qIdx + 1}
                              </span>
                              <span className="pt-1"><MathText>{q.text}</MathText></span>
                            </div>
                            <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border mt-0.5 ${badgeColor}`}>
                              {badgeText}
                            </span>
                          </h4>

                          {/* Render hình ảnh đính kèm nếu có */}
                          {q.imageUrl && (
                            <div className="mb-6 pl-11">
                              <img src={q.imageUrl} alt="minh họa câu hỏi" className="max-w-full max-h-[350px] rounded-xl border shadow-sm object-contain" />
                            </div>
                          )}

                          {/* ---- MCQ ---- */}
                          {sec.type === "mcq" && q.options && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-11">
                              {q.options.map((opt: string, oIdx: number) => {
                                // Use String comparison to avoid type mismatch
                                const isSelected = String(qAns) === String(oIdx);
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
                                    className={`p-4 rounded-xl border-2 ${!isReviewMode ? "cursor-pointer" : ""} transition-all flex items-center gap-3 ${bgClass}`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isReviewMode ? (isTrueAnswer ? "border-green-500" : isSelected ? "border-red-500" : "border-gray-400") : isSelected ? "border-indigo-500" : "border-gray-400"}`}>
                                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${isReviewMode ? (isTrueAnswer ? "bg-green-500" : "bg-red-500") : "bg-indigo-500"}`} />}
                                      {isReviewMode && isTrueAnswer && !isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                    </div>
                                    <span className={isTrueAnswer ? (theme === "dark" ? "text-green-400" : "text-green-700") : isSelected && isReviewMode ? (theme === "dark" ? "text-red-400" : "text-red-700") : ""}><MathText>{opt}</MathText></span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* ---- True / False ---- */}
                          {sec.type === "true_false" && q.items && (
                            <div className="space-y-3 pl-11">
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
                                    {/* Question text row */}
                                    <div className="flex items-start gap-2">
                                      <span className="font-bold text-gray-500 opacity-60 shrink-0">{item.label}.</span>
                                      <span className="font-medium text-[15px]"><MathText>{item.text}</MathText></span>
                                    </div>

                                    {/* Answer row */}
                                    {!isReviewMode ? (
                                      /* Taking mode: interactive buttons */
                                      <div className="flex items-center gap-2 self-end bg-black/5 p-1 rounded-lg">
                                        <button
                                          onClick={() => handleTrueFalseSelect(sIdx, qIdx, iIdx, true)}
                                          className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${studentChose === true ? "bg-green-500 text-white shadow-md shadow-green-500/30" : "text-gray-500 hover:bg-black/10"}`}
                                        >
                                          ĐÚNG
                                        </button>
                                        <button
                                          onClick={() => handleTrueFalseSelect(sIdx, qIdx, iIdx, false)}
                                          className={`px-6 py-2 rounded-md font-bold text-sm transition-colors ${studentChose === false ? "bg-red-500 text-white shadow-md shadow-red-500/30" : "text-gray-500 hover:bg-black/10"}`}
                                        >
                                          SAI
                                        </button>
                                      </div>
                                    ) : (
                                      /* Review mode: show student answer vs correct answer */
                                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-white/5">
                                        {/* Student's answer */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bạn chọn:</span>
                                          {studentChose === undefined ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-400">Chưa trả lời</span>
                                          ) : (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                              studentChose === itemIsTrue
                                                ? "bg-green-500 text-white"
                                                : "bg-red-500 text-white"
                                            }`}>
                                              {studentChose ? "ĐÚNG" : "SAI"}
                                              {studentChose === itemIsTrue ? " ✓" : " ✗"}
                                            </span>
                                          )}
                                        </div>

                                        {/* Correct answer */}
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đáp án đúng:</span>
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${itemIsTrue ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                                            {itemIsTrue ? "ĐÚNG" : "SAI"}
                                          </span>
                                        </div>

                                        {/* Explanation */}
                                        {item.explanation && (
                                          <div className="w-full text-xs italic text-blue-400 mt-1 flex gap-1">
                                            <span>💡</span> <MathText>{item.explanation}</MathText>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* ---- Short Answer ---- */}
                          {sec.type === "short_answer" && (
                            <div className="pl-11 mt-4 relative">
                              <input
                                type="text"
                                value={qAns || ""}
                                onChange={(e) => handleAnswerSelect(sIdx, qIdx, e.target.value)}
                                disabled={isReviewMode}
                                placeholder="Nhập câu trả lời của bạn..."
                                className={`w-full px-5 py-4 rounded-xl border-2 outline-none font-medium transition-colors focus:border-indigo-500 ${theme === "dark" ? "bg-black border-white/10 text-white" : "bg-white border-gray-200"}`}
                              />
                              {isReviewMode && (
                                <div className="mt-3 p-4 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium">
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

                          {/* ---- Explanation ---- */}
                          {isReviewMode && q.explanation && sec.type !== "true_false" && (
                            <div className="mt-6 pl-11">
                              <div className={`p-4 rounded-xl border flex items-start gap-3 ${theme === "dark" ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold mb-1">Giải thích chi tiết:</p>
                                  <div className="text-sm leading-relaxed"><MathText>{q.explanation}</MathText></div>
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
    </div>
  );
}
