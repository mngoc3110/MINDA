"use client";

import { useEffect, useState } from "react";
import { FileText, Trophy, Clock, CheckCircle, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";

export default function PracticePage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const token = localStorage.getItem("minda_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/assignments/practice`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAssignments(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <div className="min-h-screen bg-bg-main text-t-primary p-6 md:p-8 font-outfit">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-b-border relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-3xl tracking-tight leading-none mb-1.5">Phòng Luyện Sinh</h1>
            <p className="text-t-secondary text-sm">Chinh phục các thử thách tự do để nâng cao kỹ năng tư duy</p>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <div className={`px-5 py-3 rounded-xl border flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-xl font-black text-indigo-500">{assignments.length}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Thử thách</span>
           </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Đang tải đấu trường...</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className={`rounded-3xl border border-dashed flex flex-col items-center justify-center py-24 px-4 text-center ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-gray-300 bg-gray-50/50'}`}>
          <BrainCircuit className="w-16 h-16 text-gray-400 mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Chưa có thử thách nào</h3>
          <p className="text-gray-500 max-w-sm">Trung tâm hiện tại chưa mở bài thi tự do nào cho học viên cả. Bạn hãy nghỉ ngơi nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {assignments.map((assignment) => (
            <div key={assignment.id} className={`group flex flex-col rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-[#0a0a0a] border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-indigo-500/5'}`}>
               <div className="h-32 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 relative flex items-center justify-center owerflow-hidden">
                  <div className="absolute inset-0 bg-black/20" />
                  <FileText className="w-12 h-12 text-indigo-400/50 relative z-10" />
                  <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5 text-indigo-400" />
                     <span className="text-xs font-bold text-white">Toàn thời gian</span>
                  </div>
               </div>
               
               <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-indigo-400 transition-colors">{assignment.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
                     {assignment.description || 'Không có mô tả chi tiết cho bài tập này. Nhấn vào để xem bộ đề và bắt đầu làm bài.'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-white/10">
                     <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 opacity-50" />
                        <span className="text-xs font-semibold text-gray-500 uppercase">Điểm tối đa: {assignment.max_score || 100} đ</span>
                     </div>
                     <Link 
                        href={`/practice/${assignment.id}`}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                     >
                        Tham gia
                     </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
