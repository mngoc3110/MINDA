"use client";
import React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Phone, Mail, Globe, Link as LinkIcon, Link2, Edit3, Save, X, Plus, Trash2, MapPin, Award, BookOpen, Presentation, Code2, Loader2, ChevronLeft, Cloud } from "lucide-react";
import Link from "next/link";

interface TeacherCVViewProps {
  teacherId: string | number;
  enableGoBack?: boolean;
}

export default function TeacherCVView({ teacherId, enableGoBack = true }: TeacherCVViewProps) {
  const router = useRouter();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [isEditingBasicProfile, setIsEditingBasicProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingBasicProfile, setSavingBasicProfile] = useState(false);
  
  const [isOwner, setIsOwner] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [teacherId]);

  useEffect(() => {
    if (isOwner) {
       const checkGoogle = async () => {
          try {
             const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/me`, {
                 headers: { Authorization: `Bearer ${localStorage.getItem("minda_token")}` }
             });
             if (res.ok) {
                const data = await res.json();
                setIsGoogleConnected(data.is_google_connected);
             }
          } catch {}
       };
       checkGoogle();
    }
  }, [isOwner]);

  const handleConnectGoogle = async () => {
      try {
         const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/google/connect`, { 
             headers: { Authorization: `Bearer ${localStorage.getItem("minda_token")}` }
         });
         const data = await res.json();
         if (data.authorization_url) window.location.href = data.authorization_url;
      } catch {
         alert("Lỗi kết nối OAuth Server!");
      }
  };

  const defaultProfile = () => ({
    full_name: localStorage.getItem("minda_user_name") || "Họ và Tên",
    cv_title: "GIA SƯ TOÁN - TIN",
    phone: "",
    email: localStorage.getItem("minda_email") || "",
    social_website: "",
    social_facebook: "",
    social_linkedin: "",
    avatar_url: null,
    cv_theme_color: "#1a365d",
    cv_layout: "modern",
    cv_competencies: ["Nắm rõ kiến thức chuyên môn: Mô tả chuyên ngành"],
    cv_soft_skills: ["Kỹ năng sư phạm tốt", "Tư duy logic"],
    cv_languages: ["Tiếng Anh"],
    cv_formats: ["Nhận dạy kèm 1-1", "Nhận dạy nhóm"],
    cv_education: [{ school: "ĐẠI HỌC SƯ PHẠM TP.HCM", major1: "Sư phạm Toán học", major2: "", icon: "" }],
    cv_teaching_experience: [{ year: "2024", tasks: "Mô tả kinh nghiệm dạy học" }],
    cv_programming_experience: ["Ví dụ: Xây dựng ứng dụng học tập AI"],
    cv_additional_info: ["Ví dụ: Điểm A bộ môn phương pháp giảng dạy"],
    cv_custom_sections: [],
  });

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/teachers/${teacherId}/cv`);
      if (res.ok) {
        const data = await res.json();
        
        // Ensure defaults for JSON arrays
        const safeParse = (str: string) => {
          try { return JSON.parse(str || "[]"); } 
          catch { return []; }
        };
        
        const formattedData = {
          ...data,
          cv_title: data.cv_title || "GIA SƯ TOÁN - TIN",
          cv_competencies: safeParse(data.cv_competencies),
          cv_soft_skills: safeParse(data.cv_soft_skills),
          cv_languages: safeParse(data.cv_languages),
          cv_formats: safeParse(data.cv_formats),
          cv_education: safeParse(data.cv_education),
          cv_teaching_experience: safeParse(data.cv_teaching_experience),
          cv_programming_experience: safeParse(data.cv_programming_experience),
          cv_additional_info: safeParse(data.cv_additional_info),
          cv_theme_color: data.cv_theme_color || "#1a365d",
          cv_layout: data.cv_layout || "modern",
          cv_custom_sections: safeParse(data.cv_custom_sections),
        };
        
        setProfile(formattedData);
        setEditForm(JSON.parse(JSON.stringify(formattedData)));
        
        // Check ownership
        const currentId = localStorage.getItem("minda_user_id");
        if (currentId && parseInt(currentId) === parseInt(teacherId.toString())) {
          setIsOwner(true);
        }
      } else if (res.status === 404) {
        // Chưa có CV → tạo template mặc định và vào edit mode ngay
        const currentId = localStorage.getItem("minda_user_id");
        const isMe = currentId && parseInt(currentId) === parseInt(teacherId.toString());
        if (isMe) {
          const def = defaultProfile();
          setProfile(def);
          setEditForm(JSON.parse(JSON.stringify(def)));
          setIsOwner(true);
          setIsEditing(true); // Vào chế độ chỉnh sửa ngay
        }
        // Nếu xem CV người khác mà chưa có → giữ null (profile chưa tạo)
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const token = localStorage.getItem("minda_token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/avatar`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const newUrl = data.url || data.avatar_url;
        setProfile((p: any) => ({ ...p, avatar_url: newUrl }));
        setEditForm((f: any) => ({ ...f, avatar_url: newUrl }));
      } else {
        alert("Lỗi khi tải ảnh lên");
      }
    } catch {
      alert("Không thể kết nối máy chủ");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };


  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("minda_token");
      
      const payload = {
        cv_title: editForm.cv_title,
        cv_competencies: JSON.stringify(editForm.cv_competencies),
        cv_soft_skills: JSON.stringify(editForm.cv_soft_skills),
        cv_languages: JSON.stringify(editForm.cv_languages),
        cv_formats: JSON.stringify(editForm.cv_formats),
        cv_education: JSON.stringify(editForm.cv_education),
        cv_teaching_experience: JSON.stringify(editForm.cv_teaching_experience),
        cv_programming_experience: JSON.stringify(editForm.cv_programming_experience),
        cv_additional_info: JSON.stringify(editForm.cv_additional_info),
        phone: editForm.phone,
        email: editForm.email,
        social_linkedin: editForm.social_linkedin,
        social_facebook: editForm.social_facebook,
        social_website: editForm.social_website,
        cv_theme_color: editForm.cv_theme_color,
        cv_layout: editForm.cv_layout,
        cv_custom_sections: JSON.stringify(editForm.cv_custom_sections),
        full_name: editForm.full_name,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/teachers/cv`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setProfile(JSON.parse(JSON.stringify(editForm)));
        if (editForm.full_name) {
          localStorage.setItem("minda_user_name", editForm.full_name);
          window.dispatchEvent(new Event("storage"));
        }
        setIsEditing(false);
      } else {
        alert("Lỗi khi lưu CV");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối");
    } finally {
      setIsSaving(false);
    }
  };

  const updateArrayField = (field: string, index: number, value: string) => {
    const newArr = [...editForm[field]];
    newArr[index] = value;
    setEditForm({ ...editForm, [field]: newArr });
  };
  
  const addArrayItem = (field: string, template: any = "") => {
    setEditForm({ ...editForm, [field]: [...editForm[field], template] });
  };
  
  const removeArrayItem = (field: string, index: number) => {
    const newArr = [...editForm[field]];
    newArr.splice(index, 1);
    setEditForm({ ...editForm, [field]: newArr });
  };
  
  // Custom complex array updates
  const updateExperienceItem = (field: string, index: number, subField: string, value: string) => {
    const newArr = [...editForm[field]];
    newArr[index] = { ...newArr[index], [subField]: value };
    setEditForm({ ...editForm, [field]: newArr });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>;
  if (!profile) return <div className="min-h-screen p-10 bg-gray-100 text-center"><h1 className="text-2xl font-bold text-gray-800">Không tìm thấy hồ sơ</h1></div>;

  const activeLayout = profile ? (isEditing ? editForm.cv_layout : profile.cv_layout) : "modern";
  const activeColor = profile ? (isEditing ? editForm.cv_theme_color : profile.cv_theme_color) : "#1a365d";

  return (
    <div className={`min-h-screen bg-transparent font-sans selection:bg-[#1a365d]/20 text-[#2d3748] py-10 px-4 md:px-10 ${activeLayout === 'futuristic' ? '!text-white' : ''}`}>
      
      {/* Fixed Header Toolbar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
         {enableGoBack ? (
           <button onClick={() => router.back()} className="flex items-center gap-2 w-full md:w-auto text-[#1a365d] hover:text-[#2d5a9e] font-bold transition-colors">
              <ChevronLeft className="w-5 h-5"/> Trở về
           </button>
         ) : <div className="hidden md:block" />}
         
         {isOwner && (
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
               {isEditing ? (
                  <>
                     <button onClick={() => { setEditForm(JSON.parse(JSON.stringify(profile))); setIsEditing(false); }} className="px-5 py-2.5 rounded-full text-gray-600 bg-white hover:bg-gray-100 font-bold border border-gray-200 transition-all flex items-center gap-2 shadow-sm">
                        <X className="w-4 h-4" /> Hủy
                     </button>
                     <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 rounded-full text-white bg-green-600 hover:bg-green-700 font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Lưu CV
                     </button>
                  </>
               ) : (
                  <>
                    {!isGoogleConnected && (
                       <button onClick={handleConnectGoogle} className="px-5 py-2.5 rounded-full text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:scale-105 font-bold shadow-sm transition-all flex items-center gap-2 text-sm animate-pulse">
                          <Cloud className="w-4 h-4" /> Liên kết GD<span className="hidden md:inline">rive</span>
                       </button>
                    )}
                    <button onClick={() => { setEditFullName(profile.full_name); setEditPhone(profile.phone); setIsEditingBasicProfile(true); }} className="px-5 py-2.5 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg transition-all flex items-center gap-2 text-sm">
                       <Edit3 className="w-4 h-4" /> Cài đặt tài khoản
                    </button>
                    <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 rounded-full text-white bg-[#1a365d] hover:bg-[#2d5a9e] font-bold shadow-lg transition-all flex items-center gap-2 text-sm">
                       <Edit3 className="w-4 h-4" /> Chỉnh sửa nền CV
                    </button>
                  </>
               )}
            </div>
         )}
      </div>

      {isEditing && (
         <div className="max-w-6xl mx-auto mb-6 bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
               <span className="font-bold text-sm text-gray-700">Màu chủ đạo:</span>
               {["#1a365d", "#0F52BA", "#2E8B57", "#8B0000", "#4B0082", "#E36414", "#202020"].map(c => (
                  <button key={c} onClick={() => setEditForm({...editForm, cv_theme_color: c})} className={`w-8 h-8 rounded-full border-2 ${editForm.cv_theme_color === c ? "border-blue-500 scale-110 shadow-md" : "border-transparent"}`} style={{backgroundColor: c}}></button>
               ))}
               <input type="color" className="w-8 h-8 rounded shrink-0 cursor-pointer" value={editForm.cv_theme_color || "#1a365d"} onChange={e => setEditForm({...editForm, cv_theme_color: e.target.value})} />
            </div>
            
            <div className="flex items-center gap-3">
               <span className="font-bold text-sm text-gray-700">Layout (Bố cục):</span>
               <select className="border border-gray-300 rounded p-1.5 text-sm outline-none bg-gray-50 font-medium text-black" value={editForm.cv_layout || "modern"} onChange={e => setEditForm({...editForm, cv_layout: e.target.value})}>
                  <option value="modern">Modern (2 cột chia đôi)</option>
                  <option value="classic">Classic (1 cột rộng rãi)</option>
                  <option value="futuristic">Futuristic (Sci-fi Neon)</option>
               </select>
            </div>
         </div>
      )}

      {/* CV Sheet (Webflow Canvas) */}
      <div data-layout={activeLayout} style={{'--theme-color': activeColor} as any} className={`max-w-6xl mx-auto bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col ${
          activeLayout === "classic" ? "md:flex-col" : "md:flex-row"
      } border border-gray-100 min-h-[1000px] transition-all relative`}>
        {activeLayout === "futuristic" && (
           <style>{`
             [data-layout="futuristic"] {
               background-color: #0b0f19 !important;
               background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px) !important;
               background-size: 40px 40px !important;
               border-color: rgba(255,255,255,0.1) !important;
               box-shadow: 0 0 20px rgba(0,0,0,0.5) !important;
               color: #fff !important;
             }
             [data-layout="futuristic"] .bg-white { background: transparent !important; }
             [data-layout="futuristic"] .left-sidebar { 
               background: rgba(5, 7, 10, 0.85) !important; 
               border-right: 1px solid rgba(255,255,255,0.1) !important;
             }
             [data-layout="futuristic"] .right-main {
               background: rgba(15, 20, 30, 0.85) !important;
             }
             [data-layout="futuristic"] h1, [data-layout="futuristic"] h2, [data-layout="futuristic"] h3 {
               color: #fff !important;
               text-shadow: 0 0 8px var(--theme-color);
               letter-spacing: 2px;
             }
             [data-layout="futuristic"] .text-gray-700, [data-layout="futuristic"] .text-[#2d3748], [data-layout="futuristic"] .text-gray-600, [data-layout="futuristic"] .text-gray-500 {
               color: #cbd5e0 !important;
             }
             [data-layout="futuristic"] .border-gray-200, [data-layout="futuristic"] .border-\\[\\#cbd5e0\\] {
               border-color: rgba(255,255,255,0.1) !important;
             }
             [data-layout="futuristic"] .bg-gray-50 { background: rgba(255,255,255,0.03) !important; }
             [data-layout="futuristic"] input, [data-layout="futuristic"] textarea, [data-layout="futuristic"] .text-[#1a365d] {
               color: #fff !important;
            }
             [data-layout="futuristic"] input, [data-layout="futuristic"] textarea {
               background: rgba(0,0,0,0.5) !important;
               border-color: rgba(255,255,255,0.2) !important;
             }
             [data-layout="futuristic"] .avatar-glow {
               box-shadow: 0 0 15px var(--theme-color), inset 0 0 10px var(--theme-color) !important;
               border-color: var(--theme-color) !important;
             }
             [data-layout="futuristic"] .timeline-dot {
               box-shadow: 0 0 8px var(--theme-color) !important;
               border-color: var(--theme-color) !important;
               background-color: #000 !important;
             }
             [data-layout="futuristic"] .border-l-2 {
               border-color: rgba(255,255,255,0.1) !important;
               box-shadow: -1px 0 5px var(--theme-color);
             }
           `}</style>
        )}
        
        {/* ================= LEFT SIDEBAR ================= */}
        <div className={`w-full ${activeLayout === "classic" ? "md:w-full" : "md:w-[35%]"} left-sidebar text-white py-12 px-6 md:p-10 flex flex-col items-center transition-colors border-b-8 md:border-b-0 border-[#f1f5f9]`} style={activeLayout === 'futuristic' ? {} : { backgroundColor: activeColor }}>
           
           <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 mb-10 shadow-2xl shrink-0 bg-white/5 relative group avatar-glow">
              <img src={profile.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt="Avatar" className="w-full h-full object-cover" />
              {isEditing && (
                 <>
                   <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                   <div
                     className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={() => avatarInputRef.current?.click()}
                   >
                     {isUploadingAvatar
                       ? <Loader2 className="w-8 h-8 text-white animate-spin" />
                       : <><span className="text-2xl mb-1">📷</span><span className="text-xs font-bold text-white text-center px-3">Đổi ảnh đại diện</span></>
                     }
                   </div>
                 </>
              )}
           </div>


           <div className="w-full flex justify-start flex-col gap-10">
              
              {/* LIÊN HỆ */}
              <div className={activeLayout === "classic" ? "w-full text-center flex flex-col items-center" : "w-full"}>
                 <h2 className="text-xl font-bold tracking-widest uppercase mb-4 pb-2 border-b-2 border-white/20 inline-block w-full">Liên hệ</h2>
                 <ul className="space-y-4 font-light text-sm">
                    <li className="flex items-center gap-3">
                       <Phone className="w-4 h-4 fill-current opacity-80" />
                       {isEditing ? <input className="bg-transparent border-b border-white/30 text-white w-full outline-none" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="SĐT" /> : <span>{profile.phone || "Chưa cập nhật"}</span>}
                    </li>
                    <li className="flex items-center gap-3">
                       <Mail className="w-4 h-4 opacity-80" />
                       {isEditing ? <input className="bg-transparent border-b border-white/30 text-white w-full outline-none" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" /> : <span>{profile.email || "Chưa cập nhật"}</span>}
                    </li>
                    <li className="flex items-center gap-3">
                       <Globe className="w-4 h-4 opacity-80" />
                       {isEditing ? <input className="bg-transparent border-b border-white/30 text-white w-full outline-none" value={editForm.social_website || ""} onChange={e => setEditForm({...editForm, social_website: e.target.value})} placeholder="Website" /> : <span>{profile.social_website || "Mngoc.io.vn"}</span>}
                    </li>
                    <li className="flex items-center gap-3">
                       <Link2 className="w-4 h-4 opacity-80" />
                       {isEditing ? <input className="bg-transparent border-b border-white/30 text-white w-full outline-none" value={editForm.social_facebook || ""} onChange={e => setEditForm({...editForm, social_facebook: e.target.value})} placeholder="Facebook" /> : <span>{profile.social_facebook || "Facebook/Minh Ngoc"}</span>}
                    </li>
                    <li className="flex items-center gap-3 break-all">
                       <LinkIcon className="w-4 h-4 opacity-80 shrink-0" />
                       {isEditing ? <input className="bg-transparent border-b border-white/30 text-white w-full outline-none" value={editForm.social_linkedin || ""} onChange={e => setEditForm({...editForm, social_linkedin: e.target.value})} placeholder="LinkedIn" /> : <span>{profile.social_linkedin || "linkedin.com/in/"}</span>}
                    </li>
                 </ul>
              </div>

              {/* NĂNG LỰC */}
              <div>
                 <h2 className="text-xl font-bold tracking-widest uppercase mb-4 pb-2 border-b-2 border-white/20">Năng Lực</h2>
                 <ul className="list-disc pl-4 space-y-3 font-light text-[0.9rem] leading-relaxed marker:text-white/50">
                    {(isEditing ? editForm.cv_competencies : profile.cv_competencies).map((item: string, i: number) => (
                       <li key={i} className="relative group">
                          {isEditing ? (
                             <div className="flex gap-2">
                               <textarea className="bg-black/20 rounded p-2 text-white w-full outline-none resize-none h-16 text-xs" value={item} onChange={e => updateArrayField("cv_competencies", i, e.target.value)} />
                               <button onClick={() => removeArrayItem("cv_competencies", i)} className="text-red-400 p-1 hover:bg-black/20 rounded"><Trash2 className="w-4 h-4"/></button>
                             </div>
                          ) : (
                             <span dangerouslySetInnerHTML={{__html: item.replace(/^(.*?):/g, "<b>$1:</b>")}}></span>
                          )}
                       </li>
                    ))}
                    {isEditing && <button onClick={() => addArrayItem("cv_competencies", "Kỹ năng mới: Mô tả chi tiết")} className="text-xs font-bold text-[#cba3ff] flex items-center gap-1 mt-2 hover:bg-white/10 p-1.5 rounded"><Plus className="w-3 h-3"/> Thêm năng lực</button>}
                 </ul>
              </div>

              {/* KĨ NĂNG MỀM */}
              <div>
                 <h2 className="text-xl font-bold tracking-widest uppercase mb-4 pb-2 border-b-2 border-white/20">Kĩ Năng Mềm</h2>
                 <ul className="list-disc pl-4 space-y-2 font-light text-[0.9rem] marker:text-white/50">
                    {(isEditing ? editForm.cv_soft_skills : profile.cv_soft_skills).map((item: string, i: number) => (
                       <li key={i}>
                          {isEditing ? (
                             <div className="flex gap-2 items-center">
                               <input className="bg-black/20 rounded px-2 w-full outline-none text-sm h-8" value={item} onChange={e => updateArrayField("cv_soft_skills", i, e.target.value)} />
                               <button onClick={() => removeArrayItem("cv_soft_skills", i)} className="text-red-400 p-1"><X className="w-4 h-4"/></button>
                             </div>
                          ) : (
                             <span>{item}</span>
                          )}
                       </li>
                    ))}
                    {isEditing && <button onClick={() => addArrayItem("cv_soft_skills")} className="text-xs font-bold text-[#cba3ff] flex items-center gap-1 mt-2"><Plus className="w-3 h-3"/> Thêm kĩ năng</button>}
                 </ul>
              </div>

              {/* NGOẠI NGỮ */}
              <div>
                 <h2 className="text-xl font-bold tracking-widest uppercase mb-4 pb-2 border-b-2 border-white/20">Ngoại Ngữ</h2>
                 <ul className="list-disc pl-4 space-y-2 font-light text-[0.9rem] marker:text-white/50">
                    {(isEditing ? editForm.cv_languages : profile.cv_languages).map((item: string, i: number) => (
                       <li key={i}>
                          {isEditing ? (
                             <div className="flex gap-2 items-center">
                               <input className="bg-black/20 rounded px-2 w-full outline-none text-sm h-8" value={item} onChange={e => updateArrayField("cv_languages", i, e.target.value)} />
                               <button onClick={() => removeArrayItem("cv_languages", i)} className="text-red-400 p-1"><X className="w-4 h-4"/></button>
                             </div>
                          ) : (
                             <span>{item}</span>
                          )}
                       </li>
                    ))}
                    {isEditing && <button onClick={() => addArrayItem("cv_languages")} className="text-xs font-bold text-[#cba3ff] flex items-center gap-1 mt-2"><Plus className="w-3 h-3"/> Thêm ngoại ngữ</button>}
                 </ul>
              </div>

              {/* HÌNH THỨC */}
              <div>
                 <h2 className="text-xl font-bold tracking-widest uppercase mb-4 pb-2 border-b-2 border-white/20">Hình Thức</h2>
                 <ul className="list-disc pl-4 space-y-2 font-light text-[0.9rem] marker:text-white/50">
                    {(isEditing ? editForm.cv_formats : profile.cv_formats).map((item: string, i: number) => (
                       <li key={i}>
                          {isEditing ? (
                             <div className="flex gap-2 items-center">
                               <input className="bg-black/20 rounded px-2 w-full outline-none text-sm h-8" value={item} onChange={e => updateArrayField("cv_formats", i, e.target.value)} />
                               <button onClick={() => removeArrayItem("cv_formats", i)} className="text-red-400 p-1"><X className="w-4 h-4"/></button>
                             </div>
                          ) : (
                             <span>{item}</span>
                          )}
                       </li>
                    ))}
                    {isEditing && <button onClick={() => addArrayItem("cv_formats")} className="text-xs font-bold text-[#cba3ff] flex items-center gap-1 mt-2"><Plus className="w-3 h-3"/> Thêm hình thức</button>}
                 </ul>
              </div>

           </div>
        </div>


        {/* ================= RIGHT MAIN BODY (White) ================= */}
        <div className={`w-full ${activeLayout === "classic" ? "md:w-full" : "md:w-[65%]"} py-12 px-5 md:p-14 bg-white right-main flex flex-col gap-10`}>
           
           {/* TITLE HEADER */}
           <div>
              <h1 className="text-4xl md:text-5xl font-black text-[#5a5a5a] tracking-tight uppercase leading-none mb-3">
                 {isEditing ? (
                   <input className="bg-transparent border-b border-gray-300 w-full outline-none focus:border-blue-500 text-[#5a5a5a]" value={editForm.full_name || ""} onChange={e => setEditForm({...editForm, full_name: e.target.value})} placeholder="Họ và Tên" />
                 ) : profile.full_name}
              </h1>
              {isEditing ? (
                 <input className="text-xl md:text-2xl font-medium tracking-widest uppercase text-gray-500 w-full border-b border-gray-300 pb-1 outline-none focus:border-blue-500" value={editForm.cv_title} onChange={e => setEditForm({...editForm, cv_title: e.target.value})} placeholder="Chuyên môn (GIA SƯ TOÁN - TIN)" />
              ) : (
                 <h3 className="text-xl md:text-2xl font-medium tracking-widest text-[#7a7a7a] uppercase border-b-2 inline-block pb-1 pr-6" style={{ borderColor: profile.cv_theme_color }}>{profile.cv_title}</h3>
              )}
           </div>

            {/* HỌC VẤN */}
            <div className="mt-4">
               <h2 className="text-2xl font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#cbd5e0] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[3px]" style={{ color: isEditing ? editForm.cv_theme_color : profile.cv_theme_color, '--tw-after-bg': isEditing ? editForm.cv_theme_color : profile.cv_theme_color } as any}>
                  Học Vấn
                  <style>{`h2::after { background-color: var(--tw-after-bg) !important; }`}</style>
               </h2>
               <div className="flex flex-col gap-4">
                 {(isEditing ? editForm.cv_education : profile.cv_education).map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 items-start relative pb-4">
                       <div className="mt-1 w-12 h-12 rounded border border-gray-200 shadow-sm shrink-0 flex items-center justify-center bg-white overflow-hidden">
                          {item.icon ? <img src={item.icon} alt="icon"/> : <BookOpen className="w-6 h-6 text-[#1a365d]"/>}
                       </div>
                       <div className="flex-1">
                          {isEditing ? (
                             <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <input className="font-bold text-lg text-[#1a365d] uppercase tracking-wide w-full bg-transparent border-b border-gray-300 mb-2 outline-none" value={item.school || ""} onChange={e => updateExperienceItem("cv_education", i, "school", e.target.value)} placeholder="Tên trường (ĐẠI HỌC SƯ PHẠM...)" />
                                <div className="space-y-2 mt-2">
                                   <input className="text-sm text-gray-600 w-full border border-gray-200 rounded p-1 bg-white outline-none" value={item.major1 || ""} onChange={e => updateExperienceItem("cv_education", i, "major1", e.target.value)} placeholder="Ngành học 1" />
                                   <input className="text-sm text-gray-600 w-full border border-gray-200 rounded p-1 bg-white outline-none" value={item.major2 || ""} onChange={e => updateExperienceItem("cv_education", i, "major2", e.target.value)} placeholder="Ngành học 2" />
                                </div>
                                <button onClick={() => removeArrayItem("cv_education", i)} className="text-xs text-red-500 font-bold mt-3">Xóa trường này</button>
                             </div>
                          ) : (
                             <>
                                <h3 className="font-bold text-base text-[#2d4a7c] uppercase tracking-wide mb-1">{item.school}</h3>
                                <ul className="list-disc pl-5 text-gray-600 text-sm leading-relaxed space-y-1">
                                   {item.major1 && <li>{item.major1}</li>}
                                   {item.major2 && <li>{item.major2}</li>}
                                </ul>
                             </>
                          )}
                       </div>
                    </div>
                 ))}
                 {isEditing && <button onClick={() => addArrayItem("cv_education", {school: "TÊN TRƯỜNG ĐẠI HỌC", major1: "Ngành học 1", major2: "Ngành học 2", icon: ""})} className="h-12 border-2 border-dashed border-[#1a365d] text-[#1a365d] rounded-xl flex items-center justify-center font-bold hover:bg-[#1a365d]/5 transition-colors"><Plus className="w-5 h-5 mr-2"/> Thêm Trường đại học</button>}
              </div>
           </div>

           {/* KINH NGHIỆM DẠY HỌC (TIMELINE CHUẨN) */}
           <div>
              <h2 className="text-2xl font-bold tracking-widest uppercase mb-6 pb-2 border-b border-[#cbd5e0] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[3px]" style={{ color: activeColor, '--tw-after-bg': activeColor } as any}>
                  Kinh Nghiệm Dạy Học
                  <style>{`h2::after { background-color: var(--tw-after-bg) !important; }`}</style>
              </h2>
              
              <div className="relative border-l-2 ml-3 pb-4" style={{ borderColor: activeColor }}>
                 {(isEditing ? editForm.cv_teaching_experience : profile.cv_teaching_experience).map((exp: any, i: number) => (
                    <div key={i} className="mb-10 ml-6 relative group">
                       <span className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm box-content timeline-dot" style={{ backgroundColor: activeColor }}></span>
                       
                       {isEditing ? (
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                             <input className="font-bold text-lg bg-transparent border-b border-gray-300 mb-2 w-32 outline-none" style={{ color: activeColor }} value={exp.year || ""} onChange={e => updateExperienceItem("cv_teaching_experience", i, "year", e.target.value)} placeholder="Năm (VD: 2024)" />
                             <textarea className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded p-2 outline-none min-h-[100px] focus:border-blue-400" value={exp.tasks || ""} onChange={e => updateExperienceItem("cv_teaching_experience", i, "tasks", e.target.value)} placeholder="Mỗi ý một gạch đầu dòng dòng (- Ý 1\n- Ý 2...)" />
                             <button onClick={() => removeArrayItem("cv_teaching_experience", i)} className="text-xs text-red-500 font-bold mt-2">Xóa mục này</button>
                          </div>
                       ) : (
                          <>
                             <h3 className="font-bold text-lg text-[#1a365d] mb-2">{exp.year}</h3>
                             <div className="text-[0.95rem] text-gray-700 font-normal leading-relaxed whitespace-pre-line pl-2 -indent-2">
                                {/* Auto format bullets if they typed lines */}
                                {exp.tasks?.split('\n').map((line:string, idx:number) => (
                                   line.trim() ? <div key={idx} className="flex items-start gap-2 mb-1">
                                      <span className="text-[#3b5a8c] mt-1 text-xs font-black">•</span>
                                      <span>{line.replace(/^-/,'').trim()}</span>
                                   </div> : null
                                ))}
                             </div>
                          </>
                       )}
                    </div>
                 ))}
              </div>
              {isEditing && <button onClick={() => addArrayItem("cv_teaching_experience", {year: "202x", tasks: "Mô tả công việc"})} className="mt-2 h-12 w-full border-2 border-dashed border-[#1a365d] text-[#1a365d] rounded-xl flex items-center justify-center font-bold hover:bg-[#1a365d]/5 transition-colors"><Plus className="w-5 h-5 mr-2"/> Thêm giai đoạn kinh nghiệm</button>}
           </div>

           {/* KINH NGHIỆM LẬP TRÌNH */}
           <div>
              <h2 className="text-2xl font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#cbd5e0] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[3px]" style={{ color: activeColor, '--tw-after-bg': activeColor } as any}>
                  Kinh Nghiệm Lập Trình
              </h2>
              <ul className="list-disc pl-5 space-y-3 text-[0.95rem] text-gray-700 leading-relaxed marker:opacity-60" style={{ '--tw-marker-color': profile.cv_theme_color } as any}>
                 <style>{`ul { marker-color: var(--tw-marker-color); }`}</style>
                 {(isEditing ? editForm.cv_programming_experience : profile.cv_programming_experience).map((item: string, i: number) => (
                    <li key={i}>
                       {isEditing ? (
                          <div className="flex gap-2 mb-2">
                            <textarea className="flex-1 border border-gray-300 rounded p-2 text-sm min-h-[60px]" value={item} onChange={e => updateArrayField("cv_programming_experience", i, e.target.value)} />
                            <button onClick={() => removeArrayItem("cv_programming_experience", i)} className="text-red-500 hover:bg-red-50 p-2 rounded h-fit"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       ) : (
                          <span dangerouslySetInnerHTML={{__html: item}}></span>
                       )}
                    </li>
                 ))}
                 {isEditing && <button onClick={() => addArrayItem("cv_programming_experience")} className="text-sm font-bold flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg opacity-80 transition hover:opacity-100" style={{ color: activeColor }}><Plus className="w-4 h-4"/> Thêm mục lục</button>}
              </ul>
           </div>

           {/* THÔNG TIN THÊM (THÀNH TÍCH) */}
           <div>
              <h2 className="text-2xl font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#cbd5e0] relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[3px]" style={{ color: activeColor, '--tw-after-bg': activeColor } as any}>
                  Thông Tin Thêm
              </h2>
              <ul className="list-disc pl-5 space-y-3 text-[0.95rem] text-gray-700 leading-relaxed marker:opacity-60">
                 {(isEditing ? editForm.cv_additional_info : profile.cv_additional_info).map((item: string, i: number) => (
                    <li key={i}>
                       {isEditing ? (
                          <div className="flex gap-2 mb-2">
                            <textarea className="flex-1 border border-gray-300 rounded p-2 text-sm min-h-[60px]" value={item} onChange={e => updateArrayField("cv_additional_info", i, e.target.value)} />
                            <button onClick={() => removeArrayItem("cv_additional_info", i)} className="text-red-500 hover:bg-red-50 p-2 rounded h-fit"><Trash2 className="w-4 h-4"/></button>
                          </div>
                       ) : (
                          <span dangerouslySetInnerHTML={{__html: item}}></span>
                       )}
                    </li>
                 ))}
                 {isEditing && <button onClick={() => addArrayItem("cv_additional_info")} className="text-sm font-bold flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg opacity-80 hover:opacity-100" style={{ color: activeColor }}><Plus className="w-4 h-4"/> Thêm thông tin</button>}
              </ul>
           </div>

           {/* ===== CUSTOM SECTIONS DYNAMIC RENDER ===== */}
           {(isEditing ? editForm.cv_custom_sections : profile.cv_custom_sections).map((section: any, sIdx: number) => (
              <div key={section.id || sIdx} className="relative group">
                 {isEditing && (
                    <button onClick={() => removeArrayItem("cv_custom_sections", sIdx)} className="absolute -left-10 top-2 p-2 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition shadow hover:bg-red-200 z-10" title="Xóa nguyên mục">
                       <Trash2 className="w-4 h-4" />
                    </button>
                 )}
                 <h2 className="text-2xl font-bold tracking-widest uppercase mb-4 pb-2 border-b border-[#cbd5e0] relative flex items-center gap-2 after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[3px]" style={{ color: activeColor, '--tw-after-bg': activeColor } as any}>
                     {isEditing ? <input className="bg-transparent border-b border-gray-300 outline-none w-64" value={section.title} onChange={e => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].title = e.target.value; setEditForm({...editForm, cv_custom_sections: nm}); }} placeholder="Tên mục (Ví dụ: Dự án)" /> : section.title}
                 </h2>

                 {/* Timeline Layout */}
                 {section.type === "timeline" && (
                    <div className="relative border-l-2 ml-3 pb-4" style={{ borderColor: activeColor }}>
                       {section.items.map((item: any, i: number) => (
                          <div key={i} className="mb-8 ml-6 relative">
                             <span className="absolute -left-[33px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm box-content timeline-dot" style={{ backgroundColor: activeColor }}></span>
                             {isEditing ? (
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                   <input className="font-bold bg-transparent border-b border-gray-300 outline-none w-1/2 mb-2" style={{ color: activeColor }} value={item.title || ""} onChange={e => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items[i].title = e.target.value; setEditForm({...editForm, cv_custom_sections: nm}); }} placeholder="Tiêu đề chính (Năm hoặc chức danh)" />
                                   <textarea className="w-full text-sm text-gray-600 bg-white border border-gray-200 rounded p-2 outline-none min-h-[60px]" value={item.desc || ""} onChange={e => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items[i].desc = e.target.value; setEditForm({...editForm, cv_custom_sections: nm}); }} placeholder="Mô tả chi tiết..." />
                                   <button onClick={() => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items.splice(i, 1); setEditForm({...editForm, cv_custom_sections: nm}); }} className="text-xs text-red-500 font-bold mt-2">Xóa mốc này</button>
                                </div>
                             ) : (
                                <>
                                   <h3 className="font-bold text-lg mb-1" style={{ color: activeColor }}>{item.title}</h3>
                                   <div className="text-[0.95rem] text-gray-700 leading-relaxed whitespace-pre-line">{item.desc}</div>
                                </>
                             )}
                          </div>
                       ))}
                       {isEditing && <button onClick={() => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items.push({title: "Mốc mới", desc: "Mô tả..."}); setEditForm({...editForm, cv_custom_sections: nm}); }} className="mt-2 h-10 w-full border-2 border-dashed rounded-xl flex items-center justify-center font-bold transition-colors opacity-60 hover:opacity-100" style={{ borderColor: editForm.cv_theme_color, color: editForm.cv_theme_color }}><Plus className="w-5 h-5 mr-2"/> Thêm phần tử Timeline</button>}
                    </div>
                 )}

                 {/* List Layout */}
                 {section.type === "list" && (
                    <ul className="list-disc pl-5 space-y-3 text-[0.95rem] text-gray-700 leading-relaxed marker:opacity-60">
                       {section.items.map((item: any, i: number) => (
                          <li key={i}>
                             {isEditing ? (
                                <div className="flex gap-2 mb-2">
                                  <textarea className="flex-1 border border-gray-300 rounded p-2 text-sm min-h-[50px]" value={item.desc || ""} onChange={e => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items[i].desc = e.target.value; setEditForm({...editForm, cv_custom_sections: nm}); }} placeholder="Nội dung dòng mới..."/>
                                  <button onClick={() => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items.splice(i, 1); setEditForm({...editForm, cv_custom_sections: nm}); }} className="text-red-500 hover:bg-red-50 p-2 rounded h-fit"><Trash2 className="w-4 h-4"/></button>
                                </div>
                             ) : (
                                <span>{item.desc}</span>
                             )}
                          </li>
                       ))}
                       {isEditing && <button onClick={() => { const nm = [...editForm.cv_custom_sections]; nm[sIdx].items.push({desc: "Mục chữ mới"}); setEditForm({...editForm, cv_custom_sections: nm}); }} className="text-sm font-bold flex items-center gap-1 mt-2 px-3 py-1.5 rounded-lg opacity-80 hover:opacity-100" style={{ color: activeColor }}><Plus className="w-4 h-4"/> Thêm dòng mới</button>}
                    </ul>
                 )}
              </div>
           ))}

           {isEditing && (
              <div className="flex gap-4 border-2 border-dashed border-gray-300 p-6 rounded-xl items-center justify-center bg-gray-50 flex-col mt-4">
                 <p className="text-gray-500 font-medium">Tạo mục CV tuỳ chỉnh mới</p>
                 <div className="flex gap-3">
                    <button onClick={() => addArrayItem("cv_custom_sections", { id: "sec_"+Date.now(), title: "THÀNH TÍCH LIST", type: "list", items: [{desc: "Dòng ví dụ 1"}] })} className="px-4 py-2 border border-gray-300 bg-white rounded shadow-sm hover:border-gray-500 text-sm font-medium flex items-center gap-2 text-gray-700"><Plus className="w-4 h-4"/> Thêm mục Dạng Gạch đầu dòng</button>
                    <button onClick={() => addArrayItem("cv_custom_sections", { id: "sec_"+Date.now(), title: "DANH HIỆU TIMELINE", type: "timeline", items: [{title: "Năm 2024", desc: "Mô tả đạt giải"}] })} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded shadow-sm hover:border-blue-400 text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4"/> Thêm mục Dạng Dòng thời gian</button>
                 </div>
              </div>
           )}

        </div>

      </div>
      
      {/* Edit Basic Profile Info Modal */}
      {isEditingBasicProfile && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">Chỉnh sửa thông tin cơ bản</h3>
              <button onClick={() => setIsEditingBasicProfile(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Họ và Tên</label>
                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 outline-none focus:border-indigo-500" placeholder="Nhập họ và tên..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Số điện thoại</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-lg text-gray-800 outline-none focus:border-indigo-500" placeholder="Nhập số điện thoại..." />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
              <button onClick={() => setIsEditingBasicProfile(false)} className="px-5 py-2 font-semibold text-gray-500 hover:text-gray-700 transition-colors">Hủy</button>
              <button onClick={async () => {
                setSavingBasicProfile(true);
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/auth/me`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("minda_token")}` },
                    body: JSON.stringify({ full_name: editFullName, phone: editPhone })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    localStorage.setItem("minda_user_name", data.full_name);
                    setProfile((p: any) => ({ ...p, full_name: data.full_name, phone: data.phone }));
                    setEditForm((f: any) => ({ ...f, full_name: data.full_name, phone: data.phone }));
                    setIsEditingBasicProfile(false);
                    alert("Cập nhật thông tin thành công!");
                  } else alert("Lỗi khi cập nhật");
                } catch { alert("Lỗi kết nối"); }
                setSavingBasicProfile(false);
              }} disabled={savingBasicProfile} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                {savingBasicProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
