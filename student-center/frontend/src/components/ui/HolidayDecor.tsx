"use client";

import React, { useEffect, useState } from "react";

export default function HolidayDecor() {
  const [flags, setFlags] = useState<number[]>([]);

  useEffect(() => {
    // Generate flags spaced out more (1 flag every 150px)
    const count = Math.ceil(window.innerWidth / 150);
    setFlags(Array.from({ length: count }));
  }, []);

  if (flags.length === 0) return null;

  const ropeHeight = 100; // The curve depth

  return (
    <div className="fixed top-0 left-0 w-full h-[200px] z-[99999] pointer-events-none overflow-hidden select-none">
      {/* SVG Sợi dây thừng vắt ngang dạng Parabol */}
      <svg className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: `${ropeHeight}px` }} viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M 0,0 Q 50,200 100,0" fill="none" stroke="#8B4513" strokeWidth="2" opacity="0.7" vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="w-full relative w-full h-full pt-[2px]">
        {flags.map((_, i) => {
          const delay = (i * 0.2) % 2;
          
          // Tính toán vị trí cờ trên parabol
          const p = (i + 0.5) / flags.length; // 0.0 to 1.0
          const topPx = ropeHeight * 4 * p * (1 - p);
          
          return (
            <div 
              key={i} 
              className={`absolute flex flex-col items-center origin-top drop-shadow-lg`}
              style={{
                left: `calc(${p * 100}% - 32px)`, // center horizontally (flag width is 64px)
                top: `${topPx}px`,
                animation: `sway 3s ease-in-out infinite alternate`,
                animationDelay: `${delay}s`,
                transformOrigin: 'top center'
              }}
            >
              {/* Dây nối lá cờ với dây thừng */}
              <div className="w-[1.5px] h-3 bg-[#8B4513]/50 absolute -top-3" />
              
              <div className="w-12 h-16 sm:w-16 sm:h-20 bg-[#DA251D] shadow-[inset_-2px_-2px_10px_rgba(0,0,0,0.1)] relative overflow-hidden flex items-center justify-center transform -skew-x-2 rounded-sm border border-[#ff4d4d]/20">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-10 sm:h-10 text-[#FFFF00] fill-current">
                    <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
                  </svg>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sway {
          0% { transform: rotate(-8deg); }
          100% { transform: rotate(8deg); }
        }
      `}} />
    </div>
  );
}
