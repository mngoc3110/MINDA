"use client";

import { useState } from "react";
import { Book, X, ChevronRight, Calculator, Shapes, FunctionSquare, LayoutTemplate, Layers } from "lucide-react";
import { ShapeType } from "./Math3DViewer";

interface MathLabExplorerProps {
  onClose: () => void;
  onSelectShape: (shape: ShapeType) => void;
}

type MathFormula = {
  id?: string;
  name: string;
  trigger?: ShapeType;
  icon: React.ReactNode;
};

type MathTopic = {
  id: string;
  name: string;
  formulas: MathFormula[];
};

type CurriculumGrade = {
  grade: number;
  label: string;
  topics: MathTopic[];
};

const K12_CURRICULUM: CurriculumGrade[] = [
  { grade: 1, label: "Toán Lớp 1", topics: [] },
  { grade: 2, label: "Toán Lớp 2", topics: [] },
  { grade: 3, label: "Toán Lớp 3", topics: [] },
  { grade: 4, label: "Toán Lớp 4", topics: [] },
  { grade: 5, label: "Toán Lớp 5", topics: [] },
  { grade: 6, label: "Toán Lớp 6", topics: [] },
  { grade: 7, label: "Toán Lớp 7", topics: [] },
  { grade: 8, label: "Toán Lớp 8", topics: [] },
  { grade: 9, label: "Toán Lớp 9", topics: [] },
  { grade: 10, label: "Toán Lớp 10", topics: [
     { id: "geometry", name: "Hình học không gian sơ bộ", 
       formulas: [
         { name: "Cơ sở Vector Oxy", icon: <LayoutTemplate className="w-4 h-4 text-orange-500" /> }
       ] 
     }
  ]},
  { grade: 11, label: "Toán Lớp 11", topics: [
     { id: "spatial", name: "Hình học không gian", 
       formulas: [
         { name: "Đường thẳng & Mặt phẳng", icon: <Layers className="w-4 h-4 text-emerald-500" /> }
       ] 
     }
  ]},
  { grade: 12, label: "Toán Lớp 12", topics: [
     { id: "solids", name: "Khối Đa Diện & Tròn Xoay", 
       formulas: [
         { id: "cube", name: "Khối Lập Phương & Hộp Chữ Nhật", trigger: "cube" as ShapeType, icon: <Shapes className="w-4 h-4 text-blue-500" /> },
         { id: "cone", name: "Khối Nón Định Hình", trigger: "cone" as ShapeType, icon: <Calculator className="w-4 h-4 text-pink-500" /> },
         { id: "cylinder", name: "Khối Trụ & Diện Tích Xung Quanh", trigger: "cylinder" as ShapeType, icon: <FunctionSquare className="w-4 h-4 text-amber-500" /> },
         { id: "sphere", name: "Mặt Cầu & Thể Tích Khối Cầu", trigger: "sphere" as ShapeType, icon: <LayoutTemplate className="w-4 h-4 text-purple-500" /> }
       ] 
     }
  ]},
];

export default function MathLabExplorer({ onClose, onSelectShape }: MathLabExplorerProps) {
  const [activeGrade, setActiveGrade] = useState<number>(12);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 relative animate-in slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                 <Book className="w-5 h-5 text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-bold font-outfit text-slate-800">Thư Viện Cơ Sở Toán Học Không Gian</h2>
                 <p className="text-xs font-medium text-slate-500">Tra cứu nhanh Công thức & Mô hình 3D từ Lớp 1 đến Lớp 12</p>
              </div>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors text-slate-600">
              <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar: Lớp Học */}
           <div className="w-64 border-r border-slate-200 bg-slate-50/50 overflow-y-auto p-4 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Cấp Bậc Khối Lớp</p>
              {K12_CURRICULUM.map((grade) => (
                 <button
                    key={grade.grade}
                    onClick={() => setActiveGrade(grade.grade)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                       activeGrade === grade.grade 
                         ? "bg-blue-600 text-white shadow-md font-semibold" 
                         : "text-slate-600 hover:bg-slate-200 font-medium"
                    }`}
                 >
                    <span>{grade.label}</span>
                    {activeGrade === grade.grade && <ChevronRight className="w-4 h-4" />}
                 </button>
              ))}
           </div>

           {/* Main Content: Môn & Công Thức */}
           <div className="flex-1 overflow-y-auto bg-white p-8">
              {(() => {
                 const currentCurriculum = K12_CURRICULUM.find(c => c.grade === activeGrade);
                 
                 if (!currentCurriculum || currentCurriculum.topics.length === 0) {
                    return (
                       <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-10">
                          <Layers className="w-16 h-16 text-slate-300 mb-4" />
                          <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có Thư viện 3D cho cấp lớp này.</h3>
                          <p className="text-sm text-slate-500">Hệ thống MINDA đang nỗ lực số hóa các hình mẫu trực quan cho Lớp {activeGrade}. Vui lòng quay lại sau!</p>
                       </div>
                    );
                 }

                 return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                       {currentCurriculum.topics.map((topic, i) => (
                          <div key={i}>
                             <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block"></span>
                                {topic.name}
                             </h3>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {topic.formulas.map((formula, j) => (
                                   <div key={j} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 transition-colors group">
                                      <div className="flex items-start gap-3 mb-4">
                                         <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                                            {formula.icon}
                                         </div>
                                         <p className="font-semibold text-slate-700 text-sm">{formula.name}</p>
                                      </div>
                                      
                                      {formula.trigger ? (
                                         <button 
                                            onClick={() => {
                                               onSelectShape(formula.trigger as ShapeType);
                                               onClose(); // Auto close the modal after selection
                                            }}
                                            className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 text-slate-600 text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                                         >
                                            <Shapes className="w-4 h-4" /> Mô Phỏng Không Gian
                                         </button>
                                      ) : (
                                         <button disabled className="w-full py-2.5 bg-slate-100 border border-slate-200 text-slate-400 text-sm font-semibold rounded-xl cursor-not-allowed">
                                            Đang cập nhật đồ thị...
                                         </button>
                                      )}
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                 );
              })()}
           </div>
        </div>

      </div>
    </div>
  );
}
