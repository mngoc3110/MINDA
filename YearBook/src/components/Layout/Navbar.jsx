// Thanh điều hướng chính
import { useState, useEffect } from 'react';
import { BookOpen, PenLine, Music, Hash } from 'lucide-react';

export default function Navbar({ onOpenForm, activeSection, onNav }) {
  const [scrolled, setScrolled] = useState(false);

  // Hiệu ứng thu nhỏ navbar khi cuộn xuống
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'py-2 bg-white/80 backdrop-blur-lg shadow-sm border-b border-rose-soft/50'
          : 'py-4 bg-transparent'
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">

        {/* Logo / Tên trang */}
        <button
          onClick={() => onNav('wall')}
          className="flex items-center gap-2 group"
        >
          <span className="text-2xl group-hover:rotate-12 transition-transform duration-300">📖</span>
          <div className="hidden sm:block">
            <p className="font-display font-bold text-ink text-lg leading-tight">
              Lưu Bút <span className="gradient-text">Kỷ Yếu</span>
            </p>
            <p className="text-ink/40 text-xs font-body">Kỹ Thuật Số · 2026</p>
          </div>
        </button>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1">
          <NavBtn
            icon={<BookOpen size={15} />}
            label="Lưu bút"
            active={activeSection === 'wall'}
            onClick={() => onNav('wall')}
          />
          <NavBtn
            icon={<span className="text-sm">🖼️</span>}
            label="Thư Viện"
            active={activeSection === 'gallery'}
            onClick={() => onNav('gallery')}
          />
          <NavBtn
            icon={<Hash size={15} />}
            label="Chữ ký"
            active={activeSection === 'signature'}
            onClick={() => onNav('signature')}
          />
        </div>

        {/* Nút gửi lưu bút — luôn hiện */}
        <button
          onClick={onOpenForm}
          className="btn-primary text-sm gap-1.5"
        >
          <PenLine size={15} />
          <span>Gửi lưu bút</span>
        </button>
      </nav>

      {/* Nav mobile bottom */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-lg border-t border-cream-200 flex">
        <MobileNavBtn
          icon="📖"
          label="Lưu bút"
          active={activeSection === 'wall'}
          onClick={() => onNav('wall')}
        />
        <MobileNavBtn
          icon="🖼️"
          label="Thư Viện"
          active={activeSection === 'gallery'}
          onClick={() => onNav('gallery')}
        />
        <button
          onClick={onOpenForm}
          className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
        >
          <span className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white -mt-5 shadow-float border-2 border-white">
            <PenLine size={16} />
          </span>
          <span className="text-xs text-pink-500 font-body font-600">Gửi</span>
        </button>
        <MobileNavBtn
          icon="✍️"
          label="Chữ ký"
          active={activeSection === 'signature'}
          onClick={() => onNav('signature')}
        />
      </div>
    </header>
  );
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body font-600 transition-all duration-200 ${
        active
          ? 'bg-rose-soft text-pink-600'
          : 'text-ink/60 hover:bg-cream-100 hover:text-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavBtn({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
        active ? 'text-pink-500' : 'text-ink/40'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-body">{label}</span>
    </button>
  );
}
