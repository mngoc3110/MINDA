"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useEffect } from "react";
import { Bird } from "../models/Bird";
import { Island } from "../models/Island";
import { Plane } from "../models/Plane";
import { Sky } from "../models/Sky";
import { Html, Stars } from "@react-three/drei";
import { ArrowDown } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center">
         <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
         <span className="mt-4 text-indigo-600 font-bold uppercase tracking-widest text-xs select-none">Đang tải Đảo 3D...</span>
      </div>
    </Html>
  );
}

export default function IslandHero() {
  const [isRotating, setIsRotating] = useState(false);
  const [currentStage, setCurrentStage] = useState<number | null>(1);
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const adjustBiplaneForScreenSize = () => {
    let screenScale, screenPosition;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      screenScale = [1.5, 1.5, 1.5] as [number, number, number];
      screenPosition = [0, -1.5, 0] as [number, number, number];
    } else {
      screenScale = [3, 3, 3] as [number, number, number];
      screenPosition = [0, -4, -4] as [number, number, number];
    }
    return [screenScale, screenPosition];
  };

  const adjustIslandForScreenSize = () => {
    let screenScale, screenPosition;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      screenScale = [0.9, 0.9, 0.9] as [number, number, number];
      screenPosition = [0, -6.5, -43.4] as [number, number, number];
    } else {
      screenScale = [1, 1, 1] as [number, number, number];
      screenPosition = [0, -6.5, -43.4] as [number, number, number];
    }
    return [screenScale, screenPosition];
  };

  if (!isMounted) return null;

  const [biplaneScale, biplanePosition] = adjustBiplaneForScreenSize();
  const [islandScale, islandPosition] = adjustIslandForScreenSize();

  return (
    <section className={`w-full h-screen relative overflow-hidden transition-colors duration-1000 ${
        theme === 'dark' 
        ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-930' 
        : 'bg-gradient-to-b from-[#ffd3a5] via-[#ffb1b1] to-[#cba3ff]'
    }`}>
      
      {/* Cửa sổ Canvas 3D chứa mọi thứ */}
      <Canvas
        className={`w-full h-screen ${isRotating ? "cursor-grabbing" : "cursor-grab"}`}
        camera={{ near: 0.1, far: 1000 }}
        dpr={[1, 1.5]} // Quan trọng: Giới hạn độ phân giải render trên màn hình Retina Mac để chống nóng máy
        performance={{ min: 0.5 }} // Cho phép tự giảm chất lượng nếu FPS tụt
      >
        <Suspense fallback={<Loader />}>
          {theme === 'dark' ? (
            <>
              <directionalLight position={[1, 1, 1]} intensity={0.5} color="#b3d4ff" />
              <ambientLight intensity={0.3} color="#2b2b40" />
              <hemisphereLight groundColor="#000000" intensity={0.4} color="#65658b" />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </>
          ) : (
            <>
              <directionalLight position={[1, 1, 1]} intensity={2} color="#ffe2b3" />
              <ambientLight intensity={0.6} color="#ffd4df" />
              <hemisphereLight groundColor="#000000" intensity={1} color="#ffaebc" />
              <Sky isRotating={isRotating} />
            </>
          )}

          <Bird />
          <Island
            isRotating={isRotating}
            setIsRotating={setIsRotating}
            setCurrentStage={setCurrentStage}
            position={islandPosition as [number, number, number]}
            rotation={[0.1, 4.7077, 0]}
            scale={islandScale as [number, number, number]}
          />
          <Plane
            isRotating={isRotating}
            position={biplanePosition as [number, number, number]}
            rotation={[0, 20.1, 0]}
            scale={biplaneScale as [number, number, number]}
          />
        </Suspense>
      </Canvas>

      {/* Floating Info Boxes (Neo-Brutalism Style) mượn ý tưởng HomeInfo.jsx */}
      <div className="absolute top-32 left-0 right-0 z-10 flex items-center justify-center pointer-events-none select-none">
        {currentStage === 1 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
            <h1 className="text-2xl font-black text-indigo-600 block line-clamp-1">Chào mừng tới MINDA! 🦊</h1>
            <p className="text-sm font-bold text-gray-700 mt-2">Dùng chuột Kéo và Xoay đảo để khám phá hành trình nhé!</p>
          </div>
        )}
        {currentStage === 2 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-purple-600 block">Thư Viện Bài Giảng Đa Chiều</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Nơi tích lũy hàng ngàn video và tài liệu 3D siêu việt của Thầy Minh Ngọc.</p>
          </div>
        )}
        {currentStage === 3 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-cyan-600 block">Lõi Trí Tuệ AI RAPT-CLIP</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Cảm biến nhãn quan liên tục phân tích và giám sát độ tập trung thời gian thực.</p>
          </div>
        )}
        {currentStage === 4 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-pink-600 block">Hội Trường Xếp Hạng RANK</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Biến mỗi giờ học thành một trận chiến thăng hạng kịch tính.</p>
          </div>
        )}
      </div>

      {/* Blinking Scroll Down Arrow */}
      <div className="absolute bottom-10 right-10 z-10 flex flex-col items-center pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 text-indigo-800 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">Cuộn Xuống</span>
        <div className="w-12 h-16 rounded-full border-2 border-indigo-600 flex items-center justify-center bg-indigo-500/20 shadow-xl">
          <ArrowDown className="w-6 h-6 text-indigo-700 animate-[bounce_1s_infinite]" />
        </div>
      </div>
    </section>
  );
}
