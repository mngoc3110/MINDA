"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Play, Send, ChevronRight, CheckCircle2, XCircle,
  Clock, Cpu, AlertCircle, Loader2, RotateCcw, BookOpen,
  Terminal, Trophy, Zap, Copy, Check, Code2, RefreshCw,
  Sparkles, Maximize2, Minimize2, Split, TerminalSquare,
  FileCode2, ShieldAlert, CheckCheck, CornerDownLeft, Eye, EyeOff,
  Flame, Award
} from "lucide-react";
import MathText from "@/components/MathText";

// Monaco dynamic load client-side
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

const LANGS = [
  { key: "cpp",        label: "C++ 17",     icon: "⚡", ext: ".cpp", monacoLang: "cpp" },
  { key: "python",     label: "Python 3",   icon: "🐍", ext: ".py",  monacoLang: "python" },
  { key: "javascript", label: "JavaScript", icon: "🟨", ext: ".js",  monacoLang: "javascript" },
] as const;
type LangKey = typeof LANGS[number]["key"];

const DIFF_STYLE: Record<string, string> = {
  easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  hard:   "text-red-400 bg-red-500/10 border-red-500/30",
};
const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

export default function CodingExamRunnerPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";

  const [exam, setExam] = useState<any>(null);
  const [problems, setProblems] = useState<any[]>([]);
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Per-problem code storage
  const [codes, setCodes] = useState<Record<number, Record<string, string>>>({});
  const [lang, setLang] = useState<LangKey>("cpp");

  // Problem submission status (problemId -> { verdict, score, passed, total })
  const [problemStatus, setProblemStatus] = useState<Record<number, any>>({});

  // Execution states
  const [runningTest, setRunningTest] = useState(false);
  const [submittingJudge, setSubmittingJudge] = useState(false);
  const [customInput, setCustomInput] = useState<string>("");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [terminalView, setTerminalView] = useState<"split" | "input" | "console" | "verdict">("split");
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout?: string;
    stderr?: string;
    time?: string;
    memory?: string;
    exit_code?: number;
    status?: string;
    verdict?: string;
    timestamp?: string;
  } | null>(null);
  const [judgeResult, setJudgeResult] = useState<any | null>(null);

  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60);
  const [timerActive, setTimerActive] = useState(true);

  // Fetch Exam details
  useEffect(() => {
    if (!rawId) return;
    const fetchExam = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/coding-exams/${rawId}`);
        if (res.ok) {
          const data = await res.json();
          setExam(data);
          setProblems(data.problems || []);
          setTimeLeft((data.duration_minutes || 120) * 60);

          // Initialize starter codes
          const initialCodes: Record<number, Record<string, string>> = {};
          (data.problems || []).forEach((p: any) => {
            initialCodes[p.id] = {
              cpp: p.starter_code?.cpp || `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code giải bài toán ${p.title}\n    \n    return 0;\n}`,
              python: p.starter_code?.python || `# Code Python giải bài toán ${p.title}\n\n`,
              javascript: p.starter_code?.javascript || `// Code JavaScript giải bài toán ${p.title}\n\n`
            };
          });
          setCodes(initialCodes);
        }
      } catch (err) {
        console.error("Error loading exam:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [rawId]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const formatTimer = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentProblem = problems[selectedProblemIdx];
  const currentCode = currentProblem ? (codes[currentProblem.id]?.[lang] || "") : "";

  const handleCodeChange = (newCode: string | undefined) => {
    if (!currentProblem) return;
    setCodes(prev => ({
      ...prev,
      [currentProblem.id]: {
        ...(prev[currentProblem.id] || {}),
        [lang]: newCode || ""
      }
    }));
  };

  // Run custom test
  const handleRunCustomTest = async () => {
    if (!currentProblem || runningTest) return;
    setRunningTest(true);
    setTerminalView("console");
    setIsTerminalOpen(true);

    try {
      const res = await fetch(`${API}/api/code/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          code: currentCode,
          stdin_input: customInput || currentProblem.examples?.[0]?.input || ""
        })
      });
      const data = await res.json();
      setConsoleOutput({
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        time: data.execution_time || "12ms",
        memory: data.memory_used || "3.1MB",
        exit_code: data.exit_code ?? 0,
        status: data.exit_code === 0 ? "Thực thi thành công" : "Lỗi thực thi",
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      setConsoleOutput({
        stderr: err?.message || "Không thể kết nối đến trình chấm máy chủ!",
        status: "Lỗi kết nối",
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setRunningTest(false);
    }
  };

  // Submit problem for official judging
  const handleSubmitProblem = async () => {
    if (!currentProblem || submittingJudge) return;
    setSubmittingJudge(true);
    setTerminalView("verdict");
    setIsTerminalOpen(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/code/judge/${currentProblem.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          language: lang,
          code: currentCode
        })
      });
      const data = await res.json();
      setJudgeResult(data);

      const isAC = data.verdict === "AC";
      setProblemStatus(prev => ({
        ...prev,
        [currentProblem.id]: {
          verdict: data.verdict,
          passed: data.passed || 0,
          total: data.total || 0,
          score: isAC ? 100 : Math.round(((data.passed || 0) / (data.total || 1)) * 100)
        }
      }));

      if (isAC) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      setJudgeResult({
        verdict: "RTE",
        error: err?.message || "Lỗi nộp bài lên hệ thống máy chủ!"
      });
    } finally {
      setSubmittingJudge(false);
    }
  };

  const solvedProblemsCount = Object.values(problemStatus).filter((s: any) => s.verdict === "AC").length;
  const totalScore = Math.round(
    problems.length > 0
      ? Object.values(problemStatus).reduce((acc: number, cur: any) => acc + (cur.score || 0), 0) / problems.length
      : 0
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm">Đang tải đề thi lập trình...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center p-6">
        <div className="p-8 rounded-3xl bg-bg-card border border-border-card text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Không tìm thấy đề thi</h2>
          <p className="text-text-secondary text-sm mb-6">Đề thi này không tồn tại hoặc đã bị gỡ bỏ.</p>
          <Link
            href="/code"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition"
          >
            Quay lại MINDA Code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* ── Top Bar: Exam Title, Timer, Progress, Actions ────────── */}
      <header className="h-16 border-b border-white/10 bg-[#161b22]/90 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/code"
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Rời phòng thi
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {exam.track?.toUpperCase() || "HSG TIN 8"}
              </span>
              <h1 className="font-bold text-sm text-white truncate max-w-[300px] md:max-w-md">
                {exam.title}
              </h1>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block truncate">
              {exam.description || "Kỳ thi thử bồi dưỡng Học sinh giỏi Tin học"}
            </p>
          </div>
        </div>

        {/* Right Stats & Timer */}
        <div className="flex items-center gap-4">
          {/* Progress badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Đã hoàn thành: <strong className="text-white">{solvedProblemsCount}/{problems.length}</strong> bài</span>
            <span className="text-indigo-400 font-bold">({totalScore}đ)</span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold shadow-inner">
            <Clock className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>{formatTimer(timeLeft)}</span>
          </div>
        </div>
      </header>

      {/* ── Problem Navigation Tabs (Bài 1, Bài 2, ...) ──────────── */}
      <div className="border-b border-white/10 bg-[#0d1117] px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {problems.map((p, idx) => {
          const status = problemStatus[p.id];
          const isSelected = selectedProblemIdx === idx;
          const isAC = status?.verdict === "AC";
          const isFailed = status && !isAC;

          return (
            <button
              key={p.id}
              onClick={() => setSelectedProblemIdx(idx)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition shrink-0 border ${
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                  : "bg-[#161b22] text-gray-300 border-white/10 hover:bg-white/5 hover:border-white/20"
              }`}
            >
              {isAC ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isFailed ? (
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
              )}
              <span>Bài {idx + 1}: {p.title.replace(/^\[.*?\]\s*/, "")}</span>
              {isAC && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">100đ</span>}
            </button>
          );
        })}
      </div>

      {/* ── Main Exam Body: Split Problem Statement & Code Editor ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Column: Problem Statement */}
        <div className="w-full lg:w-1/2 flex flex-col border-r border-white/10 bg-[#0d1117] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
          {currentProblem ? (
            <div className="space-y-6 max-w-2xl">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${DIFF_STYLE[currentProblem.difficulty || "easy"]}`}>
                    {DIFF_LABEL[currentProblem.difficulty || "easy"]}
                  </span>
                  <span className="text-xs text-gray-400">Độ khó Elo: {currentProblem.rating || 800}</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {currentProblem.title}
                </h2>
              </div>

              {/* Statement Description with LaTeX */}
              <div className="prose prose-invert prose-sm text-gray-300 leading-relaxed space-y-4">
                <MathText text={currentProblem.description || ""} />
              </div>

              {/* Constraints */}
              {currentProblem.constraints && currentProblem.constraints.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Ràng Buộc Dữ Liệu</h3>
                  <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                    {currentProblem.constraints.map((c: string, i: number) => (
                      <li key={i}><MathText text={c} /></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Examples */}
              {currentProblem.examples && currentProblem.examples.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Ví Dụ Mẫu (Sample Tests)</h3>
                  {currentProblem.examples.map((ex: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-[#161b22] border border-white/10 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Input:</span>
                          <pre className="p-2.5 rounded-xl bg-[#0d1117] border border-white/5 text-xs font-mono text-emerald-300 overflow-x-auto">
                            {ex.input || "(Trống)"}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Output:</span>
                          <pre className="p-2.5 rounded-xl bg-[#0d1117] border border-white/5 text-xs font-mono text-indigo-300 overflow-x-auto">
                            {ex.output}
                          </pre>
                        </div>
                      </div>
                      {ex.explanation && (
                        <p className="text-xs text-gray-400 border-t border-white/5 pt-2">
                          💡 <strong>Giải thích:</strong> {ex.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              Chọn một bài toán ở thanh trên để bắt đầu làm bài.
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Terminal */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#161b22] overflow-hidden">
          
          {/* Editor Header: Language selector & Actions */}
          <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-[#161b22] shrink-0">
            {/* Lang switcher */}
            <div className="flex items-center gap-1.5">
              {LANGS.map(l => (
                <button
                  key={l.key}
                  onClick={() => setLang(l.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    lang === l.key
                      ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            {/* Run & Submit buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRunCustomTest}
                disabled={runningTest || submittingJudge}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {runningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Chạy thử</span>
              </button>

              <button
                onClick={handleSubmitProblem}
                disabled={runningTest || submittingJudge}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {submittingJudge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Nộp bài này</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[300px] relative">
            <MonacoEditor
              height="100%"
              theme="vs-dark"
              language={LANGS.find(l => l.key === lang)?.monacoLang || "cpp"}
              value={currentCode}
              onChange={handleCodeChange}
              options={{
                fontSize: 13,
                fontFamily: "var(--font-mono), 'Fira Code', Menlo, Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                tabSize: 4,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
            />
          </div>

          {/* ── Interactive Bottom Terminal ──────────────────────── */}
          {isTerminalOpen && (
            <div className="h-64 border-t border-white/10 bg-[#0d1117] flex flex-col shrink-0">
              
              {/* Terminal Tab Bar */}
              <div className="h-9 border-b border-white/10 bg-[#161b22] px-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTerminalView("split")}
                    className={`px-2.5 py-1 rounded-md transition ${terminalView === "split" ? "bg-white/10 text-white font-bold" : "hover:text-gray-200"}`}
                  >
                    Custom Input
                  </button>
                  <button
                    onClick={() => setTerminalView("console")}
                    className={`px-2.5 py-1 rounded-md transition ${terminalView === "console" ? "bg-white/10 text-white font-bold" : "hover:text-gray-200"}`}
                  >
                    Console Output
                  </button>
                  <button
                    onClick={() => setTerminalView("verdict")}
                    className={`px-2.5 py-1 rounded-md transition ${terminalView === "verdict" ? "bg-white/10 text-white font-bold" : "hover:text-gray-200"}`}
                  >
                    Kết quả chấm bài (Judge)
                  </button>
                </div>

                <button
                  onClick={() => setIsTerminalOpen(false)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  ✕ Đóng
                </button>
              </div>

              {/* Terminal View Content */}
              <div className="flex-1 p-3 overflow-y-auto font-mono text-xs">
                {terminalView === "split" || terminalView === "input" ? (
                  <div className="h-full flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase mb-1">Dữ liệu đầu vào thử nghiệm (stdin):</label>
                    <textarea
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder={currentProblem?.examples?.[0]?.input || "Nhập test case thử nghiệm..."}
                      className="flex-1 w-full p-2.5 rounded-xl bg-[#161b22] border border-white/10 text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>
                ) : terminalView === "console" ? (
                  consoleOutput ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                        <span>Trạng thái: <strong className="text-white">{consoleOutput.status}</strong></span>
                        <span>Thời gian: {consoleOutput.time}</span>
                        <span>Bộ nhớ: {consoleOutput.memory}</span>
                      </div>
                      {consoleOutput.stdout && (
                        <div>
                          <span className="text-[10px] text-emerald-400 block mb-1">Standard Output:</span>
                          <pre className="p-2.5 rounded-xl bg-[#161b22] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                            {consoleOutput.stdout}
                          </pre>
                        </div>
                      )}
                      {consoleOutput.stderr && (
                        <div>
                          <span className="text-[10px] text-rose-400 block mb-1">Errors / Stderr:</span>
                          <pre className="p-2.5 rounded-xl bg-rose-950/30 text-rose-300 border border-rose-500/20 overflow-x-auto whitespace-pre-wrap">
                            {consoleOutput.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 flex items-center justify-center h-full">
                      Bấm &quot;Chạy thử&quot; để xem kết quả console.
                    </div>
                  )
                ) : (
                  judgeResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl font-bold text-sm border ${
                          judgeResult.verdict === "AC"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                        }`}>
                          {judgeResult.verdict === "AC" ? "✅ Accepted (100đ)" : `❌ ${judgeResult.verdict}`}
                        </span>
                        <span className="text-gray-400">
                          Đạt <strong>{judgeResult.passed || 0}/{judgeResult.total || 0}</strong> test cases
                        </span>
                      </div>

                      {judgeResult.error && (
                        <pre className="p-2.5 rounded-xl bg-rose-950/30 text-rose-300 border border-rose-500/20 whitespace-pre-wrap">
                          {judgeResult.error}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-500 flex items-center justify-center h-full">
                      Bấm &quot;Nộp bài này&quot; để hệ thống chấm toàn bộ test cases.
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
