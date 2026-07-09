"use client";
import { useState } from "react";
import { X, Eye, CheckCircle2, XCircle, Trophy, Sparkles, Loader2, Save, FileText } from "lucide-react";

interface Props {
  submission: any;
  quizData: any | null;
  assignment?: any; // Bổ sung thông tin bài tập
  onClose: () => void;
}

function toLabel(v: any): string {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(v);
  if (!isNaN(n) && n >= 0 && n <= 25) return String.fromCharCode(65 + n);
  return String(v).trim().toUpperCase();
}

function normalize(s: any): string {
  return String(s || "").trim().toLowerCase().replace(/,/g, ".");
}

export default function SubmissionModal({ submission, quizData, assignment, onClose }: Props) {
  const [score, setScore] = useState<string>(submission.score !== null ? String(submission.score) : "");
  const [feedback, setFeedback] = useState<string>(submission.feedback || "");
  const [saving, setSaving] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);

  const isFileUpload = assignment?.assignment_type === "file_upload";

  const handleSaveGrade = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/submissions/${submission.id}/grade`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          score: score === "" ? 0 : parseFloat(score),
          feedback: feedback
        })
      });
      if (res.ok) {
        alert("Lưu điểm thành công!");
        onClose();
      } else {
        alert("Có lỗi khi lưu điểm");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi mạng");
    } finally {
      setSaving(false);
    }
  };

  const handleAIGrade = async () => {
    setAiGrading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/submissions/${submission.id}/ai-grade`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScore(String(data.score));
        setFeedback(data.feedback);
      } else {
        const err = await res.json();
        alert(err.detail || "Lỗi khi gọi AI chấm điểm");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi mạng khi gọi AI");
    } finally {
      setAiGrading(false);
    }
  };

  // Quiz calculations
  const answers = submission.quiz_answers || {};
  const sections = quizData?.sections || [];
  let correctCount = 0;
  let totalCount = 0;
  let qCount = 0;
  
  if (!isFileUpload) {
    sections.forEach((section: any, sIdx: number) => {
      (section.questions || []).forEach((q: any, qIdx: number) => {
        const qid = `s${sIdx}_${q.id || qIdx}`;
        const ans = answers[qid];
        if (section.type === "mcq") {
          totalCount++;
          if (toLabel(ans) === toLabel(q.correctAnswer)) correctCount++;
        } else if (section.type === "short_answer") {
          totalCount++;
          if (normalize(ans) === normalize(q.correctAnswer)) correctCount++;
        }
      });
    });
  }

  const maxScore = assignment?.max_score ?? submission.max_score ?? 10;
  const pct = (submission.score ?? 0) / maxScore;
  const scoreCls = pct >= 0.8
    ? "bg-green-500/15 text-green-400 border-green-500/30"
    : pct >= 0.5
    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border-card shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-card shrink-0 bg-bg-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-text-primary leading-tight">
                Bài làm của {submission.student_name}
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                {submission.assignment_title} ·{" "}
                {new Date(submission.submitted_at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-xl text-sm font-black border ${scoreCls}`}>
              {submission.score !== null ? submission.score : "Chưa chấm"} / {maxScore} đ
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500/20 transition-colors border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 flex flex-col lg:flex-row">
          {isFileUpload ? (
            <>
              {/* File Upload View */}
              <div className="flex-1 p-6 overflow-y-auto border-r border-border-card">
                 <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Nội dung bài nộp</h4>
                 {submission.content && (
                   <div className="bg-bg-hover border border-border-card p-4 rounded-xl mb-4 whitespace-pre-wrap text-sm text-text-primary">
                     {submission.content}
                   </div>
                 )}
                 {submission.file_url ? (
                   <div className="mt-2">
                      <p className="text-sm font-semibold mb-2">File đính kèm:</p>
                      {submission.file_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer">
                          <img src={submission.file_url} alt="Submission" className="max-w-full rounded-xl border border-border-card hover:opacity-90 transition-opacity cursor-pointer" />
                        </a>
                      ) : (
                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl font-medium border border-indigo-500/20 hover:bg-indigo-500/20">
                          Tải xuống / Xem file
                        </a>
                      )}
                   </div>
                 ) : (
                   !submission.content && <p className="text-text-muted italic">Học sinh không nhập nội dung nào.</p>
                 )}
              </div>
              {/* Grading Sidebar */}
              <div className="w-full lg:w-[350px] p-6 bg-bg-main shrink-0 flex flex-col gap-4">
                 <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">Chấm Điểm</h4>
                    <button 
                      onClick={handleAIGrade}
                      disabled={aiGrading}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 disabled:opacity-50"
                    >
                       {aiGrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                       Chấm tự động (AI)
                    </button>
                 </div>
                 
                 <div>
                    <label className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1 block">Điểm số (Max: {maxScore})</label>
                    <input 
                      type="number" 
                      value={score} 
                      onChange={(e) => setScore(e.target.value)} 
                      className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-lg font-bold text-indigo-400"
                    />
                 </div>
                 
                 <div className="flex-1 flex flex-col min-h-[200px]">
                    <label className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1 block">Nhận xét (Feedback)</label>
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-full flex-1 bg-bg-hover border border-border-card rounded-xl p-3 outline-none focus:border-indigo-500 text-sm resize-none"
                      placeholder="Nhập lời nhận xét cho học sinh..."
                    ></textarea>
                 </div>

                 <button 
                    onClick={handleSaveGrade}
                    disabled={saving}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white flex items-center justify-center gap-2 mt-auto disabled:opacity-50"
                 >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu Điểm
                 </button>
              </div>
            </>
          ) : (
            <div className="p-6 w-full">
              {!quizData ? (
                <div className="text-center py-16 text-text-muted">
                  <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                  Đang tải đề bài...
                </div>
              ) : (
                <>
                  {/* Quick stats for Quiz */}
                  {totalCount > 0 && (
                    <div className="flex gap-3 mb-5">
                      <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-lg font-black text-green-400">{correctCount}</p>
                          <p className="text-[10px] text-green-400/70">Câu đúng</p>
                        </div>
                      </div>
                      <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-lg font-black text-red-400">{totalCount - correctCount}</p>
                          <p className="text-[10px] text-red-400/70">Câu sai</p>
                        </div>
                      </div>
                      <div className="flex-1 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-indigo-400" />
                        <div>
                          <p className="text-lg font-black text-indigo-400">
                            {Math.round((correctCount / totalCount) * 100)}%
                          </p>
                          <p className="text-[10px] text-indigo-400/70">Tỉ lệ đúng</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {sections.map((section: any, sIdx: number) => (
                    <div key={sIdx} className="mb-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                          {section.type === "mcq"
                            ? "📝 Trắc nghiệm"
                            : section.type === "true_false"
                            ? "✅ Đúng/Sai"
                            : "✍️ Tự luận ngắn"}
                        </span>
                        <span className="text-xs text-text-muted">
                          {(section.questions || []).length} câu
                        </span>
                      </div>

                      {(section.questions || []).map((q: any, qIdx: number) => {
                        qCount++;
                        const qid = `s${sIdx}_${q.id || qIdx}`;
                        const studentAns = answers[qid];
                        const correctAns = q.correctAnswer;

                        const isCorrect =
                          section.type === "mcq"
                            ? toLabel(studentAns) === toLabel(correctAns)
                            : section.type === "short_answer"
                            ? normalize(studentAns) === normalize(correctAns)
                            : null;

                        return (
                          <div
                            key={qid}
                            className={`mb-4 rounded-2xl border overflow-hidden ${
                              isCorrect === true
                                ? "border-green-500/30"
                                : isCorrect === false
                                ? "border-red-500/30"
                                : "border-border-card"
                            }`}
                          >
                            {/* Question */}
                            <div
                              className={`px-4 py-3 flex items-start gap-3 ${
                                isCorrect === true
                                  ? "bg-green-500/5"
                                  : isCorrect === false
                                  ? "bg-red-500/5"
                                  : "bg-bg-hover"
                              }`}
                            >
                              <span
                                className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 mt-0.5 ${
                                  isCorrect === true
                                    ? "bg-green-500/20 text-green-400"
                                    : isCorrect === false
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-white/10 text-text-muted"
                                }`}
                              >
                                Câu {qCount}
                              </span>
                              <p className="text-sm font-semibold text-text-primary leading-relaxed flex-1">
                                {q.question || q.content}
                              </p>
                              {isCorrect === true && (
                                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                              )}
                              {isCorrect === false && (
                                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                              )}
                            </div>

                            {/* MCQ */}
                            {section.type === "mcq" && (
                              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {(q.options || []).map((opt: string, oIdx: number) => {
                                  const optLabel = String.fromCharCode(65 + oIdx);
                                  const isChosen = toLabel(studentAns) === optLabel;
                                  const isAnswer = toLabel(correctAns) === optLabel;
                                  return (
                                    <div
                                      key={oIdx}
                                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm ${
                                        isChosen && isAnswer
                                          ? "bg-green-500/15 border-2 border-green-500/40 text-green-300"
                                          : isAnswer
                                          ? "bg-green-500/10 border border-green-500/25 text-green-400"
                                          : isChosen
                                          ? "bg-red-500/15 border-2 border-red-500/40 text-red-300"
                                          : "bg-white/3 border border-transparent text-text-secondary"
                                      }`}
                                    >
                                      <span
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                          isChosen && isAnswer
                                            ? "bg-green-500 text-white"
                                            : isAnswer
                                            ? "bg-green-500/30 text-green-400"
                                            : isChosen
                                            ? "bg-red-500 text-white"
                                            : "bg-white/10 text-text-muted"
                                        }`}
                                      >
                                        {optLabel}
                                      </span>
                                      <span className="flex-1 font-medium">{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* True/False */}
                            {section.type === "true_false" && (
                              <div className="p-3 space-y-1.5">
                                {(q.items || []).map((item: any) => {
                                  const tfAnswer =
                                    studentAns && typeof studentAns === "object"
                                      ? studentAns[item.label]
                                      : undefined;
                                  const isRight =
                                    tfAnswer !== undefined &&
                                    String(tfAnswer).toLowerCase() === "true" ===
                                      Boolean(item.isTrue);
                                  return (
                                    <div
                                      key={item.label}
                                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm ${
                                        isRight
                                          ? "bg-green-500/10 border border-green-500/20 text-green-400"
                                          : tfAnswer !== undefined
                                          ? "bg-red-500/10 border border-red-500/20 text-red-400"
                                          : "bg-white/5 border border-transparent text-text-secondary"
                                      }`}
                                    >
                                      <span className="font-black w-5 shrink-0">{item.label}.</span>
                                      <span className="flex-1 font-medium">{item.content}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Short answer */}
                            {section.type === "short_answer" && (
                              <div className="p-3 flex gap-3 text-sm">
                                <div className="flex-1 bg-white/5 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-text-muted mb-1">HS trả lời</p>
                                  <p
                                    className={`font-bold ${
                                      isCorrect ? "text-green-400" : "text-red-400"
                                    }`}
                                  >
                                    {studentAns || "(bỏ trống)"}
                                  </p>
                                </div>
                                <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-green-400/70 mb-1">Đáp án đúng</p>
                                  <p className="font-bold text-green-400">{correctAns}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
