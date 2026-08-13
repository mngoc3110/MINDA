"use client";

import { useState, useEffect } from "react";
import { Award, Plus, Check, X, Loader2, Search, Trash2, Edit2, User } from "lucide-react";

interface Honor {
  id: number;
  student_id: number;
  teacher_id: number;
  title: string;
  description: string;
  image_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  student_name: string;
  teacher_name: string;
  academic_year: string | null;
  university_logo_url: string | null;
}

export default function HonorsPage() {
  const [honors, setHonors] = useState<Honor[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("teacher");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [editingHonorId, setEditingHonorId] = useState<number | null>(null);
  
  // For teachers only: search their students
  const [students, setStudents] = useState<any[]>([]);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [universityLogoFile, setUniversityLogoFile] = useState<File | null>(null);
  
  const [isExternalStudent, setIsExternalStudent] = useState(false);
  
  const [formData, setFormData] = useState({
    student_id: "",
    custom_student_name: "",
    academic_year: "",
    title: "",
    description: "",
    image_url: "",
    university_logo_url: ""
  });

  useEffect(() => {
    const userRole = localStorage.getItem("minda_role") || "teacher";
    setRole(userRole);
    fetchHonors(userRole);
    fetchMyStudents();
  }, []);

  const fetchHonors = async (currentRole: string) => {
    try {
      const token = localStorage.getItem("minda_token");
      const endpoint = currentRole === "admin" ? "/api/honors/admin" : "/api/honors/teacher";
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}${endpoint}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setHonors(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyStudents = async () => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/students`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setStudents(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const token = localStorage.getItem("minda_token");
      
      const submitData = new FormData();
      if (!isExternalStudent) {
        submitData.append("student_id", formData.student_id);
      } else {
        submitData.append("custom_student_name", formData.custom_student_name);
      }
      if (formData.academic_year) {
        submitData.append("academic_year", formData.academic_year);
      }
      submitData.append("title", formData.title);
      submitData.append("description", formData.description || "Cựu học sinh xuất sắc");
      
      if (imageFile) {
        submitData.append("image", imageFile);
      } else if (formData.image_url) {
        submitData.append("image_url", formData.image_url);
      }
      
      if (universityLogoFile) {
        submitData.append("university_logo", universityLogoFile);
      } else if (formData.university_logo_url) {
        submitData.append("university_logo_url", formData.university_logo_url);
      }

      const url = editingHonorId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/${editingHonorId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/`;
        
      const method = editingHonorId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Authorization": `Bearer ${token}`
        },
        body: submitData
      });
      
      if (res.ok) {
        const savedHonor = await res.json();
        if (editingHonorId) {
           setHonors(honors.map(h => h.id === editingHonorId ? savedHonor : h));
        } else {
           setHonors([savedHonor, ...honors]);
        }
        setShowModal(false);
        resetForm();
      } else {
        const err = await res.json();
        alert(`Lỗi khi thêm vinh danh: ${err.detail || 'Unknown Error'}`);
      }
    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi hệ thống khi upload.");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ student_id: "", custom_student_name: "", academic_year: "", title: "", description: "", image_url: "", university_logo_url: "" });
    setImageFile(null);
    setUniversityLogoFile(null);
    setIsExternalStudent(false);
    setEditingHonorId(null);
  };

  const handleEditClick = (honor: Honor) => {
    setEditingHonorId(honor.id);
    setIsExternalStudent(!honor.student_id);
    setFormData({
      student_id: honor.student_id ? honor.student_id.toString() : "",
      custom_student_name: honor.custom_student_name || "",
      academic_year: honor.academic_year || "",
      title: honor.title,
      description: honor.description,
      image_url: honor.image_url || "",
      university_logo_url: honor.university_logo_url || ""
    });
    setImageFile(null);
    setUniversityLogoFile(null);
    setShowModal(true);
  };

  const handleDeleteClick = async (honor_id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá đề cử này?")) return;
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/${honor_id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setHonors(honors.filter(h => h.id !== honor_id));
      } else {
        alert("Có lỗi xảy ra khi xoá.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/${id}/status?status=${status}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchHonors(role || "admin");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDirectImageUrl = (url: string | null) => {
    if (!url) return "";
    const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)/;
    const match = url.match(driveRegex);
    if (match && match[1]) {
      // Use thumbnail API which bypasses Google Drive's hotlink protection
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-main">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-t-primary p-6 md:p-10 font-outfit">
      <header className="mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3 text-amber-500 uppercase">
              <Award className="w-8 h-8" /> Quản lý Vinh Danh
           </h1>
           <p className="text-t-secondary text-sm md:text-base">
             {role === "admin" ? "Duyệt các học sinh xuất sắc để hiển thị trên trang chủ." : "Đề cử các học sinh xuất sắc của bạn để vinh danh trên trang chủ."}
           </p>
        </div>
        
        {role !== "admin" && (
          <button 
             onClick={() => { resetForm(); setShowModal(true); }}
             className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all shrink-0"
          >
             <Plus className="w-5 h-5"/> ĐỀ CỬ HỌC SINH
          </button>
        )}
      </header>

      {honors.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-bg-card rounded-3xl border border-dashed border-border-card text-center">
            <Award className="w-16 h-16 text-t-secondary/30 mb-4" />
            <h3 className="text-xl font-bold mb-2">Chưa có đề cử nào</h3>
            <p className="text-t-secondary">Danh sách vinh danh đang trống.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {honors.map(honor => (
            <div key={honor.id} className="bg-bg-card border border-border-card p-6 rounded-2xl flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-full sm:w-1/3 shrink-0">
                <div className="aspect-square rounded-xl overflow-hidden bg-bg-hover relative border border-border-card">
                  {honor.image_url ? (
                    <img src={getDirectImageUrl(honor.image_url)} alt="Chân dung" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-t-secondary/50" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg shadow-md ${
                      honor.status === "approved" ? "bg-emerald-500 text-white" :
                      honor.status === "rejected" ? "bg-rose-500 text-white" :
                      "bg-amber-500 text-white"
                    }`}>
                      {honor.status === "approved" ? "Đã duyệt" : honor.status === "rejected" ? "Đã từ chối" : "Chờ duyệt"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                {honor.university_logo_url && (
                   <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-md border-2 border-amber-500/30 overflow-hidden mb-3 flex items-center justify-center">
                      <img src={getDirectImageUrl(honor.university_logo_url)} alt="University Logo" className="w-full h-full object-contain" />
                   </div>
                )}
                <h3 className="text-xl font-black text-amber-500 mb-1">{honor.title}</h3>
                <h4 className="text-lg font-bold text-t-primary mb-2">
                  {honor.student_name}
                  {honor.academic_year && <span className="text-sm font-normal text-t-secondary ml-2">(Năm học: {honor.academic_year})</span>}
                </h4>
                <p className="text-t-secondary text-sm mb-4 line-clamp-3 leading-relaxed bg-bg-main p-3 rounded-lg border border-border-card/50">
                  {honor.description}
                </p>
                <div className="mt-auto text-xs text-t-secondary flex justify-between items-end">
                  <div>
                    <p className="font-bold">Học sinh của: <span className="text-indigo-400">{honor.teacher_name}</span></p>
                    <p className="opacity-60">{new Date(honor.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  
                  {role === "admin" && honor.status === "pending" && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(honor.id, "approved")} className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors" title="Duyệt">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => updateStatus(honor.id, "rejected")} className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Từ chối">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Actions for teacher (Edit/Delete) or Admin (Edit/Delete) */}
                  <div className="flex gap-2 ml-2">
                     <button onClick={() => handleEditClick(honor)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors" title="Sửa thông tin">
                        <Edit2 className="w-4 h-4" />
                     </button>
                     <button onClick={() => handleDeleteClick(honor.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors" title="Xoá đề cử">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TẠO ĐỀ CỬ MODAL */}
      {showModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-amber-400 to-amber-600"></div>
                <div className="p-6">
                   <div className="p-6 border-b border-border-card flex justify-between items-center bg-amber-500/5">
              <h2 className="text-xl font-black text-amber-500 flex items-center gap-2">
                <Award className="w-6 h-6" /> {editingHonorId ? "Sửa thông tin đề cử" : "Gửi Đề cử Học sinh"}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-bg-hover hover:bg-border-card text-t-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
                   
                   <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div>
                         <div className="flex items-center justify-between mb-1">
                           <label className="block text-sm font-bold text-t-secondary">Học sinh được đề cử</label>
                           <label className="flex items-center gap-2 text-sm text-amber-500 font-medium cursor-pointer">
                             <input type="checkbox" checked={isExternalStudent} onChange={e => setIsExternalStudent(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                             Học sinh ngoài hệ thống
                           </label>
                         </div>
                         {!isExternalStudent ? (
                           <select required value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors">
                              <option value="">-- Bấm để chọn học sinh --</option>
                              {Array.from(new Map(students.map(item => [item.id, item])).values()).map((s: any) => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>
                              ))}
                           </select>
                         ) : (
                           <input type="text" required placeholder="Nhập tên cựu học sinh (VD: Nguyễn Văn A)" value={formData.custom_student_name} onChange={e => setFormData({...formData, custom_student_name: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
                         )}
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Năm học (Tùy chọn)</label>
                         <input type="text" placeholder="VD: 2023-2024" value={formData.academic_year} onChange={e => setFormData({...formData, academic_year: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
                      </div>
                       <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Tên Trường Đại Học</label>
                         <input type="text" required placeholder="VD: Đại học Y Dược TP. Hồ Chí Minh" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
                      </div>

                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Chú thích (Thành tích / Vị trí)</label>
                         <textarea required rows={2} placeholder="VD: Cựu học sinh xuất sắc, Thủ khoa khối A00..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors resize-none" />
                      </div>
                      
                      <div>
                         <label className="block text-sm font-bold text-t-secondary mb-1">Ảnh Minh Chứng (Ưu tiên Upload)</label>
                         <div className="flex flex-col gap-2">
                           <input type="file" accept="image/*" onChange={e => {
                               if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                           }} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20" />
                           <div className="text-center text-xs text-t-secondary">hoặc dán Link URL</div>
                           <input type="url" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-bg-main border border-border-card rounded-lg px-4 py-3 outline-none focus:border-amber-500 transition-colors" disabled={!!imageFile} />
                         </div>
                      </div>

                      <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20 mt-2">
                         <label className="block text-sm font-bold text-amber-600 mb-2">Logo Trường Đại Học (Tùy chọn)</label>
                         <input
                           type="file"
                           accept="image/*"
                           onChange={(e) => setUniversityLogoFile(e.target.files ? e.target.files[0] : null)}
                           className="block w-full text-sm text-t-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500/20 file:transition-colors cursor-pointer"
                         />
                         <p className="text-xs text-t-secondary mt-2 opacity-70">Sẽ hiển thị ở góc trên thẻ vinh danh (Ví dụ: Logo NEU, FTU,...)</p>
                      </div>
                      
                      <div className="mt-4 flex justify-end gap-3">
                         <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg border border-border-card font-bold text-t-secondary hover:bg-bg-hover transition-colors">
                            Hủy bỏ
                         </button>
                         <button type="submit" disabled={formLoading} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 min-w-[120px] disabled:opacity-50">
                            {formLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Gửi Đề Cử"}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
         </div>
      )}
    </div>
  );
}
