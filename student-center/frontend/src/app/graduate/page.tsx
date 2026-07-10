"use client";

import dynamic from 'next/dynamic';
import Link from "next/link";

const PortfolioApp = dynamic(() => import("../../portfolio/App"), { ssr: false });

export default function GraduatePortfolio() {
  return (
    <div className="relative w-full h-full min-h-screen bg-[#faedeb]">
      <PortfolioApp />
    </div>
  );
}
