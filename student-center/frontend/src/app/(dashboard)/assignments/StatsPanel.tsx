"use client";
import { User, BarChart2, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

interface StudentTarget {
  id: number;
  name: string;
  avatar: string | null;
}

interface Props {
  submissions: any[];
  statsStudent: StudentTarget | null;
  onSelectStudent?: (st: StudentTarget) => void;
  hideStudentSelector?: boolean;
}

export default function StatsPanel({ submissions, statsStudent, onSelectStudent, hideStudentSelector }: Props) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const allStudents: StudentTarget[] = Array.from(
    new Map(
      submissions.map((s: any) => [
        s.student_id,
        { id: s.student_id, name: s.student_name, avatar: s.student_avatar },
      ])
    ).values()
  );

  const target = statsStudent ?? allStudents[0] ?? null;

  if (!target) {
    return (
      <div className="flex items-center justify-center h-40 text-text-muted text-sm">
        Chưa có dữ liệu.
      </div>
    );
  }

  // 1. Dữ liệu mốc thời gian liên tục (Timeline)
  const attempts = submissions
    .filter((s: any) => s.student_id === target.id)
    .map((s: any) => ({
      title: s.assignment_title,
      score: s.score ?? 0,
      max: s.max_score ?? 10,
      normalized_score: ((s.score ?? 0) / (s.max_score ?? 10)) * 10,
      date: s.submitted_at,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const W = 600, H = 220;
  const PAD = { t: 30, r: 30, b: 40, l: 40 };
  const maxAttempts = Math.max(attempts.length, 2);
  const xStep = (W - PAD.l - PAD.r) / Math.max(attempts.length - 1, 1);
  const globalMax = 10; // Điểm đã chuẩn hóa về hệ 10

  const handleAnalyzeAI = async () => {
    if (attempts.length === 0) return;
    setAnalyzing(true);
    setAiAnalysis(null);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn"}/api/ai/analyze-stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ history: attempts })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.reply);
      } else {
        setAiAnalysis("❌ Lỗi: Không thể kết nối AI lúc này.");
      }
    } catch (e) {
      setAiAnalysis("❌ Lỗi: Hệ thống đang bận.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-5 overflow-y-auto w-full">
      {/* Student picker */}
      {!hideStudentSelector && allStudents.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {allStudents.slice(0, 15).map((st) => (
            <button
              key={st.id}
              onClick={() => {
                onSelectStudent?.(st);
                setAiAnalysis(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                target.id === st.id
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-white/10 text-text-muted hover:border-indigo-500/30"
              }`}
            >
              <User className="w-3 h-3" />
              {st.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Chart Section */}
      <div className="bg-bg-hover rounded-2xl border border-border-card p-5 relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Tiến độ học tập xuyên suốt —{" "}
            <span className="text-indigo-400">{target.name}</span>
          </p>
          <button
            onClick={handleAnalyzeAI}
            disabled={analyzing || attempts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
          >
            {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Phân tích bằng AI
          </button>
        </div>

        {attempts.length === 0 ? (
          <p className="text-xs text-text-muted py-8 text-center">
            Học sinh chưa làm bài nào.
          </p>
        ) : (
          <div className="relative overflow-x-auto w-full pb-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[500px]" style={{ maxHeight: 250, overflow: 'visible' }}>
              {/* Defs for gradients */}
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = PAD.t + (H - PAD.t - PAD.b) * (1 - frac);
                const label = Math.round(frac * globalMax);
                return (
                  <g key={frac}>
                    <line
                      x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
                      stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray={frac === 0 ? "0" : "4 4"}
                    />
                    <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)" fontWeight="500">
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Path Data */}
              {(() => {
                const pts = attempts.map((a, i) => ({
                  x: PAD.l + i * xStep,
                  y: PAD.t + (H - PAD.t - PAD.b) * (1 - Math.min(a.normalized_score / globalMax, 1)),
                }));

                const dPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                const dArea = `${dPath} L${pts[pts.length - 1].x},${H - PAD.b} L${pts[0].x},${H - PAD.b} Z`;

                return (
                  <>
                    <path d={dArea} fill="url(#areaGradient)" />
                    <path d={dPath} fill="none" stroke="#818cf8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    
                    {pts.map((p, i) => {
                      const a = attempts[i];
                      const dObj = new Date(a.date);
                      const dateStr = `${dObj.getDate()}/${dObj.getMonth()+1}`;
                      const isHovered = hoveredPoint === i;

                      return (
                        <g key={i} 
                           onMouseEnter={() => setHoveredPoint(i)} 
                           onMouseLeave={() => setHoveredPoint(null)}
                           className="cursor-pointer transition-all duration-200"
                        >
                          {/* Invisible larger circle for easier hover */}
                          <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                          <circle 
                            cx={p.x} cy={p.y} 
                            r={isHovered ? "6" : "4"} 
                            fill={isHovered ? "#fff" : "#818cf8"} 
                            stroke="#312e81" strokeWidth="2" 
                          />
                          
                          {/* Point Score Label */}
                          <text 
                            x={p.x} y={p.y - 12} 
                            textAnchor="middle" fontSize="11" fontWeight="bold" 
                            fill={isHovered ? "#fff" : "#a5b4fc"}
                          >
                            {Math.round(a.score * 10) / 10}
                          </text>

                          {/* X-axis Date */}
                          <text 
                            x={p.x} y={H - PAD.b + 18} 
                            textAnchor="middle" fontSize="10" 
                            fill={isHovered ? "#fff" : "rgba(255,255,255,0.4)"}
                          >
                            {dateStr}
                          </text>

                          {/* Tooltip for Assignment Title */}
                          {isHovered && (
                            <g>
                              <rect 
                                x={Math.max(PAD.l, Math.min(p.x - 60, W - PAD.r - 120))} 
                                y={H - PAD.b + 28} 
                                width="120" height="24" rx="4" 
                                fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1"
                              />
                              <text 
                                x={Math.max(PAD.l + 60, Math.min(p.x, W - PAD.r - 60))} 
                                y={H - PAD.b + 44} 
                                textAnchor="middle" fontSize="10" fill="#c7d2fe"
                              >
                                {a.title.length > 18 ? a.title.substring(0, 18) + '...' : a.title}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        )}
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-yellow-400" /> Nhận xét từ giáo viên AI
          </h4>
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </p>
        </div>
      )}

      {/* Summary Table */}
      {attempts.length > 0 && (
        <div className="bg-bg-hover rounded-2xl border border-border-card overflow-hidden mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-card bg-black/20">
                <th className="text-left px-4 py-3 text-text-muted font-bold">Thời gian nộp</th>
                <th className="text-left px-4 py-3 text-text-muted font-bold">Tên bài tập</th>
                <th className="text-center px-4 py-3 text-text-muted font-bold">Điểm số</th>
              </tr>
            </thead>
            <tbody>
              {[...attempts].reverse().slice(0, 10).map((a, idx) => (
                <tr key={idx} className="border-b border-border-card last:border-0 hover:bg-white/5">
                  <td className="px-4 py-2.5 text-text-secondary">
                    {new Date(a.date).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {a.title}
                  </td>
                  <td className="px-4 py-2.5 text-center font-bold text-indigo-400">
                    {a.score}/{a.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attempts.length > 10 && (
            <div className="px-4 py-2 text-center text-text-muted text-xs bg-black/10">
              Chỉ hiển thị 10 lần nộp gần nhất.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
