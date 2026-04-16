"use client";

import { BrainCircuit, Video, BarChart3, ArrowRight, Star, Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import IslandHero from "@/components/ui/IslandHero";
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useTheme } from "@/providers/ThemeProvider";

interface TeacherInfo {
  id: number;
  full_name: string;
  avatar_url: string | null;
  email: string;
}

export default function Home() {
  const [userName, setUserName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/contact/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) setContactStatus("success");
      else setContactStatus("error");
    } catch {
      setContactStatus("error");
    }
  };


  useEffect(() => {
    setUserName(localStorage.getItem("minda_user_name"));
    setRole(localStorage.getItem("minda_role"));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile/teachers`)
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((t: TeacherInfo) => t.full_name === "Nguyễn Lê Minh Ngọc");
        setTeachers(filtered);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-t-primary selection:bg-indigo-200 overflow-x-hidden relative scroll-smooth font-outfit">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 backdrop-blur-xl bg-bg-main/90 border-b border-border-card">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="font-black text-xl tracking-tighter text-t-primary">
            MINDA<span className="text-indigo-600">.EDU</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-t-secondary">
            <Link href="#classes" className="hover:text-t-primary transition-colors uppercase tracking-wider text-xs">Các Lớp Học</Link>
            <Link href="#features" className="hover:text-t-primary transition-colors uppercase tracking-wider text-xs">Công nghệ AI</Link>
            {userName ? (
              <div className="flex items-center gap-4 ml-4">
                <span className="text-t-secondary capitalize">Xin chào, <span className="font-bold text-t-primary">{userName}</span></span>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold shadow-lg shadow-indigo-500/20">
                  Vào Lớp Học
                </Link>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 border border-border-card hover:bg-bg-hover rounded-full text-sm font-medium transition-colors text-t-secondary">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <Link href="/login" className="px-5 py-2.5 rounded-full bg-bg-card border border-border-card hover:bg-bg-hover transition-all text-t-primary font-semibold">Đăng nhập</Link>
                <Link href="/register" className="px-5 py-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition-all font-black">XUẤT PHÁT NGAY</Link>
              </div>
            )}
            {/* Desktop Theme Toggle */}
            <button onClick={toggleTheme} className="ml-2 p-2.5 rounded-full border border-border-card hover:bg-bg-hover transition-colors" title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-t-secondary" />}
            </button>
          </div>

          {/* Mobile Hamburger + Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full border border-border-card hover:bg-bg-hover transition-colors text-t-primary">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="text-t-primary p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-bg-main/98 backdrop-blur-xl border-t border-border-card px-6 py-6 flex flex-col gap-4">
            <Link href="#classes" onClick={() => setMobileMenuOpen(false)} className="text-t-primary font-bold uppercase tracking-wider text-sm py-2 border-b border-border-card">Các Lớp Học</Link>
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-t-primary font-bold uppercase tracking-wider text-sm py-2 border-b border-border-card">Công nghệ AI</Link>
            {userName ? (
              <>
                <span className="text-t-secondary text-sm">Xin chào, <span className="font-bold text-t-primary">{userName}</span></span>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center transition-all">
                  Vào Lớp Học
                </Link>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 border border-border-card rounded-xl text-sm font-medium text-t-secondary">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-bg-card border border-border-card text-center font-bold text-t-primary">Đăng nhập</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-indigo-600 text-white text-center font-black">XUẤT PHÁT NGAY</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* 3D Island Hero — vẫn giữ full-screen dark */}
      <IslandHero />

      {/* Transition gradient: dark island → light beige */}
      <div className="h-32 w-full bg-gradient-to-b from-[#cba3ff] to-bg-main"></div>

      {/* Classes Section */}
      <section id="classes" className="py-20 relative z-10 bg-bg-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
               <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase text-t-primary">Khám phá Lớp học</h2>
               <p className="text-t-secondary text-lg max-w-2xl font-light">Những khóa học được thiết kế đặc biệt kết hợp cùng Phòng Lab 3D tương tác. Học thuộc bài ngay trên lớp nhờ AI nhắc nhở.</p>
            </div>
            <Link href="/register" className="shrink-0 h-12 px-6 rounded-full border border-indigo-400 text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 transition-colors font-bold bg-bg-card shadow-sm">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className='flex flex-wrap my-10 gap-16 justify-center max-w-6xl mx-auto'>
            {/* Lớp 1 */}
            <div className='lg:w-[320px] w-full'>
              <div className='block-container w-16 h-16'>
                <div className='btn-back rounded-xl btn-back-blue' />
                <div className='btn-front flex justify-center items-center'>
                  <Star className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
              <div className='mt-7 flex flex-col'>
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>Toán Hình Không Gian Lớp 11</h4>
                <p className='mt-3 text-t-secondary font-medium leading-relaxed text-sm'>Phá đảo tư duy không gian với xưởng vẽ 3D WebGL. Bạn sẽ không bao giờ nhìn nhầm nét đứt nét liền nữa!</p>
                <div className='mt-5 flex items-center gap-2'>
                  <Link href='/register' className='font-bold text-indigo-600 flex items-center gap-2 hover:text-indigo-500'>
                    Bắt đầu học <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Lớp 2 */}
            <div className='lg:w-[320px] w-full'>
              <div className='block-container w-16 h-16'>
                <div className='btn-back rounded-xl btn-back-red' />
                <div className='btn-front flex justify-center items-center'>
                  <BrainCircuit className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className='mt-7 flex flex-col'>
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>Đại Số Biến Hình Lớp 12 & Luyện Thi</h4>
                <p className='mt-3 text-t-secondary font-medium leading-relaxed text-sm'>Cày nát các dạng đề Đại số. Hệ thống AI RAPT-CLIP tự động phân tích lỗ hổng kiến thức qua các biểu cảm khi làm bài khó.</p>
                <div className='mt-5 flex items-center gap-2'>
                  <Link href='/register' className='font-bold text-red-600 flex items-center gap-2 hover:text-red-500'>
                    Bắt đầu học <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Lớp 3 */}
             <div className='lg:w-[320px] w-full'>
              <div className='block-container w-16 h-16'>
                <div className='btn-back rounded-xl btn-back-green' />
                <div className='btn-front flex justify-center items-center'>
                  <Video className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className='mt-7 flex flex-col'>
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>Giải Tích AI Chuyên Đề Cao Cấp</h4>
                <p className='mt-3 text-t-secondary font-medium leading-relaxed text-sm'>Không dành cho số đông. Tương tác đa chiều độ trễ 0ms qua WebRTC với thầy giáo để gỡ rối các bài tích phân hóc búa.</p>
                <div className='mt-5 flex items-center gap-2'>
                  <Link href='/register' className='font-bold text-emerald-600 flex items-center gap-2 hover:text-emerald-500'>
                    Chọn Môn Này <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Core Tech */}
      <section id="features" className="py-24 relative z-10 bg-bg-card border-t border-border-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase text-t-primary">Công nghệ Cốt Lõi</h2>
            <p className="text-t-secondary text-lg font-light">MINDA được thiết kế với chuẩn kiến trúc Module độc lập của Thung lũng Silicon.</p>
          </div>
          
          <VerticalTimeline lineColor="rgba(26, 20, 16, 0.12)">
            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--t-primary)', border: '1px solid var(--border-card)', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Nền tảng Giao tiếp"
              iconStyle={{ background: '#4f46e5', color: '#fff', boxShadow: '0 0 0 4px rgba(99,102,241,0.15)' }}
              icon={<Video />}
            >
              <h3 className="text-2xl font-black text-indigo-600">Live Streaming WebRTC</h3>
              <h4 className="text-sm text-t-secondary font-bold my-2 uppercase tracking-wide">Kiến trúc Peer-to-Peer</h4>
              <p className="text-t-secondary font-medium text-sm !leading-relaxed">
                Đường truyền nén tốc độ cao độ trễ 0ms. Kết nối video và audio hai chiều mượt mà để giáo viên luôn theo sát cử chỉ học sinh từ xa như đang ở trên lớp.
              </p>
            </VerticalTimelineElement>

            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--t-primary)', border: '1px solid var(--border-card)', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(168,85,247,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Lõi Trí tuệ Nhân tạo"
              iconStyle={{ background: '#a855f7', color: '#fff', boxShadow: '0 0 0 4px rgba(168,85,247,0.15)' }}
              icon={<BrainCircuit />}
            >
              <h3 className="text-2xl font-black text-purple-600">AI RAPT-CLIP Scanner</h3>
              <h4 className="text-sm text-t-secondary font-bold my-2 uppercase tracking-wide">Mô hình PyTorch / Máy chủ FastAPI</h4>
              <p className="text-t-secondary font-medium text-sm !leading-relaxed">
                Mô hình SOTA độc quyền tự động xé nhỏ các dòng video thành từng Khung hình (Frame), đẩy ngầm qua máy chủ Backend phân tích nhãn quan và biểu cảm để chấm điểm tập trung theo thời gian thực.
              </p>
            </VerticalTimelineElement>

            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: 'var(--bg-card)', color: 'var(--t-primary)', border: '1px solid var(--border-card)', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(236,72,153,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Hệ thống Khích lệ"
              iconStyle={{ background: '#ec4899', color: '#fff', boxShadow: '0 0 0 4px rgba(236,72,153,0.15)' }}
              icon={<BarChart3 />}
            >
              <h3 className="text-2xl font-black text-pink-600">Ranking Vũ Trụ</h3>
              <h4 className="text-sm text-t-secondary font-bold my-2 uppercase tracking-wide">Gamification Engine</h4>
              <p className="text-t-secondary font-medium text-sm !leading-relaxed">
                Hệ thống đánh giá đa chiều. Học sinh không chỉ lấy điểm bài thi mà còn tích lũy EXP thái độ học (từ Cảm biến AI) để ganh đua lên cấp độ Thách Đấu với các bạn cùng lớp.
              </p>
            </VerticalTimelineElement>
            
            <VerticalTimelineElement
              iconStyle={{ background: '#10b981', color: '#fff', boxShadow: '0 0 0 4px rgba(16,185,129,0.15)' }}
              icon={<Star />}
            />
          </VerticalTimeline>
        </div>
      </section>
      
      {/* Teacher Showcase */}
      <section id="teachers" className="py-24 relative z-10 border-t border-border-card bg-bg-main">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase text-indigo-600">Đội ngũ MINDA</h2>
            <p className="text-t-secondary text-lg font-light max-w-2xl mx-auto">Giáo viên, nhà phát triển và tester — những người xây dựng MINDA mỗi ngày.</p>
          </div>

          {/* Tất cả thành viên — 1 hàng */}
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">

            {/* Giáo viên từ API */}
            {teachers.map(t => (
              <div key={t.id} className="w-[200px] bg-bg-card rounded-3xl border border-border-card hover:border-indigo-300 p-5 flex flex-col items-center group transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-md">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-border-card group-hover:border-indigo-400 transition-colors">
                  <img src={t.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt={t.full_name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-sm font-bold text-t-primary text-center mb-1 leading-tight">{t.full_name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-200 uppercase tracking-wider mb-4">
                  👩‍🏫 Giáo viên
                </span>
                <Link href={`/teachers/${t.id}`} className="mt-auto text-xs px-4 py-2 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-center flex items-center justify-center gap-1 transition-all">
                  Xem CV <ArrowRight className="w-3 h-3"/>
                </Link>
              </div>
            ))}

            {/* Nguyễn Lê Minh Ngọc — Developer + Giáo viên */}
            <div className="w-[200px] bg-bg-card rounded-3xl border border-indigo-500/25 hover:border-indigo-400/60 p-5 flex flex-col items-center group transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-indigo-500/10">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-indigo-500/30 group-hover:border-indigo-400 transition-colors">
                <img src="https://res.cloudinary.com/dxgel6jfo/image/upload/v1775743103/MINDA_Storage/avatar/admin_1/46645a31_ava.jpg" alt="Nguyễn Lê Minh Ngọc" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-bold text-t-primary text-center mb-2 leading-tight">Nguyễn Lê Minh Ngọc</h3>
              <div className="flex flex-col gap-1 items-center mb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-wider">
                  👩‍🏫 Giáo viên
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/25 uppercase tracking-wider">
                  💻 Developer
                </span>
              </div>
              <Link href="/teachers/1" className="mt-auto text-xs px-4 py-2 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-center flex items-center justify-center gap-1 transition-all">
                Xem CV <ArrowRight className="w-3 h-3"/>
              </Link>
            </div>

            {/* Phạm Trần Đăng Khoa — Tester */}
            <div className="w-[200px] bg-bg-card rounded-3xl border border-cyan-500/25 hover:border-cyan-400/60 p-5 flex flex-col items-center group transition-all hover:translate-y-[-4px] shadow-sm hover:shadow-cyan-500/10">
              <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
                <img src="https://ui-avatars.com/api/?name=Ph%E1%BA%A1m+Tr%E1%BA%A7n+%C4%90%C4%83ng+Khoa&background=06b6d4&color=fff&size=200" alt="Phạm Trần Đăng Khoa" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-sm font-bold text-t-primary text-center mb-1 leading-tight">Phạm Trần Đăng Khoa</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase tracking-wider">
                🧪 Tester
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-24 relative z-10 bg-bg-main">
        <div className="max-w-3xl mx-auto px-6">
          <div className="bg-bg-card rounded-3xl p-8 md:p-12 border border-border-card shadow-sm">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-black mb-3 tracking-tight text-t-primary uppercase">Liên hệ với MINDA</h2>
              <p className="text-t-secondary">Bạn có thắc mắc về khóa học? Hãy gửi tin nhắn cho chúng tôi.</p>
            </div>

            {contactStatus === "success" ? (
              <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center border border-emerald-200">
                <p className="font-bold text-lg mb-2">🎉 Gửi thành công!</p>
                <p>Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>
                <button onClick={() => {setContactStatus("idle"); setContactForm({name:"",email:"",message:""});}} className="mt-4 text-emerald-600 font-medium underline">
                  Gửi thêm tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Họ và Tên</label>
                    <input 
                      required type="text"
                      className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary"
                      value={contactForm.name} onChange={e=>setContactForm({...contactForm, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Email của bạn</label>
                    <input 
                      required type="email"
                      className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary"
                      value={contactForm.email} onChange={e=>setContactForm({...contactForm, email: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-t-secondary mb-2">Nội dung thắc mắc</label>
                  <textarea 
                    required rows={4}
                    className="w-full bg-bg-main border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary resize-none"
                    value={contactForm.message} onChange={e=>setContactForm({...contactForm, message: e.target.value})}
                  />
                </div>
                {contactStatus === "error" && <p className="text-red-500 text-sm font-medium">Có lỗi xảy ra, vui lòng thử lại sau.</p>}
                <button 
                  type="submit" disabled={contactStatus === "loading"}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {contactStatus === "loading" ? "Đang gửi..." : "Gửi tin nhắn"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-border-card bg-bg-card text-center relative">
        <span className="font-black text-2xl tracking-tighter block mb-2 text-text-primary/30">MINDA<span className="text-indigo-500">.EDU</span></span>
        <p className="text-text-secondary text-sm font-medium">
          &copy; {new Date().getFullYear()} MINDA — Nguyễn Lê Minh Ngọc.
        </p>
        <p className="text-text-muted text-xs mt-1">
          Mô hình 3D Island bởi{" "}
          <a href="https://github.com/basedhound/3d-island_portfolio_react" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-semibold">
            basedhound
          </a>
          {" "}— được sử dụng và tích hợp vào MINDA.
        </p>
        {/* Version Badge */}
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider">V0.8.1</span>
        </div>
      </footer>
    </div>
  );
}
