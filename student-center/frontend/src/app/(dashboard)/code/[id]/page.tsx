"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft, Play, Send, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Clock, Cpu, AlertCircle, Loader2, RotateCcw, BookOpen,
  Terminal, Trophy, Zap, Copy, Check, Code2, RefreshCw,
  Sparkles, Maximize2, Minimize2, Split, TerminalSquare,
  FileCode2, ShieldAlert, CheckCheck, CornerDownLeft, Eye, EyeOff
} from "lucide-react";
import MathText from "@/components/MathText";

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

const LANGS = [
  { key: "python",     label: "Python 3",   icon: "🐍", ext: ".py",  monacoLang: "python" },
  { key: "cpp",        label: "C++ 17",     icon: "⚡", ext: ".cpp", monacoLang: "cpp" },
  { key: "javascript", label: "JavaScript", icon: "🟨", ext: ".js",  monacoLang: "javascript" },
] as const;
type LangKey = typeof LANGS[number]["key"];

const DIFF_STYLE: Record<string, string> = {
  easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  hard:   "text-red-400 bg-red-500/10 border-red-500/30",
};
const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

type Verdict = "AC" | "WA" | "TLE" | "CE" | "RTE" | "MLE" | null;
interface RunResult {
  verdict: Verdict;
  output?: string;
  expected?: string;
  time?: string;
  memory?: string;
  error?: string;
  passed?: number;
  total?: number;
  test_results?: any[];
  failed_case?: any;
}

export default function CodeProblemPage() {
  const params = useParams();
  const rawId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<LangKey>("python");
  const [code, setCode] = useState("");
  
  // Execution states (COMPLETELY SEPARATED)
  const [runningTest, setRunningTest] = useState(false);       // Only for Test Run
  const [submittingJudge, setSubmittingJudge] = useState(false); // Only for Full Submit
  const [judgeResult, setJudgeResult] = useState<RunResult | null>(null);

  // Left Panel Tab: problem | hints | submissions
  const [leftTab, setLeftTab] = useState<"problem" | "hints" | "submissions">("problem");

  // Terminal State (Interactive Developer Terminal)
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isTerminalFullscreen, setIsTerminalFullscreen] = useState(false);
  const [terminalView, setTerminalView] = useState<"split" | "input" | "console" | "verdict">("split");
  const [customInput, setCustomInput] = useState<string>("");
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

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // User & Submissions
  const [userRole, setUserRole] = useState<string>("student");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [inspectCodeModal, setInspectCodeModal] = useState<any | null>(null);

  useEffect(() => {
    if (!rawId) return;
    const fetchProblemDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/problems/${rawId}`);
        if (res.ok) {
          const data = await res.json();
          setProblem(data);
          const starter = data.starter_code?.[lang] || "# Viết code Python ở đây\n\n";
          setCode(starter);
          if (data.examples && data.examples.length > 0 && data.examples[0].input) {
            setCustomInput(data.examples[0].input);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProblemDetail();
  }, [rawId]);

  useEffect(() => {
    const role = localStorage.getItem("minda_user_role") || "student";
    setUserRole(role);
  }, []);

  const fetchSubmissions = async () => {
    if (!problem?.id) return;
    setLoadingSubs(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/problems/${problem.id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSubmissions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleLangChange = (l: LangKey) => {
    setLang(l);
    if (problem?.starter_code?.[l]) {
      setCode(problem.starter_code[l]);
    } else {
      setCode(
        l === "cpp"
          ? "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
          : l === "javascript"
          ? "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8');\nconsole.log(input);\n"
          : "# Viết code Python ở đây\n\n"
      );
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── 1. RIÊNG BIỆT: CHẠY THỬ / TEST RUN (Không ghi đè Submit) ──────────────
  const handleRunTest = async () => {
    if (!problem?.id) return;
    setRunningTest(true);
    setIsTerminalOpen(true);
    // Switch to split view or console to see output immediately
    if (terminalView === "verdict") {
      setTerminalView("split");
    }

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/problems/${problem.id}/test-custom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ language: lang, code, custom_input: customInput || "" })
      });

      const now = new Date().toLocaleTimeString();
      if (res.ok) {
        const data = await res.json();
        setConsoleOutput({ ...data, timestamp: now });
      } else {
        setConsoleOutput({
          status: "error",
          stderr: "Lỗi kết nối máy chủ thực thi Sandbox.",
          exit_code: -1,
          timestamp: now
        });
      }
    } catch (e: any) {
      setConsoleOutput({
        status: "error",
        stderr: e.message || "Lỗi mạng kết nối máy chủ.",
        exit_code: -1,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setRunningTest(false);
    }
  };

  // ── 2. RIÊNG BIỆT: NỘP BÀI / SUBMIT JUDGE ──────────────────────────────────
  const handleSubmitJudge = async () => {
    if (!problem?.id) return;
    setSubmittingJudge(true);
    setIsTerminalOpen(true);
    setTerminalView("verdict");
    setJudgeResult(null);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${API}/api/problems/${problem.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ language: lang, code })
      });

      if (res.ok) {
        const data = await res.json();
        setJudgeResult(data);
        if (data.verdict === "AC") {
          setSubmittedSuccess(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      } else {
        setJudgeResult({ verdict: "CE", error: "Lỗi kết nối tới Online Judge." });
      }
    } catch (e: any) {
      setJudgeResult({ verdict: "CE", error: e.message || "Lỗi mạng" });
    } finally {
      setSubmittingJudge(false);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) {
          handleSubmitJudge();
        } else {
          handleRunTest();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, lang, customInput, problem]);

  const verdictStyle: Record<string, string> = {
    AC:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    WA:  "text-red-400 bg-red-500/10 border-red-500/30",
    TLE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    MLE: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    CE:  "text-rose-400 bg-rose-500/10 border-rose-500/30",
    RTE: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  };

  const currentLangObj = LANGS.find(l => l.key === lang) || LANGS[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center text-text-primary">
        <Loader2 className="w-9 h-9 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm text-slate-400 font-medium">Đang khởi tạo môi trường MINDA Code & Sandbox...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-text-primary flex flex-col" style={{ maxHeight: "100vh", overflow: "hidden" }}>

      {/* ── Top Header Navigation Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-[#0d121d] shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link
            href="/code"
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition flex items-center justify-center border border-white/5"
            title="Quay lại kho bài tập"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="font-bold text-sm sm:text-base truncate text-white tracking-tight">{problem?.title}</h1>
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-bold shrink-0 ${DIFF_STYLE[problem?.difficulty || "easy"]}`}>
              {DIFF_LABEL[problem?.difficulty || "easy"]}
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono font-semibold shrink-0 hidden sm:inline-block">
              {problem?.rating || 800} Elo
            </span>
            {problem?.track && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 hidden md:inline-block">
                {problem.track}
              </span>
            )}
          </div>
        </div>

        {/* Top Control Buttons: 3 CLEAR SEPARATED ACTIONS */}
        <div className="flex items-center gap-2.5 shrink-0">
          {submittedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse">
              <Trophy className="w-3.5 h-3.5" /> Accepted!
            </span>
          )}

          {/* 1. NÚT GỌI TERMINAL (ON/OFF) */}
          <button
            onClick={() => setIsTerminalOpen(prev => !prev)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-md ${
              isTerminalOpen
                ? "bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-purple-900/20"
                : "bg-white/5 border-white/15 text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-400" />
            <span>Gọi Terminal</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${isTerminalOpen ? "bg-purple-500 text-white" : "bg-white/10 text-slate-400"}`}>
              {isTerminalOpen ? "Đang Mở" : "Mở"}
            </span>
          </button>

          {/* 2. NÚT CHẠY THỬ / TEST RIÊNG BIỆT */}
          <button
            onClick={handleRunTest}
            disabled={runningTest || submittingJudge}
            title="Chạy thử nghiệm với STDIN (Ctrl + Enter)"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-600/30"
          >
            {runningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Chạy thử (Run)</span>
            <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-indigo-200 border border-white/10">⌘↵</kbd>
          </button>

          {/* 3. NÚT NỘP BÀI / SUBMIT RIÊNG BIỆT */}
          <button
            onClick={handleSubmitJudge}
            disabled={runningTest || submittingJudge}
            title="Nộp bài & Chấm Online Judge (Ctrl + Shift + Enter)"
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 disabled:opacity-50"
          >
            {submittingJudge ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Nộp bài (Submit)</span>
          </button>
        </div>
      </div>

      {/* ── Main Split View ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT COLUMN: Problem Statement & Hints Only ──────────────────── */}
        <div className="w-full md:w-[460px] lg:w-[520px] shrink-0 flex flex-col border-r border-white/10 bg-[#0d121d] overflow-hidden">
          {/* Left Tabs */}
          <div className="flex border-b border-white/10 bg-[#121826] shrink-0 px-2">
            <button
              onClick={() => setLeftTab("problem")}
              className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                leftTab === "problem"
                  ? "border-indigo-500 text-indigo-300 bg-white/[0.02]"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> 📄 Đề bài
            </button>

            {problem?.hints && problem.hints.length > 0 && (
              <button
                onClick={() => setLeftTab("hints")}
                className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  leftTab === "hints"
                    ? "border-amber-500 text-amber-400 bg-white/[0.02]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> 💡 Gợi ý ({problem.hints.length})
              </button>
            )}

            {(userRole === "teacher" || userRole === "admin") && (
              <button
                onClick={() => { setLeftTab("submissions"); fetchSubmissions(); }}
                className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  leftTab === "submissions"
                    ? "border-emerald-500 text-emerald-400 bg-white/[0.02]"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> 👨‍🏫 Bài nộp ({submissions.length})
              </button>
            )}
          </div>

          {/* Left Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-sm">
            {leftTab === "problem" && (
              <div className="space-y-6">
                {/* Statement text with Markdown & LaTeX Math */}
                <div className="text-text-primary leading-relaxed space-y-4">
                  <MathText>{problem?.statement || problem?.description}</MathText>
                </div>

                {/* Constraints Card */}
                {problem?.constraints?.length > 0 && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 shadow-inner">
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Giới hạn & Ràng buộc
                    </p>
                    <ul className="space-y-1.5">
                      {problem.constraints.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className="text-indigo-400 font-bold">•</span>
                          <MathText>{c}</MathText>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Examples */}
                {problem?.examples?.length > 0 && (
                  <div className="space-y-3.5">
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Ví dụ mẫu
                    </p>
                    {problem.examples.map((ex: any, i: number) => (
                      <div key={i} className="rounded-2xl border border-white/10 bg-[#121826] overflow-hidden shadow-md">
                        {/* Example Header */}
                        <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.03] border-b border-white/10">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Ví dụ {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomInput(ex.input);
                              setIsTerminalOpen(true);
                              setTerminalView("split");
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500 hover:text-white transition font-semibold flex items-center gap-1 border border-indigo-500/20"
                          >
                            <TerminalSquare className="w-3 h-3" /> Nạp vào Terminal
                          </button>
                        </div>

                        {/* Example I/O Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Input:</span>
                              <button
                                onClick={() => copyToClipboard(ex.input, `in-${i}`)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedField === `in-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <pre className="text-xs text-slate-100 font-mono bg-black/50 p-2.5 rounded-xl whitespace-pre-wrap select-all border border-white/5">{ex.input || "(Trống)"}</pre>
                          </div>

                          <div className="p-3">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output:</span>
                              <button
                                onClick={() => copyToClipboard(ex.output, `out-${i}`)}
                                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                              >
                                {copiedField === `out-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <pre className="text-xs text-emerald-300 font-mono bg-black/50 p-2.5 rounded-xl whitespace-pre-wrap select-all border border-white/5">{ex.output}</pre>
                          </div>
                        </div>

                        {ex.explanation && (
                          <div className="px-3.5 py-2.5 border-t border-white/10 text-xs text-slate-300 bg-white/[0.01]">
                            💡 <span className="font-semibold text-white">Giải thích:</span> {ex.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Tags */}
                {problem?.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {problem.tags.map((t: string) => (
                      <span key={t} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {leftTab === "hints" && (
              <div className="space-y-3.5">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Gợi ý giải thuật
                </p>
                {problem?.hints?.map((h: string, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed shadow-sm">
                    <p className="font-bold text-amber-400 mb-1.5">Gợi ý #{i + 1}:</p>
                    <p>{h}</p>
                  </div>
                ))}
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">👨‍🏫 Lịch sử bài nộp của học viên</p>
                  <button onClick={fetchSubmissions} className="p-1 rounded-lg hover:bg-white/10 text-slate-400 text-xs flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Làm mới
                  </button>
                </div>
                {loadingSubs ? (
                  <div className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" /> Đang tải...</div>
                ) : submissions.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">Chưa có bài nộp nào cho bài này.</div>
                ) : (
                  submissions.map((s) => (
                    <div key={s.id} className="p-3 rounded-2xl border border-white/10 bg-[#121826] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{s.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.language} • {s.submitted_at}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${verdictStyle[s.verdict] || "text-emerald-400"}`}>{s.verdict}</span>
                        <button onClick={() => setInspectCodeModal(s)} className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold hover:bg-white/20 text-white">Coi code</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Monaco Editor & Developer Terminal ─────────────── */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          
          {/* Editor Header Toolbar */}
          <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-white/10 bg-[#121826] shrink-0">
            {/* Language Switcher */}
            <div className="flex gap-1 p-0.5 rounded-xl bg-black/50 border border-white/10">
              {LANGS.map(l => (
                <button
                  key={l.key}
                  onClick={() => handleLangChange(l.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    lang === l.key
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>

            {/* Right Editor Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode(problem?.starter_code?.[lang] || "")}
                title="Khôi phục mã nguồn ban đầu (Reset)"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-white/5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => copyToClipboard(code, "editor-code")}
                title="Sao chép toàn bộ code"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition border border-white/5"
              >
                {copiedField === "editor-code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsTerminalOpen(prev => !prev)}
                className={`px-3 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  isTerminalOpen
                    ? "bg-purple-600/30 border-purple-500/50 text-purple-200 shadow-sm"
                    : "border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                <span>{isTerminalOpen ? "Ẩn Terminal" : "Mở Terminal"}</span>
                {isTerminalOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Monaco Editor Window */}
          <div className="flex-1 overflow-hidden relative">
            <MonacoEditor
              height="100%"
              language={currentLangObj.monacoLang}
              value={code}
              onChange={v => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "line",
                tabSize: 4,
                wordWrap: "on",
                bracketPairColorization: { enabled: true },
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                formatOnPaste: true,
              }}
            />

            {/* Floating button if terminal is closed */}
            {!isTerminalOpen && (
              <button
                onClick={() => setIsTerminalOpen(true)}
                className="absolute bottom-4 right-4 z-20 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-xl shadow-purple-600/40 flex items-center gap-2 border border-purple-400/30 transition-all active:scale-95"
              >
                <Terminal className="w-4 h-4" />
                <span>Mở Developer Terminal</span>
              </button>
            )}
          </div>

          {/* ── GORGEOUS DEVELOPER TERMINAL WINDOW ──────────────────────────── */}
          {isTerminalOpen && (
            <div
              className={`border-t border-purple-500/30 bg-[#0a0e17] flex flex-col shrink-0 shadow-2xl transition-all duration-200 ${
                isTerminalFullscreen
                  ? "fixed inset-x-0 bottom-0 top-14 z-40 h-auto"
                  : "h-[300px] sm:h-[330px]"
              }`}
            >
              
              {/* ── MacOS Terminal Window Header ──────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-2 bg-[#101522] border-b border-white/10 shrink-0 select-none">
                {/* Traffic Lights & Title */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] cursor-pointer hover:opacity-80" onClick={() => setIsTerminalOpen(false)} title="Đóng Terminal" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] cursor-pointer hover:opacity-80" onClick={() => setIsTerminalFullscreen(false)} title="Thu nhỏ" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] cursor-pointer hover:opacity-80" onClick={() => setIsTerminalFullscreen(prev => !prev)} title="Toàn màn hình" />
                  </div>

                  <div className="flex items-center gap-2 pl-2 text-xs font-mono font-bold text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-slate-400">minda@sandbox:</span>
                    <span className="text-purple-300">~/solution{currentLangObj.ext}</span>
                    {runningTest && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                  </div>
                </div>

                {/* Terminal View Switcher Pills */}
                <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-xl border border-white/10 text-xs">
                  <button
                    onClick={() => setTerminalView("split")}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      terminalView === "split"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Song song (Input + Output)</span>
                  </button>

                  <button
                    onClick={() => setTerminalView("input")}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      terminalView === "input"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>📥 STDIN</span>
                  </button>

                  <button
                    onClick={() => setTerminalView("console")}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      terminalView === "console"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>📤 Console</span>
                  </button>

                  <button
                    onClick={() => setTerminalView("verdict")}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      terminalView === "verdict"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Kết quả Nộp bài</span>
                    {judgeResult && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-bold ${verdictStyle[judgeResult.verdict ?? "WA"]}`}>
                        {judgeResult.verdict}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Window Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsTerminalFullscreen(prev => !prev)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                    title={isTerminalFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
                  >
                    {isTerminalFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* ── Terminal Body ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-hidden p-3 font-mono text-xs">

                {/* 1. SPLIT VIEW: STDIN & STDOUT SIDE BY SIDE */}
                {terminalView === "split" && (
                  <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-3">
                    
                    {/* LEFT HALF: STDIN INPUT */}
                    <div className="flex flex-col bg-[#111624] border border-white/10 rounded-2xl p-3 overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                        <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">$</span> STDIN (Dữ liệu đầu vào):
                        </span>
                        <div className="flex items-center gap-1">
                          {problem?.examples?.map((ex: any, i: number) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setCustomInput(ex.input)}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 hover:bg-purple-500/20 border border-white/10 text-slate-300 hover:text-purple-300 transition"
                            >
                              Test {i + 1}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setCustomInput("")}
                            className="text-[10px] px-1.5 py-0.5 text-slate-500 hover:text-rose-400"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        placeholder="Nhập dữ liệu STDIN tại đây (hoặc để trống nếu chỉ in cout đơn giản)..."
                        className="flex-1 w-full bg-transparent text-slate-100 placeholder:text-slate-600 font-mono text-xs resize-none focus:outline-none pt-2 leading-relaxed"
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 shrink-0">
                        <span className="text-[10px] text-slate-500">Phím tắt: Ctrl + Enter</span>
                        <button
                          onClick={handleRunTest}
                          disabled={runningTest}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
                        >
                          {runningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                          <span>Chạy thử ngay</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT HALF: STDOUT CONSOLE */}
                    <div className="flex flex-col bg-[#111624] border border-white/10 rounded-2xl p-3 overflow-hidden shadow-inner">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span className="text-purple-400 font-bold">$</span> Console Output (stdout):
                        </span>
                        {consoleOutput && (
                          <div className="flex items-center gap-2 text-[10px]">
                            {consoleOutput.status === "success" ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Exit 0
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                            {consoleOutput.execution_time && <span className="text-slate-400">⏱ {consoleOutput.execution_time}</span>}
                            {consoleOutput.memory_used && <span className="text-slate-400">💾 {consoleOutput.memory_used}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto pt-2 space-y-2 custom-scrollbar">
                        {runningTest ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                            <p className="text-xs">Đang biên dịch và thực thi chương trình...</p>
                          </div>
                        ) : consoleOutput ? (
                          <>
                            {consoleOutput.stdout ? (
                              <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">
                                {consoleOutput.stdout}
                              </pre>
                            ) : !consoleOutput.stderr ? (
                              <p className="text-slate-500 italic">(Chương trình kết thúc mà không in gì ra stdout)</p>
                            ) : null}

                            {consoleOutput.stderr && (
                              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                                <p className="text-[10px] uppercase font-bold text-rose-400 mb-1">Standard Error (stderr):</p>
                                <pre className="whitespace-pre-wrap leading-relaxed select-all text-rose-200">
                                  {consoleOutput.stderr}
                                </pre>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-1">
                            <Terminal className="w-6 h-6 opacity-30" />
                            <p className="text-xs">Bấm "Chạy thử ngay" để thực thi code và xem output</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* 2. INPUT ONLY VIEW */}
                {terminalView === "input" && (
                  <div className="h-full flex flex-col bg-[#111624] border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                      <span className="text-xs font-bold text-purple-300">Dữ liệu đầu vào chuẩn (STDIN):</span>
                      <button onClick={handleRunTest} disabled={runningTest} className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5">
                        {runningTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                        <span>Chạy thử</span>
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      value={customInput}
                      onChange={e => setCustomInput(e.target.value)}
                      placeholder="Nhập hoặc dán dữ liệu test tại đây..."
                      className="flex-1 w-full bg-transparent text-slate-100 font-mono text-xs resize-none focus:outline-none pt-3 leading-relaxed"
                    />
                  </div>
                )}

                {/* 3. CONSOLE ONLY VIEW */}
                {terminalView === "console" && (
                  <div className="h-full flex flex-col bg-[#111624] border border-white/10 rounded-2xl p-4 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
                      <span className="text-xs font-bold text-slate-300">Console Log & Standard Output:</span>
                      {consoleOutput && (
                        <span className="text-slate-400 text-xs">Thời gian chạy: {consoleOutput.execution_time}</span>
                      )}
                    </div>
                    <div className="flex-1 pt-3 overflow-y-auto">
                      {consoleOutput?.stdout && (
                        <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">{consoleOutput.stdout}</pre>
                      )}
                      {consoleOutput?.stderr && (
                        <pre className="text-rose-300 whitespace-pre-wrap leading-relaxed select-all mt-2">{consoleOutput.stderr}</pre>
                      )}
                      {!consoleOutput && (
                        <p className="text-slate-500 italic">Chưa có kết quả chạy. Vui lòng bấm 'Chạy thử'.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. VERDICT VIEW: ONLINE JUDGE SUBMISSION */}
                {terminalView === "verdict" && (
                  <div className="h-full flex flex-col bg-[#111624] border border-white/10 rounded-2xl p-4 overflow-y-auto">
                    {submittingJudge ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                        <p className="text-sm font-bold text-white">Online Judge đang chấm toàn bộ test cases...</p>
                      </div>
                    ) : judgeResult ? (
                      <div className="space-y-4">
                        {/* Verdict Header Banner */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${verdictStyle[judgeResult.verdict ?? "WA"]}`}>
                          <div className="flex items-center gap-3.5">
                            {judgeResult.verdict === "AC" ? (
                              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                            ) : judgeResult.verdict === "CE" ? (
                              <AlertCircle className="w-8 h-8 text-rose-400 shrink-0" />
                            ) : (
                              <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                            )}
                            <div>
                              <p className="font-black text-lg">
                                {{
                                  AC: "ACCEPTED 🎉 (Chính xác 100%)",
                                  WA: "WRONG ANSWER ❌ (Kết quả không khớp)",
                                  TLE: "TIME LIMIT EXCEEDED ⏱ (Quá thời gian)",
                                  CE: "COMPILE ERROR 🔴 (Lỗi biên dịch)",
                                  RTE: "RUNTIME ERROR ⚠️ (Lỗi thực thi)"
                                }[judgeResult.verdict ?? "WA"]}
                              </p>
                              <p className="text-xs opacity-90 mt-0.5">
                                Đã vượt qua: <span className="font-bold">{judgeResult.passed ?? 0}/{judgeResult.total ?? 0}</span> test cases
                              </p>
                            </div>
                          </div>

                          <div className="text-right text-xs opacity-80 font-mono">
                            <p>Thời gian: {judgeResult.time || "—"}</p>
                            <p>Bộ nhớ: {judgeResult.memory || "—"}</p>
                          </div>
                        </div>

                        {/* Test breakdown cards */}
                        {judgeResult.test_results && judgeResult.test_results.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chi tiết từng test case:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {judgeResult.test_results.map((tc, idx) => (
                                <div
                                  key={idx}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                                    tc.passed
                                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                      : "bg-red-500/10 border-red-500/30 text-red-300"
                                  }`}
                                >
                                  <span>Test #{tc.test_index} {tc.is_hidden ? "(Ẩn)" : ""}</span>
                                  <span className="font-bold">{tc.verdict} ({tc.time})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Compile error */}
                        {judgeResult.verdict === "CE" && judgeResult.error && (
                          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30">
                            <p className="text-xs font-bold text-rose-400 uppercase mb-1.5">Lỗi biên dịch:</p>
                            <pre className="text-xs text-rose-200 whitespace-pre-wrap select-all">{judgeResult.error}</pre>
                          </div>
                        )}

                        {/* Wrong answer diff */}
                        {judgeResult.verdict === "WA" && judgeResult.failed_case && (
                          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3.5 space-y-2">
                            <p className="text-xs font-bold text-red-400">Sai ở test case:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <p className="text-[10px] text-slate-400 mb-1">Output của bạn:</p>
                                <pre className="bg-black/60 p-2.5 rounded-xl text-red-300 whitespace-pre-wrap border border-white/5">{judgeResult.failed_case.actual}</pre>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-400 mb-1">Output mong đợi:</p>
                                <pre className="bg-black/60 p-2.5 rounded-xl text-emerald-300 whitespace-pre-wrap border border-white/5">{judgeResult.failed_case.expected}</pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Trophy className="w-8 h-8 opacity-30" />
                        <p className="text-xs">Bấm nút "Nộp bài" ở thanh trên để chấm điểm toàn bộ test cases.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* ── Terminal Bottom Status Bar ─────────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-[#0e131f] border-t border-white/10 shrink-0 text-[11px] text-slate-500 select-none">
                <div className="flex items-center gap-3">
                  <span>Shell: <strong className="text-slate-400">bash / sandbox</strong></span>
                  <span>Lang: <strong className="text-slate-400">{currentLangObj.label}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Phím tắt: <code className="bg-black/40 px-1 py-0.5 rounded text-slate-300 border border-white/5">Ctrl+Enter</code> Chạy thử</span>
                  <span>•</span>
                  <span><code className="bg-black/40 px-1 py-0.5 rounded text-slate-300 border border-white/5">Ctrl+Shift+Enter</code> Nộp bài</span>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* ── Teacher Code Inspection Modal ─────────────────────────────────── */}
      {inspectCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-neutral-900 border border-white/15 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Bài làm của:</span>
                  <span className="text-indigo-400 font-bold">{inspectCodeModal.student_name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ngôn ngữ: <span className="font-mono text-white">{inspectCodeModal.language}</span> · Nộp lúc: {inspectCodeModal.submitted_at}
                </p>
              </div>
              <button
                onClick={() => setInspectCodeModal(null)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-4 flex flex-col">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mã nguồn bài làm:</p>
              <pre className="flex-1 overflow-y-auto custom-scrollbar text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
                {inspectCodeModal.code}
              </pre>
            </div>

            <div className="flex items-center justify-between mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Kết quả:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-black ${verdictStyle[inspectCodeModal.verdict] || "text-emerald-400"}`}>
                  {inspectCodeModal.verdict}
                </span>
              </div>
              <button
                onClick={() => setInspectCodeModal(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
