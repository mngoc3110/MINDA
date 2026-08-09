"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  ClipboardList, Radio, Cpu, BarChart3, Plus, Check, X, Clock,
  Users, Star, ChevronDown, ChevronUp, Loader2, Wifi, WifiOff,
  RefreshCw, AlertCircle, CheckCircle2, Copy, Trash2, Eye, EyeOff,
  BookOpen, Calendar, User, Zap, Shield, ChevronLeft, ChevronRight, RotateCcw, Search, Key
} from "lucide-react";

import ScheduleModal from "@/components/schedule/ScheduleModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("minda_token") || "" : "";

type TabType = "live" | "session" | "weekly-monthly" | "devices";

interface Student { id: number; full_name: string; avatar_url?: string; }
interface ScheduleItem {
  id: number; title: string; start_time: string; end_time: string;
  description?: string;
}
interface AttendanceRecord {
  id: number; student_id: number; student_name: string; student_avatar?: string;
  status: "present" | "absent" | "late" | "excused";
  method: "manual" | "fingerprint" | "face";
  checkin_time?: string; note?: string;
}
interface SessionReport {
  id?: number; student_id: number; student_name: string;
  content?: string; behavior_score?: number; progress_score?: number;
  homework_status?: "done" | "partial" | "missing";
  strengths?: string; weaknesses?: string; is_visible_to_parent: boolean;
}
interface Device { id: number; name: string; device_type: string; is_active: boolean; last_seen?: string; }

const STATUS_CONFIG = {
  present: { label: "Có mặt", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  absent:  { label: "Vắng",   color: "bg-red-500/20 text-red-400 border-red-500/30",           dot: "bg-red-400" },
  late:    { label: "Muộn",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30",     dot: "bg-amber-400" },
  excused: { label: "Phép",   color: "bg-blue-500/20 text-blue-400 border-blue-500/30",        dot: "bg-blue-400" },
};

const HW_CONFIG = {
  done:    { label: "✅ Hoàn thành",  color: "text-emerald-400" },
  partial: { label: "⚠️ Làm dở",      color: "text-amber-400" },
  missing: { label: "❌ Không làm",   color: "text-red-400" },
};

function StarRating({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-5 h-5 ${(hovered || value || 0) >= s ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`} />
        </button>
      ))}
    </div>
  );
}

export default function SessionReportsPage() {
  const [tab, setTab] = useState<TabType>("live");
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Attendance State
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleItem | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [roomStudents, setRoomStudents] = useState<Student[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);

  // Session Report State
  const [reportSchedule, setReportSchedule] = useState<ScheduleItem | null>(null);
  const [sessionReports, setSessionReports] = useState<Record<number, SessionReport>>({});
  const [savingReport, setSavingReport] = useState<number | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<number, boolean>>({});

  // Search queries
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [roomSearchQuery, setRoomSearchQuery] = useState("");

  // Weekly/Monthly
  const getMondayDate = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const [reportMode, setReportMode] = useState<"weekly" | "monthly">("weekly");
  const [weekStart, setWeekStart] = useState(getMondayDate());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [selectedStudentReport, setSelectedStudentReport] = useState<number | null>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [generating, setGenerating] = useState(false);

  // Device Management
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("fingerprint");
  const [createdDeviceToken, setCreatedDeviceToken] = useState<string | null>(null);

  // Parent Link
  const [parentLinks, setParentLinks] = useState<any[]>([]);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [newLinkStudentId, setNewLinkStudentId] = useState<number | null>(null);
  const [newLinkParentName, setNewLinkParentName] = useState("");
  const [newLinkExpires, setNewLinkExpires] = useState<number | null>(null);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null);

  // Schedule edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalSchedule, setEditModalSchedule] = useState<ScheduleItem | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  const handleSaveEditSchedule = async (data: any) => {
    if (!editModalSchedule) return;
    const token = getToken();
    const res = await fetch(`${API}/api/schedules/${editModalSchedule.id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (res.ok && data.student_ids && data.student_ids.length > 0) {
      const extraStudentIds = data.student_ids.filter((sid: number) => sid !== data.student_id);
      if (extraStudentIds.length > 0) {
        await fetch(`${API}/api/schedules/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, student_ids: extraStudentIds })
        });
      }
    }

    setIsEditModalOpen(false);
    const targetId = selectedSchedule?.id || reportSchedule?.id || editModalSchedule.id;
    if (targetId) {
      const stuRes = await fetch(`${API}/api/schedules/${targetId}/students`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (stuRes.ok) setRoomStudents(await stuRes.json());
    }
    fetchData();
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [schRes, stuRes, devRes, linkRes, crsRes] = await Promise.all([
        fetch(`${API}/api/schedules/`, { headers }),
        fetch(`${API}/api/profile/my-offline-students`, { headers }),
        fetch(`${API}/api/attendance/devices`, { headers }),
        fetch(`${API}/api/parent-links/my-links`, { headers }),
        fetch(`${API}/api/courses/`, { headers }),
      ]);
      if (schRes.ok) {
        const data = await schRes.json();
        const sortedData = data.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
        const uniqueSchedules: ScheduleItem[] = [];
        const seenKeys = new Set<string>();
        for (const sch of sortedData) {
          const key = `${sch.title}_${new Date(sch.start_time).getTime()}_${new Date(sch.end_time).getTime()}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueSchedules.push(sch);
          }
        }
        setSchedules(uniqueSchedules);
      }
      if (stuRes.ok) setMyStudents(await stuRes.json());
      if (devRes.ok) setDevices(await devRes.json());
      if (linkRes.ok) setParentLinks(await linkRes.json());
      if (crsRes.ok) setCourses(await crsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── WebSocket for live attendance ──────────────────────────────────────────
  const openLiveRoom = async (schedule: ScheduleItem) => {
    setSelectedSchedule(schedule);
    setRoomStudents([]);
    const headers = { Authorization: `Bearer ${getToken()}` };
    
    // Load existing attendance and schedule-specific students
    const [attRes, stuRes] = await Promise.all([
      fetch(`${API}/api/attendance/schedule/${schedule.id}`, { headers }),
      fetch(`${API}/api/schedules/${schedule.id}/students`, { headers }),
    ]);
    if (attRes.ok) setAttendanceRecords(await attRes.json());
    if (stuRes.ok) setRoomStudents(await stuRes.json());

    // Connect WebSocket
    const wsUrl = `${API.replace("https://", "wss://").replace("http://", "ws://")}/api/attendance/ws/${schedule.id}?token=${getToken()}`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "student_arrived") {
        setAttendanceRecords((prev) => {
          const filtered = prev.filter((r) => Number(r.student_id) !== Number(data.student_id));
          return [...filtered, data];
        });
      } else if (data.type === "attendance_reset") {
        setAttendanceRecords((prev) => prev.filter((r) => Number(r.student_id) !== Number(data.student_id)));
      }
    };
    wsRef.current = ws;
  };

  const closeLiveRoom = () => {
    wsRef.current?.close();
    setSelectedSchedule(null);
    setWsConnected(false);
  };

  const undoCheckin = async (studentId: number) => {
    if (!selectedSchedule) return;
    setCheckingIn(studentId);

    // Optimistic update: phản hồi tức thì 0ms trên màn hình
    setAttendanceRecords((prev) => prev.filter((r) => Number(r.student_id) !== Number(studentId)));

    try {
      await fetch(`${API}/api/attendance/reset?schedule_id=${selectedSchedule.id}&student_id=${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingIn(null);
    }
  };

  const manualCheckin = async (studentId: number, status: "present" | "late" | "excused" | "absent") => {
    if (!selectedSchedule) return;
    setCheckingIn(studentId);

    // Optimistic update: đổi trạng thái tức thì 0ms trên giao diện
    const tempRecord: AttendanceRecord = {
      id: Date.now(),
      student_id: studentId,
      student_name: "",
      status: status,
      method: "manual",
      checkin_time: new Date().toISOString()
    };
    setAttendanceRecords((prev) => {
      const filtered = prev.filter((r) => Number(r.student_id) !== Number(studentId));
      return [...filtered, tempRecord];
    });

    try {
      const res = await fetch(`${API}/api/attendance/manual-checkin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: selectedSchedule.id, student_id: studentId, status }),
      });
      if (res.ok) {
        const { record } = await res.json();
        setAttendanceRecords((prev) => {
          const filtered = prev.filter((r) => Number(r.student_id) !== Number(studentId));
          return [...filtered, record];
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingIn(null);
    }
  };

  const getStudentAttendance = (studentId: number) =>
    attendanceRecords.find((r) => Number(r.student_id) === Number(studentId));

  // ── Session Report ──────────────────────────────────────────────────────────
  const loadReportsForSchedule = async (schedule: ScheduleItem | null) => {
    if (!schedule || !schedule.id) return;
    setReportSchedule(schedule);
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [repRes, stuRes] = await Promise.all([
        fetch(`${API}/api/reports/session/schedule/${schedule.id}`, { headers }),
        fetch(`${API}/api/schedules/${schedule.id}/students`, { headers }),
      ]);
      if (repRes.ok) {
        const data = await repRes.json();
        const map: Record<number, SessionReport> = {};
        data.forEach((r: SessionReport) => { map[r.student_id] = r; });
        setSessionReports(map);
      }
      if (stuRes.ok) setRoomStudents(await stuRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const [savedSuccessStudentId, setSavedSuccessStudentId] = useState<number | null>(null);

  const saveSessionReport = async (studentId: number) => {
    if (!reportSchedule) return;
    setSavingReport(studentId);
    try {
      const report = sessionReports[studentId] || {};
      const payload = {
        schedule_id: reportSchedule.id,
        student_id: studentId,
        content: report.content || "",
        behavior_score: report.behavior_score || null,
        progress_score: report.progress_score || null,
        homework_status: report.homework_status || null,
        strengths: report.strengths || "",
        weaknesses: report.weaknesses || "",
        is_visible_to_parent: report.is_visible_to_parent !== false,
      };

      const res = await fetch(`${API}/api/reports/session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedData = await res.json();
        setSessionReports((prev) => ({ ...prev, [studentId]: savedData }));
        setSavedSuccessStudentId(studentId);
        setTimeout(() => setSavedSuccessStudentId(null), 3000);
      } else {
        const errorData = await res.json();
        alert(`Lỗi khi lưu báo cáo: ${errorData.detail || "Vui lòng thử lại"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi lưu báo cáo!");
    } finally {
      setSavingReport(null);
    }
  };

  const updateReport = (studentId: number, field: string, value: any) => {
    setSessionReports((prev) => ({ ...prev, [studentId]: { ...(prev[studentId] || {}), student_id: studentId, is_visible_to_parent: true, [field]: value } }));
  };

  // ── Auto-generate weekly/monthly ───────────────────────────────────────────
  const autoGenerate = async () => {
    if (!selectedStudentReport) {
      alert("Vui lòng chọn học sinh trước khi bấm tự động tổng hợp!");
      return;
    }

    const currentWeekStart = weekStart || getMondayDate();
    if (reportMode === "weekly" && !weekStart) {
      setWeekStart(currentWeekStart);
    }

    setGenerating(true);
    try {
      if (reportMode === "weekly") {
        const res = await fetch(`${API}/api/reports/weekly/auto-generate?student_id=${selectedStudentReport}&week_start_str=${currentWeekStart}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data);
        } else {
          const errData = await res.json();
          alert(`Lỗi tổng hợp báo cáo tuần: ${errData.detail || "Vui lòng thử lại"}`);
        }
      } else {
        const res = await fetch(`${API}/api/reports/monthly/auto-generate?student_id=${selectedStudentReport}&month=${reportMonth}&year=${reportYear}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMonthlyData(data);
        } else {
          const errData = await res.json();
          alert(`Lỗi tổng hợp báo cáo tháng: ${errData.detail || "Vui lòng thử lại"}`);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi tự động tổng hợp báo cáo!");
    } finally {
      setGenerating(false);
    }
  };

  // ── Device Management ───────────────────────────────────────────────────────
  const registerDevice = async () => {
    const res = await fetch(`${API}/api/attendance/devices`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDeviceName, device_type: newDeviceType }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedDeviceToken(data.device_token);
      setDevices((prev) => [...prev, data]);
      setNewDeviceName("");
    }
  };

  const toggleDevice = async (deviceId: number) => {
    await fetch(`${API}/api/attendance/devices/${deviceId}/toggle`, {
      method: "PUT", headers: { Authorization: `Bearer ${getToken()}` },
    });
    fetchData();
  };

  // ── Parent Link ─────────────────────────────────────────────────────────────
  const generateParentLink = async () => {
    if (!newLinkStudentId) return;
    setGeneratingLink(true);
    const res = await fetch(`${API}/api/parent-links/generate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: newLinkStudentId, parent_name: newLinkParentName || null, expires_days: newLinkExpires }),
    });
    if (res.ok) {
      const data = await res.json();
      setCreatedLink(data);
      setParentLinks((prev) => [data, ...prev]);
    }
    setGeneratingLink(false);
  };

  const regeneratePin = async (linkId: number) => {
    try {
      const res = await fetch(`${API}/api/parent-links/${linkId}/regenerate-pin`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const link = parentLinks.find((l) => l.id === linkId);
        setCreatedLink({
          share_token: link?.share_token,
          raw_pin: data.raw_pin,
          student_name: link?.student_name,
        });
      } else {
        alert("Không thể tạo lại mã PIN");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối khi cấp lại mã PIN");
    }
  };

  const revokeLink = async (linkId: number) => {
    await fetch(`${API}/api/parent-links/${linkId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    setParentLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
    </div>
  );

  const todaySchedules = schedules.filter((s) => {
    const d = new Date(s.start_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const pastSchedules = schedules.filter((s) => new Date(s.start_time) < new Date());

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-12">
      {/* Header */}
      <div className="pt-3 sm:pt-4 pb-5 sm:pb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
          📋 Quản Lý Báo Cáo & Điểm Danh
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1.5 sm:mt-2">Điểm danh học sinh, viết báo cáo và chia sẻ với phụ huynh</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 bg-bg-card border border-border-card rounded-2xl p-1.5 overflow-x-auto max-w-full no-scrollbar">
        {[
          { key: "live",          icon: Radio,          label: "Điểm Danh Live" },
          { key: "session",       icon: ClipboardList,  label: "Báo Cáo Buổi" },
          { key: "weekly-monthly",icon: BarChart3,      label: "Tuần / Tháng" },
          { key: "devices",       icon: Cpu,            label: "Arduino & Phụ Huynh" },
        ].map(({ key, icon: Icon, label }) => (
          <button key={key} onClick={() => setTab(key as TabType)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-all ${
              tab === key ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" : "text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: LIVE ATTENDANCE ──────────────────────────────────────────── */}
      {tab === "live" && (
        <div className="space-y-6">
          {!selectedSchedule ? (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Today's sessions */}
                <div>
                  <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" /> Buổi học hôm nay
                  </h2>
                  {todaySchedules.length === 0 ? (
                    <div className="p-6 rounded-2xl border border-border-card text-center text-text-secondary">Không có buổi học nào hôm nay</div>
                  ) : (
                    <div className="space-y-3">
                      {todaySchedules.map((s) => (
                        <button key={s.id} onClick={() => openLiveRoom(s)}
                          className="w-full text-left p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-text-primary">{s.title}</p>
                              <p className="text-sm text-text-secondary mt-0.5">
                                {new Date(s.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} –
                                {new Date(s.end_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm group-hover:gap-3 transition-all">
                              Mở phòng <Radio className="w-4 h-4 animate-pulse" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Past sessions */}
                <div>
                  <h2 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-3">Buổi học gần đây</h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {pastSchedules.slice(0, 10).map((s) => (
                      <button key={s.id} onClick={() => openLiveRoom(s)}
                        className="w-full text-left p-3 rounded-xl border border-border-card hover:bg-bg-hover transition-all"
                      >
                        <p className="font-semibold text-text-primary text-sm">{s.title}</p>
                        <p className="text-xs text-text-secondary">
                          {new Date(s.start_time).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Live Room */
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={closeLiveRoom} className="p-2 rounded-xl hover:bg-bg-hover transition shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-text-primary truncate">{selectedSchedule.title}</h2>
                    <p className="text-text-secondary text-xs sm:text-sm truncate">
                      {new Date(selectedSchedule.start_time).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => { setEditModalSchedule(selectedSchedule); setIsEditModalOpen(true); }}
                    className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-blue-500/20 shadow-sm"
                  >
                    ✏️ Sửa danh sách học sinh
                  </button>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${wsConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                    {wsConnected ? <><Wifi className="w-3 h-3" /> LIVE</> : <><WifiOff className="w-3 h-3" /> Offline</>}
                  </div>
                </div>
              </div>

              {/* Stats bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
                {Object.entries(STATUS_CONFIG).map(([k, v]) => {
                  const count = roomStudents.filter((s) => getStudentAttendance(s.id)?.status === k).length;
                  return (
                    <div key={k} className="p-2.5 sm:p-3 rounded-xl border border-border-card bg-bg-card text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${v.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                        {v.label}
                      </div>
                      <p className="text-xl sm:text-2xl font-black text-text-primary mt-1">{count}</p>
                    </div>
                  );
                })}
              </div>

              {/* Live room search filter */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  placeholder="🔍 Gõ tên học sinh để tìm nhanh trong danh sách..."
                  className="w-full bg-bg-card border border-border-card rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50 shadow-sm transition"
                />
              </div>

              {/* Student list */}
              <div className="space-y-3">
                {roomStudents
                  .filter((s) => s.full_name.toLowerCase().includes(roomSearchQuery.toLowerCase()))
                  .map((student) => {
                  const record = getStudentAttendance(student.id);
                  const isSaving = checkingIn === student.id;
                  return (
                    <div key={student.id} className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${record ? "border-border-card bg-bg-card" : "border-dashed border-border-card bg-bg-card/50"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {student.full_name.split(" ").pop()?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text-primary text-sm sm:text-base truncate">{student.full_name}</p>
                            {record ? (
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_CONFIG[record.status].color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[record.status].dot}`} />
                                  {STATUS_CONFIG[record.status].label}
                                </span>
                                {record.checkin_time && (
                                  <span className="text-[11px] text-text-secondary flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(record.checkin_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                                {record.method !== "manual" && (
                                  <span className="text-[11px] text-indigo-400 font-semibold">
                                    {record.method === "fingerprint" ? "🖐️ Vân tay" : "📸 Khuôn mặt"}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-text-secondary mt-0.5">Chưa điểm danh</p>
                            )}
                          </div>
                        </div>

                        {isSaving ? (
                          <div className="flex justify-end sm:justify-center py-1">
                            <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-card/50">
                            <div className="grid grid-cols-4 sm:flex items-center gap-1.5 flex-1 sm:flex-initial">
                              {[
                                { s: "present" as const, label: "✅", title: "Có mặt" },
                                { s: "late" as const, label: "⏰", title: "Muộn" },
                                { s: "excused" as const, label: "📋", title: "Phép" },
                                { s: "absent" as const, label: "❌", title: "Vắng" },
                              ].map(({ s, label, title }) => (
                                <button key={s} title={record?.status === s ? `Bấm để hoàn tác (${title})` : title}
                                  onClick={() => {
                                    if (record?.status === s) {
                                      undoCheckin(student.id);
                                    } else {
                                      manualCheckin(student.id, s);
                                    }
                                  }}
                                  className={`h-9 sm:h-8 px-2 sm:w-8 rounded-xl sm:rounded-lg text-sm transition-all flex items-center justify-center border ${
                                    record?.status === s ? "bg-rose-500 border-rose-500 shadow-lg shadow-rose-500/30 text-white" : "border-border-card hover:border-rose-500/30 hover:bg-bg-hover"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>

                            {record && (
                              <button
                                type="button"
                                title="Hoàn tác điểm danh (Reset về Chưa điểm danh)"
                                onClick={() => undoCheckin(student.id)}
                                className="h-9 w-9 sm:h-8 sm:w-8 rounded-xl sm:rounded-lg text-xs font-bold transition-all border border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-white flex items-center justify-center shrink-0"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const targetSchedule = selectedSchedule;
                    closeLiveRoom();
                    setTab("session");
                    if (targetSchedule) {
                      loadReportsForSchedule(targetSchedule);
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition text-center"
                >
                  Kết thúc & Viết báo cáo →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: SESSION REPORT ───────────────────────────────────────────── */}
      {tab === "session" && (
        <div className="space-y-6">
          {!reportSchedule ? (
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-4">Chọn buổi học để viết báo cáo</h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {schedules.map((s) => (
                  <button key={s.id} onClick={() => loadReportsForSchedule(s)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-border-card bg-bg-card hover:bg-bg-hover transition group text-left"
                  >
                    <div>
                      <p className="font-bold text-text-primary">{s.title}</p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {new Date(s.start_time).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-secondary group-hover:text-rose-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setReportSchedule(null)} className="p-2 rounded-xl hover:bg-bg-hover shrink-0">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-black text-text-primary truncate">{reportSchedule.title}</h2>
                    <p className="text-text-secondary text-xs sm:text-sm truncate">{new Date(reportSchedule.start_time).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditModalSchedule(reportSchedule); setIsEditModalOpen(true); }}
                  className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-500/20 shadow-sm self-stretch sm:self-auto"
                >
                  ✏️ Sửa danh sách học sinh
                </button>
              </div>

              <div className="space-y-4">
                {roomStudents.map((student) => {
                  const report = sessionReports[student.id] || {};
                  const isExpanded = !!expandedStudentIds[student.id];
                  const toggleExpanded = () => setExpandedStudentIds((prev) => ({ ...prev, [student.id]: !prev[student.id] }));
                  return (
                    <div key={student.id} className="border border-border-card rounded-2xl overflow-hidden bg-bg-card">
                      <button onClick={toggleExpanded}
                        className="w-full flex items-center gap-3 sm:gap-4 p-3.5 sm:p-4 hover:bg-bg-hover transition"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {student.full_name.split(" ").pop()?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold text-text-primary text-sm sm:text-base truncate">{student.full_name}</p>
                          {report.content ? (
                            <p className="text-xs text-emerald-400 font-semibold">✅ Đã có nhận xét</p>
                          ) : (
                            <p className="text-xs text-text-secondary">Chưa viết báo cáo</p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-text-secondary shrink-0" /> : <ChevronDown className="w-4 h-4 text-text-secondary shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 sm:px-4 pb-4 border-t border-border-card space-y-4 pt-4">
                          <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Nhận xét</label>
                            <textarea rows={3} value={report.content || ""} onChange={(e) => updateReport(student.id, "content", e.target.value)}
                              placeholder="Nhận xét về học sinh trong buổi học hôm nay..."
                              className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-rose-500/50"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Thái độ</label>
                              <StarRating value={report.behavior_score} onChange={(v) => updateReport(student.id, "behavior_score", v)} />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Tiến bộ</label>
                              <StarRating value={report.progress_score} onChange={(v) => updateReport(student.id, "progress_score", v)} />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Bài tập về nhà</label>
                            <div className="grid grid-cols-3 sm:flex gap-1.5 sm:gap-2">
                              {Object.entries(HW_CONFIG).map(([k, v]) => (
                                <button key={k} onClick={() => updateReport(student.id, "homework_status", k)}
                                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition text-center ${report.homework_status === k ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "border-border-card hover:bg-bg-hover"}`}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Điểm mạnh</label>
                              <input value={report.strengths || ""} onChange={(e) => updateReport(student.id, "strengths", e.target.value)}
                                placeholder="Điểm mạnh buổi này..."
                                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Cần cải thiện</label>
                              <input value={report.weaknesses || ""} onChange={(e) => updateReport(student.id, "weaknesses", e.target.value)}
                                placeholder="Điểm cần cải thiện..."
                                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-amber-500/50"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={report.is_visible_to_parent !== false}
                                onChange={(e) => updateReport(student.id, "is_visible_to_parent", e.target.checked)}
                                className="w-4 h-4 accent-rose-500"
                              />
                              <span className="text-xs sm:text-sm text-text-secondary">Hiển thị cho phụ huynh</span>
                            </label>
                            <button onClick={() => saveSessionReport(student.id)}
                              disabled={savingReport === student.id}
                              className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-sm font-bold transition w-full sm:w-auto ${
                                savedSuccessStudentId === student.id
                                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                  : "bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                              } disabled:opacity-50`}
                            >
                              {savingReport === student.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : savedSuccessStudentId === student.id ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              {savedSuccessStudentId === student.id ? "Đã lưu thành công!" : "Lưu báo cáo"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: WEEKLY / MONTHLY ─────────────────────────────────────────── */}
      {tab === "weekly-monthly" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="p-6 rounded-2xl border border-border-card bg-bg-card space-y-4">
            <div className="flex gap-3 items-center">
              <div className="flex gap-2 bg-bg-main rounded-xl p-1 border border-border-card">
                {(["weekly", "monthly"] as const).map((m) => (
                  <button key={m} onClick={() => setReportMode(m)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${reportMode === m ? "bg-rose-500 text-white" : "text-text-secondary hover:text-text-primary"}`}
                  >
                    {m === "weekly" ? "📅 Báo cáo Tuần" : "📆 Báo cáo Tháng"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 flex items-center justify-between">
                  <span>Học sinh</span>
                  <span className="text-[10px] text-text-secondary font-normal">
                    {studentSearchQuery ? `Tìm thấy ${myStudents.filter(s => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase())).length}/${myStudents.length}` : `Tổng ${myStudents.length}`}
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="🔍 Gõ tên học sinh để tìm nhanh..."
                      className="w-full bg-bg-main border border-border-card rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <select value={selectedStudentReport || ""} onChange={(e) => setSelectedStudentReport(Number(e.target.value) || null)}
                    className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {myStudents
                      .filter((s) => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                      .map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                  </select>
                </div>
              </div>

              {reportMode === "weekly" ? (
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Tuần bắt đầu (Thứ 2)</label>
                  <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)}
                    className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Tháng</label>
                    <select value={reportMonth} onChange={(e) => setReportMonth(Number(e.target.value))}
                      className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>Tháng {m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Năm</label>
                    <input type="number" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}
                      className="w-24 bg-bg-main border border-border-card rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button onClick={autoGenerate} disabled={!selectedStudentReport || generating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition disabled:opacity-50 w-full sm:w-auto"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Tự động tổng hợp
            </button>
          </div>

          {/* Generated data */}
          {(weeklyData || monthlyData) && (
            <div className="p-4 sm:p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5" /> Đã tổng hợp xong
              </h3>
              {reportMode === "weekly" && weeklyData && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 text-center">
                  {[
                    { label: "Tổng buổi", value: weeklyData.total_sessions },
                    { label: "Đi học", value: weeklyData.attended_sessions },
                    { label: "Đi muộn", value: weeklyData.late_sessions },
                    { label: "TB Thái độ", value: weeklyData.avg_behavior_score ? `${weeklyData.avg_behavior_score}/5` : "—" },
                    { label: "TB Tiến bộ", value: weeklyData.avg_progress_score ? `${weeklyData.avg_progress_score}/5` : "—" },
                    { label: "BTVN", value: weeklyData.homework_completion_rate ? `${Math.round(weeklyData.homework_completion_rate * 100)}%` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2.5 sm:p-3 rounded-xl bg-bg-card border border-border-card">
                      <p className="text-[11px] sm:text-xs text-text-secondary">{label}</p>
                      <p className="text-base sm:text-lg font-black text-text-primary">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}
              {reportMode === "monthly" && monthlyData && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 text-center">
                  {[
                    { label: "Tổng buổi", value: monthlyData.total_sessions },
                    { label: "Đi học", value: monthlyData.attended_sessions },
                    { label: "Chuyên cần", value: monthlyData.attendance_rate ? `${Math.round(monthlyData.attendance_rate * 100)}%` : "—" },
                    { label: "TB Thái độ", value: monthlyData.avg_behavior_score ? `${monthlyData.avg_behavior_score}/5` : "—" },
                    { label: "TB Tiến bộ", value: monthlyData.avg_progress_score ? `${monthlyData.avg_progress_score}/5` : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-2.5 sm:p-3 rounded-xl bg-bg-card border border-border-card">
                      <p className="text-[11px] sm:text-xs text-text-secondary">{label}</p>
                      <p className="text-base sm:text-lg font-black text-text-primary">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-secondary">Nhận xét và mục tiêu sẽ được thêm thủ công qua API. Tính năng giao diện chỉnh sửa đầy đủ sắp ra mắt.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: DEVICES & PARENT LINKS ──────────────────────────────────── */}
      {tab === "devices" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Arduino Devices */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" /> Thiết Bị Arduino
            </h2>

            {/* Register new */}
            <div className="p-4 rounded-2xl border border-border-card bg-bg-card space-y-3">
              <p className="text-sm font-bold text-text-secondary">Đăng ký thiết bị mới</p>
              <input value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Tên thiết bị (VD: Arduino Phòng A)"
                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50"
              />
              <select value={newDeviceType} onChange={(e) => setNewDeviceType(e.target.value)}
                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="fingerprint">🖐️ Vân tay</option>
                <option value="face">📸 Khuôn mặt</option>
              </select>
              <button onClick={registerDevice} disabled={!newDeviceName}
                className="w-full py-2 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition disabled:opacity-50 text-sm"
              >
                + Đăng ký thiết bị
              </button>
            </div>

            {/* Token reveal */}
            {createdDeviceToken && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <p className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Lưu token này ngay! Không hiện lại.
                </p>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 text-xs bg-bg-card px-3 py-2 rounded-lg font-mono text-text-primary break-all">{createdDeviceToken}</code>
                  <button onClick={() => navigator.clipboard.writeText(createdDeviceToken)} className="p-2 rounded-lg hover:bg-bg-hover transition">
                    <Copy className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
                <button onClick={() => setCreatedDeviceToken(null)} className="text-xs text-text-secondary hover:text-text-primary">Đã lưu, đóng</button>
              </div>
            )}

            {/* Device list */}
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-border-card">
                  <div className={`w-2.5 h-2.5 rounded-full ${d.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{d.name}</p>
                    <p className="text-xs text-text-secondary">{d.device_type === "fingerprint" ? "🖐️ Vân tay" : "📸 Khuôn mặt"}</p>
                  </div>
                  <button onClick={() => toggleDevice(d.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition ${d.is_active ? "border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "border-zinc-600 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"}`}
                  >
                    {d.is_active ? "Đang bật" : "Đã tắt"}
                  </button>
                </div>
              ))}
              {devices.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">Chưa có thiết bị nào</p>
              )}
            </div>
          </div>

          {/* Parent Links */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" /> Link Phụ Huynh
            </h2>

            {/* Generate new */}
            <div className="p-4 rounded-2xl border border-border-card bg-bg-card space-y-3">
              <p className="text-sm font-bold text-text-secondary">Tạo link mới cho phụ huynh</p>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="🔍 Gõ tên học sinh để tìm nhanh..."
                    className="w-full bg-bg-main border border-border-card rounded-xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <select value={newLinkStudentId || ""} onChange={(e) => setNewLinkStudentId(Number(e.target.value) || null)}
                  className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {myStudents
                    .filter((s) => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                    .map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <input value={newLinkParentName} onChange={(e) => setNewLinkParentName(e.target.value)}
                placeholder="Tên phụ huynh (VD: Mẹ của An)"
                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none"
              />
              <select value={newLinkExpires || ""} onChange={(e) => setNewLinkExpires(Number(e.target.value) || null)}
                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="">Không hết hạn</option>
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="90">3 tháng</option>
              </select>
              <button onClick={generateParentLink} disabled={!newLinkStudentId || generatingLink}
                className="w-full py-2 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition disabled:opacity-50 text-sm"
              >
                {generatingLink ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
                Tạo link chia sẻ
              </button>
            </div>

            {/* Created link reveal */}
            {createdLink && (
              <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <p className="text-sm font-bold text-emerald-400">🔗 Link đã tạo — chia sẻ ngay cho phụ huynh!</p>
                <div>
                  <p className="text-xs text-text-secondary mb-1">URL chia sẻ:</p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-bg-card px-2 py-1.5 rounded-lg font-mono text-text-primary break-all">
                      {`https://minda.io.vn/parent/${createdLink.share_token}`}
                    </code>
                    <button onClick={() => navigator.clipboard.writeText(`https://minda.io.vn/parent/${createdLink.share_token}`)}
                      className="p-1.5 rounded-lg hover:bg-bg-hover"><Copy className="w-4 h-4 text-emerald-400" /></button>
                  </div>
                </div>
                <button onClick={() => setCreatedLink(null)} className="text-xs text-text-secondary hover:text-text-primary">Đã chia sẻ, đóng</button>
              </div>
            )}

            {/* Link list */}
            <div className="space-y-2">
              {parentLinks.map((l) => (
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border-card bg-bg-main/30">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${l.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {l.parent_name || "Phụ huynh"} → <span className="text-rose-400">{l.student_name}</span>
                      </p>
                      <p className="text-[11px] text-text-secondary font-mono truncate">/parent/{l.share_token}</p>
                    </div>
                  </div>
                  {l.is_active && (
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-card/40">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`https://minda.io.vn/parent/${l.share_token}`);
                          setCopiedLinkId(l.id);
                          setTimeout(() => setCopiedLinkId(null), 2000);
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center gap-1.5 transition font-bold"
                        title="Sao chép link chia sẻ"
                      >
                        {copiedLinkId === l.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLinkId === l.id ? "Đã chép link!" : "Sao chép link"}
                      </button>

                      <button
                        onClick={() => revokeLink(l.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-secondary hover:text-red-400 transition"
                        title="Thu hồi link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {parentLinks.length === 0 && (
                <p className="text-sm text-text-secondary text-center py-6">Chưa có link nào được tạo</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      <ScheduleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveEditSchedule}
        initialData={editModalSchedule}
        courses={courses}
        students={myStudents}
        userRole="teacher"
      />
    </div>
  );
}
