import LiveClassRoom from "@/features/live-class/LiveClassRoom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ClassPage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 md:p-6 font-outfit selection:bg-indigo-500/30">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex items-center justify-between mb-4 md:mb-6 px-2">
           <div className="flex items-center gap-4">
             <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:-translate-x-1">
                <ArrowLeft className="w-4 h-4" />
             </Link>
             <div>
               <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                 Phòng học Live: Khối Đa Diện - Hình Học Không Gian
               </h1>
               <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                 <p className="text-gray-400 text-xs md:text-sm font-medium">Đang Live (Giáo viên Nguyễn Văn B)</p>
               </div>
             </div>
           </div>
           
           <div className="hidden md:flex items-center px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
             <span className="text-indigo-400 text-xs font-bold uppercase tracking-wider">Hệ thống AI RAPT-CLIP Đang hoạt động</span>
           </div>
        </header>

        {/* Lớp học Live Streaming View */}
        <LiveClassRoom />
      </div>
    </div>
  );
}
