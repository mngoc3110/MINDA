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

// ── Problem database (mirrors /code/page.tsx — will be API-driven later) ────

const PROBLEMS: Record<string, any> = {
  "hello-world": {
    id: "hello-world", title: "Hello, World!", difficulty: "easy", rating: 800,
    tags: ["I/O cơ bản"],
    statement: `In ra màn hình dòng chữ **Hello, World!** (không có dấu cách thừa, xuống dòng sau khi in).`,
    constraints: ["Không có input", "Output: Hello, World!"],
    examples: [
      { input: "(không có)", output: "Hello, World!", explanation: "In đúng chuỗi yêu cầu." }
    ],
    hints: ["Dùng print() trong Python, printf trong C++, System.out.println trong Java."],
    starterCode: {
      python: 'print("Hello, World!")',
      cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
      javascript: 'console.log("Hello, World!");',
      java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
    }
  },
  "sum-two": {
    id: "sum-two", title: "Tổng Hai Số", difficulty: "easy", rating: 850,
    tags: ["Toán", "I/O"],
    statement: `Cho hai số nguyên $a$ và $b$ trên cùng một dòng, cách nhau bởi dấu cách.\n\nIn ra giá trị $a + b$.`,
    constraints: ["$-10^9 \\leq a, b \\leq 10^9$", "1 dòng input gồm 2 số nguyên"],
    examples: [
      { input: "3 5", output: "8", explanation: "3 + 5 = 8" },
      { input: "-1 7", output: "6", explanation: "-1 + 7 = 6" }
    ],
    hints: ["Đọc 2 số nguyên từ stdin.", "Cộng chúng lại và in ra."],
    starterCode: {
      python: 'a, b = map(int, input().split())\nprint(a + b)',
      cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a + b << endl;\n    return 0;\n}',
      javascript: 'const [a, b] = require("fs").readFileSync("/dev/stdin","utf8").trim().split(" ").map(Number);\nconsole.log(a + b);',
      java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        long a = sc.nextLong(), b = sc.nextLong();\n        System.out.println(a + b);\n    }\n}',
    }
  },
  "fibo": {
    id: "fibo", title: "Số Fibonacci thứ N", difficulty: "medium", rating: 1100,
    tags: ["DP", "Đệ quy"],
    statement: `Cho số nguyên $N$. Hãy tính số Fibonacci thứ $N$.\n\nDãy Fibonacci: $F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)$ với $n \\geq 3$.`,
    constraints: ["$1 \\leq N \\leq 10^6$", "Kết quả có thể rất lớn, in theo modulo $10^9 + 7$"],
    examples: [
      { input: "6", output: "8", explanation: "F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8" },
      { input: "1", output: "1", explanation: "F(1) = 1" }
    ],
    hints: ["Đệ quy thông thường sẽ bị TLE với N lớn.", "Dùng DP bottom-up với mảng 1D hoặc 2 biến."],
    starterCode: {
      python: 'MOD = 10**9 + 7\nn = int(input())\na, b = 1, 1\nfor _ in range(n - 1):\n    a, b = b, (a + b) % MOD\nprint(a)',
      cpp: '#include <iostream>\nusing namespace std;\nconst int MOD = 1e9 + 7;\nint main() {\n    int n;\n    cin >> n;\n    long long a = 1, b = 1;\n    for (int i = 2; i < n; i++) {\n        long long c = (a + b) % MOD;\n        a = b; b = c;\n    }\n    cout << a << endl;\n    return 0;\n}',
      javascript: 'const n = parseInt(require("fs").readFileSync("/dev/stdin","utf8").trim());\nconst MOD = 1000000007n;\nlet [a, b] = [1n, 1n];\nfor (let i = 2; i < n; i++) [a, b] = [b, (a + b) % MOD];\nconsole.log(a.toString());',
      java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        long MOD = 1000000007L;\n        int n = new Scanner(System.in).nextInt();\n        long a = 1, b = 1;\n        for (int i = 2; i < n; i++) { long c = (a+b)%MOD; a=b; b=c; }\n        System.out.println(a);\n    }\n}',
    }
  },
};

// Fill remaining problems with a generic template
const GENERIC = (id: string, title: string) => ({
  id, title, difficulty: "medium", rating: 1200,
  tags: ["Thuật toán"],
  statement: `Đây là bài toán **${title}**.\n\nNội dung bài toán đang được cập nhật. Hãy đọc đề từ tài liệu đính kèm.`,
  constraints: ["Đang cập nhật"],
  examples: [{ input: "...", output: "...", explanation: "Xem đề bài." }],
  hints: [],
  starterCode: {
    python: '# Viết code Python ở đây\n\n',
    cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Code ở đây\n    return 0;\n}',
    javascript: '// Viết code JS ở đây\n',
    java: 'public class Main {\n    public static void main(String[] args) {\n        // Code ở đây\n    }\n}',
  }
});

["prime-sieve","sort-basics","binary-search","dp-knapsack","graph-bfs","segment-tree","lca"].forEach(id => {
  if (!PROBLEMS[id]) PROBLEMS[id] = GENERIC(id, id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
});

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Mock judge (replace with real API later) ─────────────────────────────────

async function mockJudge(code: string, lang: LangKey, problem: any): Promise<RunResult> {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));
  // Basic check: non-empty code
  if (!code.trim() || code.trim().split("\n").length < 2) {
    return { verdict: "CE", error: "Code trống hoặc có lỗi cú pháp." };
  }
  // Mock: 70% AC, 20% WA, 10% TLE for demo
  const roll = Math.random();
  if (roll < 0.70) {
    return { verdict: "AC", time: `${(Math.random() * 50 + 10).toFixed(0)}ms`, memory: `${(Math.random() * 5 + 2).toFixed(1)}MB` };
  } else if (roll < 0.90) {
    return { verdict: "WA", output: "7", expected: problem.examples[0]?.output ?? "8", time: `${(Math.random() * 30 + 5).toFixed(0)}ms` };
  } else {
    return { verdict: "TLE", time: ">2000ms" };
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CodeProblemPage() {
  const { id } = useParams<{ id: string }>();
  const problem = PROBLEMS[id] ?? GENERIC(id, id);

  const [lang, setLang] = useState<LangKey>("python");
  const [code, setCode] = useState(problem.starterCode["python"]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [activeTab, setActiveTab] = useState<"problem" | "output">("problem");
  const [showHint, setShowHint] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // When language changes, reset code to starter
  const handleLangChange = (l: LangKey) => {
    setLang(l);
    setCode(problem.starterCode[l] ?? "");
    setResult(null);
  };

  const handleRun = async (submit = false) => {
    setRunning(true);
    setActiveTab("output");
    setResult(null);
    if (submit) setSubmitted(false);
    const res = await mockJudge(code, lang, problem);
    setResult(res);
    setRunning(false);
    if (submit && res.verdict === "AC") setSubmitted(true);
  };

  const verdictStyle: Record<string, string> = {
    AC:  "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    WA:  "text-red-400 bg-red-500/10 border-red-500/30",
    TLE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    MLE: "text-orange-400 bg-orange-500/10 border-orange-500/30",
    CE:  "text-rose-400 bg-rose-500/10 border-rose-500/30",
  };

  const monacoLang = LANGS.find(l => l.key === lang)?.monacoLang ?? "python";

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex flex-col" style={{ maxHeight: "100vh", overflow: "hidden" }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 bg-bg-main/95 backdrop-blur shrink-0">
        <Link href="/code" className="p-1.5 rounded-lg hover:bg-white/8 text-text-muted hover:text-text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate text-text-primary">{problem.title}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${DIFF_STYLE[problem.difficulty]}`}>
            {DIFF_LABEL[problem.difficulty]}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-text-muted font-mono shrink-0">
            {problem.rating} Elo
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
                      <MathText>{problem.statement}</MathText>
                    </div>
                  </div>

                  {/* Constraints */}
                  {problem.constraints?.length > 0 && (
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
                  <div>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Ví dụ</p>
                    <div className="flex flex-col gap-3">
                      {problem.examples?.map((ex: any, i: number) => (
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

                  {/* Hints */}
                  {problem.hints?.length > 0 && (
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
                    {problem.tags?.map((t: string) => (
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
              onClick={() => { setCode(problem.starterCode[lang] ?? ""); setResult(null); }}
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
