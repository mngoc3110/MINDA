"use client";
import { User, BarChart2, TrendingUp } from "lucide-react";

interface StudentTarget {
  id: number;
  name: string;
  avatar: string | null;
}

interface Props {
  submissions: any[];
  statsStudent: StudentTarget | null;
  onSelectStudent: (st: StudentTarget) => void;
}

const COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"];

export default function StatsPanel({ submissions, statsStudent, onSelectStudent }: Props) {
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

  // Group by assignment, sorted by time
  const byAssignment = new Map<number, { title: string; max: number; attempts: { score: number; date: string }[] }>();
  submissions
    .filter((s: any) => s.student_id === target.id)
    .forEach((s: any) => {
      if (!byAssignment.has(s.assignment_id)) {
        byAssignment.set(s.assignment_id, {
          title: s.assignment_title,
          max: s.max_score ?? 10,
          attempts: [],
        });
      }
      byAssignment.get(s.assignment_id)!.attempts.push({ score: s.score ?? 0, date: s.submitted_at });
    });
  for (const v of byAssignment.values()) {
    v.attempts.sort((a, b) => a.date.localeCompare(b.date));
  }
  const chartData = Array.from(byAssignment.values());

  const W = 480, H = 200;
  const PAD = { t: 20, r: 16, b: 36, l: 40 };
  const maxAttempts = Math.max(...chartData.map((d) => d.attempts.length), 2);
  const xStep = (W - PAD.l - PAD.r) / Math.max(maxAttempts - 1, 1);
  const globalMax = Math.max(...chartData.map((d) => d.max), 10);

  return (
    <div className="p-5 flex flex-col gap-4 overflow-y-auto">
      {/* Student picker */}
      <div className="flex gap-2 flex-wrap">
        {allStudents.slice(0, 15).map((st) => (
          <button
            key={st.id}
            onClick={() => onSelectStudent(st)}
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

      {/* Chart */}
      <div className="bg-bg-hover rounded-2xl border border-border-card p-4">
        <p className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          Tiến độ điểm —{" "}
          <span className="text-indigo-400">{target.name}</span>
        </p>

        {chartData.length === 0 ? (
          <p className="text-xs text-text-muted py-6 text-center">
            Học sinh chưa làm bài nào.
          </p>
        ) : (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
              {/* Y gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const y = PAD.t + (H - PAD.t - PAD.b) * (1 - frac);
                const label = Math.round(frac * globalMax * 10) / 10;
                return (
                  <g key={frac}>
                    <line
                      x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
                      stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                    />
                    <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.3)">
                      {label}
                    </text>
                  </g>
                );
              })}
              {/* X labels */}
              {Array.from({ length: maxAttempts }).map((_, i) => (
                <text key={i} x={PAD.l + i * xStep} y={H - PAD.b + 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.3)">
                  Lần {i + 1}
                </text>
              ))}
              {/* Lines */}
              {chartData.map((d, ci) => {
                const color = COLORS[ci % COLORS.length];
                const pts = d.attempts.map((a, i) => ({
                  x: PAD.l + i * xStep,
                  y: PAD.t + (H - PAD.t - PAD.b) * (1 - Math.min(a.score / d.max, 1)),
                }));
                if (pts.length === 0) return null;
                if (pts.length === 1) {
                  return (
                    <g key={ci}>
                      <circle cx={pts[0].x} cy={pts[0].y} r="5" fill={color} />
                      <text x={pts[0].x} y={pts[0].y - 9} textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
                        {d.attempts[0].score}
                      </text>
                    </g>
                  );
                }
                const dPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                return (
                  <g key={ci}>
                    <path d={dPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
                        <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
                          {d.attempts[i].score}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {chartData.map((d, ci) => (
                <div key={ci} className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[ci % COLORS.length] }} />
                  <span className="truncate max-w-[140px]">{d.title}</span>
                  <span className="text-text-muted">({d.attempts.length} lần)</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Summary table */}
      {chartData.length > 0 && (
        <div className="bg-bg-hover rounded-2xl border border-border-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-card">
                <th className="text-left px-4 py-2.5 text-text-muted font-bold">Đề bài</th>
                <th className="text-center px-3 py-2.5 text-text-muted font-bold">Lần</th>
                <th className="text-center px-3 py-2.5 text-text-muted font-bold">Tốt nhất</th>
                <th className="text-center px-3 py-2.5 text-text-muted font-bold">Lần cuối</th>
                <th className="text-center px-3 py-2.5 text-text-muted font-bold">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((d, ci) => {
                const best = Math.max(...d.attempts.map((a) => a.score));
                const last = d.attempts[d.attempts.length - 1]?.score ?? 0;
                const first = d.attempts[0]?.score ?? 0;
                const trend = last > first ? "↑" : last < first ? "↓" : "→";
                const trendCls = last > first ? "text-green-400" : last < first ? "text-red-400" : "text-text-muted";
                return (
                  <tr key={ci} className="border-b border-border-card last:border-0 hover:bg-white/5">
                    <td className="px-4 py-2.5 font-medium text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[ci % COLORS.length] }} />
                        <span className="truncate max-w-[150px]">{d.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-text-secondary">{d.attempts.length}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-green-400">{best}/{d.max}</td>
                    <td className="px-3 py-2.5 text-center text-text-secondary">{last}/{d.max}</td>
                    <td className={`px-3 py-2.5 text-center font-black text-lg ${trendCls}`}>{trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
