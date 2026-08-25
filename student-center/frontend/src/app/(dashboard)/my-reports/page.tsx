"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BookOpen, Calendar, Star, CheckCircle2, XCircle, Clock,
  BarChart3, TrendingUp, Award, Target, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, Home, User, Activity, Sparkles
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("minda_token") || "" : "";
const getUserId = () => typeof window !== "undefined" ? localStorage.getItem("minda_user_id") || "" : "";

type TabType = "session" | "weekly" | "monthly";

const STATUS_ICON: Record<string, JSX.Element> = {
  present: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  absent:  <XCircle className="w-5 h-5 text-red-400" />,
  late:    <Clock className="w-5 h-5 text-amber-400" />,
  excused: <CheckCircle2 className="w-5 h-5 text-blue-400" />,
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  present: { label: "Có mặt",  color: "text-emerald-400" },
  absent:  { label: "Vắng mặt", color: "text-red-400" },
  late:    { label: "Đi muộn", color: "text-amber-400" },
  excused: { label: "Phép",    color: "text-blue-400" },
};

const METHOD_LABEL: Record<string, string> = {
  manual: "✋ Thủ công",
  fingerprint: "🖐️ Vân tay",
  face: "📸 Khuôn mặt",
};

const HW_LABEL: Record<string, { icon: string; text: string; color: string }> = {
  done:    { icon: "✅", text: "Hoàn thành", color: "text-emerald-400" },
  partial: { icon: "⚠️", text: "Làm dở",    color: "text-amber-400" },
  missing: { icon: "❌", text: "Không làm", color: "text-red-400" },
};

function StarDisplay({ value, max = 5 }: { value?: number; max?: number }) {
  if (!value) return <span className="text-text-secondary text-sm">—</span>;
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < value ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />
      ))}
      <span className="text-xs text-text-secondary ml-1 font-semibold">{value}/5</span>
    </div>
  );
}

function AttendanceMiniBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-bg-main rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-amber-400" : "text-red-400"}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function MyReportsPage() {
  const [tab, setTab] = useState<TabType>("session");
  const [loading, setLoading] = useState(true);

  const [sessionReports, setSessionReports] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Stats
  const [stats, setStats] = useState({ total: 0, attended: 0, rate: 0 });

  // Pagination/filter
  const [sessionPage, setSessionPage] = useState(0);
  const [weeklyIdx, setWeeklyIdx] = useState(0);
  const [monthlyIdx, setMonthlyIdx] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const studentId = getUserId();
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [sessRes, weekRes, monRes, attRes] = await Promise.all([
        fetch(`${API}/api/reports/my-session-reports?limit=50`, { headers }),
        fetch(`${API}/api/reports/weekly/${studentId}`, { headers }),
        fetch(`${API}/api/reports/monthly/${studentId}`, { headers }),
        fetch(`${API}/api/attendance/schedule/0`, { headers }), // placeholder — gets own records
      ]);
      if (sessRes.ok) setSessionReports(await sessRes.json());
      if (weekRes.ok) setWeeklyReports(await weekRes.json());
      if (monRes.ok) setMonthlyReports(await monRes.json());

      // Compute stats from session reports
      const sData = sessRes.ok ? await sessRes.clone().json().catch(() => []) : [];
      // Stats computed from weekly/monthly, fallback to session count
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Aggregate stats ────────────────────────────────────────────────────────
  const latestMonthly = monthlyReports[0];
  const overallRate = latestMonthly?.attendance_rate ?? (weeklyReports[0]
    ? weeklyReports[0].attended_sessions / Math.max(weeklyReports[0].total_sessions, 1)
    : null);
  const avgBehavior = sessionReports.filter(r => r.behavior_score).reduce((s, r) => s + r.behavior_score, 0) / Math.max(sessionReports.filter(r => r.behavior_score).length, 1);
  const avgProgress = sessionReports.filter(r => r.progress_score).reduce((s, r) => s + r.progress_score, 0) / Math.max(sessionReports.filter(r => r.progress_score).length, 1);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
    </div>
  );

  const SESSIONS_PER_PAGE = 5;
  const pagedSessions = sessionReports.slice(sessionPage * SESSIONS_PER_PAGE, (sessionPage + 1) * SESSIONS_PER_PAGE);
  const currentWeekly = weeklyReports[weeklyIdx];
  const currentMonthly = monthlyReports[monthlyIdx];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="pt-4 pb-6">
        <h1 className="text-3xl font-black text-text-primary tracking-tight">📊 Nhật Ký Học Tập</h1>
        <p className="text-text-secondary mt-1">Theo dõi tiến độ học tập và báo cáo từ giáo viên</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 text-center">
          <Activity className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-text-primary">
            {overallRate != null ? `${Math.round(overallRate * 100)}%` : "—"}
          </div>
          <p className="text-xs text-text-secondary font-semibold">Chuyên cần</p>
          {overallRate != null && (
            <div className="mt-2">
              <AttendanceMiniBar rate={overallRate} />
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center">
          <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-text-primary">
            {sessionReports.filter(r => r.behavior_score).length > 0 ? avgBehavior.toFixed(1) : "—"}
          </div>
          <p className="text-xs text-text-secondary font-semibold">Thái độ TB</p>
          {sessionReports.filter(r => r.behavior_score).length > 0 && (
            <div className="flex justify-center gap-0.5 mt-2">
              {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.round(avgBehavior) ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />)}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <TrendingUp className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-black text-text-primary">
            {sessionReports.filter(r => r.progress_score).length > 0 ? avgProgress.toFixed(1) : "—"}
          </div>
          <p className="text-xs text-text-secondary font-semibold">Tiến bộ TB</p>
          {sessionReports.filter(r => r.progress_score).length > 0 && (
            <div className="flex justify-center gap-0.5 mt-2">
              {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Math.round(avgProgress) ? "fill-emerald-400 text-emerald-400" : "text-zinc-700"}`} />)}
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2 mb-6 bg-bg-card border border-border-card rounded-2xl p-1.5 w-fit">
        {[
          { key: "session", icon: BookOpen,  label: "Buổi Học" },
          { key: "weekly",  icon: Calendar,  label: "Báo Cáo Tuần" },
          { key: "monthly", icon: BarChart3, label: "Báo Cáo Tháng" },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ── Session Tab ─────────────────────────────────────────────────────── */}
      {tab === "session" && (
        <div className="space-y-4">
          {sessionReports.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có báo cáo buổi học nào</p>
            </div>
          ) : (
            <>
              {pagedSessions.map((report, idx) => (
                <div key={report.id || idx} className="rounded-2xl border border-border-card bg-bg-card overflow-hidden">
                  {/* Report Header */}
                  <div className="p-4 border-b border-border-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-text-primary">
                        {new Date(report.created_at).toLocaleDateString("vi-VN", {
                          weekday: "long", day: "2-digit", month: "2-digit", year: "numeric"
                        })}
                      </p>
                      <p className="text-xs text-text-secondary">Nhận xét từ: {report.teacher_name}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* 1. Bài học hôm nay & 2. Bài học buổi sau */}
                    {(report.lesson_content || report.next_lesson_plan) && (
                      <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                        {report.lesson_content && (
                          <div>
                            <p className="text-xs text-indigo-400 font-bold mb-1 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>📘 Nội dung bài học hôm nay</span>
                            </p>
                            <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line">{report.lesson_content}</p>
                          </div>
                        )}
                        {report.next_lesson_plan && (
                          <div>
                            <p className="text-xs text-purple-400 font-bold mb-1 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>🚀 Nội dung sẽ học ở buổi sau & Chuẩn bị</span>
                            </p>
                            <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-line">{report.next_lesson_plan}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    {report.content && (
                      <div className="p-3 rounded-xl bg-bg-main border border-border-card/50">
                        <p className="text-sm text-text-primary leading-relaxed italic">"{report.content}"</p>
                      </div>
                    )}

                    {/* Scores */}
                    {(report.behavior_score || report.progress_score) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-text-secondary font-semibold mb-1">Thái độ học tập</p>
                          <StarDisplay value={report.behavior_score} />
                        </div>
                        <div>
                          <p className="text-xs text-text-secondary font-semibold mb-1">Tiến bộ</p>
                          <StarDisplay value={report.progress_score} />
                        </div>
                      </div>
                    )}

                    {/* Homework */}
                    {report.homework_status && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-text-secondary font-semibold">Bài tập về nhà:</p>
                        <span className={`text-sm font-bold ${HW_LABEL[report.homework_status]?.color}`}>
                          {HW_LABEL[report.homework_status]?.icon} {HW_LABEL[report.homework_status]?.text}
                        </span>
                      </div>
                    )}

                    {/* Strengths / Weaknesses */}
                    {(report.strengths || report.weaknesses) && (
                      <div className="grid grid-cols-2 gap-3">
                        {report.strengths && (
                          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <p className="text-xs font-bold text-emerald-400 mb-1">💪 Điểm mạnh</p>
                            <p className="text-sm text-text-primary">{report.strengths}</p>
                          </div>
                        )}
                        {report.weaknesses && (
                          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <p className="text-xs font-bold text-amber-400 mb-1">📌 Cần cải thiện</p>
                            <p className="text-sm text-text-primary">{report.weaknesses}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {sessionReports.length > SESSIONS_PER_PAGE && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button disabled={sessionPage === 0} onClick={() => setSessionPage(p => p - 1)}
                    className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30 transition">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-text-secondary">
                    Trang {sessionPage + 1} / {Math.ceil(sessionReports.length / SESSIONS_PER_PAGE)}
                  </span>
                  <button disabled={(sessionPage + 1) * SESSIONS_PER_PAGE >= sessionReports.length}
                    onClick={() => setSessionPage(p => p + 1)}
                    className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30 transition">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Weekly Tab ──────────────────────────────────────────────────────── */}
      {tab === "weekly" && (
        <div>
          {weeklyReports.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có báo cáo tuần nào</p>
            </div>
          ) : (
            <>
              {/* Week selector */}
              <div className="flex items-center gap-3 mb-6">
                <button disabled={weeklyIdx >= weeklyReports.length - 1} onClick={() => setWeeklyIdx(i => i + 1)}
                  className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  {currentWeekly && (
                    <p className="font-bold text-text-primary">
                      Tuần {new Date(currentWeekly.week_start).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} –{" "}
                      {new Date(currentWeekly.week_end).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </p>
                  )}
                </div>
                <button disabled={weeklyIdx === 0} onClick={() => setWeeklyIdx(i => i - 1)}
                  className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {currentWeekly && (
                <div className="space-y-4">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Tổng buổi",  value: currentWeekly.total_sessions,    color: "text-text-primary" },
                      { label: "Đi học",      value: currentWeekly.attended_sessions, color: "text-emerald-400" },
                      { label: "Đi muộn",     value: currentWeekly.late_sessions,     color: "text-amber-400" },
                      { label: "BTVN",        value: currentWeekly.homework_completion_rate != null ? `${Math.round(currentWeekly.homework_completion_rate * 100)}%` : "—", color: "text-indigo-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="p-4 rounded-2xl border border-border-card bg-bg-card text-center">
                        <p className={`text-2xl font-black ${color}`}>{value ?? "—"}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Attendance rate bar */}
                  <div className="p-4 rounded-2xl border border-border-card bg-bg-card">
                    <p className="text-sm font-bold text-text-secondary mb-3">Tỷ lệ chuyên cần tuần này</p>
                    <AttendanceMiniBar rate={currentWeekly.total_sessions > 0 ? currentWeekly.attended_sessions / currentWeekly.total_sessions : 0} />
                  </div>

                  {/* Scores */}
                  {(currentWeekly.avg_behavior_score || currentWeekly.avg_progress_score) && (
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl border border-border-card bg-bg-card">
                      <div>
                        <p className="text-xs font-bold text-text-secondary mb-2">TB Thái độ tuần</p>
                        <StarDisplay value={currentWeekly.avg_behavior_score ? Math.round(currentWeekly.avg_behavior_score) : undefined} />
                        {currentWeekly.avg_behavior_score && <p className="text-xs text-text-secondary mt-1">{currentWeekly.avg_behavior_score.toFixed(1)}/5</p>}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-secondary mb-2">TB Tiến bộ tuần</p>
                        <StarDisplay value={currentWeekly.avg_progress_score ? Math.round(currentWeekly.avg_progress_score) : undefined} />
                        {currentWeekly.avg_progress_score && <p className="text-xs text-text-secondary mt-1">{currentWeekly.avg_progress_score.toFixed(1)}/5</p>}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {currentWeekly.summary && (
                    <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                      <p className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Nhận xét tuần từ giáo viên</p>
                      <p className="text-sm text-text-primary leading-relaxed italic">"{currentWeekly.summary}"</p>
                    </div>
                  )}

                  {/* Goals */}
                  {currentWeekly.goals_next_week && (
                    <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Mục tiêu tuần tới</p>
                      <p className="text-sm text-text-primary">{currentWeekly.goals_next_week}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Monthly Tab ─────────────────────────────────────────────────────── */}
      {tab === "monthly" && (
        <div>
          {monthlyReports.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có báo cáo tháng nào</p>
            </div>
          ) : (
            <>
              {/* Month selector */}
              <div className="flex items-center gap-3 mb-6">
                <button disabled={monthlyIdx >= monthlyReports.length - 1} onClick={() => setMonthlyIdx(i => i + 1)}
                  className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  {currentMonthly && (
                    <p className="font-bold text-text-primary text-lg">
                      Tháng {currentMonthly.month}/{currentMonthly.year}
                    </p>
                  )}
                </div>
                <button disabled={monthlyIdx === 0} onClick={() => setMonthlyIdx(i => i - 1)}
                  className="p-2 rounded-xl border border-border-card hover:bg-bg-hover disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {currentMonthly && (
                <div className="space-y-4">
                  {/* Big attendance card */}
                  <div className="p-6 rounded-2xl border border-border-card bg-bg-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-text-primary">Tỷ lệ chuyên cần</h3>
                      <span className={`text-3xl font-black ${(currentMonthly.attendance_rate || 0) >= 0.9 ? "text-emerald-400" : (currentMonthly.attendance_rate || 0) >= 0.75 ? "text-amber-400" : "text-red-400"}`}>
                        {currentMonthly.attendance_rate != null ? `${Math.round(currentMonthly.attendance_rate * 100)}%` : "—"}
                      </span>
                    </div>
                    <AttendanceMiniBar rate={currentMonthly.attendance_rate || 0} />
                    <div className="flex gap-4 mt-4 text-sm text-text-secondary">
                      <span>Tổng: <strong className="text-text-primary">{currentMonthly.total_sessions}</strong> buổi</span>
                      <span>Đi học: <strong className="text-emerald-400">{currentMonthly.attended_sessions}</strong></span>
                      <span>Vắng: <strong className="text-red-400">{currentMonthly.total_sessions - currentMonthly.attended_sessions}</strong></span>
                    </div>
                  </div>

                  {/* Avg scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-border-card bg-bg-card">
                      <p className="text-xs font-bold text-text-secondary mb-2">TB Thái độ tháng</p>
                      <StarDisplay value={currentMonthly.avg_behavior_score ? Math.round(currentMonthly.avg_behavior_score) : undefined} />
                      <p className="text-lg font-black text-amber-400 mt-1">
                        {currentMonthly.avg_behavior_score ? currentMonthly.avg_behavior_score.toFixed(1) : "—"}/5
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl border border-border-card bg-bg-card">
                      <p className="text-xs font-bold text-text-secondary mb-2">TB Tiến bộ tháng</p>
                      <StarDisplay value={currentMonthly.avg_progress_score ? Math.round(currentMonthly.avg_progress_score) : undefined} />
                      <p className="text-lg font-black text-emerald-400 mt-1">
                        {currentMonthly.avg_progress_score ? currentMonthly.avg_progress_score.toFixed(1) : "—"}/5
                      </p>
                    </div>
                  </div>

                  {/* Overall assessment */}
                  {currentMonthly.overall_assessment && (
                    <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                      <p className="text-xs font-bold text-indigo-400 mb-2">📝 Nhận xét tổng quan tháng</p>
                      <p className="text-sm text-text-primary leading-relaxed italic">"{currentMonthly.overall_assessment}"</p>
                    </div>
                  )}

                  {/* Achievements + Improvements */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {currentMonthly.achievements && (
                      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                        <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" /> Thành tích nổi bật
                        </p>
                        <p className="text-sm text-text-primary">{currentMonthly.achievements}</p>
                      </div>
                    )}
                    {currentMonthly.areas_for_improvement && (
                      <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                        <p className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Cần cải thiện
                        </p>
                        <p className="text-sm text-text-primary">{currentMonthly.areas_for_improvement}</p>
                      </div>
                    )}
                  </div>

                  {/* Goals */}
                  {currentMonthly.goals_next_month && (
                    <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" /> Mục tiêu tháng tới
                      </p>
                      <p className="text-sm text-text-primary">{currentMonthly.goals_next_month}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
