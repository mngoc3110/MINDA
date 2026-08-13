"use client";

import { BrainCircuit, Video, BarChart3, ArrowRight, Star, Menu, X, Sun, Moon, Award, Sparkles, Trophy, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { VerticalTimeline, VerticalTimelineElement }  from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useTheme } from "@/providers/ThemeProvider";

const IslandHero = dynamic(() => import("@/components/ui/IslandHero"), {
  ssr: false,
  loading: () => (
    <section className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
      <span className="mt-4 text-indigo-400 font-bold uppercase tracking-widest text-xs select-none">Đang khởi tạo môi trường 3D...</span>
    </section>
  ),
});

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
  const [honors, setHonors] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Testimonials State
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    student_name: "",
    avatar_url: "",
    content: "",
    rating: 5
  });
  const [testimonialAvatarFile, setTestimonialAvatarFile] = useState<File | null>(null);
  const [testimonialSubmitStatus, setTestimonialSubmitStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

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

  // Contact Form State
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/contact/submit`, {
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

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestimonialSubmitStatus("loading");
    try {
      let finalAvatarUrl = testimonialForm.avatar_url;

      if (testimonialAvatarFile) {
        const formData = new FormData();
        formData.append("file", testimonialAvatarFile);
        
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/upload-avatar`, {
          method: "POST",
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalAvatarUrl = uploadData.avatar_url;
        } else {
          setTestimonialSubmitStatus("error");
          return;
        }
      }

      const token = localStorage.getItem("minda_token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const payload = { ...testimonialForm, avatar_url: finalAvatarUrl };
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setTestimonialSubmitStatus("success");
        setTimeout(() => {
          setShowTestimonialModal(false);
          setTestimonialSubmitStatus("idle");
          setTestimonialForm({ ...testimonialForm, content: "", rating: 5, avatar_url: "" });
          setTestimonialAvatarFile(null);
        }, 3000);
      } else {
        setTestimonialSubmitStatus("error");
      }
    } catch {
      setTestimonialSubmitStatus("error");
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem("minda_user_name");
    setUserName(savedName);
    if (savedName) {
       setTestimonialForm(prev => ({ ...prev, student_name: savedName }));
    }
    setRole(localStorage.getItem("minda_role"));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/profile/teachers`)
      .then(res => res.json())
      .then(data => {
        // Hiển thị tất cả giáo viên từ API, ngoại trừ trưởng dự án (đã có thẻ hardcode riêng phía dưới)
        const filtered = data.filter((t: TeacherInfo) => 
          t.full_name !== "Nguyễn Lê Minh Ngọc" &&
          t.full_name !== "Admin"
        );
        setTeachers(filtered);
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/honors/public`)
        .then(async res => {
           if (!res.ok) throw new Error("API not ok");
           return res.json();
        })
        .then(data => {
           if (Array.isArray(data) && data.length > 0) {
             setHonors(data);
           } else {
             throw new Error("Empty array");
           }
        })
        .catch(err => {
           console.error("Honors API fetch failed or empty:", err);
           // Fallback demo data để hiển thị khi chưa có ai hoặc lỗi API
           setHonors([
             {
               id: 999,
               student_name: "Nguyễn Văn A",
               teacher_name: "Thầy Hùng",
               title: "Thủ Khoa Đánh Giá Năng Lực",
               description: "Đạt 1150/1200 điểm thi ĐGNL ĐHQG. Phong độ cực kỳ ổn định, luôn lọt top 1 bảng vàng của lớp trong 12 tháng liên tiếp.",
               image_url: "https://ui-avatars.com/api/?name=Nguyễn+Văn+A&background=f59e0b&color=fff&size=200",
               academic_year: "2023-2024"
             },
             {
               id: 998,
               student_name: "Trần Thị B",
               teacher_name: "Cô giáo Thuỷ",
               title: "Giải Nhất QG Môn Toán",
               description: "Tư duy nhạy bén, khả năng giải quyết các bài toán hóc búa siêu việt. Thường xuyên support giảng bài cho các bạn học kém hơn.",
               image_url: "https://ui-avatars.com/api/?name=Trần+Thị+B&background=10b981&color=fff&size=200",
               academic_year: "2022-2023"
             },
             {
               id: 997,
               student_name: "Lê Hoàng C",
               teacher_name: "Nguyễn Lê Minh Ngọc",
               title: "Best Coder Khóa K1",
               description: "Hoàn thành 100% bài tập thực hành trên MINDA. Tự tay code dự án web chia sẻ tài liệu học tập cho lớp.",
               image_url: "https://ui-avatars.com/api/?name=Lê+Hoàng+C&background=3b82f6&color=fff&size=200",
               academic_year: "2021-2022"
             }
           ]);
         });

        // Lấy danh sách cảm nhận học sinh
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/testimonials/`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setTestimonials(data);
          })
          .catch(err => console.error("Testimonials API err:", err));
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-bg-main font-outfit text-t-primary selection:bg-indigo-500/30 overflow-x-hidden`}>
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-bg-main/80 backdrop-blur-md border-b border-border-card">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
               <span className="text-white font-black text-xl tracking-tighter">M</span>
             </div>
             <span className="text-xl font-black tracking-tight text-t-primary">MINDA<span className="text-indigo-500">.EDU</span></span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#classes" className="text-sm font-bold text-t-secondary hover:text-indigo-500 transition-colors uppercase tracking-wider">Các Lớp Học</Link>
            <Link href="#features" className="text-sm font-bold text-t-secondary hover:text-indigo-500 transition-colors uppercase tracking-wider">Công nghệ AI</Link>
            <Link href="/hall-of-fame" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-4 h-4" /> Bảng Vàng (Hall of Fame)
            </Link>
          </div>

          {/* Desktop Auth / User */}
          <div className="hidden md:flex items-center gap-4">
            {userName ? (
              <div className="flex items-center gap-4">
                <Link href="/yearbook/" className="px-4 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 font-bold hover:bg-pink-100 transition-colors flex items-center gap-2 shadow-sm">
                  <Star className="w-4 h-4 fill-pink-500" /> Kỷ Yếu Khóa Học
                </Link>
                <span className="text-t-secondary text-sm">Xin chào, <span className="font-bold text-t-primary">{userName}</span></span>
                <Link href={role === "admin" ? "/admin" : "/dashboard"} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                  Vào Lớp Học
                </Link>
                <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2.5 border border-border-card rounded-xl text-sm font-medium text-t-secondary hover:bg-bg-hover transition-colors">
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/yearbook/" className="px-4 py-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 font-bold hover:bg-pink-100 transition-colors flex items-center gap-2 shadow-sm">
                  <Star className="w-4 h-4 fill-pink-500" /> Viết Sổ Kỷ Yếu
                </Link>
                <Link href="/login" className="px-5 py-2.5 rounded-full border border-border-card text-t-primary hover:bg-bg-hover transition-colors font-bold">Đăng nhập</Link>
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
            <Link href="/hall-of-fame" onClick={() => setMobileMenuOpen(false)} className="text-amber-500 font-bold uppercase tracking-wider text-sm py-2 border-b border-border-card flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Bảng Vàng (Hall of Fame)
            </Link>
            
            {userName ? (
              <>
                <Link href="/yearbook/" onClick={() => setMobileMenuOpen(false)} className="text-pink-500 font-bold uppercase tracking-wider text-sm py-2 border-b border-border-card flex items-center gap-2">
                  <Star className="w-4 h-4 fill-pink-500" /> Kỷ Yếu
                </Link>
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
                <Link href="/yearbook/" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 rounded-xl bg-pink-50 border border-pink-200 text-pink-600 font-bold text-center flex items-center justify-center gap-2">
                  <Star className="w-4 h-4 fill-pink-500" /> Viết Sổ Kỷ Yếu
                </Link>
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
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>Phòng Lab 3D</h4>
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
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>Môn Học Đa Dạng</h4>
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
                <h4 className='text-3xl font-black tracking-tight text-t-primary'>AI Giải Đề Tích Hợp Vẽ Hình</h4>
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

      {/* AI Features */}
      <section id="features" className="py-24 relative z-10 border-t border-border-card bg-bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-5 tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">
              Công nghệ tiên phong
            </h2>
            <p className="text-t-secondary text-lg font-light max-w-2xl mx-auto">
              MINDA không chỉ là nền tảng học trực tuyến, mà là hệ sinh thái AI đồng hành cùng giáo viên và học sinh.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-bg-main rounded-3xl p-8 border border-border-card hover:border-indigo-400 transition-colors shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:bg-indigo-500/20 transition-colors">
                <BrainCircuit className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-t-primary">AI Theo Dõi Cảm Xúc</h3>
              <p className="text-t-secondary leading-relaxed">RAPT-CLIP theo dõi độ tập trung qua webcam, báo cáo chi tiết cho giáo viên những đoạn video học sinh sao nhãng.</p>
            </div>
            
            <div className="bg-bg-main rounded-3xl p-8 border border-border-card hover:border-cyan-400 transition-colors shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:bg-cyan-500/20 transition-colors">
                <Video className="w-7 h-7 text-cyan-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-t-primary">WebRTC Streaming</h3>
              <p className="text-t-secondary leading-relaxed">Học Live đỉnh cao. Bảng vẽ đồng bộ trực tiếp hai chiều không có độ trễ giữa giáo viên và học sinh.</p>
            </div>

            <div className="bg-bg-main rounded-3xl p-8 border border-border-card hover:border-pink-400 transition-colors shadow-sm group">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:bg-pink-500/20 transition-colors">
                <Sparkles className="w-7 h-7 text-pink-500" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-t-primary">Tự động hóa bài tập</h3>
              <p className="text-t-secondary leading-relaxed">Trợ lý AI tự động chấm trắc nghiệm, nhận diện chữ viết tay để phân tích điểm yếu trong bài giải tự luận.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame Showcase Teaser Section */}
      <section id="honors" className="py-20 relative z-10 border-t border-border-card bg-gradient-to-b from-bg-card/80 via-bg-card to-bg-main overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-wider mb-3">
                <Trophy className="w-3.5 h-3.5" /> MINDA Hall of Fame
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500">
                Bảng Vàng Vinh Danh
              </h2>
              <p className="text-t-secondary text-base md:text-lg font-light max-w-2xl mt-2">
                Tôn vinh các thế hệ học sinh xuất sắc nhất MINDA với thành tích Thủ khoa, Á khoa và đỗ vào các trường Đại học danh giá.
              </p>
            </div>

            <Link
              href="/hall-of-fame"
              className="shrink-0 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/25 flex items-center gap-2 hover:scale-105"
            >
              <span>Xem Toàn Bộ Bảng Vàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* 3 Spotlight Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {honors.slice(0, 3).map((h) => {
              const avatarImg = getDirectImageUrl(h.image_url);
              const uniLogo = getDirectImageUrl(h.university_logo_url);
              return (
                <Link
                  key={h.id}
                  href="/hall-of-fame"
                  className="bg-bg-main rounded-3xl p-6 border border-border-card hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-amber-500/10 group flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        {h.academic_year ? `Khóa ${h.academic_year}` : "Vinh Danh"}
                      </span>
                      {uniLogo && (
                        <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-border-card shadow-sm flex items-center justify-center shrink-0">
                          <img src={uniLogo} alt="Uni" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3.5">
                      <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
                        <img 
                          src="/square_rank_frame.png" 
                          alt="Frame" 
                          className="absolute inset-0 w-[125%] h-[125%] -top-[12.5%] -left-[12.5%] max-w-none pointer-events-none drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] object-fill" 
                        />
                        <div className="w-[80%] h-[80%] rounded-md overflow-hidden relative z-10 bg-bg-card">
                          {avatarImg ? (
                            <img src={avatarImg} alt={h.student_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-bg-card">
                              <Award className="w-6 h-6 text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-black text-base text-t-primary group-hover:text-amber-500 transition-colors truncate">
                          {h.student_name}
                        </h3>
                        <p className="text-[11px] text-t-secondary truncate mt-0.5">
                          GV: <strong>{h.teacher_name}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold leading-tight line-clamp-2">
                      {h.title}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-border-card flex items-center justify-between text-xs text-t-secondary group-hover:text-amber-500 transition-colors">
                    <span className="font-semibold">Xem chi tiết</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
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

      {/* Testimonials Showcase */}
      <section id="testimonials" className="py-24 relative z-10 border-t border-border-card bg-bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center justify-center p-3 bg-pink-500/10 rounded-2xl mb-4 border border-pink-500/20">
                <Star className="w-8 h-8 text-pink-500" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                Học sinh nói gì?
              </h2>
            </div>
            <button 
              onClick={() => setShowTestimonialModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
            >
              Viết cảm nhận của bạn
            </button>
          </div>

          {testimonials.length === 0 ? (
            <div className="text-center text-t-secondary py-10 bg-bg-main rounded-3xl border border-border-card">
              Chưa có cảm nhận nào. Hãy là người đầu tiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-bg-main p-8 rounded-3xl border border-border-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < t.rating ? "fill-current" : "text-border-card"}`} />
                    ))}
                  </div>
                  <p className="text-t-secondary mb-6 italic leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-hover">
                      <img src={t.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.student_name)}&background=6366f1&color=fff`} alt={t.student_name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-t-primary">{t.student_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-main w-full max-w-lg rounded-3xl border border-border-card overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowTestimonialModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-bg-hover text-t-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-black text-t-primary mb-2">Gửi Cảm Nhận</h3>
              <p className="text-sm text-t-secondary mb-6">Chia sẻ trải nghiệm học tập của bạn tại MINDA.</p>
              
              {testimonialSubmitStatus === "success" ? (
                <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl text-center border border-emerald-200 py-10">
                  <p className="font-bold text-xl mb-2">Cảm ơn bạn! 🎉</p>
                  <p>Cảm nhận của bạn đã được gửi và đang chờ duyệt.</p>
                </div>
              ) : (
                <form onSubmit={handleTestimonialSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Tên hiển thị</label>
                    <input 
                      required type="text"
                      className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary"
                      value={testimonialForm.student_name} onChange={e=>setTestimonialForm({...testimonialForm, student_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Ảnh đại diện (Tuỳ chọn)</label>
                    <div className="flex flex-col gap-2">
                       <input 
                         type="file" accept="image/*"
                         onChange={e => setTestimonialAvatarFile(e.target.files ? e.target.files[0] : null)}
                         className="w-full text-sm text-t-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20"
                       />
                       <div className="text-center text-xs text-t-secondary opacity-70">hoặc dán Link ảnh</div>
                       <input 
                         type="url"
                         placeholder="https://..."
                         className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary"
                         value={testimonialForm.avatar_url} onChange={e=>setTestimonialForm({...testimonialForm, avatar_url: e.target.value})}
                         disabled={!!testimonialAvatarFile}
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Đánh giá sao</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} type="button" 
                          onClick={() => setTestimonialForm({...testimonialForm, rating: star})}
                          className="focus:outline-none"
                        >
                          <Star className={`w-8 h-8 transition-colors ${star <= testimonialForm.rating ? "fill-amber-400 text-amber-400" : "text-border-card"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-t-secondary mb-2">Nội dung</label>
                    <textarea 
                      required rows={4}
                      className="w-full bg-bg-hover border border-border-card rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-t-primary resize-none"
                      value={testimonialForm.content} onChange={e=>setTestimonialForm({...testimonialForm, content: e.target.value})}
                    />
                  </div>
                  {testimonialSubmitStatus === "error" && <p className="text-red-500 text-sm font-medium">Có lỗi xảy ra, vui lòng thử lại sau.</p>}
                  <button 
                    type="submit" disabled={testimonialSubmitStatus === "loading"}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 mt-2"
                  >
                    {testimonialSubmitStatus === "loading" ? "Đang gửi..." : "Gửi cảm nhận"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
