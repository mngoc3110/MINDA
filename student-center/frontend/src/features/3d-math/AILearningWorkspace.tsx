"use client";

import { useState } from "react";
import { LibraryBig, Maximize2, Minimize2 } from "lucide-react";
import AILogicSolver, { GeometryData } from "./AILogicSolver";
import Math3DViewer, { ShapeType } from "./Math3DViewer";
import MathLabExplorer from "./MathLabExplorer";

export default function AILearningWorkspace() {
  const [activeShape, setActiveShape] = useState<ShapeType>("cylinder");
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-[100] bg-slate-50 p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 h-screen w-screen overflow-hidden"
      : "w-full h-[60vh] min-h-[500px] max-h-[800px] grid grid-cols-1 lg:grid-cols-2 gap-6 bg-transparent relative"
    }>
       
       {/* Library Modal Overlay */}
       {isLabOpen && (
          <MathLabExplorer onClose={() => setIsLabOpen(false)} onSelectShape={setActiveShape} />
       )}
       
       {/* Left Pane: AI Chat Solver */}
       <div className="flex flex-col h-full z-10 hover:shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-500 rounded-3xl min-h-0">
          <AILogicSolver 
             onDetectedShape={setActiveShape}
             onDetectedGeometry={setGeometryData}
             isFullscreen={isFullscreen}
             onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          />
       </div>

       {/* Right Pane: 3D Lab Viewer */}
       <div className="flex flex-col h-full z-0 hover:shadow-2xl hover:shadow-indigo-500/10 transition-shadow duration-500 rounded-3xl border border-slate-200 overflow-hidden bg-white min-h-0">
          {/* Header of the 3D lab (Moved from inside component to here) */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 relative z-20">
             <h2 className="text-xl font-bold font-outfit text-slate-800">Cơ sở Toán học 3D</h2>
             <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setIsLabOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2 transition-colors"
                >
                  <LibraryBig className="w-4 h-4" /> Thư viện K-12
                </button>
                <div className="px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200 hidden md:block">
                   Đang Vẽ: {activeShape.charAt(0).toUpperCase() + activeShape.slice(1)}
                </div>
             </div>
          </div>
          <div className="flex-1 relative">
             <Math3DViewer shape={activeShape} extraGeometry={geometryData} />
          </div>
       </div>

    </div>
  );
}
