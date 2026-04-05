"use client";

import { useEffect, useState } from "react";
import { Wallet, CheckCircle2, XCircle, Ban, Plus, Filter, Search, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type TuitionRecord = {
  id: number;
  student_name: string;
  amount: number;
  paid_amount?: number;
  status: string;
  note?: string;
  billing_cycle?: string;
  paid_at?: string;
  created_at?: string;
  method?: string;
};

type Student = {
  id: number;
  full_name: string;
  avatar_url?: string;
  email?: string;
};

// ════════════════════════════════
// VIEW HỌC SINH — xem học phí bản thân
// ════════════════════════════════
function StudentTuitionView() {
  const [records, setRecords] = useState<TuitionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("minda_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tuition/my-fees`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : [])
      .then(data => setRecords(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const paid = records.filter(r => r.status === "paid").length;
  const pending = records.filter(r => r.status === "pending" || r.status === "overdue").length;
  const total = records.reduce((a, r) => a + r.amount, 0);
  const totalPaid = records.filter(r => r.status === "paid").reduce((a, r) => a + (r.paid_amount || r.amount), 0);

  return (
    <div className="min-h-screen bg-bg-main p-6 md:p-8 font-outfit">
      <header className="flex items-center gap-3 mb-8 pb-6 border-b border-border-card">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-text-primary leading-none mb-1">Học phí của tôi</h1>
          <p className="text-text-secondary text-sm">Trạng thái đóng học phí & lịch sử thanh toán</p>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-bg-card rounded-2xl border border-border-card shadow-sm">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Tổng học phí</p>
          <p className="text-2xl font-black text-text-primary">{total.toLocaleString()}₫</p>
        </div>
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">Đã thanh toán</p>
          <p className="text-2xl font-black text-emerald-700">{totalPaid.toLocaleString()}₫ <span className="text-sm font-normal text-emerald-600">({paid} phiếu)</span></p>
        </div>
        <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs text-amber-700 font-bold uppercase tracking-wider mb-1">Chờ đóng</p>
          <p className="text-2xl font-black text-amber-700">{pending} <span className="text-sm font-normal text-amber-600">phiếu còn lại</span></p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-3xl border border-border-card overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-card">
          <h2 className="text-base font-bold text-text-primary">Lịch sử học phí</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-card text-text-secondary text-xs uppercase tracking-wider">
              <th className="p-4 pl-6 font-semibold">Tháng</th>
              <th className="p-4 font-semibold">Ghi chú</th>
              <th className="p-4 font-semibold">Số tiền</th>
              <th className="p-4 font-semibold">Ngày nộp</th>
              <th className="p-4 pr-6 font-semibold text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-10 text-text-secondary">Đang tải...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-10 text-text-secondary">Chưa có phiếu học phí nào.</td></tr>
            ) : records.map(item => (
              <tr key={item.id} className="border-b border-border-card hover:bg-bg-hover transition-colors">
                <td className="p-4 pl-6 font-semibold text-text-primary">{item.billing_cycle || "—"}</td>
                <td className="p-4 text-text-secondary">{item.note || "Học phí"}</td>
                <td className="p-4 font-bold text-text-primary">{item.amount.toLocaleString()}₫</td>
                <td className="p-4 text-text-secondary">{item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : "Chưa nộp"}</td>
                <td className="p-4 pr-6 text-right">
                  {item.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Đã đóng
                    </span>
                  ) : item.status === 'quit' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-hover text-text-muted border border-border-card rounded-full text-xs font-bold">
                      <Ban className="w-3 h-3" /> Đã nghỉ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">
                      <XCircle className="w-3 h-3" /> Chưa đóng
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════
// VIEW GIÁO VIÊN — quản lý học phí
// ════════════════════════════════
function TeacherTuitionView() {
  const [records, setRecords] = useState<TuitionRecord[]>([]);
  const [offlineStudents, setOfflineStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ student_id: "", amount: "", note: "", billing_cycle: "2026-04" });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [revenueView, setRevenueView] = useState("all");

  const fetchRecords = async () => {
    const token = localStorage.getItem("minda_token");
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tuition/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRecords(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const token = localStorage.getItem("minda_token");
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile/my-offline-students`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : []).then(setOfflineStudents).catch(console.error);
    fetchRecords();
  }, []);

  const handleCreateTuition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount) { alert("Vui lòng điền đầy đủ thông tin"); return; }
    const token = localStorage.getItem("minda_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tuition/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: parseInt(formData.student_id), course_id: null, amount: parseInt(formData.amount), note: formData.note || "Học phí lớp Offline", billing_cycle: formData.billing_cycle })
    });
    if (res.ok) { setShowCreateModal(false); setFormData({ student_id: "", amount: "", note: "", billing_cycle: "2026-04" }); fetchRecords(); }
    else { const err = await res.json(); alert(err.detail || "Lỗi tạo phiếu"); }
  };

  const handleConfirmPayment = async (record: TuitionRecord, newStatus = "paid") => {
    if (!confirm(newStatus === "quit" ? `Xác nhận ${record.student_name} đã nghỉ học?` : `Xác nhận thu ${record.amount.toLocaleString()}₫ từ ${record.student_name}?`)) return;
    const token = localStorage.getItem("minda_token");
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tuition/${record.id}/pay`, {
      method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paid_amount: record.amount, status: newStatus })
    });
    if (res.ok) fetchRecords(); else { const err = await res.json(); alert(err.detail || "Lỗi cập nhật"); }
  };

  const filteredRecords = records.filter(r => {
    if (!selectedMonth) return true;
    const m = (r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0, 7) : (r.created_at ? r.created_at.substring(0, 7) : r.billing_cycle);
    return m === selectedMonth;
  });
  const pendingCount = filteredRecords.filter(r => r.status === "pending" || r.status === "overdue").length;
  const displayYear = selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear().toString();
  let currentRevenue = 0;
  if (revenueView === "month" && selectedMonth) currentRevenue = records.filter(r => ((r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0,7) : (r.created_at ? r.created_at.substring(0,7) : r.billing_cycle)) === selectedMonth).reduce((a, c) => a + (c.paid_amount || 0), 0);
  else if (revenueView === "year") currentRevenue = records.filter(r => { const m = (r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0,7) : (r.created_at ? r.created_at.substring(0,7) : r.billing_cycle); return m && m.startsWith(displayYear); }).reduce((a, c) => a + (c.paid_amount || 0), 0);
  else currentRevenue = records.reduce((a, c) => a + (c.paid_amount || 0), 0);

  const chartData = Array.from({length: 12}, (_, i) => {
    const data: Record<string, number | string> = { name: `T${i+1}`, fullMonth: `${displayYear}-${String(i+1).padStart(2, '0')}`, "Đã thu": 0, "Chưa thu": 0 };
    records.forEach(curr => {
      const m = (curr.status === 'paid' && curr.paid_at) ? curr.paid_at.substring(0,7) : (curr.created_at ? curr.created_at.substring(0,7) : curr.billing_cycle);
      if (m === data.fullMonth) { if (curr.status === "paid") (data["Đã thu"] as number) += curr.paid_amount || 0; else if (curr.status !== "quit") (data["Chưa thu"] as number) += curr.amount || 0; }
    });
    return data;
  });

  return (
    <div className="min-h-screen bg-bg-main p-6 md:p-8 font-outfit">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border-card gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight text-text-primary leading-none mb-1">Quản lý Học phí</h1>
            <p className="text-text-secondary text-sm">Kiểm soát dòng tiền, báo cáo doanh thu</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg-card border border-border-card rounded-xl overflow-hidden shadow-sm">
            <div className="px-3 py-2.5 bg-bg-hover border-r border-border-card flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Lọc Tháng</span>
            </div>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent text-sm text-text-primary px-3 py-2.5 outline-none font-medium" />
            {selectedMonth && <button onClick={() => setSelectedMonth("")} className="px-3 text-text-secondary hover:text-red-500"><XCircle className="w-4 h-4" /></button>}
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-purple-500/20">
            <Plus className="w-4 h-4" /> Gửi Yêu Cầu
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="p-5 bg-bg-card rounded-2xl border border-border-card shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <select value={revenueView} onChange={e => setRevenueView(e.target.value)} className="bg-bg-hover border border-border-card rounded-lg px-2 py-1 text-text-secondary text-xs font-semibold outline-none">
              <option value="all">Tổng doanh thu</option>
              <option value="year">Theo năm {displayYear}</option>
              <option value="month">Theo tháng</option>
            </select>
          </div>
          <p className="text-2xl font-black text-purple-700">{currentRevenue.toLocaleString()}₫</p>
          <div className="mt-3 w-full bg-bg-hover h-1.5 rounded-full"><div className="bg-purple-500 h-1.5 rounded-full w-4/5" /></div>
        </div>
        <div className="p-5 bg-bg-card rounded-2xl border border-border-card shadow-sm">
          <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-2">Số học sinh Offline</p>
          <p className="text-2xl font-black text-text-primary">{offlineStudents.length} <span className="text-base text-text-secondary font-normal">học sinh</span></p>
        </div>
        <div className="p-5 bg-red-50 rounded-2xl border border-red-200 shadow-sm">
          <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-2">Chưa thanh toán</p>
          <p className="text-2xl font-black text-red-700">{pendingCount} <span className="text-base font-normal text-red-600">phiếu</span></p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8 p-6 bg-bg-card rounded-3xl border border-border-card shadow-sm h-72">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h2 className="text-base font-bold text-text-primary">Biểu đồ Doanh thu năm {displayYear}</h2>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CE" vertical={false} />
            <XAxis dataKey="name" stroke="#5C4F42" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#5C4F42" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `${v/1000}k`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#E2D9CE', borderRadius: '8px', color: '#1A1410' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#5C4F42' }} />
            <Bar dataKey="Đã thu" stackId="a" fill="#a855f7" radius={[0,0,4,4]} />
            <Bar dataKey="Chưa thu" stackId="a" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Offline students */}
      {offlineStudents.length > 0 && (
        <div className="mb-8 bg-bg-card rounded-3xl border border-border-card p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4">Học sinh của bạn (Offline)</h2>
          <div className="flex flex-wrap gap-3">
            {offlineStudents.map(student => (
              <div key={student.id} className="flex items-center gap-3 bg-bg-hover px-4 py-3 rounded-2xl border border-border-card">
                <div className="w-9 h-9 rounded-full bg-purple-100 overflow-hidden">
                  <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=a855f7&color=fff`} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{student.full_name}</p>
                  <p className="text-xs text-text-secondary">{student.email}</p>
                </div>
                <button onClick={() => { setFormData({...formData, student_id: student.id.toString()}); setShowCreateModal(true); }} className="ml-3 px-3 py-1.5 bg-bg-card hover:bg-purple-600 hover:text-white text-text-secondary text-xs font-semibold rounded-lg border border-border-card hover:border-transparent transition-all">
                  Tạo phiếu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-bg-card rounded-3xl border border-border-card overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border-card">
          <h2 className="text-base font-bold text-text-primary">Lịch sử giao dịch</h2>
          <div className="relative w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input type="text" placeholder="Tìm tên, tháng..." className="w-full pl-9 pr-4 py-2 bg-bg-hover border border-border-card rounded-lg text-sm outline-none focus:border-purple-400 text-text-primary" />
          </div>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border-card text-text-secondary text-xs uppercase tracking-wider">
              <th className="p-4 pl-6 font-semibold">Học sinh / Ghi chú</th>
              <th className="p-4 font-semibold">Số tiền</th>
              <th className="p-4 font-semibold">Phương thức</th>
              <th className="p-4 font-semibold">Ngày thanh toán</th>
              <th className="p-4 pr-6 font-semibold text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-8 text-text-secondary">Đang tải dữ liệu...</td></tr>
            ) : filteredRecords.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-text-secondary">Không có phiếu thu cho tháng này.</td></tr>
            ) : filteredRecords.map(item => (
              <tr key={item.id} className="border-b border-border-card hover:bg-bg-hover transition-colors">
                <td className="p-4 pl-6">
                  <div className="font-semibold text-text-primary mb-0.5">{item.student_name}</div>
                  <div className="text-xs text-text-secondary">{item.note}</div>
                </td>
                <td className="p-4 font-bold text-text-primary">{item.amount.toLocaleString()}₫</td>
                <td className="p-4 text-text-secondary">{item.method || "CK/Momo"}</td>
                <td className="p-4 text-text-secondary">{item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : "Chưa nộp"}</td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Đã đóng
                      </span>
                    ) : item.status === 'quit' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg-hover text-text-muted border border-border-card rounded-full text-xs font-bold">
                        <Ban className="w-3 h-3" /> Đã nghỉ
                      </span>
                    ) : (
                      <>
                        <span onClick={() => handleConfirmPayment(item)} className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold cursor-pointer hover:bg-amber-100 transition-colors">
                          <XCircle className="w-3 h-3" /> Chưa đóng — Xác nhận
                        </span>
                        <button onClick={() => handleConfirmPayment(item, "quit")} title="Đánh dấu nghỉ học" className="p-1.5 text-text-secondary hover:bg-red-50 hover:text-red-500 rounded-full transition-colors border border-transparent hover:border-red-200">
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-text-primary mb-5">Tạo Phiếu Thu</h3>
            <form onSubmit={handleCreateTuition} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Học sinh Offline</label>
                <select value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-purple-400 text-sm text-text-primary" required>
                  <option value="">-- Chọn học sinh --</option>
                  {offlineStudents.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Số tiền (VNĐ)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-purple-400 text-sm text-text-primary placeholder-[#5C4F42]" placeholder="VD: 500000" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Tháng thu</label>
                <input type="month" value={formData.billing_cycle} onChange={e => setFormData({...formData, billing_cycle: e.target.value})} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-purple-400 text-sm text-text-primary" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Ghi chú</label>
                <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 outline-none focus:border-purple-400 text-sm text-text-primary placeholder-[#5C4F42]" placeholder="VD: Học phí T4/2026" />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl text-text-secondary hover:bg-bg-hover border border-border-card text-sm font-bold transition-colors">Hủy</button>
                <button type="submit" className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-md transition-all">Phát hành</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════
// MAIN EXPORT — phân luồng theo role
// ════════════════════════════════
export default function TuitionPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("minda_role") || "student");
  }, []);

  if (role === null) return <div className="min-h-screen bg-bg-main" />;
  if (role === "teacher" || role === "admin") return <TeacherTuitionView />;
  return <StudentTuitionView />;
}
