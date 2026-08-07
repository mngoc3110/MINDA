"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft, Play, Send, ChevronDown, CheckCircle2, XCircle,
  Clock, Cpu, AlertCircle, Loader2, RotateCcw, BookOpen,
  Terminal, Trophy, Zap
} from "lucide-react";
import MathText from "@/components/MathText";

// Monaco must be loaded client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

const LANGS = [
  { key: "python",     label: "Python 3",   monacoLang: "python" },
  { key: "cpp",        label: "C++ 17",     monacoLang: "cpp" },
  { key: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { key: "java",       label: "Java 21",    monacoLang: "java" },
] as const;
type LangKey = typeof LANGS[number]["key"];

const DIFF_STYLE: Record<string, string> = {
  easy:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  hard:   "text-red-400 bg-red-500/10 border-red-500/30",
};
const DIFF_LABEL: Record<string, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };

type Verdict = "AC" | "WA" | "TLE" | "CE" | "MLE" | null;
interface RunResult {
  verdict: Verdict;
  output?: string;
  expected?: string;
  time?: string;
  memory?: string;
  error?: string;
}

export default function CodeProblemPage() {
  const params = useParams();
  const rawId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : "";

  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<LangKey>("python");
  const [code, setCode] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [activeTab, setActiveTab] = useState<"problem" | "output">("problem");
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
        } else {
          // Fallback
          setProblem({
            id: rawId,
            title: `Bài tập: ${rawId}`,
            statement: "Chi tiết bài tập đang được tải...",
            difficulty: "easy",
            rating: 800,
            examples: [],
            hints: []
          });
          setCode("# Viết code Python ở đây\n\n");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProblemDetail();
  }, [rawId]);

  const handleLangChange = (l: LangKey) => {
    setLang(l);
    if (problem?.starter_code?.[l]) {
      setCode(problem.starter_code[l]);
    } else {
      setCode(l === "cpp" ? "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}" : "# Viết code ở đây\n");
    }
    setResult(null);
  };

  const handleRun = async (submit = false) => {
    if (!problem?.id) return;
    setRunning(true);
    setActiveTab("output");
    setResult(null);
    if (submit) setSubmitted(false);

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
        setResult(data);
        if (submit && data.verdict === "AC") setSubmitted(true);
      } else {
        setResult({ verdict: "CE", error: "Lỗi kết nối tới hệ thống chấm bài." });
      }
    } catch (e: any) {
      setResult({ verdict: "CE", error: e.message || "Lỗi mạng" });
    } finally {
      setRunning(false);
    }
  };

  const verdictStyle: Record<string, string> = {
    AC:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    WA:  "text-red-400 bg-red-500/10 border-red-500/30",
    TLE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    MLE: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    CE:  "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };

  const monacoLang = LANGS.find(l => l.key === lang)?.monacoLang ?? "python";

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center text-text-primary">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm text-text-muted">Đang tải chi tiết bài tập...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col" style={{ maxHeight: "100vh", overflow: "hidden" }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-bg-main/95 backdrop-blur shrink-0">
        <Link href="/code" className="p-1.5 rounded-lg hover:bg-white/8 text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate text-text-primary">{problem?.title}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${DIFF_STYLE[problem?.difficulty || "easy"]}`}>
            {DIFF_LABEL[problem?.difficulty || "easy"]}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-text-muted font-mono shrink-0">
            {problem?.rating || 800} Elo
          </span>
        </div>
        {submitted && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 shrink-0">
            <Trophy className="w-3.5 h-3.5" /> Accepted!
          </span>
        )}
      </div>

      {/* ── Main layout: split ──────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Problem + Output */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-white/8 overflow-hidden">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-white/8 shrink-0">
            {(["problem", "output"] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2 ${activeTab === t ? "border-indigo-400 text-indigo-300" : "border-transparent text-text-muted hover:text-text-secondary"}`}
              >
                {t === "problem" ? "📄 Đề bài" : "⚡ Kết quả"}
                {result && t === "output" && (
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full border font-black ${verdictStyle[result.verdict ?? "WA"]}`}>
                    {result.verdict}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              {activeTab === "problem" ? (
                <motion.div key="problem" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">
                  {/* Statement */}
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Đề bài</p>
                    <div className="text-sm text-text-secondary leading-relaxed">
                      <MathText>{problem?.statement || problem?.description}</MathText>
                    </div>
                  </div>

                  {/* Constraints */}
                  {problem?.constraints?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Ràng buộc</p>
                      <ul className="flex flex-col gap-1">
                        {problem.constraints.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                            <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
                            <MathText>{c}</MathText>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Examples */}
                  {problem?.examples?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Ví dụ</p>
                      <div className="flex flex-col gap-3">
                        {problem.examples.map((ex: any, i: number) => (
                          <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                            <div className="grid grid-cols-2 divide-x divide-white/8">
                              <div className="p-3">
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-1.5">Input</p>
                                <pre className="text-xs text-text-primary font-mono">{ex.input}</pre>
                              </div>
                              <div className="p-3">
                                <p className="text-[9px] font-bold text-text-muted uppercase mb-1.5">Output</p>
                                <pre className="text-xs text-emerald-300 font-mono">{ex.output}</pre>
                              </div>
                            </div>
                            {ex.explanation && (
                              <div className="px-3 py-2 border-t border-white/8 text-[11px] text-text-muted">
                                💡 {ex.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hints */}
                  {problem?.hints?.length > 0 && (
                    <div>
                      <button onClick={() => setShowHint(v => !v)} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                        <Zap className="w-3.5 h-3.5" />
                        {showHint ? "Ẩn gợi ý" : "Xem gợi ý"}
                      </button>
                      {showHint && (
                        <motion.ul initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex flex-col gap-1.5">
                          {problem.hints.map((h: string, i: number) => (
                            <li key={i} className="text-xs text-amber-300/80 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
                              {i + 1}. {h}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {problem?.tags?.map((t: string) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/6 border border-white/8 text-text-muted">{t}</span>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="output" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  {running ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                      <p className="text-sm text-text-secondary">Đang chạy code...</p>
                      <p className="text-xs text-text-muted">Online Judge đang chấm bài</p>
                    </div>
                  ) : result ? (
                    <div className="flex flex-col gap-4">
                      {/* Verdict */}
                      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${verdictStyle[result.verdict ?? "WA"]}`}>
                        {result.verdict === "AC"
                          ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                          : result.verdict === "CE"
                          ? <Terminal className="w-6 h-6 text-rose-400 shrink-0" />
                          : <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
                        <div>
                          <p className="font-black text-base">{
                            { AC: "Accepted ✅", WA: "Wrong Answer ❌", TLE: "Time Limit Exceeded ⏱️", MLE: "Memory Limit Exceeded", CE: "Compile Error" }[result.verdict ?? "WA"]
                          }</p>
                          <div className="flex gap-3 text-[11px] opacity-70 mt-0.5">
                            {result.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{result.time}</span>}
                            {result.memory && <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{result.memory}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Wrong answer diff */}
                      {result.verdict === "WA" && (
                        <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
                          <div className="grid grid-cols-2 divide-x divide-white/8">
                            <div className="p-3">
                              <p className="text-[9px] font-bold text-text-muted uppercase mb-1.5">Output của bạn</p>
                              <pre className="text-xs text-red-300 font-mono">{result.output}</pre>
                            </div>
                            <div className="p-3">
                              <p className="text-[9px] font-bold text-text-muted uppercase mb-1.5">Expected</p>
                              <pre className="text-xs text-emerald-300 font-mono">{result.expected}</pre>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Compile error */}
                      {result.verdict === "CE" && result.error && (
                        <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                          <p className="text-[9px] font-bold text-rose-400 uppercase mb-1.5">Lỗi biên dịch</p>
                          <pre className="text-xs text-rose-300 whitespace-pre-wrap">{result.error}</pre>
                        </div>
                      )}

                      {/* AC congrats */}
                      {result.verdict === "AC" && (
                        <div className="text-center py-4">
                          <p className="text-2xl mb-2">🎉</p>
                          <p className="text-sm font-bold text-emerald-300">Chính xác! +Elo</p>
                          <p className="text-xs text-text-muted mt-1">Tiếp tục giải các bài khó hơn để leo rank</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-text-muted">
                      <Terminal className="w-8 h-8 opacity-30" />
                      <p className="text-sm">Chưa có kết quả</p>
                      <p className="text-xs">Bấm Run hoặc Submit để chạy code</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-[#1e1e1e] shrink-0">
            {/* Language selector */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 border border-white/8">
              {LANGS.map(l => (
                <button
                  key={l.key}
                  onClick={() => handleLangChange(l.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${lang === l.key ? "bg-indigo-500/30 text-indigo-300" : "text-text-muted hover:text-text-secondary"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Reset */}
            <button
              onClick={() => { setCode(problem?.starter_code?.[lang] || ""); setResult(null); }}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-white/8 transition-colors"
              title="Reset về starter code"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex-1" />

            {/* Run */}
            <button
              onClick={() => handleRun(false)}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-white/12 disabled:opacity-50 transition-all"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run
            </button>

            {/* Submit */}
            <button
              onClick={() => handleRun(true)}
              disabled={running}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Submit
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={monacoLang}
              value={code}
              onChange={v => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
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
          </div>
        </div>
      </div>
    </div>
  );
}
