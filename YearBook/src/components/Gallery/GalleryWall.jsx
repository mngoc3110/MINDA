// Trang Thư Viện Ảnh & Video — gallery grid toàn bộ media từ lưu bút
// Hỗ trợ: xem ảnh/video full màn hình, lọc theo loại, upload thêm
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Film, Camera, Play, Download, ZoomIn } from 'lucide-react';
import { getMessages } from '../../utils/storage';
import { fileToBase64, formatDate, generateId } from '../../utils/helpers';

// ─────────────────────────────────────────────────────────
//  Hằng số
// ─────────────────────────────────────────────────────────
const GALLERY_KEY = 'yearbook_gallery_extra';
const FILTERS = [
  { key: 'all',   label: 'Tất cả', icon: '🖼️' },
  { key: 'image', label: 'Ảnh',    icon: '📸' },
  { key: 'video', label: 'Video',  icon: '🎬' },
];

function loadGalleryExtra() {
  try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || '[]'); }
  catch { return []; }
}
function saveGalleryExtra(items) {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(items));
}

// ─────────────────────────────────────────────────────────
//  Component chính
// ─────────────────────────────────────────────────────────
export default function GalleryWall() {
  const [allMedia, setAllMedia]   = useState([]);
  const [filter, setFilter]       = useState('all');
  const [lightboxIdx, setLightboxIdx] = useState(null); // FIX: null = đóng
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const uploadRef = useRef(null);

  // ── Load tất cả media ──
  useEffect(() => {
    const fromMessages = getMessages()
      .filter(m => m.imageBase64)
      .map(m => ({
        id:      m.id,
        src:     m.imageBase64,
        type:    m.mediaType || 'image',
        author:  m.name,
        date:    m.date,
        caption: m.message?.slice(0, 80) + (m.message?.length > 80 ? '…' : ''),
        source:  'message',
      }));
    const extra = loadGalleryExtra();
    setAllMedia(
      [...extra, ...fromMessages].sort((a, b) => new Date(b.date) - new Date(a.date))
    );
  }, []);

  // ── Mảng đã lọc ──
  const filtered = allMedia.filter(m => filter === 'all' || m.type === filter);

  // ── Upload ──
  const handleFiles = async (files) => {
    setUploading(true);
    const newItems = [];
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) continue;
      const maxMB = isVideo ? 50 : 10;
      if (file.size > maxMB * 1024 * 1024) {
        alert(`"${file.name}" quá lớn (tối đa ${maxMB}MB)`);
        continue;
      }
      const src = await fileToBase64(file);
      newItems.push({
        id:      generateId(),
        src,
        type:    isVideo ? 'video' : 'image',
        author:  'Thầy/Cô',
        date:    new Date().toISOString(),
        caption: file.name.replace(/\.[^.]+$/, ''),
        source:  'extra',
      });
    }
    if (newItems.length > 0) {
      const extra = [...newItems, ...loadGalleryExtra()];
      saveGalleryExtra(extra);
      setAllMedia(prev => [...newItems, ...prev]);
    }
    setUploading(false);
  };

  // ── Lightbox controls ──
  const openLightbox  = useCallback((idx) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevItem = useCallback(() =>
    setLightboxIdx(i => (i - 1 + filtered.length) % filtered.length),
  [filtered.length]);
  const nextItem = useCallback(() =>
    setLightboxIdx(i => (i + 1) % filtered.length),
  [filtered.length]);

  const handleDownload = useCallback((item) => {
    const a = document.createElement('a');
    a.href     = item.src;
    a.download = `${item.author}-${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
    a.click();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 pb-32">

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
          🖼️ Thư Viện Ảnh &amp; Video
        </h2>
        <p className="text-ink/50 font-body text-sm">
          {allMedia.filter(m => m.type === 'image').length} ảnh ·{' '}
          {allMedia.filter(m => m.type === 'video').length} video
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className={`relative mb-8 border-2 border-dashed rounded-2xl transition-all duration-200 ${
          dragOver
            ? 'border-pink-400 bg-rose-soft/60 scale-[1.01]'
            : 'border-cream-300 bg-cream-50/60 hover:border-pink-300 hover:bg-rose-soft/20'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => uploadRef.current?.click()}
      >
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6 px-4 cursor-pointer select-none">
          <div className={`text-4xl transition-transform ${dragOver ? 'scale-125' : ''}`}>
            {uploading ? '⏳' : '📁'}
          </div>
          <div className="text-center sm:text-left">
            <p className="font-body font-700 text-ink/70 text-sm">
              {uploading ? 'Đang tải lên…' : 'Kéo thả ảnh/video vào đây để thêm vào thư viện'}
            </p>
            <p className="font-body text-xs text-ink/40 mt-0.5">
              hoặc{' '}
              <span className="text-pink-500 underline">chọn file từ thiết bị</span>
              {' '}· Nhiều file cùng lúc · Ảnh ≤10MB · Video ≤50MB
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-full text-xs font-body text-ink/50 border border-cream-200">
              <Camera size={11} /> Ảnh
            </span>
            <span className="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-full text-xs font-body text-ink/50 border border-cream-200">
              <Film size={11} /> Video
            </span>
          </div>
        </div>
        <input
          ref={uploadRef}
          type="file"
          multiple
          accept="image/*,video/mp4,video/webm,video/quicktime,.mov"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body font-600 transition-all duration-200 ${
              filter === f.key
                ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md'
                : 'bg-white/80 text-ink/60 border border-cream-200 hover:border-pink-200 hover:text-ink'
            }`}
          >
            <span>{f.icon}</span>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ml-0.5 ${
              filter === f.key ? 'bg-white/20' : 'bg-cream-200/80'
            }`}>
              {f.key === 'all'
                ? allMedia.length
                : allMedia.filter(m => m.type === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence>
            {filtered.map((item, idx) => (
              <GalleryTile
                key={item.id}
                item={item}
                index={idx}
                onOpen={() => openLightbox(idx)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌅</div>
          <p className="font-display text-xl text-ink/40 mb-1">
            Chưa có {filter !== 'all' ? (filter === 'image' ? 'ảnh' : 'video') : 'media'} nào
          </p>
          <p className="font-body text-sm text-ink/30">
            Kéo thả ảnh/video vào ô upload ở trên nhé!
          </p>
        </div>
      )}

      {/* ── FIX: Lightbox dùng createPortal — thoát ra ngoài DOM tree ── */}
      {lightboxIdx !== null && filtered[lightboxIdx] &&
        createPortal(
          <Lightbox
            items={filtered}
            currentIdx={lightboxIdx}
            onClose={closeLightbox}
            onPrev={prevItem}
            onNext={nextItem}
            onJump={setLightboxIdx}
            onDownload={handleDownload}
          />,
          document.body
        )
      }
    </section>
  );
}

// ─────────────────────────────────────────────────────────
//  Tile trong grid
// ─────────────────────────────────────────────────────────
function GalleryTile({ item, index, onOpen }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 280, damping: 22 }}
      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-card
                 hover:shadow-paper-hover hover:-translate-y-1 transition-all duration-300"
      // FIX: dùng onOpen thay vì onClick trực tiếp để tránh nhầm tên prop
      onClick={onOpen}
    >
      {item.type === 'video' ? (
        <>
          <video
            src={item.src}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
            playsInline
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/35 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-float group-hover:scale-110 transition-transform">
              <Play size={20} className="text-pink-500 ml-1" />
            </div>
          </div>
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs font-body px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
            <Film size={9} /> Video
          </div>
        </>
      ) : (
        <>
          <img
            src={item.src}
            alt={item.caption}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <ZoomIn size={26} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </>
      )}

      {/* Tên tác giả hiện khi hover */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/65 to-transparent
                      px-2 pb-2 pt-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-white text-xs font-body font-600 truncate">{item.author}</p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────
//  Lightbox — render qua createPortal lên document.body
// ─────────────────────────────────────────────────────────
function Lightbox({ items, currentIdx, onClose, onPrev, onNext, onJump, onDownload }) {
  const item = items[currentIdx];

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrev, onNext, onClose]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        // FIX: overlay click đóng lightbox — dùng e.target check tránh đóng do child
        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{ isolation: 'isolate' }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{item.type === 'video' ? '🎬' : '📸'}</span>
            <div>
              <p className="text-white text-sm font-body font-700">{item.author}</p>
              <p className="text-white/40 text-xs font-body">{formatDate(item.date)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs font-body">
              {currentIdx + 1} / {items.length}
            </span>
            <button
              onClick={() => onDownload(item)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              title="Tải về"
            >
              <Download size={15} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              title="Đóng (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Media area */}
        <div
          className="flex-1 flex items-center justify-center relative px-14 min-h-0 overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, scale: 0.92, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.92, x: -30 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="flex items-center justify-center max-w-full max-h-full"
            >
              {item.type === 'video' ? (
                <video
                  src={item.src}
                  controls
                  autoPlay
                  playsInline
                  className="max-w-full rounded-xl shadow-2xl"
                  style={{ maxHeight: 'calc(100vh - 220px)' }}
                />
              ) : (
                <img
                  src={item.src}
                  alt={item.caption || item.author}
                  className="max-w-full rounded-xl shadow-2xl object-contain"
                  style={{ maxHeight: 'calc(100vh - 220px)' }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Nút Prev */}
          <button
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                       bg-white/10 hover:bg-white/30 flex items-center justify-center
                       text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Nút Next */}
          <button
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full
                       bg-white/10 hover:bg-white/30 flex items-center justify-center
                       text-white transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Caption + Filmstrip */}
        <div
          className="flex-shrink-0 px-4 pt-2 pb-4"
          onClick={e => e.stopPropagation()}
        >
          {item.caption && (
            <p className="text-white/60 text-sm font-body text-center mb-3 max-w-xl mx-auto italic">
              "{item.caption}"
            </p>
          )}

          {/* FIX: Filmstrip — onClick truyền đúng index i */}
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {items.map((m, i) => (
              <button
                key={m.id}
                onClick={() => onJump(i)}   // FIX: navigate tới đúng item
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === currentIdx
                    ? 'border-pink-400 scale-110 opacity-100'
                    : 'border-white/20 opacity-50 hover:opacity-80 hover:border-white/40'
                }`}
              >
                {m.type === 'video' ? (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <Play size={12} className="text-white" />
                  </div>
                ) : (
                  <img src={m.src} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


