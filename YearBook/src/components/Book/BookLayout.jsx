import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Printer, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CoverDesigner from './CoverDesigner';
import StudentPage from './StudentPage';
import StickerToolbar from './StickerToolbar';

export default function BookLayout({ yearbook, viewMode, userRole, onUpdateYearbook }) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1...N = Pages
  const [isEditing, setIsEditing] = useState(false);

  // Lọc các trang hiển thị (Giáo viên xem tất cả, Học sinh chỉ xem trang public)
  const visiblePages = yearbook.pages ? yearbook.pages.filter(page => {
    if (userRole === 'teacher' || userRole === 'admin') return true;
    return page.content?.isPublic !== false;
  }) : [];

  const prevPagesLengthRef = useRef(visiblePages.length);
  const totalPages = visiblePages.length + 1; // +1 for cover

  // Reset page when yearbook changes (ID change)
  useEffect(() => {
    setCurrentPage(0);
    prevPagesLengthRef.current = visiblePages.length;
  }, [yearbook.id]);

  // Auto-flip to new message
  useEffect(() => {
    const currentLength = visiblePages.length;
    if (currentLength > prevPagesLengthRef.current) {
      setCurrentPage(1);
    }
    prevPagesLengthRef.current = currentLength;
  }, [visiblePages.length]);

  const handleUpdateCover = (newCover) => {
    onUpdateYearbook({ cover: newCover });
  };

  const handleUpdatePage = (pageId, newPageData) => {
    const newPages = yearbook.pages.map(p => p.id === pageId ? newPageData : p);
    onUpdateYearbook({ pages: newPages });
  };

  const handleAddSticker = (stickerTemplate) => {
    const newSticker = {
      ...stickerTemplate,
      id: 'sticker_' + Date.now(),
      x: 100,
      y: 100,
      width: 80,
      height: 80
    };

    if (currentPage === 0) {
      handleUpdateCover({
        ...yearbook.cover,
        stickers: [...(yearbook.cover.stickers || []), newSticker]
      });
    } else {
      const page = visiblePages[currentPage - 1];
      handleUpdatePage(page.id, {
        ...page,
        stickers: [...(page.stickers || []), newSticker]
      });
    }
  };

  const goToPrev = () => setCurrentPage(p => Math.max(0, p - 1));
  const goToNext = () => setCurrentPage(p => Math.min(totalPages - 1, p + 1));

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col print:bg-white print:block">
      {/* Thanh công cụ Top (Ẩn khi in) */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 px-4 py-3 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <input
              type="text"
              value={yearbook.title || ''}
              onChange={(e) => onUpdateYearbook({ title: e.target.value })}
              className="font-display font-bold text-xl text-ink bg-transparent border-b-2 border-dashed border-ink/30 focus:outline-none focus:border-ink/60"
            />
          ) : (
            <h2 className="font-display font-bold text-xl text-ink">
              {yearbook.title}
            </h2>
          )}
          <span className="text-sm font-body text-ink/60 bg-cream-50 px-2 py-1 rounded-md">
            Trang {currentPage === 0 ? 'Bìa' : `${currentPage} / ${totalPages - 1}`}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="btn-ghost px-4 py-2 text-xs"
          >
            <Printer size={16} /> In Sách
          </button>
          
          {/* Quyền Edit: Admin/Teacher luôn được sửa. Student chỉ được sửa Sổ cá nhân. */}
          {(userRole === 'teacher' || userRole === 'admin' || yearbook.type === 'personal') && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`btn-primary px-4 py-2 text-xs ${isEditing ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : ''}`}
            >
              {isEditing ? <><Check size={16} /> Lưu thiết kế</> : <><Edit3 size={16} /> Thiết kế trang này</>}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col md:flex-row gap-8 items-start justify-center print:p-0 print:block">
        
        {/* Vùng hiển thị Trang Sách */}
        <div className="flex-1 w-full max-w-2xl relative flex flex-col items-center print:max-w-none print:w-full print:block">
          
          {/* Vùng in ấn: Hiển thị TẤT CẢ CÁC TRANG khi in */}
          <div className="hidden print:block w-full">
            <div className="break-after-page mb-8">
              <CoverDesigner coverData={yearbook.cover} onUpdateCover={handleUpdateCover} isEditing={false} />
            </div>
            {visiblePages.map((page, idx) => (
              <div key={page.id} className="break-after-page mb-8 page-break-inside-avoid">
                <StudentPage 
                  pageData={{ ...page, pageIndex: idx + 1 }} 
                  onUpdatePage={(newData) => handleUpdatePage(page.id, newData)} 
                  isEditing={false} 
                />
              </div>
            ))}
          </div>

          {/* Vùng xem bình thường (Trên màn hình) */}
          <div className="w-full relative shadow-2xl rounded-md print:hidden perspective-1000">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="w-full h-full origin-left"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {currentPage === 0 ? (
                  <CoverDesigner 
                    coverData={yearbook.cover || { stickers: [] }} 
                    onUpdateCover={handleUpdateCover} 
                    isEditing={isEditing} 
                  />
                ) : (
                  <StudentPage 
                    pageData={{ ...visiblePages[currentPage - 1], pageIndex: currentPage }} 
                    onUpdatePage={(newData) => handleUpdatePage(visiblePages[currentPage - 1].id, newData)} 
                    isEditing={isEditing} 
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Điều hướng trang (Ẩn khi in) */}
          <div className="flex items-center gap-6 mt-8 print:hidden">
            <button 
              onClick={goToPrev} 
              disabled={currentPage === 0}
              className="p-3 rounded-full bg-white shadow-sm border border-pink-100 text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pink-50 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="font-body font-600 text-ink/70">
              {currentPage === 0 ? 'Trang Bìa' : `Trang ${currentPage}`}
            </span>
            <button 
              onClick={goToNext}
              disabled={currentPage === totalPages - 1}
              className="p-3 rounded-full bg-white shadow-sm border border-pink-100 text-pink-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pink-50 hover:scale-110 active:scale-95 transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Sticker Toolbar (Chỉ hiện khi đang Edit) */}
        {isEditing && (
          <div className="w-full md:w-auto md:sticky md:top-24 animate-fade-in-up print:hidden">
            <StickerToolbar onAddSticker={handleAddSticker} />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
          .break-after-page {
            page-break-after: always;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          /* Ẩn bớt các hiệu ứng cánh hoa không cần thiết khi in */
          .petal {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
