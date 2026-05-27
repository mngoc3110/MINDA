// Hero Section — banner chào mừng ở đầu trang
import { motion } from 'framer-motion';
import { PenLine, Heart } from 'lucide-react';

export default function HeroSection({ totalMessages, onOpenForm, onGoToSignature }) {
  return (
    <section className="relative pt-28 pb-16 px-4 overflow-hidden">

      {/* Nền gradient pastel */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-soft via-cream-50 to-cream-50" />
        {/* Blobs trang trí */}
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-48 h-48 bg-sky-pastel/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-cream-200/50 rounded-full blur-2xl" />
      </div>

      <div className="max-w-3xl mx-auto text-center">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-rose-warm/40 rounded-full px-4 py-1.5 mb-6 shadow-sm"
        >
          <span className="text-sm">🎓</span>
          <span className="text-xs font-body font-600 text-pink-600 tracking-wide">
            Kỷ Yếu Lớp · Năm Học 2025–2026
          </span>
        </motion.div>

        {/* Tiêu đề chính */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-4"
        >
          Lưu Bút{' '}
          <span className="gradient-text italic">Kỷ Yếu</span>
          <br />
          <span className="text-3xl sm:text-4xl text-ink/70">Kỹ Thuật Số</span>
        </motion.h1>

        {/* Mô tả */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-body text-ink/60 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8"
        >
          Nơi lưu giữ những khoảnh khắc đẹp nhất, những lời nhắn yêu thương từ
          học sinh gửi đến thầy/cô — ký ức thanh xuân không bao giờ phai.
        </motion.p>

        {/* Thống kê & CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onOpenForm}
            className="btn-primary gap-2 text-base px-8 py-3.5"
          >
            <PenLine size={18} />
            Gửi lời nhắn của bạn
          </button>

          <button
            onClick={onGoToSignature}
            className="btn-ghost gap-2 text-base px-8 py-3.5"
          >
            ✍️ Ghi lưu bút
          </button>


          <div className="flex items-center gap-1.5 text-ink/50 font-body text-sm">
            <Heart size={14} className="text-pink-400 fill-pink-400" />
            <span>
              <strong className="text-ink font-700">{totalMessages}</strong> lời nhắn đã được gửi
            </span>
          </div>
        </motion.div>
      </div>

      {/* Đường kẻ trang trí */}
      <div className="absolute bottom-0 inset-x-0 flex justify-center">
        <svg viewBox="0 0 1200 40" className="w-full text-cream-50" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,20 C300,40 900,0 1200,20 L1200,40 L0,40 Z" />
        </svg>
      </div>
    </section>
  );
}
