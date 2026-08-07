"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Shield, Star, CheckCircle2, XCircle, Clock, BookOpen,
  Calendar, BarChart3, TrendingUp, Award, Target, User,
  Loader2, AlertCircle, ChevronLeft, ChevronRight, Eye, Activity
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";

type Step = "loading" | "pin-entry" | "reports" | "error";

function StarDisplay({ value }: { value?: number }) {
  if (!value) return <span className="text-zinc-500 text-sm">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= value ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`} />
      ))}
    </div>
  );
}

function AttendanceBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold min-w-[3rem] text-right ${pct >= 90 ? "text-emerald-400" : pct >= 75 ? "text-amber-400" : "text-red-400"}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function ParentPortalPage() {
  const { token } = useParams() as { token: string };
  const [step, setStep] = useState<Step>("loading");
  const [linkInfo, setLinkInfo] = useState<{ student_name: string; teacher_name: string; parent_name?: string } | null>(null);
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [sessionToken, setSessionToken] = useState("");
  const [reportsData, setReportsData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [activeTab, setActiveTab] = useState<"session" | "weekly" | "monthly">("session");
  const [sessionIdx, setSessionIdx] = useState(0);
  const [weeklyIdx, setWeeklyIdx] = useState(0);
  const [monthlyIdx, setMonthlyIdx] = useState(0);

  // Load link info
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${API}/api/parent/${token}/info`);
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          // Response body was not JSON
        }

        if (!res.ok) {
          const detail = data?.detail;
          const fallback = res.status === 404
            ? "Link không hợp lệ hoặc đã bị thu hồi. Vui lòng liên hệ giáo viên để nhận link mới."
            : res.status === 410
            ? "Link đã hết hạn. Vui lòng liên hệ giáo viên để nhận link mới."
            : "Link không khả dụng";
          setErrorMsg(detail || fallback);
          setStep("error");
          return;
        }

        setLinkInfo(data);
        setStep("pin-entry");
      } catch (err) {
        console.error("Parent fetch info error:", err);
        setErrorMsg("Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại mạng.");
        setStep("error");
      }
    };
    if (token) {
      fetchInfo();
    }
  }, [token]);

  const handlePinChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[idx] = val.slice(-1);
    setPin(newPin);
    // Auto-focus next
    if (val && idx < 5) {
      const next = document.getElementById(`pin-${idx + 1}`);
      next?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      document.getElementById(`pin-${idx - 1}`)?.focus();
    }
  };

  const verifyPin = async () => {
    const pinStr = pin.join("");
    if (pinStr.length < 6) return;
    setVerifying(true);
    try {
      const res = await fetch(`${API}/api/parent/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_code: pinStr }),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.detail || "Mã PIN không đúng");
        setPin(["", "", "", "", "", ""]);
        document.getElementById("pin-0")?.focus();
        setVerifying(false);
        return;
      }
      const data = await res.json();
      setSessionToken(data.session_token);
      // Fetch reports
      const rRes = await fetch(`${API}/api/parent/${token}/reports?session_token=${data.session_token}`);
      if (rRes.ok) setReportsData(await rRes.json());
      setStep("reports");
    } catch {
      setErrorMsg("Lỗi kết nối, thử lại sau");
    }
    setVerifying(false);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-rose-400" />
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (step === "error") return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">Link không khả dụng</h1>
        <p className="text-zinc-400">{errorMsg}</p>
        <p className="text-sm text-zinc-500">Vui lòng liên hệ giáo viên để nhận link mới.</p>
      </div>
    </div>
  );

  // ── PIN Entry ──────────────────────────────────────────────────────────────
  if (step === "pin-entry") return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/20 mb-4">
            <Shield className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">MINDA</h1>
          <p className="text-rose-400 text-sm font-semibold tracking-widest uppercase mt-0.5">Cổng Phụ Huynh</p>
        </div>

        {/* Student info */}
        {linkInfo && (
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 text-center space-y-1">
            <p className="text-zinc-400 text-sm">Báo cáo học tập của</p>
            <p className="text-white font-black text-xl">{linkInfo.student_name}</p>
            <p className="text-zinc-500 text-sm">Giáo viên: {linkInfo.teacher_name}</p>
            {linkInfo.parent_name && (
              <p className="text-rose-400 text-xs font-semibold mt-1">Dành cho: {linkInfo.parent_name}</p>
            )}
          </div>
        )}

        {/* PIN input */}
        <div className="space-y-4">
          <p className="text-center text-zinc-300 font-semibold">Nhập mã PIN 6 số</p>
          <div className="flex gap-2 justify-center">
            {pin.map((d, i) => (
              <input
                key={i}
                id={`pin-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handlePinChange(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-black bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30 transition"
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-center text-red-400 text-sm font-semibold animate-shake">{errorMsg}</p>
          )}

          <button
            onClick={verifyPin}
            disabled={pin.join("").length < 6 || verifying}
            className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-bold text-base hover:bg-rose-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
            Xem báo cáo
          </button>
        </div>

        {/* Upsell */}
        <div className="text-center">
          <p className="text-zinc-600 text-xs">
            Muốn theo dõi thường xuyên?{" "}
            <a href="/register" className="text-rose-400 hover:text-rose-300 font-semibold">
              Tạo tài khoản phụ huynh →
            </a>
          </p>
        </div>
      </div>
    </div>
  );

  // ── Reports View ───────────────────────────────────────────────────────────
  if (step === "reports" && reportsData) {
    const { session_reports = [], weekly_reports = [], monthly_reports = [], stats, student_name, teacher_name } = reportsData;
    const currentSession = session_reports[sessionIdx];
    const currentWeekly = weekly_reports[weeklyIdx];
    const currentMonthly = monthly_reports[monthlyIdx];

    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="font-black text-sm text-white">{student_name}</p>
              <p className="text-zinc-500 text-xs">GV: {teacher_name}</p>
            </div>
            <button onClick={() => setStep("pin-entry")} className="text-xs text-zinc-500 hover:text-zinc-300">Đổi học sinh</button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-16 pt-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-center">
              <Activity className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">
                {stats?.attendance_rate != null ? `${stats.attendance_rate}%` : "—"}
              </p>
              <p className="text-xs text-zinc-500">Chuyên cần</p>
            </div>
            <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-center">
              <BookOpen className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{session_reports.length}</p>
              <p className="text-xs text-zinc-500">Báo cáo</p>
            </div>
            <div className="p-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-center">
              <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-black text-white">{monthly_reports.length > 0 ? `${monthly_reports.length}T` : "—"}</p>
              <p className="text-xs text-zinc-500">Tháng theo dõi</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {[
              { key: "session", label: "Buổi Học" },
              { key: "weekly",  label: "Tuần" },
              { key: "monthly", label: "Tháng" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${activeTab === key ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Session Reports */}
          {activeTab === "session" && (
            session_reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p>Chưa có báo cáo buổi học</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button disabled={sessionIdx >= session_reports.length - 1} onClick={() => setSessionIdx(i => i + 1)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <p className="flex-1 text-center text-sm text-zinc-400 font-semibold">
                    {new Date(currentSession.created_at).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" })}
                    <span className="text-zinc-600 ml-2">({sessionIdx + 1}/{session_reports.length})</span>
                  </p>
                  <button disabled={sessionIdx === 0} onClick={() => setSessionIdx(i => i - 1)}
                    className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>

                {currentSession && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden space-y-0">
                    {currentSession.content && (
                      <div className="p-4 border-b border-zinc-800">
                        <p className="text-xs text-rose-400 font-bold mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Nhận xét giáo viên</p>
                        <p className="text-sm text-zinc-200 leading-relaxed italic">"{currentSession.content}"</p>
                      </div>
                    )}
                    <div className="p-4 grid grid-cols-2 gap-4 border-b border-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1.5">Thái độ học tập</p>
                        <StarDisplay value={currentSession.behavior_score} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1.5">Tiến bộ</p>
                        <StarDisplay value={currentSession.progress_score} />
                      </div>
                    </div>
                    {currentSession.homework_status && (
                      <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                        <p className="text-xs text-zinc-500">Bài tập:</p>
                        <span className={`text-sm font-bold ${currentSession.homework_status === "done" ? "text-emerald-400" : currentSession.homework_status === "partial" ? "text-amber-400" : "text-red-400"}`}>
                          {currentSession.homework_status === "done" ? "✅ Hoàn thành" : currentSession.homework_status === "partial" ? "⚠️ Làm dở" : "❌ Không làm"}
                        </span>
                      </div>
                    )}
                    {(currentSession.strengths || currentSession.weaknesses) && (
                      <div className="p-4 grid grid-cols-2 gap-3">
                        {currentSession.strengths && (
                          <div>
                            <p className="text-xs text-emerald-400 font-bold mb-1">💪 Điểm mạnh</p>
                            <p className="text-xs text-zinc-300">{currentSession.strengths}</p>
                          </div>
                        )}
                        {currentSession.weaknesses && (
                          <div>
                            <p className="text-xs text-amber-400 font-bold mb-1">📌 Cần cải thiện</p>
                            <p className="text-xs text-zinc-300">{currentSession.weaknesses}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* Weekly */}
          {activeTab === "weekly" && (
            weekly_reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-600"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Chưa có báo cáo tuần</p></div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button disabled={weeklyIdx >= weekly_reports.length - 1} onClick={() => setWeeklyIdx(i => i + 1)} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <p className="flex-1 text-center text-sm text-zinc-400 font-semibold">
                    {currentWeekly && `Tuần ${new Date(currentWeekly.week_start).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} – ${new Date(currentWeekly.week_end).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`}
                  </p>
                  <button disabled={weeklyIdx === 0} onClick={() => setWeeklyIdx(i => i - 1)} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
                {currentWeekly && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {[{ l: "Tổng buổi", v: currentWeekly.total_sessions }, { l: "Đi học", v: currentWeekly.attended_sessions }, { l: "Đi muộn", v: currentWeekly.late_sessions }].map(({ l, v }) => (
                        <div key={l} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-center">
                          <p className="text-xl font-black text-white">{v}</p>
                          <p className="text-xs text-zinc-500">{l}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
                      <p className="text-xs text-zinc-500 mb-2">Tỷ lệ chuyên cần tuần</p>
                      <AttendanceBar rate={currentWeekly.total_sessions > 0 ? currentWeekly.attended_sessions / currentWeekly.total_sessions : 0} />
                    </div>
                    {currentWeekly.summary && (
                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                        <p className="text-xs text-indigo-400 font-bold mb-1">Nhận xét tuần</p>
                        <p className="text-sm text-zinc-200 italic">"{currentWeekly.summary}"</p>
                      </div>
                    )}
                    {currentWeekly.goals_next_week && (
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Mục tiêu tuần tới</p>
                        <p className="text-sm text-zinc-200">{currentWeekly.goals_next_week}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* Monthly */}
          {activeTab === "monthly" && (
            monthly_reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-600"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Chưa có báo cáo tháng</p></div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <button disabled={monthlyIdx >= monthly_reports.length - 1} onClick={() => setMonthlyIdx(i => i + 1)} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                  <p className="flex-1 text-center font-bold text-zinc-300">
                    {currentMonthly && `Tháng ${currentMonthly.month}/${currentMonthly.year}`}
                  </p>
                  <button disabled={monthlyIdx === 0} onClick={() => setMonthlyIdx(i => i - 1)} className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
                {currentMonthly && (
                  <div className="space-y-3">
                    <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xs text-zinc-500">Tỷ lệ chuyên cần tháng</p>
                          <p className={`text-3xl font-black mt-0.5 ${(currentMonthly.attendance_rate || 0) >= 0.9 ? "text-emerald-400" : (currentMonthly.attendance_rate || 0) >= 0.75 ? "text-amber-400" : "text-red-400"}`}>
                            {currentMonthly.attendance_rate != null ? `${Math.round(currentMonthly.attendance_rate * 100)}%` : "—"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-zinc-500">
                          <p>{currentMonthly.attended_sessions}/{currentMonthly.total_sessions} buổi</p>
                        </div>
                      </div>
                      <AttendanceBar rate={currentMonthly.attendance_rate || 0} />
                    </div>
                    {currentMonthly.overall_assessment && (
                      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                        <p className="text-xs text-indigo-400 font-bold mb-1">📝 Nhận xét tổng quan</p>
                        <p className="text-sm text-zinc-200 italic">"{currentMonthly.overall_assessment}"</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {currentMonthly.achievements && (
                        <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                          <p className="text-xs text-amber-400 font-bold mb-1 flex items-center gap-1"><Award className="w-3 h-3" /> Thành tích</p>
                          <p className="text-xs text-zinc-300">{currentMonthly.achievements}</p>
                        </div>
                      )}
                      {currentMonthly.areas_for_improvement && (
                        <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
                          <p className="text-xs text-rose-400 font-bold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Cần cải thiện</p>
                          <p className="text-xs text-zinc-300">{currentMonthly.areas_for_improvement}</p>
                        </div>
                      )}
                    </div>
                    {currentMonthly.goals_next_month && (
                      <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                        <p className="text-xs text-emerald-400 font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Mục tiêu tháng sau</p>
                        <p className="text-xs text-zinc-200">{currentMonthly.goals_next_month}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}

          {/* Footer upsell */}
          <div className="mt-10 p-4 rounded-2xl border border-zinc-800 bg-zinc-900 text-center">
            <p className="text-zinc-500 text-sm">Muốn nhận thông báo khi có báo cáo mới?</p>
            <a href="/register" className="inline-block mt-2 px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 font-bold text-sm hover:bg-rose-500/30 transition">
              Tạo tài khoản phụ huynh →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
