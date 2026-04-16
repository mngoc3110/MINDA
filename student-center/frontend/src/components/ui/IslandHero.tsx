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

import { ZodiacAnimal } from "../models/ZodiacAnimal";
import { Cloud, Leaf, Snowflake, Sun as SunIcon } from "lucide-react";

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

  // New States for Zodiac & Seasons
  const [phase, setPhase] = useState<"zodiac" | "island">("zodiac");
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter">("spring");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const adjustPositionForScreenSize = () => {
    let biplaneScale, biplanePosition, islandScale, islandPosition, zodiacScale, zodiacPosition;
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      biplaneScale = [1.5, 1.5, 1.5] as [number, number, number];
      biplanePosition = [0, -1.5, 0] as [number, number, number];
      islandScale = [0.9, 0.9, 0.9] as [number, number, number];
      islandPosition = [0, -6.5, -43.4] as [number, number, number];
      zodiacScale = [0.8, 0.8, 0.8] as [number, number, number];
      zodiacPosition = [0, -2, -5] as [number, number, number];
    } else {
      biplaneScale = [3, 3, 3] as [number, number, number];
      biplanePosition = [0, -4, -4] as [number, number, number];
      islandScale = [1, 1, 1] as [number, number, number];
      islandPosition = [0, -6.5, -43.4] as [number, number, number];
      zodiacScale = [1.5, 1.5, 1.5] as [number, number, number];
      zodiacPosition = [0, -2.5, -6] as [number, number, number];
    }
    return { biplaneScale, biplanePosition, islandScale, islandPosition, zodiacScale, zodiacPosition };
  };

  if (!isMounted) return null;

  const { biplaneScale, biplanePosition, islandScale, islandPosition, zodiacScale, zodiacPosition } = adjustPositionForScreenSize();

  // Dynamic Lighting based on Theme and Season
  let lightProps = { dirColor: "#ffe2b3", dirInt: 2, ambColor: "#ffd4df", ambInt: 0.6, hemiGround: "#000000", hemiColor: "#ffaebc", hemiInt: 1 };
  if (theme === 'dark') {
      lightProps = { dirColor: "#b3d4ff", dirInt: 0.5, ambColor: "#2b2b40", ambInt: 0.3, hemiGround: "#000000", hemiColor: "#65658b", hemiInt: 0.4 };
  } else {
      switch(season) {
          case "spring": lightProps = { dirColor: "#ffe2b3", dirInt: 2, ambColor: "#ffd4df", ambInt: 0.6, hemiGround: "#000000", hemiColor: "#ffaebc", hemiInt: 1 }; break;
          case "summer": lightProps = { dirColor: "#ffffff", dirInt: 2.5, ambColor: "#e0f2fe", ambInt: 0.8, hemiGround: "#000000", hemiColor: "#38bdf8", hemiInt: 1.2 }; break;
          case "autumn": lightProps = { dirColor: "#fcd34d", dirInt: 2, ambColor: "#ffedd5", ambInt: 0.7, hemiGround: "#000000", hemiColor: "#fb923c", hemiInt: 1.2 }; break;
          case "winter": lightProps = { dirColor: "#e0f2fe", dirInt: 1.5, ambColor: "#f1f5f9", ambInt: 0.6, hemiGround: "#000000", hemiColor: "#94a3b8", hemiInt: 1 }; break;
      }
  }

  const handleZodiacClick = () => {
     setPhase("island");
  };

  return (
    <section className={`w-full h-screen relative overflow-hidden transition-colors duration-1000 ${
        theme === 'dark' 
        ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-930' 
        : season === "spring" ? 'bg-gradient-to-b from-[#ffd3a5] via-[#ffb1b1] to-[#cba3ff]'
        : season === "summer" ? 'bg-gradient-to-b from-[#bae6fd] via-[#7dd3fc] to-[#e0f2fe]'
        : season === "autumn" ? 'bg-gradient-to-b from-[#fed7aa] via-[#fdba74] to-[#ffedd5]'
        : 'bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#f1f5f9]' // winter
    }`}>
      
      {/* Cửa sổ Canvas 3D chứa mọi thứ */}
      <Canvas
        className={`w-full h-screen ${isRotating ? "cursor-grabbing" : "cursor-grab"}`}
        camera={{ near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={<Loader />}>
          <directionalLight position={[1, 1, 1]} intensity={lightProps.dirInt} color={lightProps.dirColor} />
          <ambientLight intensity={lightProps.ambInt} color={lightProps.ambColor} />
          <hemisphereLight groundColor={lightProps.hemiGround} intensity={lightProps.hemiInt} color={lightProps.hemiColor} />
          
          {theme === 'dark' ? (
             <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          ) : (
             <Sky isRotating={isRotating} />
          )}

          {phase === "zodiac" && (
             <ZodiacAnimal 
               position={zodiacPosition} 
               scale={zodiacScale} 
               rotation={[0.1, 0, 0]}
               onClick={handleZodiacClick}
             />
          )}

          {phase === "island" && (
             <>
                <Bird />
                <Island
                  isRotating={isRotating}
                  setIsRotating={setIsRotating}
                  setCurrentStage={setCurrentStage}
                  position={islandPosition}
                  rotation={[0.1, 4.7077, 0]}
                  scale={islandScale}
                  season={season}
                />
                <Plane
                  isRotating={isRotating}
                  position={biplanePosition}
                  rotation={[0, 20.1, 0]}
                  scale={biplaneScale}
                />
             </>
          )}

        </Suspense>
      </Canvas>

      {/* Floating Info Boxes */}
      <div className="absolute top-32 left-0 right-0 z-10 flex items-center justify-center pointer-events-none select-none">
        
        {phase === "zodiac" && (
           <div className="bg-white/80 backdrop-blur-md px-8 py-5 rounded-2xl shadow-2xl border border-white max-w-md text-center animate-bounce">
              <h1 className="text-2xl font-black text-indigo-600 block mb-2">Chào mừng năm mới 🦊</h1>
              <p className="text-sm font-bold text-gray-700">Click vào linh vật để tiến vào Đảo MINDA!</p>
              <p className="text-xs text-indigo-500 mt-2 italic">(Bạn có thể thay linh vật này bằng mô hình Con Ngựa 3D tệp .glb)</p>
           </div>
        )}

        {phase === "island" && currentStage === 1 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
            <h1 className="text-2xl font-black text-indigo-600 block line-clamp-1">Khám phá Đảo MINDA!</h1>
            <p className="text-sm font-bold text-gray-700 mt-2">Dùng chuột Kéo và Xoay đảo để khám phá hành trình nhé!</p>
          </div>
        )}
        {phase === "island" && currentStage === 2 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-purple-600 block">Thư Viện Bài Giảng Đa Chiều</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Nơi tích lũy hàng ngàn video và tài liệu 3D siêu việt của Thầy Minh Ngọc.</p>
          </div>
        )}
        {phase === "island" && currentStage === 3 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-cyan-600 block">Lõi Trí Tuệ AI RAPT-CLIP</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Cảm biến nhãn quan liên tục phân tích và giám sát độ tập trung thời gian thực.</p>
          </div>
        )}
        {phase === "island" && currentStage === 4 && (
          <div className="bg-white/80 backdrop-blur-md px-6 py-4 rounded-xl shadow-2xl border border-white max-w-sm text-center">
             <h1 className="text-lg font-black text-pink-600 block">Hội Trường Xếp Hạng RANK</h1>
             <p className="text-sm font-bold text-gray-700 mt-2">Biến mỗi giờ học thành một trận chiến thăng hạng kịch tính.</p>
          </div>
        )}
      </div>

      {/* Season Selector Toolbar */}
      {phase === "island" && theme !== "dark" && (
         <div className="absolute top-24 right-6 md:top-auto md:bottom-10 md:left-1/2 md:-translate-x-1/2 md:right-auto z-20 flex flex-col md:flex-row gap-2 bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-white shadow-xl">
            <button 
               onClick={() => setSeason("spring")} 
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${season === 'spring' ? 'bg-pink-500 text-white shadow-md' : 'text-pink-600 hover:bg-pink-100'}`}
            >
               <Leaf className="w-4 h-4" /> Mùa Xuân
            </button>
            <button 
               onClick={() => setSeason("summer")} 
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${season === 'summer' ? 'bg-sky-500 text-white shadow-md' : 'text-sky-600 hover:bg-sky-100'}`}
            >
               <SunIcon className="w-4 h-4" /> Mùa Hạ
            </button>
            <button 
               onClick={() => setSeason("autumn")} 
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${season === 'autumn' ? 'bg-orange-500 text-white shadow-md' : 'text-orange-600 hover:bg-orange-100'}`}
            >
               <Cloud className="w-4 h-4" /> Mùa Thu
            </button>
            <button 
               onClick={() => setSeason("winter")} 
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${season === 'winter' ? 'bg-slate-400 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}
            >
               <Snowflake className="w-4 h-4" /> Mùa Đông
            </button>
         </div>
      )}

      {/* Blinking Scroll Down Arrow */}
      {phase === "island" && (
         <div className="absolute bottom-10 right-10 z-10 flex flex-col items-center pointer-events-none hidden md:flex">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold mb-2 text-indigo-800 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">Cuộn Xuống</span>
            <div className="w-12 h-16 rounded-full border-2 border-indigo-600 flex items-center justify-center bg-indigo-500/20 shadow-xl">
               <ArrowDown className="w-6 h-6 text-indigo-700 animate-[bounce_1s_infinite]" />
            </div>
         </div>
      )}
    </section>
  );
}
