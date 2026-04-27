"use client";

import { useEffect, useState } from "react";
import { FileText, Trophy, Clock, CheckCircle, BrainCircuit, ChevronDown, ChevronRight, FolderOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTheme } from "@/providers/ThemeProvider";

export default function PracticePage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { theme } = useTheme();

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/practice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
        // Auto-expand all folders
        const folderNames = new Set<string>();
        data.forEach((a: any) => { if (a.folder_name) folderNames.add(a.folder_name); });
        folderNames.add("__unfoldered__");
        setExpandedFolders(folderNames);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const toggleFolder = (name: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Group by folder
  const folderMap = new Map<string, any[]>();
  const unfolderedItems: any[] = [];

  assignments.forEach((a) => {
    if (a.folder_name) {
      if (!folderMap.has(a.folder_name)) folderMap.set(a.folder_name, []);
      folderMap.get(a.folder_name)!.push(a);
    } else {
      unfolderedItems.push(a);
    }
  });

  const renderCard = (assignment: any) => (
    <div key={assignment.id} className={`group flex flex-col rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden ${assignment.my_score !== null && assignment.my_score !== undefined ? (theme === 'dark' ? 'bg-[#0a0a0a] border-green-500/30' : 'bg-white border-green-400') : (theme === 'dark' ? 'bg-[#0a0a0a] border-white/10 hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'bg-white border-gray-200 hover:border-indigo-400 hover:shadow-indigo-500/5')}`}>
       <div className={`h-32 relative flex items-center justify-center overflow-hidden ${assignment.my_score !== null && assignment.my_score !== undefined ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40' : 'bg-gradient-to-br from-indigo-900/40 to-purple-900/40'}`}>
          <div className="absolute inset-0 bg-black/20" />
          {assignment.my_score !== null && assignment.my_score !== undefined ? (
            <CheckCircle className="w-12 h-12 text-green-400/70 relative z-10" />
          ) : (
            <FileText className="w-12 h-12 text-indigo-400/50 relative z-10" />
          )}
          {assignment.my_score !== null && assignment.my_score !== undefined ? (
            <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-full border border-green-400/30 flex items-center gap-1.5">
               <CheckCircle className="w-3.5 h-3.5 text-white" />
               <span className="text-xs font-bold text-white">Đã làm: {assignment.my_score}đ</span>
            </div>
          ) : (
            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
               <Clock className="w-3.5 h-3.5 text-indigo-400" />
               <span className="text-xs font-bold text-white">Chưa làm</span>
            </div>
          )}
       </div>
       
       <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-indigo-400 transition-colors">{assignment.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">
             {assignment.description || 'Không có mô tả chi tiết cho bài tập này. Nhấn vào để xem bộ đề và bắt đầu làm bài.'}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-white/10">
             <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${assignment.my_score !== null && assignment.my_score !== undefined ? 'text-green-500' : 'text-green-500 opacity-50'}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase">Điểm tối đa: {assignment.max_score || 100} đ</span>
             </div>
             <Link 
                href={`/practice/${assignment.id}`}
                className={`px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors shadow-lg ${assignment.my_score !== null && assignment.my_score !== undefined ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
             >
                {assignment.my_score !== null && assignment.my_score !== undefined ? 'Làm lại' : 'Tham gia'}
             </Link>
          </div>
       </div>
    </div>
  );

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
           <button 
              onClick={fetchAssignments}
              disabled={loading}
              className={`px-5 py-3 rounded-xl border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 ${theme === 'dark' ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'}`}
              title="Làm mới (Tải lại)"
            >
              <RefreshCw className={`w-6 h-6 text-indigo-500 mb-1 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cập nhật</span>
           </button>
           <div className={`px-5 py-3 rounded-xl border flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <span className="text-xl font-black text-indigo-500">{assignments.length}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thử thách</span>
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
        <div className="space-y-8">
          {/* Folders */}
          {Array.from(folderMap.entries()).map(([folderName, items]) => (
            <div key={folderName} className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-white/[0.02] border-indigo-500/20' : 'bg-indigo-50/30 border-indigo-200'}`}>
              <button
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors text-left"
                onClick={() => toggleFolder(folderName)}
              >
                {expandedFolders.has(folderName) ? (
                  <ChevronDown className="w-5 h-5 text-indigo-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-indigo-400 shrink-0" />
                )}
                <FolderOpen className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="font-bold text-lg flex-1">{folderName}</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${theme === 'dark' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-100 text-indigo-600'}`}>
                  {items.length} đề
                </span>
              </button>
              {expandedFolders.has(folderName) && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((assignment: any) => renderCard(assignment))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Unfoldered as a regular pseudo-folder */}
          {unfolderedItems.length > 0 && (
            <div className={`rounded-3xl border overflow-hidden ${theme === 'dark' ? 'bg-white/[0.02] border-gray-500/20' : 'bg-gray-50/30 border-gray-200'}`}>
              <button
                className="w-full flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors text-left"
                onClick={() => toggleFolder("__unfoldered__")}
              >
                {expandedFolders.has("__unfoldered__") ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                )}
                <FolderOpen className="w-5 h-5 text-gray-400 shrink-0" />
                <span className="font-bold text-lg flex-1 text-gray-400">📄 Bài tập tự do (Chưa phân chia)</span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${theme === 'dark' ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20' : 'bg-gray-200 text-gray-600'}`}>
                  {unfolderedItems.length} đề
                </span>
              </button>
              {expandedFolders.has("__unfoldered__") && (
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {unfolderedItems.map((assignment: any) => renderCard(assignment))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
