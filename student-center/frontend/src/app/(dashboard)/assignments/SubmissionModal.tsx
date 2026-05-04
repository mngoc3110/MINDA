"use client";
import { X, Eye, CheckCircle2, XCircle, Trophy } from "lucide-react";

interface Props {
  submission: any;
  quizData: any | null;
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

export default function SubmissionModal({ submission, quizData, onClose }: Props) {
  const answers = submission.quiz_answers || {};
  const sections = quizData?.sections || [];

  // Pre-calculate stats
  let correctCount = 0;
  let totalCount = 0;
  let qCountPre = 0;
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

  const pct = (submission.score ?? 0) / (submission.max_score ?? 10);
  const scoreCls = pct >= 0.8
    ? "bg-green-500/15 text-green-400 border-green-500/30"
    : pct >= 0.5
    ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    : "bg-red-500/15 text-red-400 border-red-500/30";

  let qCount = 0;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-border-card shadow-2xl flex flex-col"
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
              {submission.score ?? "Chưa chấm"} / {submission.max_score ?? 10} đ
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
        <div className="overflow-y-auto flex-1 p-6">
          {!quizData ? (
            <div className="text-center py-16 text-text-muted">
              <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
              Đang tải đề bài...
            </div>
          ) : (
            <>
              {/* Quick stats */}
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
                                  {isChosen && isAnswer && (
                                    <span className="text-xs text-green-400 font-black shrink-0">
                                      ✓ HS chọn
                                    </span>
                                  )}
                                  {isAnswer && !isChosen && (
                                    <span className="text-xs text-green-400 shrink-0">
                                      ✓ Đáp án
                                    </span>
                                  )}
                                  {isChosen && !isAnswer && (
                                    <span className="text-xs text-red-400 font-black shrink-0">
                                      ✗ HS chọn
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            <div className="sm:col-span-2 flex items-center gap-3 text-xs pt-2 px-1 border-t border-white/5">
                              <span className="text-text-muted">
                                HS chọn:{" "}
                                <span
                                  className={`font-bold ${
                                    toLabel(studentAns) === toLabel(correctAns)
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {toLabel(studentAns) || "(bỏ trống)"}
                                </span>
                              </span>
                              <span className="text-white/20">|</span>
                              <span className="text-text-muted">
                                Đáp án:{" "}
                                <span className="font-bold text-green-400">
                                  {toLabel(correctAns)}
                                </span>
                              </span>
                              {toLabel(studentAns) === toLabel(correctAns) ? (
                                <span className="text-green-400 font-bold ml-auto">✓ Đúng</span>
                              ) : (
                                <span className="text-red-400 font-bold ml-auto">✗ Sai</span>
                              )}
                            </div>
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
                                  <span className="text-xs shrink-0">
                                    HS:{" "}
                                    <b>
                                      {tfAnswer !== undefined
                                        ? String(tfAnswer).toLowerCase() === "true"
                                          ? "Đ"
                                          : "S"
                                        : "—"}
                                    </b>
                                  </span>
                                  <span className="text-xs shrink-0 text-white/30">|</span>
                                  <span className="text-xs shrink-0">
                                    ĐA: <b>{item.isTrue ? "Đ" : "S"}</b>
                                  </span>
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
      </div>
    </div>
  );
}
