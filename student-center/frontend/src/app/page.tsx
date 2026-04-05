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

  useEffect(() => {
    setUserName(localStorage.getItem("minda_user_name"));
    setRole(localStorage.getItem("minda_role"));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile/teachers`)
      .then(res => res.json())
      .then(data => setTeachers(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#1A1410] selection:bg-indigo-200 overflow-x-hidden relative scroll-smooth font-outfit">
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 backdrop-blur-xl bg-[#F7F3EE]/90 border-b border-[#E2D9CE]">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="font-black text-xl tracking-tighter text-[#1A1410]">
            MINDA<span className="text-indigo-600">.EDU</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#5C4F42]">
            <Link href="#classes" className="hover:text-[#1A1410] transition-colors uppercase tracking-wider text-xs">Các Lớp Học</Link>
            <Link href="#features" className="hover:text-[#1A1410] transition-colors uppercase tracking-wider text-xs">Công nghệ AI</Link>
            {userName ? (
              <div className="flex items-center gap-4 ml-4">
                <span className="text-[#5C4F42] capitalize">Xin chào, <span className="font-bold text-[#1A1410]">{userName}</span></span>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold shadow-lg shadow-indigo-500/20">
                  Vào Lớp Học
                </Link>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 border border-[#E2D9CE] hover:bg-[#EEE9E1] rounded-full text-sm font-medium transition-colors text-[#5C4F42]">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 ml-4">
                <Link href="/login" className="px-5 py-2.5 rounded-full bg-white border border-[#E2D9CE] hover:bg-[#EEE9E1] transition-all text-[#1A1410] font-semibold">Đăng nhập</Link>
                <Link href="/register" className="px-5 py-2.5 rounded-full bg-[#1A1410] text-white hover:bg-[#2D2620] transition-all font-black">XUẤT PHÁT NGAY</Link>
              </div>
            )}
            {/* Desktop Theme Toggle */}
            <button onClick={toggleTheme} className="ml-2 p-2.5 rounded-full border border-[#E2D9CE] hover:bg-[#EEE9E1] transition-colors" title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}>
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-[#5C4F42]" />}
            </button>
          </div>

          {/* Mobile Hamburger + Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-full border border-[#E2D9CE] hover:bg-[#EEE9E1] transition-colors text-[#1A1410]">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
            </button>
            <button className="text-[#1A1410] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F7F3EE]/98 backdrop-blur-xl border-t border-[#E2D9CE] px-6 py-6 flex flex-col gap-4">
            <Link href="#classes" onClick={() => setMobileMenuOpen(false)} className="text-[#1A1410] font-bold uppercase tracking-wider text-sm py-2 border-b border-[#E2D9CE]">Các Lớp Học</Link>
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[#1A1410] font-bold uppercase tracking-wider text-sm py-2 border-b border-[#E2D9CE]">Công nghệ AI</Link>
            {userName ? (
              <>
                <span className="text-[#5C4F42] text-sm">Xin chào, <span className="font-bold text-[#1A1410]">{userName}</span></span>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-center transition-all">
                  Vào Lớp Học
                </Link>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-3 border border-[#E2D9CE] rounded-xl text-sm font-medium text-[#5C4F42]">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-white border border-[#E2D9CE] text-center font-bold text-[#1A1410]">Đăng nhập</Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-[#1A1410] text-white text-center font-black">XUẤT PHÁT NGAY</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* 3D Island Hero — vẫn giữ full-screen dark */}
      <IslandHero />

      {/* Transition gradient: dark island → light beige */}
      <div className="h-32 w-full bg-gradient-to-b from-[#cba3ff] to-[#F7F3EE]"></div>

      {/* Classes Section */}
      <section id="classes" className="py-20 relative z-10 bg-[#F7F3EE]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
               <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight uppercase text-[#1A1410]">Khám phá Lớp học</h2>
               <p className="text-[#5C4F42] text-lg max-w-2xl font-light">Những khóa học được thiết kế đặc biệt kết hợp cùng Phòng Lab 3D tương tác. Học thuộc bài ngay trên lớp nhờ AI nhắc nhở.</p>
            </div>
            <Link href="/register" className="shrink-0 h-12 px-6 rounded-full border border-indigo-400 text-indigo-600 flex items-center gap-2 hover:bg-indigo-50 transition-colors font-bold bg-white shadow-sm">
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
                <h4 className='text-3xl font-black tracking-tight text-[#1A1410]'>Toán Hình Không Gian Lớp 11</h4>
                <p className='mt-3 text-[#5C4F42] font-medium leading-relaxed text-sm'>Phá đảo tư duy không gian với xưởng vẽ 3D WebGL. Bạn sẽ không bao giờ nhìn nhầm nét đứt nét liền nữa!</p>
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
                <h4 className='text-3xl font-black tracking-tight text-[#1A1410]'>Đại Số Biến Hình Lớp 12 & Luyện Thi</h4>
                <p className='mt-3 text-[#5C4F42] font-medium leading-relaxed text-sm'>Cày nát các dạng đề Đại số. Hệ thống AI RAPT-CLIP tự động phân tích lỗ hổng kiến thức qua các biểu cảm khi làm bài khó.</p>
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
                <h4 className='text-3xl font-black tracking-tight text-[#1A1410]'>Giải Tích AI Chuyên Đề Cao Cấp</h4>
                <p className='mt-3 text-[#5C4F42] font-medium leading-relaxed text-sm'>Không dành cho số đông. Tương tác đa chiều độ trễ 0ms qua WebRTC với thầy giáo để gỡ rối các bài tích phân hóc búa.</p>
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
      <section id="features" className="py-24 relative z-10 bg-white border-t border-[#E2D9CE]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase text-[#1A1410]">Công nghệ Cốt Lõi</h2>
            <p className="text-[#5C4F42] text-lg font-light">MINDA được thiết kế với chuẩn kiến trúc Module độc lập của Thung lũng Silicon.</p>
          </div>
          
          <VerticalTimeline lineColor="rgba(26, 20, 16, 0.12)">
            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: '#FFFFFF', color: '#1A1410', border: '1px solid #E2D9CE', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Nền tảng Giao tiếp"
              iconStyle={{ background: '#4f46e5', color: '#fff', boxShadow: '0 0 0 4px rgba(99,102,241,0.15)' }}
              icon={<Video />}
            >
              <h3 className="text-2xl font-black text-indigo-600">Live Streaming WebRTC</h3>
              <h4 className="text-sm text-[#5C4F42] font-bold my-2 uppercase tracking-wide">Kiến trúc Peer-to-Peer</h4>
              <p className="text-[#5C4F42] font-medium text-sm !leading-relaxed">
                Đường truyền nén tốc độ cao độ trễ 0ms. Kết nối video và audio hai chiều mượt mà để giáo viên luôn theo sát cử chỉ học sinh từ xa như đang ở trên lớp.
              </p>
            </VerticalTimelineElement>

            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: '#FFFFFF', color: '#1A1410', border: '1px solid #E2D9CE', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(168,85,247,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Lõi Trí tuệ Nhân tạo"
              iconStyle={{ background: '#a855f7', color: '#fff', boxShadow: '0 0 0 4px rgba(168,85,247,0.15)' }}
              icon={<BrainCircuit />}
            >
              <h3 className="text-2xl font-black text-purple-600">AI RAPT-CLIP Scanner</h3>
              <h4 className="text-sm text-[#5C4F42] font-bold my-2 uppercase tracking-wide">Mô hình PyTorch / Máy chủ FastAPI</h4>
              <p className="text-[#5C4F42] font-medium text-sm !leading-relaxed">
                Mô hình SOTA độc quyền tự động xé nhỏ các dòng video thành từng Khung hình (Frame), đẩy ngầm qua máy chủ Backend phân tích nhãn quan và biểu cảm để chấm điểm tập trung theo thời gian thực.
              </p>
            </VerticalTimelineElement>

            <VerticalTimelineElement
              className="vertical-timeline-element--work"
              contentStyle={{ background: '#FFFFFF', color: '#1A1410', border: '1px solid #E2D9CE', borderRadius: '1.5rem', boxShadow: '0 4px 24px rgba(236,72,153,0.08)' }}
              contentArrowStyle={{ borderRight: '7px solid #FFFFFF' }}
              date="Hệ thống Khích lệ"
              iconStyle={{ background: '#ec4899', color: '#fff', boxShadow: '0 0 0 4px rgba(236,72,153,0.15)' }}
              icon={<BarChart3 />}
            >
              <h3 className="text-2xl font-black text-pink-600">Ranking Vũ Trụ</h3>
              <h4 className="text-sm text-[#5C4F42] font-bold my-2 uppercase tracking-wide">Gamification Engine</h4>
              <p className="text-[#5C4F42] font-medium text-sm !leading-relaxed">
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
      <section id="teachers" className="py-24 relative z-10 border-t border-[#E2D9CE] bg-[#F7F3EE]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase text-indigo-600">Đội ngũ Giáo viên</h2>
            <p className="text-[#5C4F42] text-lg font-light max-w-2xl mx-auto">MINDA hiện đang hợp tác với {teachers.length} giáo viên xuất sắc từ các trường Đại học trọng điểm và Chuyên trên toàn quốc.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {teachers.map(t => (
                <div key={t.id} className="bg-white rounded-3xl border border-[#E2D9CE] hover:border-indigo-300 p-6 flex flex-col items-center group transition-all hover:translate-y-[-5px] shadow-sm hover:shadow-md">
                   <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-2 border-[#E2D9CE] group-hover:border-indigo-400 transition-colors">
                      <img src={t.avatar_url || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} alt={t.full_name} className="w-full h-full object-cover" />
                   </div>
                   <h3 className="text-xl font-bold text-[#1A1410] text-center mb-1">{t.full_name}</h3>
                   <span className="text-xs text-[#5C4F42] uppercase tracking-widest font-bold mb-6">Giáo viên MINDA</span>
                   
                   <Link href={`/teachers/${t.id}`} className="mt-auto px-6 py-2.5 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all font-bold text-center flex items-center justify-center gap-2">
                      Xem Học Vấn & CV <ArrowRight className="w-4 h-4"/>
                   </Link>
                </div>
             ))}
             {teachers.length === 0 && (
                <div className="col-span-full text-center text-[#5C4F42] italic">Hệ thống đang cập nhật danh sách giáo viên...</div>
             )}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t border-[#E2D9CE] bg-white text-center relative">
        <span className="font-black text-2xl tracking-tighter block mb-2 text-[#1A1410]/30">MINDA<span className="text-indigo-500">.EDU</span></span>
        <p className="text-[#5C4F42] text-sm font-medium">&copy; {new Date().getFullYear()} MINDA — Nguyễn Lê Minh Ngọc. Mô hình 3D Island do tác giả thiết kế.</p>
        {/* Version Badge */}
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-indigo-600 tracking-wider">V0.5.0</span>
        </div>
      </footer>
    </div>
  );
}
