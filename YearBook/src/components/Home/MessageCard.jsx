// Card lưu bút — click để mở modal xem chi tiết đầy đủ
import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Maximize2, Film, Lock } from 'lucide-react';
import { formatDate, getInitials } from '../../utils/helpers';
import { updateHearts, toggleLike, isLiked } from '../../utils/storage';

const HEART_EMOJIS = ['❤️', '💕', '💖', '💗', '💓', '🩷'];

export default function MessageCard({ message, onHeartUpdate }) {
  const [hearts, setHearts]     = useState(message.hearts);
  const [liked, setLiked]       = useState(isLiked(message.id));
  const [particles, setParticles] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);  // modal xem chi tiết
  const heartBtnRef = useRef(null);

  // ── Nút Thương thương ──
  const handleHeart = useCallback((e) => {
    e.stopPropagation(); // không mở modal khi bấm tim
    const newLiked  = toggleLike(message.id);
    const newHearts = hearts + (newLiked ? 1 : -1);
    setLiked(newLiked);
    setHearts(newHearts);
    updateHearts(message.id, newHearts);
    onHeartUpdate?.(message.id, newHearts);

    if (newLiked) {
      const burst = Array.from({ length: 6 }, (_, i) => ({
        id:    Date.now() + i,
        emoji: HEART_EMOJIS[i % HEART_EMOJIS.length],
        x:     (Math.random() - 0.5) * 80,
        y:     -(20 + Math.random() * 40),
      }));
      setParticles(p => [...p, ...burst]);
      setTimeout(() => setParticles(p => p.filter(x => !burst.find(b => b.id === x.id))), 900);
    }
  }, [hearts, liked, message.id]);

  const isLong = message.message.length > 160;

  return (
    <>
      {/* ── Card ── */}
      <motion.article
        layout
        initial={{ opacity: 0, y: 28, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="memory-card masonry-item cursor-pointer select-none"
        style={{ backgroundColor: message.bgColor || '#ffffff' }}
        onClick={() => setModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setModalOpen(true)}
        aria-label={`Xem lưu bút của ${message.name}`}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 p-4 pb-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 shadow-sm border-2 border-white"
            style={{ background: 'rgba(255,255,255,0.7)' }}
          >
            {message.emoji || getInitials(message.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-body font-700 text-ink text-sm leading-tight truncate flex items-center gap-2">
              {message.name}
              {message.isPublic === false && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-pink-600 rounded text-[10px] uppercase tracking-wider border border-pink-100" title="Lời nhắn gửi riêng">
                  <Lock size={10} /> Riêng tư
                </span>
              )}
            </p>
            <div className="flex items-center gap-1 text-ink/40">
              <Calendar size={10} />
              <span className="text-xs font-body">{formatDate(message.date)}</span>
            </div>
          </div>
          {/* Hint icon — mở rộng */}
          <Maximize2 size={13} className="text-ink/25 flex-shrink-0" />
        </div>

        {/* Thumbnail ảnh/video (nhỏ, không tương tác) */}
        {message.imageBase64 && (
          <div className="mx-4 mt-3 rounded-xl overflow-hidden pointer-events-none">
            {message.mediaType === 'video' ? (
              <div className="relative bg-black/80 rounded-xl flex items-center justify-center h-32">
                <span className="text-3xl">🎬</span>
                <div className="absolute bottom-1 right-2 text-white text-xs font-body opacity-60">Video</div>
              </div>
            ) : (
              <img
                src={message.imageBase64}
                alt={`Ảnh của ${message.name}`}
                className="w-full object-cover max-h-40"
                loading="lazy"
              />
            )}
          </div>
        )}

        {/* Preview lời nhắn (cắt ngắn) */}
        <div className="p-4 pb-2">
          <p className="font-body text-ink/75 text-sm leading-relaxed">
            {isLong ? `${message.message.slice(0, 160)}…` : message.message}
          </p>
          {isLong && (
            <span className="text-xs text-pink-400 font-body font-600 mt-1 inline-block">
              Xem đầy đủ →
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/5">
          <div className="relative" ref={heartBtnRef}>
            <button
              onClick={handleHeart}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-600 transition-all duration-200 ${
                liked
                  ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  : 'bg-black/5 text-ink/50 hover:bg-pink-50 hover:text-pink-500'
              }`}
            >
              <span className={`text-base transition-transform ${liked ? 'scale-125' : 'scale-100'}`}>
                {liked ? '❤️' : '🤍'}
              </span>
              <span>{hearts > 0 ? hearts : ''} Thương</span>
            </button>

            <AnimatePresence>
              {particles.map(p => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.75, ease: 'easeOut' }}
                  className="absolute pointer-events-none text-base select-none"
                  style={{ left: '50%', top: '50%' }}
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>

          <span className="text-lg opacity-60">{message.emoji}</span>
        </div>
      </motion.article>

      {/* ── Modal chi tiết — dùng createPortal ── */}
      {modalOpen && createPortal(
        <DetailModal
          message={message}
          hearts={hearts}
          liked={liked}
          onHeart={handleHeart}
          onClose={() => setModalOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
//  Modal xem chi tiết lưu bút
// ─────────────────────────────────────────────────────────────────────
function DetailModal({ message, hearts, liked, onHeart, onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        key="detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="detail-card"
          initial={{ opacity: 0, scale: 0.88, y: 32 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 32 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
          style={{ backgroundColor: message.bgColor || '#ffffff' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Nút đóng */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-ink/70" />
          </button>

          {/* Ảnh / Video full width */}
          {message.imageBase64 && (
            <div className="w-full overflow-hidden rounded-t-3xl">
              {message.mediaType === 'video' ? (
                <video
                  src={message.imageBase64}
                  controls
                  playsInline
                  autoPlay={false}
                  className="w-full max-h-72 bg-black object-contain"
                />
              ) : (
                <img
                  src={message.imageBase64}
                  alt={`Ảnh của ${message.name}`}
                  className="w-full max-h-72 object-cover"
                />
              )}
            </div>
          )}

          {/* Body */}
          <div className="p-6">
            {/* Avatar + Tên */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl flex-shrink-0 shadow-md border-4 border-white"
                style={{ background: 'rgba(255,255,255,0.8)' }}
              >
                {message.emoji || getInitials(message.name)}
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink leading-tight">
                  {message.name}
                </h3>
                <div className="flex items-center gap-1.5 text-ink/40 mt-0.5">
                  <Calendar size={12} />
                  <span className="text-sm font-body">
                    {new Date(message.date).toLocaleDateString('vi-VN', {
                      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Lời nhắn đầy đủ */}
            <div className="relative">
              {/* Dấu ngoặc trang trí */}
              <span className="absolute -top-2 -left-1 text-5xl text-pink-200 font-display leading-none select-none">
                "
              </span>
              <p className="font-body text-ink/80 text-base leading-relaxed pt-4 px-3">
                {message.message}
              </p>
              <span className="text-5xl text-pink-200 font-display leading-none select-none float-right -mt-4">
                "
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t border-black/8">
            <button
              onClick={onHeart}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-700 text-sm transition-all duration-200 active:scale-95 ${
                liked
                  ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                  : 'bg-black/6 text-ink/50 hover:bg-pink-50 hover:text-pink-500'
              }`}
            >
              <span className={`text-lg transition-transform ${liked ? 'scale-125' : 'scale-100'}`}>
                {liked ? '❤️' : '🤍'}
              </span>
              {hearts > 0 ? hearts : ''} Thương thương
            </button>

            <span className="text-3xl">{message.emoji}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
