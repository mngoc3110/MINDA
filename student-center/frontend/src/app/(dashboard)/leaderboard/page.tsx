"use client";

import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Sparkles, Crown } from "lucide-react";
import Image from "next/image";

interface Ranking {
  id: number;
  full_name: string;
  avatar_url: string | null;
  exp_points: number;
  current_rank: string | null;
}

export default function LeaderboardPage() {
  const [dataPayload, setDataPayload] = useState<{ students: Ranking[], teachers: Ranking[] }>({ students: [], teachers: [] });
  const [activeTab, setActiveTab] = useState<"students" | "teachers">("students");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/profile/leaderboard`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("minda_token")}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.students && data.teachers) {
           setDataPayload(data);
        } else if (Array.isArray(data)) {
           // fallback if backend not updated yet
           setDataPayload({ students: data, teachers: [] });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-bg-main flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const getRankMeta = (rankStr: string | null) => {
    switch(rankStr) {
      case "Sơ cấp": return { 
          img: "iron", color: "text-slate-400", borders: "border-slate-400", grad: "from-slate-400/30 to-slate-600/50", 
          shadow: "shadow-[0_0_10px_#94a3b8]", frameGrad: "from-slate-400 via-slate-600 to-slate-800",
          gem: "from-slate-300 to-slate-500", bracketColor: "border-slate-500", glowGrad: "from-slate-500 via-transparent to-transparent"
      };
      case "Tân binh": return { 
          img: "bronze", color: "text-green-500", borders: "border-green-500", grad: "from-green-500/30 to-emerald-700/50", 
          shadow: "shadow-[0_0_15px_#22c55e]", frameGrad: "from-green-400 via-emerald-600 to-emerald-800",
          gem: "from-green-300 to-emerald-500", bracketColor: "border-green-500", glowGrad: "from-green-500 via-transparent to-transparent"
      };
      case "Học bá": return { 
          img: "silver", color: "text-blue-400", borders: "border-blue-400", grad: "from-blue-400/30 to-indigo-600/50", 
          shadow: "shadow-[0_0_20px_#60a5fa]", frameGrad: "from-blue-300 via-blue-500 to-indigo-700",
          gem: "from-blue-200 to-indigo-500", bracketColor: "border-blue-400", glowGrad: "from-blue-400 via-transparent to-transparent"
      };
      case "Học thần": return { 
          img: "gold", color: "text-purple-400", borders: "border-purple-400", grad: "from-purple-400/30 to-pink-600/50", 
          shadow: "shadow-[0_0_25px_#c084fc]", frameGrad: "from-purple-300 via-fuchsia-500 to-pink-800",
          gem: "from-purple-200 to-fuchsia-600", bracketColor: "border-purple-400", glowGrad: "from-purple-500 via-transparent to-transparent"
      };
      case "Thủ khoa": return { 
          img: "diamond", color: "text-amber-400", borders: "border-amber-400", grad: "from-amber-400/30 to-orange-600/50", 
          shadow: "shadow-[0_0_30px_#fbbf24]", frameGrad: "from-yellow-300 via-amber-500 to-orange-700",
          gem: "from-yellow-200 to-amber-500", bracketColor: "border-yellow-400", glowGrad: "from-amber-400 via-transparent to-transparent"
      };
      // Teacher ranks
      case "Trợ giảng": return { 
          img: "iron", color: "text-stone-400", borders: "border-stone-400", grad: "from-stone-400/30 to-stone-600/50", 
          shadow: "shadow-[0_0_10px_#a8a29e]", frameGrad: "from-stone-400 via-stone-600 to-stone-800",
          gem: "from-stone-300 to-stone-500", bracketColor: "border-stone-500", glowGrad: "from-stone-500 via-transparent to-transparent"
      };
      case "Giáo viên": return { 
          img: "bronze", color: "text-blue-500", borders: "border-blue-500", grad: "from-blue-500/30 to-blue-700/50", 
          shadow: "shadow-[0_0_15px_#3b82f6]", frameGrad: "from-blue-400 via-blue-600 to-blue-800",
          gem: "from-blue-300 to-blue-600", bracketColor: "border-blue-500", glowGrad: "from-blue-500 via-transparent to-transparent"
      };
      case "Chuyên gia": return { 
          img: "silver", color: "text-violet-400", borders: "border-violet-400", grad: "from-violet-400/30 to-purple-600/50", 
          shadow: "shadow-[0_0_20px_#8b5cf6]", frameGrad: "from-violet-300 via-purple-500 to-purple-800",
          gem: "from-violet-200 to-purple-500", bracketColor: "border-violet-400", glowGrad: "from-violet-400 via-transparent to-transparent"
      };
      case "Thạc sĩ": return { 
          img: "gold", color: "text-amber-500", borders: "border-amber-500", grad: "from-amber-500/30 to-orange-700/50", 
          shadow: "shadow-[0_0_25px_#f59e0b]", frameGrad: "from-amber-300 via-amber-500 to-orange-700",
          gem: "from-amber-200 to-orange-500", bracketColor: "border-amber-400", glowGrad: "from-amber-500 via-transparent to-transparent"
      };
      case "Tiến sĩ GS": return { 
          img: "mythic", color: "text-red-500", borders: "border-red-500", grad: "from-red-500/30 to-rose-800/50", 
          shadow: "shadow-[0_0_35px_#ef4444]", frameGrad: "from-yellow-400 via-red-600 to-rose-900",
          gem: "from-red-300 to-red-700", bracketColor: "border-yellow-400", glowGrad: "from-red-500 via-transparent to-transparent"
      };
      case "Mystic":
      case "Thần Thoại (Mystic)":
      case "Tối Thượng (Mystic)":
          return {
          img: "mythic", color: "text-pink-500", borders: "border-pink-500", grad: "from-yellow-400/50 via-red-500/50 to-fuchsia-500/70",
          shadow: "shadow-[0_0_50px_#ec4899]", frameGrad: "from-yellow-400 via-red-500 to-fuchsia-500",
          gem: "from-yellow-300 to-red-500", bracketColor: "border-yellow-400", glowGrad: "from-fuchsia-500 via-red-500 to-yellow-500"
      };
      default: return { 
          img: "iron", color: "text-slate-400", borders: "border-slate-400", grad: "from-slate-400/30 to-slate-600/50", 
          shadow: "shadow-[0_0_10px_#94a3b8]", frameGrad: "from-slate-400 via-slate-600 to-slate-800",
          gem: "from-slate-300 to-slate-500", bracketColor: "border-slate-500", glowGrad: "from-slate-500 via-transparent to-transparent"
      };
    }
  };

  const RenderMobaPortraitFrame = ({ user, rankMeta, isTop3 }: { user: Ranking, rankMeta: any, isTop3: boolean }) => {
     // A perfectly styled exact mirrored variant of the Lien Quan style ornate framing bounds
     return (
       <div className={`relative ${isTop3 ? 'w-[150px] md:w-[220px]' : 'w-[70px] md:w-[100px] mt-8'} aspect-[2/3] shrink-0 transition-transform duration-500 ${isTop3 ? 'group-hover:scale-105' : 'group-hover:scale-110'}`}>
           
           {/* Thẻ Bài (The Outer Ornate Rectangular Frame bounds) */}
           <div className={`absolute inset-0 bg-linear-to-b ${rankMeta.frameGrad} p-[3px] rounded-sm drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-visible`}>
               {/* Lớp nền trong suốt của thẻ */}
               <div className="w-full h-full bg-[#050B14] relative overflow-hidden flex flex-col items-center">
                   {/* Ánh sáng Gradient tỏa ra từ tâm Frame */}
                   <div className={`absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${rankMeta.glowGrad}`} />

                   {/* HUY HIỆU RỒNG NỔI BẬT KHỔNG LỒ (Hero Graphic - Overlaps Frame bounds) */}
                   <div className={`absolute ${isTop3 ? '-top-12 md:-top-16 scale-150' : '-top-10 scale-[2.2] md:scale-[2.0]'} z-40 w-full aspect-square pointer-events-none flex items-center justify-center`}>
                      <img src={`/ranks/${rankMeta.img}.png`} alt={rankMeta.img} className="w-full h-full object-contain filter brightness-110" style={{ maskImage: "radial-gradient(circle at center, black 40%, transparent 60%)", WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 60%)" }} />
                   </div>

                   {/* Tên Rank (Bảng Tên Chữ Nhật Giữa Khung giống y hệt Yêu cầu) */}
                   <div className={`absolute ${isTop3 ? 'top-[50%]' : 'top-[55%] scale-75'} z-50 bg-white border-2 border-gray-300 text-slate-800 px-3 md:px-5 py-1 box-content rounded font-black text-xs md:text-sm shadow-xl tracking-tighter whitespace-nowrap`}>
                       {user.current_rank?.toUpperCase()}
                   </div>

                   {/* Avatar Nằm Trong Khung, Lót Phía Dưới */}
                   <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center group/avatar cursor-pointer w-full">
                       <div className={`w-10 h-10 md:w-16 md:h-16 rounded overflow-hidden border-2 ${rankMeta.bracketColor} shadow-lg shrink-0`}>
                         {user.avatar_url ? (
                           <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-slate-800 font-bold text-lg flex items-center justify-center text-white">{user.full_name[0]}</div>
                         )}
                       </div>
                   </div>
               </div>

               {/* -- Overlay Corner Ornaments -- */}
               {/* Top Jewel / Gemstone Center */}
               <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 flex items-center justify-center z-50">
                  <div className={`w-6 h-6 md:w-8 md:h-8 bg-linear-to-b ${rankMeta.gem} -rotate-45 border-2 ${rankMeta.bracketColor} shadow-[0_0_15px_rgba(255,255,255,0.4)] flex items-center justify-center`}>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full opacity-80 blur-[1px]"></div>
                  </div>
               </div>
               <div className={`absolute top-0 md:top-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-1 md:h-1.5 bg-linear-to-r from-transparent via-yellow-200 to-transparent opacity-90 z-40`} />

               {/* Bốn Góc (Corner Brackets) Mạ Vàng/Màu Theo Rank */}
               <div className={`absolute -bottom-1 -left-1 w-3 md:w-5 h-3 md:h-5 border-b-[3px] border-l-[3px] ${rankMeta.bracketColor} z-50`} />
               <div className={`absolute -bottom-1 -right-1 w-3 md:w-5 h-3 md:h-5 border-b-[3px] border-r-[3px] ${rankMeta.bracketColor} z-50`} />
               
               <div className={`absolute -top-1 -left-1 w-3 md:w-5 h-3 md:h-5 border-t-[3px] border-l-[3px] ${rankMeta.bracketColor} z-50`} />
               <div className={`absolute -top-1 -right-1 w-3 md:w-5 h-3 md:h-5 border-t-[3px] border-r-[3px] ${rankMeta.bracketColor} z-50`} />
           </div>
       </div>
     );
  };

  const rankings = dataPayload[activeTab];
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-main text-t-primary p-6 md:p-8 font-outfit pb-24 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-indigo-500/10 via-purple-500/5 to-transparent -z-10 blur-3xl pointer-events-none" />

      <header className="mb-8 text-center relative z-10 w-full flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-600 inline-flex items-center gap-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
           <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
           Đỉnh Cao Nhẫn Giả MINDA
           <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
        </h1>
        <p className="text-t-secondary mt-3 text-sm md:text-lg font-medium max-w-2xl px-4 text-center">
           Bảng xếp hạng gắt gao nhất vinh danh **Top 10%** thần đồng sở hữu thành tích (EXP) xuất sắc toàn hệ thống.
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-bg-card border border-border-card rounded-full p-1 mt-8 shadow-sm">
           <button 
             onClick={() => setActiveTab('students')}
             className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md' : 'text-t-secondary hover:text-t-primary'}`}
           >
             Học sinh
           </button>
           <button 
             onClick={() => setActiveTab('teachers')}
             className={`px-8 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md' : 'text-t-secondary hover:text-t-primary'}`}
           >
             Giáo viên
           </button>
        </div>
      </header>

      {/* Podium Top 3 */}
      <div className="max-w-6xl mx-auto flex items-end justify-center gap-4 md:gap-8 mb-24 px-2 h-[550px] md:h-[650px]">
        {podiumOrder.map((user, idx) => {
           if (!user) return <div key={idx} className="w-[150px] md:w-[220px] aspect-[2/3] flex-1" />;
           const rankPlace = idx === 0 ? 2 : idx === 1 ? 1 : 3;
           const rankMeta = getRankMeta(user.current_rank);
           
           const podiumHeights = {
             1: "h-[160px] md:h-[220px]",
             2: "h-[120px] md:h-[180px]",
             3: "h-[100px] md:h-[140px]"
           };

           return (
             <div key={user.id} className="flex flex-col items-center group relative z-10 flex-1 max-w-[220px] justify-end h-full">
                
                {/* Custom Next.js MOBA Frame */}
                <RenderMobaPortraitFrame user={user} rankMeta={rankMeta} isTop3={true} />
                
                <p className="font-bold text-base md:text-2xl truncate w-full text-center text-t-primary mt-6 mb-2 drop-shadow-md" title={user.full_name}>
                    {user.full_name}
                </p>
                <div className={`flex items-center gap-1.5 text-xs md:text-sm font-bold text-t-secondary mb-6 bg-bg-card/80 px-4 py-1.5 rounded-full border border-border-card shadow-sm backdrop-blur-md`}>
                   <Sparkles className="w-4 h-4 text-indigo-500" />
                   {user.exp_points.toLocaleString()} EXP
                </div>
                
                {/* 3D Podium Block Below the Trading Card */}
                <div className={`w-full rounded-t-2xl bg-linear-to-t ${rankMeta.grad} border-t-8 ${rankMeta.borders} flex items-start justify-center pt-4 lg:pt-8 relative overflow-hidden backdrop-blur-xl ${podiumHeights[rankPlace as 1|2|3]} shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 group-hover:brightness-125`}>
                   <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="text-6xl md:text-8xl font-black drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] opacity-95 text-white/90">
                       {rankPlace}
                   </span>
                </div>
                
                {/* Floating Crown above the entire stack for Rank 1 */}
                {rankPlace === 1 && (
                   <div className="absolute top-10 md:top-14 animate-bounce cursor-pointer z-50">
                     <Crown className="w-14 h-14 md:w-20 md:h-20 text-yellow-400 fill-yellow-400/60 drop-shadow-[0_0_25px_rgba(250,204,21,1)]" />
                   </div>
                )}
             </div>
           );
        })}
      </div>

      {/* List Rank 4 - 10% */}
      <div className="max-w-4xl mx-auto flex flex-col gap-8 relative z-10 px-2 lg:px-0">
        {rest.map((user, index) => {
           const actualRank = index + 4;
           const meta = getRankMeta(user.current_rank);

           return (
             <div key={user.id} className="bg-bg-card border-l-4 border border-border-card rounded-2xl p-4 md:p-6 flex items-center justify-between hover:bg-bg-hover transition-all duration-300 group shadow-md hover:shadow-xl backdrop-blur-3xl pl-2" style={{ borderLeftColor: meta.color.replace('text-', '') }}>
                
                <div className="flex items-center gap-0 md:gap-4 w-full h-24">
                   {/* Xếp hạng Index */}
                   <div className="w-8 md:w-16 text-center font-black text-2xl md:text-4xl text-t-secondary/40 group-hover:text-t-secondary transition-colors italic">#{actualRank}</div>

                   {/* MOBA Mini Portrait Frame Inline */}
                   <div className="mr-4 ml-2">
                       <RenderMobaPortraitFrame user={user} rankMeta={meta} isTop3={false} />
                   </div>
                   
                   {/* Thông tin Text bên cạnh Frame */}
                   <div className="flex flex-col flex-1 min-w-0 pr-4 mt-2">
                       <span className="font-black text-xl md:text-3xl text-t-primary leading-tight truncate tracking-tight">{user.full_name}</span>
                       <span className={`${meta.color} text-[11px] md:text-sm font-bold tracking-widest uppercase mt-1 opacity-80`}>
                           Tướng quân
                       </span>
                   </div>
                </div>
                
                {/* EXP Điểm */}
                <div className="flex items-center gap-1.5 md:gap-2 bg-bg-main/70 text-t-primary px-4 md:px-6 py-2 md:py-4 rounded-xl border border-border-card font-black text-lg md:text-2xl whitespace-nowrap shadow-inner min-w-[120px] justify-center mt-2">
                  {user.exp_points.toLocaleString()} <span className="text-t-secondary text-sm md:text-base font-semibold tracking-wider">EXP</span>
                </div>
             </div>
           );
        })}
        {rest.length === 0 && rankings.length <= 3 && (
            <div className="text-center py-16 text-t-secondary font-medium bg-bg-card/50 rounded-3xl border-2 border-border-card border-dashed">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-xl font-bold">Chưa có ai đủ trình độ vượt lên đây...</p>
                <p className="text-sm mt-2 opacity-70">Ngai vàng đang chờ chủ nhân.</p>
            </div>
        )}
      </div>
    </div>
  );
}
