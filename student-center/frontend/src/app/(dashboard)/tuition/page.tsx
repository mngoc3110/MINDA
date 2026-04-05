"use client";

import { useEffect, useState } from "react";
import { Wallet, Search, CheckCircle2, XCircle, Ban, Plus, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function TuitionPage() {
  const [role, setRole] = useState<string | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [offlineStudents, setOfflineStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ student_id: "", amount: "", note: "", billing_cycle: "2026-04" });
  const [selectedMonth, setSelectedMonth] = useState("");
  const [revenueView, setRevenueView] = useState("all");

  const fetchOfflineStudents = async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/profile/my-offline-students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setOfflineStudents(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = async () => {
     try {
       const token = localStorage.getItem("minda_token");
       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/tuition/teacher/dashboard`, {
         headers: { Authorization: `Bearer ${token}` }
       });
       if(res.ok) {
         const data = await res.json();
         setRecords(data);
       }
     } catch(e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
  };

  useEffect(() => {
    const minda_role = localStorage.getItem("minda_role") || "student";
    const token = localStorage.getItem("minda_token");
    setRole(minda_role);
    if (minda_role === "teacher" && token) {
      fetchOfflineStudents(token);
    }
    fetchRecords();
  }, []);

  const handleCreateTuition = async (e: React.FormEvent) => {
    // ... no changes here
    e.preventDefault();
    if (!formData.student_id || !formData.amount) {
      alert("Vui lòng điền đầy đủ Học sinh và Số tiền");
      return;
    }
    try {
      const token = localStorage.getItem("minda_token");
      const payload = {
        student_id: parseInt(formData.student_id),
        course_id: null,
        amount: parseInt(formData.amount),
        note: formData.note || "Học phí lớp Offline",
        billing_cycle: formData.billing_cycle
      };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}'}`}/api/tuition/`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ student_id: "", amount: "", note: "", billing_cycle: "2026-04" });
        fetchRecords();
      } else {
        const error = await res.json();
        alert(error.detail || "Lỗi tạo phiếu thu");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối server");
    }
  };

  const handleConfirmPayment = async (record: any, newStatus: string = "paid") => {
    let confirmMsg = `Xác nhận thu đủ số tiền ${record.amount.toLocaleString()}₫ từ ${record.student_name}?`;
    if (newStatus === "quit") confirmMsg = `Xác nhận Học viên ${record.student_name} đã nghỉ học và hủy phiếu thu này?`;

    if (!confirm(confirmMsg)) return;
    
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tuition/${record.id}/pay`, {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ paid_amount: record.amount, status: newStatus })
      });
      
      if (res.ok) {
         fetchRecords();
      } else {
         const error = await res.json();
         alert(error.detail || "Lỗi cập nhật thanh toán");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối server");
    }
  };

  if (role !== "teacher") {
    return <div className="min-h-screen bg-bg-main flex items-center justify-center text-gray-500">Bạn không có quyền truy cập trang này.</div>;
  }

  const filteredRecords = records.filter(r => {
     if (!selectedMonth) return true;
     const m = (r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0, 7) : (r.created_at ? r.created_at.substring(0, 7) : r.billing_cycle);
     return m === selectedMonth;
  });
  const pendingCount = filteredRecords.filter(r => r.status === "pending" || r.status === "overdue").length;

  const displayYear = selectedMonth ? selectedMonth.split('-')[0] : new Date().getFullYear().toString();
  
  let currentRevenue = 0;
  if (revenueView === "month" && selectedMonth) {
     currentRevenue = records.filter(r => ((r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0, 7) : (r.created_at ? r.created_at.substring(0, 7) : r.billing_cycle)) === selectedMonth).reduce((a, c) => a + (c.paid_amount || 0), 0);
  } else if (revenueView === "year") {
     currentRevenue = records.filter(r => {
         const m = (r.status === 'paid' && r.paid_at) ? r.paid_at.substring(0, 7) : (r.created_at ? r.created_at.substring(0, 7) : r.billing_cycle);
         return m && m.startsWith(displayYear);
     }).reduce((a, c) => a + (c.paid_amount || 0), 0);
  } else {
     currentRevenue = records.reduce((a, c) => a + (c.paid_amount || 0), 0);
  }
  const chartData = Array.from({length: 12}, (_, i) => {
     const data = { name: `T${i+1}`, fullMonth: `${displayYear}-${String(i+1).padStart(2, '0')}`, "Đã thu": 0, "Chưa thu": 0 };
     records.forEach(curr => {
        const m = (curr.status === 'paid' && curr.paid_at) ? curr.paid_at.substring(0, 7) : (curr.created_at ? curr.created_at.substring(0, 7) : curr.billing_cycle);
        if (m === data.fullMonth) {
           if (curr.status === "paid") data["Đã thu"] += curr.paid_amount || 0;
           else if (curr.status !== "quit") data["Chưa thu"] += curr.amount || 0;
        }
     });
     return data;
  });

  return (
    <div className="min-h-screen bg-bg-main text-white p-6 md:p-8 font-outfit selection:bg-purple-500/30">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl tracking-tight leading-none mb-1">Quản lý Học phí</h1>
            <p className="text-gray-400 text-sm">Kiểm soát dòng tiền, báo cáo doanh thu và học phí sinh viên</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Bộ lọc tháng to rõ ràng trên Header */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner group transition-all focus-within:border-purple-500/50 focus-within:bg-white/10">
            <div className="px-3 py-2.5 bg-black/40 border-r border-white/5 flex items-center justify-center">
               <Filter className="w-4 h-4 text-purple-400" />
               <span className="text-xs font-semibold text-gray-300 ml-2 uppercase tracking-wide">Lọc Tháng</span>
            </div>
            <input 
               type="month" 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="bg-transparent text-sm text-white px-3 py-2.5 outline-none font-medium appearance-none cursor-pointer"
               title="Lọc theo Tháng/Năm"
            />
            {selectedMonth && (
               <button onClick={() => setSelectedMonth("")} className="px-3 hover:text-red-400 text-gray-500 transition-colors">
                 <XCircle className="w-4 h-4" />
               </button>
            )}
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] shrink-0"
          >
            <Plus className="w-5 h-5" /> Gửi Yêu Cầu
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-2">
             <select 
                value={revenueView} 
                onChange={(e) => setRevenueView(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-gray-300 text-xs font-semibold outline-none cursor-pointer focus:border-purple-500 focus:text-purple-400 transition-colors"
                title="Chọn cách tính Doanh thu"
             >
                <option value="all" className="bg-[#111] text-white">Doanh thu (Tổng)</option>
                <option value="year" className="bg-[#111] text-white">Theo Năm ({displayYear})</option>
                <option value="month" className="bg-[#111] text-white">Theo Tháng ({selectedMonth || "chưa chọn"})</option>
             </select>
             <Filter className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
             {currentRevenue.toLocaleString()}₫
          </p>
          <div className="mt-4 w-full bg-white/5 h-1.5 rounded-full"><div className="bg-purple-500 h-1.5 rounded-full w-[85%]"></div></div>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10">
          <p className="text-gray-400 text-sm font-medium mb-2">Số lượng Học sinh Offline</p>
          <p className="text-2xl font-bold text-white">{offlineStudents.length} <span className="text-base text-gray-500 font-normal">học sinh</span></p>
        </div>
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-red-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          <p className="text-red-400 text-sm font-medium mb-2">Phiếu chưa thanh toán</p>
          <p className="text-2xl font-bold text-white">{pendingCount} <span className="text-base font-normal opacity-50">phiếu</span></p>
        </div>
      </div>

      <div className="mb-8 p-6 bg-white/[0.02] rounded-3xl border border-white/10 h-72">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Biểu đồ Doanh thu năm {displayYear}</h2>
         </div>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Đã thu" stackId="a" fill="#a855f7" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Chưa thu" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
         ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
               <Wallet className="w-8 h-8 opacity-20 mb-2" />
               <p className="text-sm">Chưa có dữ liệu thống kê</p>
            </div>
         )}
      </div>

      {offlineStudents.length > 0 && (
         <div className="mb-8 bg-white/[0.02] rounded-3xl border border-white/10 p-6">
            <h2 className="text-lg font-bold mb-4">Học sinh của bạn (Offline)</h2>
            <div className="flex flex-wrap gap-4">
              {offlineStudents.map(student => (
                 <div key={student.id} className="flex items-center gap-3 bg-black/40 px-4 py-3 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 overflow-hidden">
                       <img src={student.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.full_name)}&background=a855f7&color=fff`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                       <p className="text-sm font-bold">{student.full_name}</p>
                       <p className="text-xs text-gray-500">{student.email}</p>
                    </div>
                    <button 
                       onClick={() => {
                          setFormData({...formData, student_id: student.id.toString()});
                          setShowCreateModal(true);
                       }}
                       className="ml-4 px-3 py-1.5 bg-white/5 hover:bg-purple-600 hover:text-white text-gray-300 text-xs font-semibold rounded-lg transition-colors border border-white/10 hover:border-transparent"
                    >
                       Tạo phiếu
                    </button>
                 </div>
              ))}
            </div>
         </div>
      )}

      <div className="bg-[#0a0a0a] rounded-3xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-lg font-bold">Lịch sử giao dịch</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Tìm tên, tháng..." className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-purple-500/50" />
          </div>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-sm text-gray-400">
              <th className="p-4 pl-6 font-medium">Học sinh / Ghi chú</th>
              <th className="p-4 font-medium">Số tiền</th>
              <th className="p-4 font-medium">Phương thức</th>
              <th className="p-4 font-medium">Ngày thanh toán</th>
              <th className="p-4 pr-6 font-medium text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
               <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">Đang tải dữ liệu học phí...</td>
               </tr>
            ) : filteredRecords.length === 0 ? (
               <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">Không tìm thấy phiếu thu nào cho tháng này.</td>
               </tr>
            ) : filteredRecords.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4 pl-6">
                   <div className="font-semibold text-white mb-0.5">{item.student_name}</div>
                   <div className="text-xs text-gray-500">{item.note}</div>
                </td>
                <td className="p-4 font-medium">{item.amount.toLocaleString()}₫</td>
                <td className="p-4 text-gray-400">{item.method || "CK/Momo"}</td>
                <td className="p-4 text-gray-400">{item.paid_at ? new Date(item.paid_at).toLocaleDateString('vi-VN') : "Chưa nộp"}</td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status === 'paid' ? (
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/20 inline-flex items-center gap-1.5 bg-opacity-30">
                        <CheckCircle2 className="w-3 h-3" /> Đã đóng
                      </span>
                    ) : item.status === 'quit' ? (
                      <span className="px-3 py-1 bg-gray-500/10 text-gray-400 text-xs font-bold rounded-full border border-gray-500/20 inline-flex items-center gap-1.5 bg-opacity-30">
                        <Ban className="w-3 h-3" /> Đã nghỉ học
                      </span>
                    ) : (
                      <>
                        <span 
                           onClick={() => handleConfirmPayment(item, "paid")}
                           className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold rounded-full border border-blue-500/20 inline-flex items-center gap-1.5 bg-opacity-30 cursor-pointer hover:bg-blue-500/20 hover:text-white transition-colors group"
                        >
                          <XCircle className="w-3 h-3 group-hover:hidden" />
                          <CheckCircle2 className="w-3 h-3 hidden group-hover:block text-green-400" />
                          <span className="group-hover:hidden">Chưa đóng</span>
                          <span className="hidden group-hover:block text-green-400">Bấm Xác nhận</span>
                        </span>
                        
                        <button 
                           onClick={() => handleConfirmPayment(item, "quit")}
                           title="Chuyển trạng thái sang Đã nghỉ học"
                           className="p-1 text-gray-500 hover:bg-red-500/10 hover:text-red-400 rounded-full transition-colors border border-transparent hover:border-red-500/20"
                        >
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

      {/* CREATE TUITION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 min-w-[320px]">
          <div className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-6">Tạo Phiếu Thu</h3>
            
            <form onSubmit={handleCreateTuition} className="flex flex-col gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Học sinh Offline</label>
                  <select 
                    value={formData.student_id} 
                    onChange={e => setFormData({...formData, student_id: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm text-white"
                    required
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {offlineStudents.map(s => (
                       <option key={s.id} value={s.id}>{s.full_name || `Học sinh #${s.id}`} (ID: {s.id})</option>
                    ))}
                  </select>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Số tiền (VNĐ)</label>
                  <input 
                    type="number" 
                    value={formData.amount} 
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm placeholder-gray-600" 
                    placeholder="VD: 500000"
                    required 
                  />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Tháng Thu (Năm-Tháng)</label>
                  <input 
                    type="month" 
                    value={formData.billing_cycle} 
                    onChange={e => setFormData({...formData, billing_cycle: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm text-gray-300" 
                    required 
                  />
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Ghi chú chi tiết</label>
                  <input 
                    type="text" 
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500 text-sm placeholder-gray-600" 
                    placeholder="VD: Học phí T4/2026"
                  />
               </div>

               <div className="flex justify-end gap-3 mt-4">
                 <button 
                   type="button"
                   onClick={() => setShowCreateModal(false)}
                   className="px-5 py-2.5 rounded-xl text-gray-400 hover:bg-white/5 transition-colors text-sm font-bold"
                 >Hủy</button>
                 <button 
                   type="submit"
                   className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/25 transition-all"
                 >Phát hành phiếu</button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
