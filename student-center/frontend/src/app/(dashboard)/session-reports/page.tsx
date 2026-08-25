"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  ClipboardList, Radio, Cpu, BarChart3, Plus, Check, X, Clock,
  Users, Star, ChevronDown, ChevronUp, Loader2, Wifi, WifiOff,
  RefreshCw, AlertCircle, CheckCircle2, Copy, Trash2, Eye, EyeOff,
  BookOpen, Calendar, User, Zap, Shield, ChevronLeft, ChevronRight, RotateCcw, Search, Key,
  UserPlus, Sparkles, CheckCheck, Filter
} from "lucide-react";

import ScheduleModal from "@/components/schedule/ScheduleModal";

const API = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
const getToken = () => typeof window !== "undefined" ? localStorage.getItem("minda_token") || "" : "";

type TabType = "live" | "session" | "weekly-monthly" | "devices";

interface Student { id: number; full_name: string; avatar_url?: string; email?: string; }
interface ScheduleItem {
  id: number; title: string; start_time: string; end_time: string;
  description?: string; student_id?: number; course_id?: number;
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
  attendance_status?: string; attendance_time?: string; attendance_method?: string;
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

const QUICK_COMMENTS = [
  "🌟 Tiếp thu bài nhanh, rất hăng hái phát biểu",
  "👍 Hiểu bài tốt, hoàn thành đầy đủ bài tập",
  "⚡ Cần tập trung hơn và chú ý nghe giảng",
  "📖 Cần ôn lại lý thuyết và làm thêm bài tập",
  "🎯 Cẩn thận hơn trong cách trình bày và tính toán",
  "🔥 Có sự tiến bộ vượt bậc so với các buổi trước",
  "💡 Tư duy giải quyết vấn đề sáng tạo, nhạy bén",
];

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
  const [liveFilter, setLiveFilter] = useState<"recent" | "today" | "week" | "month" | "all">("recent");
  const [liveSearchQuery, setLiveSearchQuery] = useState("");

  // Session Report State
  const [reportSchedule, setReportSchedule] = useState<ScheduleItem | null>(null);
  const [sessionReports, setSessionReports] = useState<Record<number, SessionReport>>({});
  const [savingReport, setSavingReport] = useState<number | null>(null);
  const [expandedStudentIds, setExpandedStudentIds] = useState<Record<number, boolean>>({});
  const [batchCheckingIn, setBatchCheckingIn] = useState(false);

  // Session selector filter & search (Default: recent)
  const [sessionFilter, setSessionFilter] = useState<"recent" | "all" | "missing" | "completed" | "today" | "week" | "month">("recent");
  const [sessionSearchQuery, setSessionSearchQuery] = useState("");
  const [studentSearchInSession, setStudentSearchInSession] = useState("");

  // Add student modal state
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [addStudentQuery, setAddStudentQuery] = useState("");

  // Search queries for other tabs
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

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

  const undoCheckin = async (studentId: number, targetScheduleId?: number) => {
    const schedId = targetScheduleId || selectedSchedule?.id || reportSchedule?.id;
    if (!schedId) return;
    setCheckingIn(studentId);

    // Optimistic update: phản hồi tức thì 0ms trên màn hình
    setAttendanceRecords((prev) => prev.filter((r) => Number(r.student_id) !== Number(studentId)));

    try {
      await fetch(`${API}/api/attendance/reset?schedule_id=${schedId}&student_id=${studentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setCheckingIn(null);
    }
  };

  const manualCheckin = async (studentId: number, status: "present" | "late" | "excused" | "absent", targetScheduleId?: number) => {
    const schedId = targetScheduleId || selectedSchedule?.id || reportSchedule?.id;
    if (!schedId) return;
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
        body: JSON.stringify({ schedule_id: schedId, student_id: studentId, status }),
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

  const batchMarkAllPresent = async () => {
    if (!reportSchedule) return;
    const schedId = reportSchedule.id;
    setBatchCheckingIn(true);

    const newRecords: AttendanceRecord[] = roomStudents.map((s) => {
      const existing = getStudentAttendance(s.id);
      return existing || {
        id: Date.now() + s.id,
        student_id: s.id,
        student_name: s.full_name,
        status: "present" as const,
        method: "manual" as const,
        checkin_time: new Date().toISOString()
      };
    });
    setAttendanceRecords(newRecords);

    try {
      const recordsPayload = roomStudents.map((s) => ({
        student_id: s.id,
        status: getStudentAttendance(s.id)?.status || "present",
        note: "Điểm danh bù hàng loạt"
      }));
      await fetch(`${API}/api/attendance/batch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ schedule_id: schedId, records: recordsPayload })
      });
    } catch (err) {
      console.error(err);
    } finally {
      setBatchCheckingIn(false);
    }
  };

  const addStudentToSession = (student: Student) => {
    if (roomStudents.some((s) => s.id === student.id)) return;
    setRoomStudents((prev) => [...prev, student]);
    setExpandedStudentIds((prev) => ({ ...prev, [student.id]: true }));
    if (!getStudentAttendance(student.id)) {
      manualCheckin(student.id, "present", reportSchedule?.id);
    }
    setIsAddStudentModalOpen(false);
    setAddStudentQuery("");
  };

  const getStudentAttendance = (studentId: number) =>
    attendanceRecords.find((r) => Number(r.student_id) === Number(studentId));

  // ── Session Report ──────────────────────────────────────────────────────────
  const loadReportsForSchedule = async (schedule: ScheduleItem | null) => {
    if (!schedule || !schedule.id) return;
    setReportSchedule(schedule);
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [repRes, stuRes, attRes] = await Promise.all([
        fetch(`${API}/api/reports/session/schedule/${schedule.id}`, { headers }),
        fetch(`${API}/api/schedules/${schedule.id}/students`, { headers }),
        fetch(`${API}/api/attendance/schedule/${schedule.id}`, { headers }),
      ]);
      if (repRes.ok) {
        const data = await repRes.json();
        const map: Record<number, SessionReport> = {};
        data.forEach((r: SessionReport) => { map[r.student_id] = r; });
        setSessionReports(map);
      }
      if (stuRes.ok) setRoomStudents(await stuRes.json());
      if (attRes.ok) setAttendanceRecords(await attRes.json());
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
      const attRec = getStudentAttendance(studentId);
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
        attendance_status: attRec?.status || "present",
        attendance_note: attRec?.note || "Điểm danh bổ sung khi lưu báo cáo",
      };

      const res = await fetch(`${API}/api/reports/session`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedData = await res.json();
        setSessionReports((prev) => ({ ...prev, [studentId]: savedData }));
        if (savedData.attendance_status) {
          setAttendanceRecords((prev) => {
            const filtered = prev.filter((r) => Number(r.student_id) !== Number(studentId));
            return [...filtered, {
              id: Date.now(),
              student_id: studentId,
              student_name: savedData.student_name,
              status: savedData.attendance_status,
              method: savedData.attendance_method || "manual",
              checkin_time: savedData.attendance_time || new Date().toISOString()
            }];
          });
        }
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
    setSessionReports((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        student_id: studentId,
        is_visible_to_parent: true,
        [field]: value
      }
    }));
  };

  const appendCommentTemplate = (studentId: number, template: string) => {
    const current = sessionReports[studentId]?.content || "";
    const newContent = current.trim() ? `${current.trim()}\n• ${template}` : template;
    updateReport(studentId, "content", newContent);
  };

  // ── Filtered Schedules for Live Attendance ───────────────────────────────
  const getFilteredLiveSchedules = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const mondayStr = getMondayDate();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime();

    const filtered = schedules.filter((s) => {
      const schTime = new Date(s.start_time).getTime();
      const schDate = new Date(s.start_time).toISOString().split("T")[0];

      if (liveSearchQuery.trim()) {
        const q = liveSearchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDate = schDate.includes(q);
        if (!matchTitle && !matchDate) return false;
      }

      if (liveFilter === "today") return schDate === todayStr;
      if (liveFilter === "week") return schDate >= mondayStr;
      if (liveFilter === "recent") return schTime >= sevenDaysAgo && schTime <= sevenDaysAhead;
      if (liveFilter === "month") {
        const schDateObj = new Date(s.start_time);
        return schDateObj.getMonth() === now.getMonth() && schDateObj.getFullYear() === now.getFullYear();
      }
      return true;
    });

    // Fallback: nếu chọn 'recent' mà không có ca nào trong 7 ngày và chưa search, hiển thị 10 ca mới nhất
    if (liveFilter === "recent" && filtered.length === 0 && !liveSearchQuery.trim()) {
      return schedules.slice(0, 10);
    }
    return filtered;
  };

  // ── Filtered Schedules for Session Reports ─────────────────────────────────
  const getFilteredSchedules = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const mondayStr = getMondayDate();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime();
    const sevenDaysAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).getTime();

    const filtered = schedules.filter((s) => {
      const schTime = new Date(s.start_time).getTime();
      const schDate = new Date(s.start_time).toISOString().split("T")[0];
      if (sessionSearchQuery.trim()) {
        const q = sessionSearchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchDate = schDate.includes(q);
        if (!matchTitle && !matchDate) return false;
      }

      if (sessionFilter === "today") return schDate === todayStr;
      if (sessionFilter === "week") return schDate >= mondayStr;
      if (sessionFilter === "recent") return schTime >= sevenDaysAgo && schTime <= sevenDaysAhead;
      if (sessionFilter === "month") {
        const schDateObj = new Date(s.start_time);
        return schDateObj.getMonth() === now.getMonth() && schDateObj.getFullYear() === now.getFullYear();
      }
      return true;
    });

    if (sessionFilter === "recent" && filtered.length === 0 && !sessionSearchQuery.trim()) {
      return schedules.slice(0, 10);
    }
    return filtered;
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

  const revokeLink = async (linkId: number) => {
    await fetch(`${API}/api/parent-links/${linkId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` },
    });
    setParentLinks((prev) => prev.filter((l) => l.id !== linkId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const reportedStudentsCount = roomStudents.filter((s) => !!sessionReports[s.id]?.content).length;
  const attendedStudentsCount = roomStudents.filter((s) => {
    const att = getStudentAttendance(s.id);
    return att && (att.status === "present" || att.status === "late");
  }).length;

  const filteredSessionStudents = roomStudents.filter((s) =>
    s.full_name.toLowerCase().includes(studentSearchInSession.toLowerCase())
  );

  const availableStudentsToAdd = myStudents.filter(
    (s) => !roomStudents.some((rs) => rs.id === s.id) &&
      s.full_name.toLowerCase().includes(addStudentQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 px-3 sm:px-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-card pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-rose-500" /> Điểm Danh & Báo Cáo Buổi Học
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-1">
            Quản lý điểm danh trực tiếp, viết bổ sung báo cáo và xuất tổng hợp tuần / tháng
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-bg-card border border-border-card p-1 rounded-2xl gap-1 overflow-x-auto shrink-0">
          <button onClick={() => setTab("live")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${tab === "live" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-text-secondary hover:text-text-primary"}`}
          >
            <Radio className="w-4 h-4" /> Live Điểm Danh
          </button>
          <button onClick={() => setTab("session")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${tab === "session" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-text-secondary hover:text-text-primary"}`}
          >
            <BookOpen className="w-4 h-4" /> Báo Cáo & Bổ Sung
          </button>
          <button onClick={() => setTab("weekly-monthly")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${tab === "weekly-monthly" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-text-secondary hover:text-text-primary"}`}
          >
            <BarChart3 className="w-4 h-4" /> Tổng Hợp Tuần/Tháng
          </button>
          <button onClick={() => setTab("devices")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${tab === "devices" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-text-secondary hover:text-text-primary"}`}
          >
            <Cpu className="w-4 h-4" /> Thiết Bị & Phụ Huynh
          </button>
        </div>
      </div>

      {/* ── Tab 1: LIVE ATTENDANCE ──────────────────────────────────────────── */}
      {tab === "live" && (
        <div className="space-y-6">
          {!selectedSchedule ? (
            <div className="space-y-4">
              {/* Header with Title, Count & Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <span>Chọn ca học để mở phòng điểm danh</span>
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Hiển thị <strong className="text-rose-400 font-bold">{getFilteredLiveSchedules().length}</strong> / {schedules.length} buổi học
                  </p>
                </div>

                {/* Quick Search */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={liveSearchQuery}
                    onChange={(e) => setLiveSearchQuery(e.target.value)}
                    placeholder="Tìm theo lớp, môn (Toán 10, 2k11...)"
                    className="w-full pl-9 pr-8 py-2 bg-bg-card border border-border-card rounded-xl text-xs text-text-primary focus:outline-none focus:border-rose-500 transition placeholder:text-text-secondary/60 shadow-sm"
                  />
                  {liveSearchQuery && (
                    <button
                      onClick={() => setLiveSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text-primary"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: "recent" as const, label: "🔥 7 ngày gần đây" },
                  { id: "today" as const, label: "⚡ Hôm nay" },
                  { id: "week" as const, label: "📅 Tuần này" },
                  { id: "month" as const, label: "📆 Tháng này" },
                  { id: "all" as const, label: `🗂️ Tất cả (${schedules.length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setLiveFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border flex items-center gap-1.5 ${
                      liveFilter === f.id
                        ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "border-border-card bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`}
                  >
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              {/* Schedules Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
                {getFilteredLiveSchedules().map((s) => {
                  const startTime = new Date(s.start_time).getTime();
                  const endTime = new Date(s.end_time || s.start_time).getTime();
                  const now = Date.now();
                  const isLiveNow = now >= startTime && now <= (endTime > startTime ? endTime : startTime + 2 * 3600 * 1000);
                  const isToday = new Date(s.start_time).toDateString() === new Date().toDateString();
                  const isPast = startTime < now && !isLiveNow;

                  return (
                    <button
                      key={s.id}
                      onClick={() => openLiveRoom(s)}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition group text-left shadow-sm relative overflow-hidden ${
                        isLiveNow
                          ? "bg-rose-950/20 border-rose-500/50 hover:bg-rose-950/30"
                          : "border-border-card bg-bg-card hover:bg-bg-hover hover:border-rose-500/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-text-primary truncate">{s.title}</p>
                          {isLiveNow ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white flex items-center gap-1 animate-pulse shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Đang học
                            </span>
                          ) : isToday ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                              Hôm nay
                            </span>
                          ) : isPast ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                              Đã qua
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                              Sắp tới
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-rose-400" />
                          {new Date(s.start_time).toLocaleString("vi-VN", {
                            weekday: "short",
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition ${
                          isLiveNow
                            ? "bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white"
                        }`}>
                          Vào phòng →
                        </span>
                      </div>
                    </button>
                  );
                })}

                {getFilteredLiveSchedules().length === 0 && (
                  <div className="col-span-full text-center py-12 text-text-secondary border border-dashed border-border-card rounded-2xl p-6 space-y-2">
                    <Calendar className="w-10 h-10 mx-auto text-rose-400/50 mb-2" />
                    <p className="text-sm font-semibold text-text-primary">Không có ca học nào trong khoảng thời gian này</p>
                    <p className="text-xs text-text-secondary">Bạn có thể chọn xem 7 ngày gần đây hoặc bấm xem tất cả ca học.</p>
                    <button
                      onClick={() => { setLiveFilter("all"); setLiveSearchQuery(""); }}
                      className="mt-3 px-4 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 text-xs font-bold border border-rose-500/20 transition"
                    >
                      Xem tất cả ({schedules.length} buổi)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Room Header */}
              <div className="p-4 sm:p-6 rounded-3xl border border-border-card bg-bg-card space-y-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={closeLiveRoom} className="p-2 rounded-xl hover:bg-bg-hover shrink-0">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-text-primary">{selectedSchedule.title}</h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${wsConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-700/50 text-zinc-400"}`}>
                          {wsConnected ? <Wifi className="w-3 h-3 animate-pulse" /> : <WifiOff className="w-3 h-3" />}
                          {wsConnected ? "Live Realtime" : "Offline"}
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs mt-0.5">
                        {new Date(selectedSchedule.start_time).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditModalSchedule(selectedSchedule); setIsEditModalOpen(true); }}
                      className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-blue-500/20 shadow-sm"
                    >
                      ✏️ Sửa danh sách học sinh
                    </button>
                  </div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border-card">
                  {(["present", "late", "excused", "absent"] as const).map((k) => {
                    const count = roomStudents.filter((s) => getStudentAttendance(s.id)?.status === k).length;
                    return (
                      <div key={k} className={`p-3 rounded-2xl border text-center ${STATUS_CONFIG[k].color}`}>
                        <span className="text-xs font-bold block">{STATUS_CONFIG[k].label}</span>
                        <span className="text-2xl font-black">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Student list */}
              <div className="space-y-3">
                {roomStudents.map((student) => {
                  const record = getStudentAttendance(student.id);
                  const isSaving = checkingIn === student.id;

                  return (
                    <div key={student.id}
                      className="p-3.5 sm:p-4 rounded-2xl border border-border-card bg-bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-border-card/80"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {student.full_name.split(" ").pop()?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary text-sm sm:text-base truncate">{student.full_name}</p>
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
                  className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition text-center shadow-lg shadow-rose-500/20"
                >
                  Kết thúc & Viết báo cáo →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: SESSION REPORT (Báo cáo & Bổ sung) ────────────────────────── */}
      {tab === "session" && (
        <div className="space-y-6">
          {!reportSchedule ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-text-primary">Chọn buổi học để viết / bổ sung báo cáo</h2>
                  <p className="text-xs text-text-secondary mt-0.5">Dễ dàng bổ sung báo cáo và điểm danh bù cho các buổi học đã diễn ra</p>
                </div>
              </div>

              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={sessionSearchQuery}
                    onChange={(e) => setSessionSearchQuery(e.target.value)}
                    placeholder="🔍 Tìm buổi học theo tên, ngày..."
                    className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50"
                  />
                  {sessionSearchQuery && (
                    <button onClick={() => setSessionSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "recent" as const, label: "🔥 7 ngày gần đây" },
                    { id: "today" as const, label: "⚡ Hôm nay" },
                    { id: "week" as const, label: "📅 Tuần này" },
                    { id: "month" as const, label: "📆 Tháng này" },
                    { id: "all" as const, label: `🗂️ Tất cả (${schedules.length})` },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSessionFilter(f.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                        sessionFilter === f.id
                          ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                          : "border-border-card bg-bg-card text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[550px] overflow-y-auto pr-1">
                {getFilteredSchedules().map((s) => {
                  const dateObj = new Date(s.start_time);
                  const isPast = dateObj.getTime() < Date.now();

                  return (
                    <button key={s.id} onClick={() => loadReportsForSchedule(s)}
                      className="flex items-center justify-between p-4 rounded-2xl border border-border-card bg-bg-card hover:bg-bg-hover hover:border-rose-500/40 transition group text-left shadow-sm relative overflow-hidden"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-text-primary truncate">{s.title}</p>
                          {isPast && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700">
                              Đã qua
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-rose-400" />
                          {dateObj.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })} • {dateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition">
                          Báo cáo →
                        </span>
                      </div>
                    </button>
                  );
                })}
                {getFilteredSchedules().length === 0 && (
                  <div className="col-span-full text-center py-12 text-text-secondary border border-dashed border-border-card rounded-2xl">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Không tìm thấy buổi học nào</p>
                    <p className="text-xs text-text-secondary mt-1">Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Selected session header */}
              <div className="p-4 sm:p-6 rounded-3xl border border-border-card bg-bg-card space-y-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setReportSchedule(null)} className="p-2 rounded-xl hover:bg-bg-hover shrink-0">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-xl font-black text-text-primary">{reportSchedule.title}</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                          Báo cáo sau buổi học
                        </span>
                      </div>
                      <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
                        {new Date(reportSchedule.start_time).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })} • {new Date(reportSchedule.start_time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  {/* Actions in top bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /> Bổ sung học sinh vào buổi này
                    </button>

                    <button
                      type="button"
                      onClick={batchMarkAllPresent}
                      disabled={batchCheckingIn || roomStudents.length === 0}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-amber-500/20 shadow-sm disabled:opacity-50"
                    >
                      {batchCheckingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      ⚡ Điểm danh tất cả Có mặt
                    </button>

                    <button
                      type="button"
                      onClick={() => { setEditModalSchedule(reportSchedule); setIsEditModalOpen(true); }}
                      className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition text-xs font-bold flex items-center gap-1.5 border border-blue-500/20 shadow-sm"
                    >
                      ✏️ Sửa lớp / Lịch
                    </button>
                  </div>
                </div>

                {/* Status Badges Row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-card text-center">
                  <div className="p-2.5 rounded-2xl bg-bg-main border border-border-card">
                    <p className="text-[11px] text-text-secondary font-semibold">Sĩ số buổi học</p>
                    <p className="text-lg font-black text-text-primary">{roomStudents.length} học sinh</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-bg-main border border-border-card">
                    <p className="text-[11px] text-text-secondary font-semibold">Đã điểm danh</p>
                    <p className={`text-lg font-black ${attendedStudentsCount === roomStudents.length && roomStudents.length > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                      {attendedStudentsCount}/{roomStudents.length}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-bg-main border border-border-card">
                    <p className="text-[11px] text-text-secondary font-semibold">Đã có nhận xét</p>
                    <p className={`text-lg font-black ${reportedStudentsCount === roomStudents.length && roomStudents.length > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {reportedStudentsCount}/{roomStudents.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Filter in session if many */}
              {roomStudents.length > 4 && (
                <div className="relative mb-4">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchInSession}
                    onChange={(e) => setStudentSearchInSession(e.target.value)}
                    placeholder="🔍 Lọc học sinh trong buổi học..."
                    className="w-full bg-bg-card border border-border-card rounded-2xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              )}

              {/* Student Report Cards */}
              <div className="space-y-4">
                {filteredSessionStudents.map((student) => {
                  const report = sessionReports[student.id] || {};
                  const isExpanded = !!expandedStudentIds[student.id];
                  const toggleExpanded = () => setExpandedStudentIds((prev) => ({ ...prev, [student.id]: !prev[student.id] }));
                  const record = getStudentAttendance(student.id);

                  return (
                    <div key={student.id} className="border border-border-card rounded-3xl overflow-hidden bg-bg-card shadow-sm transition hover:border-border-card/80">
                      <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button onClick={toggleExpanded} className="flex items-center gap-3 sm:gap-4 text-left flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                            {student.full_name.split(" ").pop()?.charAt(0) || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-text-primary text-sm sm:text-base truncate">{student.full_name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {report.content ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                  <CheckCircle2 className="w-3 h-3" /> Đã có nhận xét
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary bg-zinc-800 px-2 py-0.5 rounded-md">
                                  Chưa viết báo cáo
                                </span>
                              )}

                              {record ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${STATUS_CONFIG[record.status].color}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[record.status].dot}`} />
                                  {STATUS_CONFIG[record.status].label}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  ⚠️ Chưa điểm danh
                                </span>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Inline Attendance Quick Buttons */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-card/40">
                          <div className="flex items-center gap-1 bg-bg-main p-1 rounded-2xl border border-border-card">
                            {[
                              { s: "present" as const, label: "✅", title: "Có mặt" },
                              { s: "late" as const, label: "⏰", title: "Muộn" },
                              { s: "excused" as const, label: "📋", title: "Phép" },
                              { s: "absent" as const, label: "❌", title: "Vắng" },
                            ].map(({ s, label, title }) => (
                              <button
                                key={s}
                                type="button"
                                title={`Điểm danh bù: ${title}`}
                                onClick={() => manualCheckin(student.id, s, reportSchedule.id)}
                                className={`h-8 w-8 rounded-xl text-xs transition-all flex items-center justify-center border ${
                                  record?.status === s
                                    ? "bg-rose-500 border-rose-500 shadow-md shadow-rose-500/30 text-white font-bold"
                                    : "border-transparent text-text-secondary hover:border-border-card hover:bg-bg-hover hover:text-text-primary"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={toggleExpanded}
                            className="p-2 rounded-xl hover:bg-bg-hover text-text-secondary shrink-0"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-5 border-t border-border-card space-y-4 pt-4 bg-bg-main/30">
                          {/* Chuyên cần buổi học */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest block">
                                Chuyên cần buổi học
                              </label>
                              <span className="text-[11px] text-text-secondary">
                                Tự động đồng bộ khi lưu báo cáo
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {[
                                { s: "present" as const, label: "✅ Có mặt", desc: "Đúng giờ" },
                                { s: "late" as const, label: "⏰ Đi muộn", desc: "Đến trễ" },
                                { s: "excused" as const, label: "📋 Có phép", desc: "Báo trước" },
                                { s: "absent" as const, label: "❌ Vắng mặt", desc: "Không phép" },
                              ].map(({ s, label, desc }) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => manualCheckin(student.id, s, reportSchedule.id)}
                                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                                    record?.status === s
                                      ? "bg-rose-500/20 border-rose-500 text-rose-400 font-bold shadow-sm"
                                      : "border-border-card bg-bg-card hover:bg-bg-hover text-text-secondary"
                                  }`}
                                >
                                  <p className="text-xs font-bold">{label}</p>
                                  <p className="text-[10px] opacity-70 mt-0.5">{desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Nhận xét text area */}
                          <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">
                              Nhận xét sau buổi học
                            </label>
                            <textarea
                              rows={3}
                              value={report.content || ""}
                              onChange={(e) => updateReport(student.id, "content", e.target.value)}
                              placeholder="Ghi nhận xét về sự tập trung, mức độ hiểu bài, tinh thần học tập..."
                              className="w-full bg-bg-main border border-border-card rounded-2xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:border-rose-500/50 leading-relaxed"
                            />

                            {/* Quick Comment Templates Chips */}
                            <div className="mt-2">
                              <p className="text-[11px] font-bold text-text-secondary mb-1.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" /> Mẫu nhận xét nhanh (bấm để thêm):
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {QUICK_COMMENTS.map((cmt, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => appendCommentTemplate(student.id, cmt)}
                                    className="text-[11px] px-2.5 py-1 rounded-xl bg-bg-card border border-border-card hover:border-rose-500/40 hover:text-rose-400 text-text-secondary transition font-medium text-left"
                                  >
                                    {cmt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Ratings */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-card p-3.5 rounded-2xl border border-border-card">
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">
                                Thái độ học tập (1–5 ⭐)
                              </label>
                              <StarRating value={report.behavior_score} onChange={(v) => updateReport(student.id, "behavior_score", v)} />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">
                                Mức độ tiến bộ (1–5 ⭐)
                              </label>
                              <StarRating value={report.progress_score} onChange={(v) => updateReport(student.id, "progress_score", v)} />
                            </div>
                          </div>

                          {/* Homework */}
                          <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">
                              Bài tập về nhà (BTVN)
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(HW_CONFIG).map(([k, v]) => (
                                <button key={k} type="button" onClick={() => updateReport(student.id, "homework_status", k)}
                                  className={`px-3 py-2 rounded-2xl border text-xs sm:text-sm font-bold transition text-center ${report.homework_status === k ? "bg-rose-500/20 border-rose-500/50 text-rose-400" : "border-border-card bg-bg-card hover:bg-bg-hover"}`}
                                >
                                  {v.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5 block">
                                💪 Điểm mạnh buổi này
                              </label>
                              <input
                                value={report.strengths || ""}
                                onChange={(e) => updateReport(student.id, "strengths", e.target.value)}
                                placeholder="VD: Tính toán nhanh, nhớ công thức..."
                                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-emerald-500/50"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1.5 block">
                                📌 Cần cải thiện
                              </label>
                              <input
                                value={report.weaknesses || ""}
                                onChange={(e) => updateReport(student.id, "weaknesses", e.target.value)}
                                placeholder="VD: Cần cẩn thận khi đọc đề..."
                                className="w-full bg-bg-main border border-border-card rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-amber-500/50"
                              />
                            </div>
                          </div>

                          {/* Bottom save bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-card">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={report.is_visible_to_parent !== false}
                                onChange={(e) => updateReport(student.id, "is_visible_to_parent", e.target.checked)}
                                className="w-4 h-4 accent-rose-500 rounded"
                              />
                              <span className="text-xs sm:text-sm text-text-secondary">Hiển thị cho phụ huynh và học sinh</span>
                            </label>
                            <button onClick={() => saveSessionReport(student.id)}
                              disabled={savingReport === student.id}
                              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition w-full sm:w-auto ${
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
                              {savedSuccessStudentId === student.id ? "Đã lưu thành công!" : "Lưu báo cáo & Điểm danh"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredSessionStudents.length === 0 && (
                  <div className="text-center py-12 text-text-secondary border border-dashed border-border-card rounded-3xl">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Buổi học này chưa có học sinh nào</p>
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="mt-3 px-4 py-2 rounded-2xl bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-white transition text-xs inline-flex items-center gap-1.5 border border-emerald-500/20"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Bổ sung học sinh ngay
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: WEEKLY / MONTHLY ─────────────────────────────────────────── */}
      {tab === "weekly-monthly" && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="p-6 rounded-3xl border border-border-card bg-bg-card space-y-4 shadow-sm">
            <div className="flex gap-3 items-center">
              <div className="flex gap-2 bg-bg-main rounded-2xl p-1 border border-border-card">
                {(["weekly", "monthly"] as const).map((m) => (
                  <button key={m} onClick={() => setReportMode(m)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${reportMode === m ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "text-text-secondary hover:text-text-primary"}`}
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
                      className="w-full bg-bg-main border border-border-card rounded-2xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50"
                    />
                  </div>
                  <select value={selectedStudentReport || ""} onChange={(e) => setSelectedStudentReport(Number(e.target.value) || null)}
                    className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
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
                    className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-rose-500/50"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Tháng</label>
                    <select value={reportMonth} onChange={(e) => setReportMonth(Number(e.target.value))}
                      className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2.5 text-sm text-text-primary focus:outline-none"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>Tháng {m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1.5 block">Năm</label>
                    <input type="number" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}
                      className="w-24 bg-bg-main border border-border-card rounded-2xl px-3 py-2.5 text-sm text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button onClick={autoGenerate} disabled={!selectedStudentReport || generating}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition disabled:opacity-50 w-full sm:w-auto shadow-lg shadow-rose-500/20"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Tự động tổng hợp
            </button>
          </div>

          {/* Generated data */}
          {(weeklyData || monthlyData) && (
            <div className="p-4 sm:p-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 space-y-4 shadow-sm">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5" /> Đã tổng hợp thành công
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
                    <div key={label} className="p-3 rounded-2xl bg-bg-card border border-border-card">
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
                    <div key={label} className="p-3 rounded-2xl bg-bg-card border border-border-card">
                      <p className="text-[11px] sm:text-xs text-text-secondary">{label}</p>
                      <p className="text-base sm:text-lg font-black text-text-primary">{value ?? "—"}</p>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="p-4 rounded-3xl border border-border-card bg-bg-card space-y-3">
              <p className="text-sm font-bold text-text-secondary">Đăng ký thiết bị mới</p>
              <input value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Tên thiết bị (VD: Arduino Phòng A)"
                className="w-full bg-bg-main border border-border-card rounded-2xl px-3.5 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500/50"
              />
              <select value={newDeviceType} onChange={(e) => setNewDeviceType(e.target.value)}
                className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="fingerprint">🖐️ Vân tay</option>
                <option value="face">📸 Khuôn mặt</option>
              </select>
              <button onClick={registerDevice} disabled={!newDeviceName}
                className="w-full py-2.5 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition disabled:opacity-50 text-sm shadow-md"
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
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-2xl border border-border-card bg-bg-card">
                  <div className={`w-2.5 h-2.5 rounded-full ${d.is_active ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{d.name}</p>
                    <p className="text-xs text-text-secondary">{d.device_type === "fingerprint" ? "🖐️ Vân tay" : "📸 Khuôn mặt"}</p>
                  </div>
                  <button onClick={() => toggleDevice(d.id)}
                    className={`text-xs px-2.5 py-1 rounded-xl font-bold border transition ${d.is_active ? "border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "border-zinc-600 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"}`}
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
            <div className="p-4 rounded-3xl border border-border-card bg-bg-card space-y-3">
              <p className="text-sm font-bold text-text-secondary">Tạo link mới cho phụ huynh</p>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    placeholder="🔍 Gõ tên học sinh để tìm nhanh..."
                    className="w-full bg-bg-main border border-border-card rounded-2xl pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-rose-500/50"
                  />
                </div>
                <select value={newLinkStudentId || ""} onChange={(e) => setNewLinkStudentId(Number(e.target.value) || null)}
                  className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2 text-sm text-text-primary focus:outline-none"
                >
                  <option value="">-- Chọn học sinh --</option>
                  {myStudents
                    .filter((s) => s.full_name.toLowerCase().includes(studentSearchQuery.toLowerCase()))
                    .map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <input value={newLinkParentName} onChange={(e) => setNewLinkParentName(e.target.value)}
                placeholder="Tên phụ huynh (VD: Mẹ của An)"
                className="w-full bg-bg-main border border-border-card rounded-2xl px-3.5 py-2 text-sm text-text-primary focus:outline-none"
              />
              <select value={newLinkExpires || ""} onChange={(e) => setNewLinkExpires(Number(e.target.value) || null)}
                className="w-full bg-bg-main border border-border-card rounded-2xl px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                <option value="">Không hết hạn</option>
                <option value="7">7 ngày</option>
                <option value="30">30 ngày</option>
                <option value="90">3 tháng</option>
              </select>
              <button onClick={generateParentLink} disabled={!newLinkStudentId || generatingLink}
                className="w-full py-2.5 rounded-2xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition disabled:opacity-50 text-sm shadow-md"
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
                <div key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl border border-border-card bg-bg-main/30">
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

      {/* ── Modal Bổ sung học sinh vào buổi học ────────────────────────────── */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" /> Bổ sung học sinh vào buổi học
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Thêm học sinh để viết báo cáo và điểm danh bù
                </p>
              </div>
              <button
                onClick={() => { setIsAddStudentModalOpen(false); setAddStudentQuery(""); }}
                className="p-2 rounded-xl hover:bg-bg-hover text-text-secondary hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={addStudentQuery}
                onChange={(e) => setAddStudentQuery(e.target.value)}
                placeholder="🔍 Tìm học sinh theo tên..."
                className="w-full bg-bg-main border border-border-card rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {availableStudentsToAdd.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border-card bg-bg-main/50 hover:bg-bg-hover transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {student.full_name.split(" ").pop()?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-text-primary text-sm truncate">{student.full_name}</p>
                      {student.email && <p className="text-[11px] text-text-secondary truncate">{student.email}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => addStudentToSession(student)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition shadow-sm shrink-0"
                  >
                    + Thêm vào buổi
                  </button>
                </div>
              ))}

              {availableStudentsToAdd.length === 0 && (
                <div className="text-center py-8 text-text-secondary">
                  <p className="text-xs">
                    {addStudentQuery.trim() ? "Không tìm thấy học sinh phù hợp" : "Tất cả học sinh đã có trong danh sách buổi học này"}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border-card flex justify-end">
              <button
                type="button"
                onClick={() => { setIsAddStudentModalOpen(false); setAddStudentQuery(""); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover transition"
              >
                Đóng
              </button>
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
