"use client";

import { useEffect, useState, useRef } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, MoreHorizontal, Plus, PenTool, Image as ImageIcon, Video, Briefcase, GraduationCap, MapPin, Heart, Clock, Send, Trash2, Edit2, X, PlusCircle, Loader2 } from "lucide-react";
import TeacherCVView from "@/components/profile/TeacherCVView";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api`;

type ProfileInfo = {
  id: string;
  text: string;
  icon: string;
  roleTarget?: string;
};

type SocialPost = {
  id: string;
  author: string;
  avatar: string | null;
  time: string;
  content: string;
  postImage?: string | null;
  likes: number;
  comments: number;
};

type FeaturedImage = {
  id: number;
  url: string;
};

const AVAILABLE_ICONS = [
  { name: 'Briefcase', component: Briefcase },
  { name: 'GraduationCap', component: GraduationCap },
  { name: 'MapPin', component: MapPin },
  { name: 'Heart', component: Heart },
  { name: 'Clock', component: Clock },
];

function getToken() { return localStorage.getItem("minda_token") || ""; }

async function apiUpload(endpoint: string, file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch(`${API_BASE}/profile/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Upload thất bại");
      return null;
    }
    const data = await res.json();
    return data.url || data.file?.url || null;
  } catch {
    alert("Lỗi kết nối máy chủ khi upload");
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("Học Viên");
  const [role, setRole] = useState<string>("student");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(false);
  
  const [coverPhoto, setCoverPhoto] = useState<string>("https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop");
  const [avatarPhoto, setAvatarPhoto] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  
  // Post States
  const [newPostContent, setNewPostContent] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile Info States
  const [profileInfos, setProfileInfos] = useState<ProfileInfo[]>([]);
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [isAddingInfo, setIsAddingInfo] = useState(false);
  const [newInfoText, setNewInfoText] = useState("");
  const [newInfoIcon, setNewInfoIcon] = useState("Briefcase");

  // Sidebar Featured Photos (API)
  const [featuredPhotos, setFeaturedPhotos] = useState<FeaturedImage[]>([]);

  // Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);
  const sidebarPhotoRef = useRef<HTMLInputElement>(null);

  async function fetchFeaturedImages() {
    try {
      const res = await fetch(`${API_BASE}/profile/featured`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeaturedPhotos(data);
      }
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const savedName = localStorage.getItem("minda_user_name") || "Học Viên";
    const currentRole = localStorage.getItem("minda_role") || "student";
    setUserName(savedName);
    setRole(currentRole);
    if (currentRole === "teacher") {
      setTeacherId(localStorage.getItem("minda_user_id"));
    }

    // Dừng fetch dữ liệu facebook nếu là teacher
    if (currentRole === "teacher") {
       // Chúng ta vẫn cho phép checkGoogleStatus chạy để lấy user_id nếu thiếu
    }

    // Fetch user status to check Google Drive connected status
    const checkGoogleStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${getToken()}`} });
        if (res.ok) {
           const data = await res.json();
           setIsGoogleConnected(data.is_google_connected);
           if (data.avatar_url) setAvatarPhoto(data.avatar_url);
           if (data.cover_url) setCoverPhoto(data.cover_url);
           if (data.id) {
             localStorage.setItem("minda_user_id", data.id);
             if (currentRole === "teacher") setTeacherId(data.id);
           }
           if (data.full_name) {
             setUserName(data.full_name);
             setEditFullName(data.full_name);
             localStorage.setItem("minda_user_name", data.full_name);
           }
           if (data.phone) setEditPhone(data.phone);
        }
      } catch (e) {}
    };
    checkGoogleStatus();

    // Fallback load images from lightweight localStorage URLs (NOT base64!)
    const savedAvatar = localStorage.getItem("minda_avatar_url");
    if (savedAvatar) setAvatarPhoto(savedAvatar);
    const savedCover = localStorage.getItem("minda_cover_url");
    if (savedCover) setCoverPhoto(savedCover);

    if (currentRole === "teacher") return; // Dừng fetch fb-like sau khi gọi checkGoogleStatus

    // Load posts from localStorage (text only, lightweight)
    const savedPosts = localStorage.getItem("minda_profile_posts");
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      setPosts([{
        id: "post-1", author: savedName, avatar: savedAvatar || null,
        time: "Vừa xong", content: "Chào mọi người, đây là không gian học tập mới của mình trên MINDA! 🚀✨",
        likes: 12, comments: 3
      }]);
    }

    // Load profile infos
    const savedInfos = localStorage.getItem("minda_profile_infos");
    if (savedInfos) {
      setProfileInfos(JSON.parse(savedInfos));
    } else {
      setProfileInfos([
        { id: 'info-1', roleTarget: 'teacher', text: "Giảng viên tại **MINDA EduCenter**", icon: "Briefcase" },
        { id: 'info-1s', roleTarget: 'student', text: "Sinh viên tại **MINDA EduCenter**", icon: "Briefcase" },
        { id: 'info-2', text: "Tham gia các khoá học nền tảng & nâng cao", icon: "GraduationCap" },
        { id: 'info-3', text: "Trở thành thành viên từ hôm nay", icon: "Clock" }
      ]);
    }

    // Fetch featured images from API
    fetchFeaturedImages();
  }, [router]);

  /* ─── Google OAuth Flow ─── */
  const handleConnectGoogle = async () => {
      try {
         const res = await fetch(`${API_BASE}/auth/google/connect`, { 
             headers: { Authorization: `Bearer ${getToken()}` }
         });
         const data = await res.json();
         if (data.authorization_url) window.location.href = data.authorization_url;
      } catch {
         alert("Lỗi kết nối OAuth Server!");
      }
  }

  /* ─── Avatar Upload (Drive API) ─── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const url = await apiUpload("avatar", file);
    if (url) {
      setAvatarPhoto(url);
      localStorage.setItem("minda_avatar_url", url);
    }
    setUploadingAvatar(false);
  };

  /* ─── Cover Upload (Drive API) ─── */
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const url = await apiUpload("cover", file);
    if (url) {
      setCoverPhoto(url);
      localStorage.setItem("minda_cover_url", url);
    }
    setUploadingCover(false);
  };

  /* ─── Featured Photo Upload (Drive API, max 10) ─── */
  const handleFeaturedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (featuredPhotos.length >= 10) {
      alert("Đã đạt giới hạn 10 ảnh nổi bật. Vui lòng xoá bớt để thêm mới.");
      return;
    }
    setUploadingFeatured(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/profile/featured`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFeaturedPhotos(prev => [{ id: data.file.id, url: data.file.url }, ...prev]);
      } else {
        const err = await res.json();
        alert(err.detail || "Upload thất bại");
      }
    } catch { alert("Lỗi kết nối máy chủ"); }
    setUploadingFeatured(false);
  };

  const removeFeaturedPhoto = async (fileId: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá ảnh này?")) return;
    try {
      const res = await fetch(`${API_BASE}/profile/featured/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) setFeaturedPhotos(prev => prev.filter(p => p.id !== fileId));
    } catch { alert("Lỗi khi xoá ảnh"); }
  };

  /* ─── Post Image (local display only, no storage) ─── */
  const handlePostImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ─── Profile Info Handlers ─── */
  const handleSaveInfo = () => {
    if (!newInfoText.trim()) return;
    let updated;
    if (editingInfoId) {
      updated = profileInfos.map(info => info.id === editingInfoId ? { ...info, text: newInfoText, icon: newInfoIcon } : info);
    } else {
      updated = [...profileInfos, { id: `info-${Date.now()}`, text: newInfoText, icon: newInfoIcon }];
    }
    setProfileInfos(updated);
    localStorage.setItem("minda_profile_infos", JSON.stringify(updated));
    setEditingInfoId(null);
    setIsAddingInfo(false);
    setNewInfoText("");
  };

  const handleDeleteInfo = (id: string) => {
    if (window.confirm("Xoá thông tin này khỏi trang cá nhân?")) {
      const updated = profileInfos.filter(i => i.id !== id);
      setProfileInfos(updated);
      localStorage.setItem("minda_profile_infos", JSON.stringify(updated));
    }
  };

  const cancelEditInfo = () => { setEditingInfoId(null); setIsAddingInfo(false); setNewInfoText(""); };
  const startEditInfo = (info: ProfileInfo) => { setIsAddingInfo(false); setEditingInfoId(info.id); setNewInfoText(info.text); setNewInfoIcon(info.icon); };
  const startAddInfo = () => { setEditingInfoId(null); setIsAddingInfo(true); setNewInfoText(""); setNewInfoIcon("Briefcase"); };

  /* ─── Post Handlers ─── */
  const handlePostSubmit = () => {
    if (!newPostContent.trim() && !attachedImage) return;
    const newPost: SocialPost = { id: `post-${Date.now()}`, author: userName, avatar: avatarPhoto, time: "Vừa xong", content: newPostContent, postImage: attachedImage, likes: 0, comments: 0 };
    const updated = [newPost, ...posts];
    setPosts(updated);
    setNewPostContent("");
    setAttachedImage(null);
    // Save posts without postImage base64 to avoid quota
    const safePosts = updated.map(p => ({ ...p, postImage: null }));
    localStorage.setItem("minda_profile_posts", JSON.stringify(safePosts));
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá bài viết này?")) {
       const updated = posts.filter(p => p.id !== id);
       setPosts(updated);
       localStorage.setItem("minda_profile_posts", JSON.stringify(updated));
       setActiveMenuId(null);
    }
  };

  const handleSaveEdit = (id: string) => {
    const updated = posts.map(p => p.id === id ? { ...p, content: editContent } : p);
    setPosts(updated);
    setEditingPostId(null);
    localStorage.setItem("minda_profile_posts", JSON.stringify(updated));
  };

  const renderIcon = (iconName: string, className: string = "w-5 h-5 shrink-0") => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const TargetIcon = found ? found.component : Briefcase;
    return <TargetIcon className={className} />;
  };

  const renderAvatar = (imageUrl: string | null, name: string, sizeClasses: string, textClasses: string, roundedClass: string = "rounded-full") => {
    if (imageUrl) return <img src={imageUrl} alt={name} className={`object-cover w-full h-full ${roundedClass}`} />;
    return <span className={`font-bold text-white ${textClasses}`}>{name.charAt(0).toUpperCase()}</span>;
  };

  const getFilteredInfos = () => profileInfos.filter(i => !i.roleTarget || i.roleTarget === role);

  if (role === "teacher") {
    // Render the webflow CV directly in dashboard instead of Facebook-like social layout
    const id = teacherId || localStorage.getItem("minda_user_id");
    if (!id) return <div className="min-h-screen flex items-center justify-center bg-bg-main"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
    return <TeacherCVView teacherId={id} enableGoBack={false} />;
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary font-sans pb-20 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="sticky top-0 z-40 w-full h-14 bg-bg-card border-b border-border-card flex items-center px-4 shadow-sm">
         <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-full bg-bg-hover hover:bg-bg-hover transition-colors group z-50">
           <ArrowLeft className="w-5 h-5 text-text-primary" />
         </Link>
         <div className="ml-4 font-bold text-text-primary text-lg">MINDA Social</div>
      </div>

      <div className="max-w-[1095px] mx-auto w-full relative z-10">
        <div className="bg-bg-card shadow-sm rounded-b-xl">
          {/* Cover Photo */}
          <div className="w-full h-[350px] relative rounded-b-xl overflow-hidden group bg-linear-to-br from-indigo-900 to-purple-900">
             <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
             <input type="file" accept="image/*" className="hidden" ref={coverInputRef} onChange={handleCoverUpload} />
             <button onClick={() => isGoogleConnected ? coverInputRef.current?.click() : alert("Vui lòng Liên kết Google Drive trước!")} disabled={!isGoogleConnected || uploadingCover} className="absolute bottom-4 right-4 bg-white text-black px-3 py-1.5 rounded-md flex items-center gap-2 font-bold text-sm hover:bg-gray-200 transition-colors z-20 shadow-lg disabled:opacity-50">
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploadingCover ? "Đang tải..." : "Chỉnh sửa ảnh bìa"}
             </button>
          </div>

          {/* Profile Header Info */}
          <div className="px-8 pb-4 relative">
             <div className="flex flex-col md:flex-row gap-4 items-center md:items-end -mt-10 md:-mt-8 mb-4">
               {/* Avatar */}
               <div className="relative z-20 group">
                 <div className="w-[168px] h-[168px] rounded-full border-4 border-bg-card bg-bg-hover overflow-hidden flex items-center justify-center">
                    {uploadingAvatar ? <Loader2 className="w-10 h-10 animate-spin text-white" /> : renderAvatar(avatarPhoto, userName, "w-[168px] h-[168px]", "text-6xl")}
                 </div>
                 <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={handleAvatarUpload} />
                 <button onClick={() => isGoogleConnected ? avatarInputRef.current?.click() : alert("Vui lòng Liên kết Google Drive trước!")} disabled={!isGoogleConnected || uploadingAvatar} className="absolute bottom-2 right-2 w-9 h-9 bg-bg-hover hover:bg-bg-hover rounded-full flex items-center justify-center border border-bg-card transition-colors shadow-lg z-30 disabled:opacity-50">
                    <Camera className="w-5 h-5 text-text-primary" />
                 </button>
               </div>

               {/* Name & Stats */}
               <div className="flex-1 mt-4 md:mt-0 text-center md:text-left mb-2 md:mb-4">
                 <h1 className="text-3xl font-bold text-text-primary">{userName}</h1>
                 <p className="text-text-secondary font-medium hover:underline cursor-pointer">340 người bạn chung</p>
                 <div className="flex -space-x-2 mt-2 justify-center md:justify-start">
                    {[1,2,3,4,5,6].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card bg-bg-hover overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                 </div>
               </div>

               {/* Actions */}
               <div className="flex gap-2 mb-2 md:mb-6">
                 <button className="bg-[#2374E1] hover:bg-[#3982E4] text-white px-3 py-1.5 rounded-md flex items-center gap-2 font-semibold text-sm transition-colors">
                    <Plus className="w-4 h-4" /> Thêm vào tin
                 </button>
                 <button onClick={() => setIsEditingProfile(true)} className="bg-bg-hover hover:bg-bg-hover text-text-primary px-3 py-1.5 rounded-md flex items-center gap-2 font-semibold text-sm transition-colors">
                    <PenTool className="w-4 h-4" /> Chỉnh sửa trang cá nhân
                 </button>
               </div>
             </div>

             <div className="w-full h-px bg-bg-hover mb-1" />

             {!isGoogleConnected && (
                <div className="my-4 bg-linear-to-r from-blue-900 to-indigo-900 p-4 rounded-xl flex items-center justify-between border border-blue-500/30 shadow-lg animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                       <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-6 h-6 drop-shadow-md" alt="Drive" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white drop-shadow-sm">Liên kết Đám mây Google Drive</h3>
                      <p className="text-[14px] text-gray-300 max-w-xl">Hệ thống MINDA phi tập trung lưu trữ. Dữ liệu học tập và hình ảnh của bạn sẽ được lưu trực tiếp vào Drive cá nhân để mở khóa tính năng thay Avatar không giới hạn.</p>
                    </div>
                  </div>
                  <button onClick={handleConnectGoogle} className="bg-white text-blue-700 px-5 py-2.5 font-bold rounded-lg whitespace-nowrap hover:bg-gray-100 transition-colors shadow-xl ring-2 ring-white/50 active:scale-95">
                     Liên Kết Drive Ngay
                  </button>
                </div>
             )}

             {/* Tabs */}
             <div className="flex items-center justify-between overflow-x-auto no-scrollbar">
                <div className="flex items-center font-semibold text-text-secondary text-[15px] min-w-max">
                  <button className="px-4 py-4 text-[#2374E1] border-b-4 border-[#2374E1] whitespace-nowrap">Bài viết</button>
                  <button className="px-4 py-4 hover:bg-bg-hover rounded-lg transition-colors whitespace-nowrap">Giới thiệu</button>
                  <button className="px-4 py-4 hover:bg-bg-hover rounded-lg transition-colors whitespace-nowrap">Ảnh</button>
                </div>
             </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-4 mt-4 w-full px-4 lg:px-0 relative z-10">
           
           {/* Left Sidebar */}
           <div className="flex flex-col gap-4">
              {/* Giới thiệu Module */}
              <div className="bg-bg-card rounded-xl p-4 shadow-sm">
                <h2 className="font-bold text-xl text-text-primary mb-4">Giới thiệu</h2>
                
                <div className="flex flex-col gap-3 text-[15px] text-text-primary">
                   {getFilteredInfos().map((info) => (
                      <div key={info.id} className="group relative">
                         {editingInfoId === info.id ? (
                           <div className="flex flex-col gap-2 p-2 bg-bg-hover rounded-md border border-border-card">
                             <div className="flex gap-2 mb-2">{AVAILABLE_ICONS.map(i => (
                               <button key={i.name} onClick={() => setNewInfoIcon(i.name)} className={`p-1.5 rounded-md ${newInfoIcon === i.name ? 'bg-[#2374E1]' : 'hover:bg-bg-hover'}`}><i.component className="w-4 h-4 text-white" /></button>
                             ))}</div>
                             <input value={newInfoText} onChange={(e) => setNewInfoText(e.target.value)} className="w-full bg-transparent outline-none flex-1 placeholder-[#B0B3B8] text-sm" placeholder="Thêm mô tả..." autoFocus />
                             <div className="flex justify-end gap-2 mt-1">
                               <button onClick={cancelEditInfo} className="px-2 py-1 text-sm bg-gray-600 rounded">Huỷ</button>
                               <button onClick={handleSaveInfo} className="px-2 py-1 text-sm bg-[#2374E1] rounded">Lưu</button>
                             </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-3 pr-10">
                             <div className="text-[#8C939D]">{renderIcon(info.icon)}</div>
                             <span dangerouslySetInnerHTML={{__html: info.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></span>
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                <button onClick={() => startEditInfo(info)} className="p-1.5 hover:bg-bg-hover rounded-full text-text-secondary"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteInfo(info.id)} className="p-1.5 hover:bg-bg-hover rounded-full text-red-400"><Trash2 className="w-4 h-4" /></button>
                             </div>
                           </div>
                         )}
                      </div>
                   ))}

                   {isAddingInfo && (
                     <div className="flex flex-col gap-2 p-2 bg-bg-hover rounded-md border border-border-card mt-2">
                       <div className="flex gap-2 mb-2">{AVAILABLE_ICONS.map(i => (
                         <button key={i.name} onClick={() => setNewInfoIcon(i.name)} className={`p-1.5 rounded-md ${newInfoIcon === i.name ? 'bg-[#2374E1]' : 'hover:bg-bg-hover'}`}><i.component className="w-4 h-4 text-white" /></button>
                       ))}</div>
                       <input value={newInfoText} onChange={(e) => setNewInfoText(e.target.value)} className="w-full bg-transparent outline-none flex-1 placeholder-[#B0B3B8] text-sm" placeholder="Mô tả thông tin mới..." autoFocus />
                       <div className="flex justify-end gap-2 mt-1">
                         <button onClick={cancelEditInfo} className="px-2 py-1 text-sm bg-gray-600 rounded">Huỷ</button>
                         <button onClick={handleSaveInfo} className="px-2 py-1 text-sm bg-[#2374E1] rounded">Lưu</button>
                       </div>
                     </div>
                   )}
                </div>

                {!isAddingInfo && (
                  <button onClick={startAddInfo} className="w-full mt-4 py-2 bg-bg-hover hover:bg-bg-hover rounded-md font-semibold text-sm transition-colors text-text-primary flex justify-center items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Thêm thông tin mới
                  </button>
                )}
              </div>

              {/* Photos Panel — Drive API */}
              <div className="bg-bg-card rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="font-bold text-xl text-text-primary">Ảnh <span className="text-sm font-normal text-text-secondary">({featuredPhotos.length}/10)</span></h2>
                   <input type="file" accept="image/*" className="hidden" ref={sidebarPhotoRef} onChange={handleFeaturedUpload} />
                   <button onClick={() => isGoogleConnected ? sidebarPhotoRef.current?.click() : alert("Vui lòng Liên kết Google Drive trước!")} disabled={!isGoogleConnected || uploadingFeatured || featuredPhotos.length >= 10} className="text-[#2374E1] hover:bg-bg-hover px-2 py-1 rounded-md text-[15px] transition-colors disabled:opacity-50 flex items-center gap-1">
                     {uploadingFeatured ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Thêm ảnh
                   </button>
                </div>
                {featuredPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                     {featuredPhotos.map((photo) => (
                       <div key={photo.id} className="aspect-square bg-bg-hover group cursor-pointer overflow-hidden relative">
                         <img src={photo.url} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                         <button onClick={() => removeFeaturedPhoto(photo.id)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <X className="w-3 h-3 text-white" />
                         </button>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-text-secondary text-sm font-medium border-2 border-dashed border-border-card rounded-lg">
                     Chưa có ảnh nào được tải lên
                  </div>
                )}
              </div>
           </div>

           {/* Right Feed Area */}
           <div className="flex flex-col gap-4">
             {/* Create Post */}
             <div className="bg-bg-card rounded-xl p-4 shadow-sm flex flex-col">
                <div className="flex gap-4 items-start mb-3">
                   <div className="w-10 h-10 rounded-full bg-bg-hover shrink-0 flex items-center justify-center overflow-hidden">
                     {renderAvatar(avatarPhoto, userName, "w-10 h-10", "text-sm")}
                   </div>
                   <div className="flex-1 bg-bg-hover rounded-2xl p-2 relative">
                     <textarea 
                        className="w-full bg-transparent text-text-primary placeholder-[#B0B3B8] text-[15px] resize-none outline-none focus:ring-0 min-h-[60px] p-2"
                        placeholder="Bạn đang nghĩ gì?"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                     />
                     {attachedImage && (
                       <div className="relative mt-2 p-2 border border-border-card rounded-xl group">
                         <img src={attachedImage} className="w-full h-auto max-h-[400px] object-cover rounded-lg" alt="Attachment" />
                         <button onClick={() => setAttachedImage(null)} className="absolute top-4 right-4 bg-black/60 hover:bg-black p-2 rounded-full text-white transition-colors">
                           <X className="w-5 h-5" />
                         </button>
                       </div>
                     )}
                     <div className="flex justify-end p-2 border-t border-border-card mt-2">
                        <button onClick={handlePostSubmit} disabled={!newPostContent.trim() && !attachedImage} className="bg-[#2374E1] hover:bg-[#3982E4] disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md font-semibold text-sm transition-colors flex items-center gap-2">
                          <Send className="w-4 h-4" /> Đăng
                        </button>
                     </div>
                   </div>
                </div>
                <div className="w-full h-px bg-bg-hover my-2" />
                <div className="flex mt-1">
                   <button className="flex-1 flex items-center justify-center gap-2 hover:bg-bg-hover py-2 rounded-lg transition-colors text-[15px] font-semibold text-text-secondary">
                     <Video className="w-6 h-6 text-[#F02849]" /> Video trực tiếp
                   </button>
                   <input type="file" accept="image/*" className="hidden" ref={postImageInputRef} onChange={handlePostImageUpload} />
                   <button onClick={() => postImageInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 hover:bg-bg-hover py-2 rounded-lg transition-colors text-[15px] font-semibold text-text-secondary">
                     <ImageIcon className="w-6 h-6 text-[#45BD62]" /> Ảnh/video
                   </button>
                </div>
             </div>

             {/* Dynamic Feed Posts */}
             {posts.map((post, index) => (
               <div key={post.id} className="bg-bg-card rounded-xl shadow-sm text-text-primary animate-in fade-in relative">
                  <div className="p-4 flex gap-2 items-start">
                     <div className="w-10 h-10 rounded-full bg-bg-hover shrink-0 flex items-center justify-center overflow-hidden">
                       {renderAvatar(post.avatar, post.author, "w-10 h-10", "text-sm")}
                     </div>
                     <div className="flex-1">
                       <h3 className="font-semibold text-[15px] cursor-pointer hover:underline">{post.author}</h3>
                       <p className="text-[13px] text-text-secondary">{post.time} · 🌐</p>
                     </div>
                     <div className="relative">
                        <button onClick={() => setActiveMenuId(activeMenuId === post.id ? null : post.id)} className="w-9 h-9 rounded-full hover:bg-bg-hover flex items-center justify-center transition-colors">
                           <MoreHorizontal className="w-5 h-5 text-text-secondary" />
                        </button>
                        {activeMenuId === post.id && (
                          <div className="absolute right-0 top-10 mt-1 w-48 bg-bg-card border border-border-card rounded-lg shadow-xl z-50 py-2">
                             <button onClick={() => { setEditingPostId(post.id); setEditContent(post.content); setActiveMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-text-primary transition-colors text-sm font-semibold">
                               <Edit2 className="w-4 h-4" /> Chỉnh sửa
                             </button>
                             <button onClick={() => handleDeletePost(post.id)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover text-red-500 transition-colors text-sm font-semibold">
                               <Trash2 className="w-4 h-4" /> Xoá bài viết
                             </button>
                          </div>
                        )}
                     </div>
                  </div>
                  
                  {editingPostId === post.id ? (
                     <div className="px-4 pb-3">
                        <textarea className="w-full bg-bg-hover text-text-primary p-3 rounded-lg resize-none min-h-[80px] outline-none" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
                        <div className="flex justify-end gap-2 mt-2">
                           <button onClick={() => setEditingPostId(null)} className="px-4 py-1.5 rounded-md font-semibold text-sm bg-gray-600 hover:bg-gray-500 transition-colors">Huỷ</button>
                           <button onClick={() => handleSaveEdit(post.id)} className="px-4 py-1.5 rounded-md font-semibold text-sm bg-[#2374E1] hover:bg-[#3982E4] transition-colors">Lưu</button>
                        </div>
                     </div>
                  ) : (
                     <div className="px-4 pb-3 text-[15px] whitespace-pre-wrap">{post.content}</div>
                  )}

                  {post.postImage && !editingPostId && (
                     <div className="w-full bg-bg-main border-y border-border-card mt-2 max-h-[600px] overflow-hidden flex items-center justify-center">
                        <img src={post.postImage} alt="Attachment" className="w-full object-cover max-h-[600px]" />
                     </div>
                  )}
                  
                  {index === posts.length - 1 && post.content.includes("MINDA") && !post.postImage && (
                    <div className="w-full bg-bg-main p-10 flex flex-col items-center justify-center border-y border-border-card">
                       <GraduationCap className="w-12 h-12 text-indigo-500 mb-2" />
                       <p className="font-bold">Hành trình Học tập mới</p>
                       <p className="text-sm text-text-secondary">Powered by MINDA EduCenter</p>
                    </div>
                  )}

                  <div className="p-4 flex items-center justify-between text-text-secondary text-[15px] border-b border-border-card mx-4 px-0">
                     <div className="flex items-center gap-1 group cursor-pointer">
                        <div className="w-5 h-5 rounded-full bg-[#2374E1] flex items-center justify-center fill-white group-hover:scale-110 transition-transform">👍</div>
                        <div className="w-5 h-5 rounded-full bg-[#F52B4D] flex items-center justify-center fill-white group-hover:scale-110 transition-transform -ml-1">❤️</div>
                        <span className="hover:underline ml-1">{post.likes}</span>
                     </div>
                     <span className="hover:underline cursor-pointer">{post.comments} bình luận</span>
                  </div>
                  <div className="flex p-2 px-4 gap-1">
                     <button onClick={() => { const up = [...posts]; up[index].likes += 1; setPosts(up); localStorage.setItem("minda_profile_posts", JSON.stringify(up)); }} className="flex-1 py-1.5 hover:bg-bg-hover rounded-md font-semibold text-text-secondary text-[15px] transition-colors items-center justify-center flex gap-2">
                       👍 Thích
                     </button>
                     <button className="flex-1 py-1.5 hover:bg-bg-hover rounded-md font-semibold text-text-secondary text-[15px] transition-colors items-center justify-center flex gap-2">💬 Bình luận</button>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Edit Basic Profile Info Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-border-card">
            <div className="flex items-center justify-between p-4 border-b border-border-card">
              <h3 className="text-xl font-bold text-text-primary">Chỉnh sửa thông tin</h3>
              <button onClick={() => setIsEditingProfile(false)} className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-1 block">Họ và Tên</label>
                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} className="w-full bg-bg-main border border-border-card px-4 py-2.5 rounded-lg text-text-primary outline-none focus:border-indigo-500" placeholder="Nhập họ và tên..." />
              </div>
              <div>
                <label className="text-sm font-semibold text-text-secondary mb-1 block">Số điện thoại</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-bg-main border border-border-card px-4 py-2.5 rounded-lg text-text-primary outline-none focus:border-indigo-500" placeholder="Nhập số điện thoại..." />
              </div>
            </div>
            <div className="p-4 border-t border-border-card flex justify-end gap-3 bg-bg-main/50">
              <button onClick={() => setIsEditingProfile(false)} className="px-5 py-2 font-semibold text-text-secondary hover:text-text-primary transition-colors">Hủy</button>
              <button onClick={async () => {
                setSavingProfile(true);
                try {
                  const res = await fetch(`${API_BASE}/auth/me`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
                    body: JSON.stringify({ full_name: editFullName, phone: editPhone })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setUserName(data.full_name);
                    localStorage.setItem("minda_user_name", data.full_name);
                    setEditPhone(data.phone || "");
                    setIsEditingProfile(false);
                    alert("Cập nhật thông tin thành công!");
                  } else alert("Lỗi khi cập nhật");
                } catch { alert("Lỗi kết nối"); }
                setSavingProfile(false);
              }} disabled={savingProfile} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
