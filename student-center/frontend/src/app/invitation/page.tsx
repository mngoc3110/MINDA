"use client";

import { useState } from "react";

function InvitationContent() {
  // Trạng thái trang hiện tại (1 đến 6)
  const [currentPage, setCurrentPage] = useState(1);

  const nextPage = () => setCurrentPage(p => p < 6 ? p + 1 : 1);
  const prevPage = () => setCurrentPage(p => p > 1 ? p - 1 : 6);

  return (
    <div className="min-h-screen bg-[#c8e1f5] p-4 sm:p-8 flex flex-col items-center">
      
      {/* Nút điều hướng */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={prevPage} type="button" className="px-4 py-2 bg-white rounded-full shadow hover:bg-gray-50 font-bold text-gray-700">
          ← Trang trước
        </button>
        <span className="font-bold text-gray-700">Trang {currentPage} / 6</span>
        <button onClick={nextPage} type="button" className="px-4 py-2 bg-white rounded-full shadow hover:bg-gray-50 font-bold text-gray-700">
          Trang sau →
        </button>
      </div>

      {/* Container thiệp - Render tất cả ảnh và dùng CSS ẩn hiện */}
      <div className="relative mx-auto group">
        {[1, 2, 3, 4, 5, 6].map((pageNum) => (
          <img 
            key={pageNum}
            src={`/thiep/${pageNum}.png`} 
            alt={`Graduation Invitation Page ${pageNum}`}
            className={`max-h-[85vh] w-auto max-w-[95vw] block rounded-xl shadow-2xl transition-opacity duration-300 ${
              currentPage === pageNum ? 'block' : 'hidden'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <div className="min-h-screen bg-[#c8e1f5]">
      <title>Thiệp Mời Lễ Tốt Nghiệp</title>
      <InvitationContent />
    </div>
  );
}
