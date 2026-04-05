"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import LearningGalaxy from "@/features/3d-math/LearningGalaxy";
import Link from "next/link";

export default function DrivePage() {
  return (
    <div className="fixed inset-0 w-screen h-screen z-[100] bg-black text-white overflow-hidden font-outfit">
      
      {/* Nút thoát */}
      <Link 
        href="/dashboard" 
        className="absolute top-6 left-6 z-[110] flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all group shadow-lg"
      >
         <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
         <span className="font-bold text-sm tracking-wide">Trở về Tổng quan</span>
      </Link>
      
      {/* 3D Universe Backpack */}
      <div className="w-full h-full relative cursor-none">
        <LearningGalaxy isFullscreen={true} />
      </div>

    </div>
  );
}
