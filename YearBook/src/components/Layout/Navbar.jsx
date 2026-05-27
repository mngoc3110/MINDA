// Thanh điều hướng chính
import { useState, useEffect } from 'react';
import { BookOpen, PenLine, Music, Hash, Copy, Check } from 'lucide-react';

export default function Navbar({ onOpenForm, activeSection, onNav, onBackToDashboard, backButtonLabel = 'Quản lý Sổ', yearbookId }) {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!yearbookId) return;
    navigator.clipboard.writeText(yearbookId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        <div className="flex items-center gap-3">
          {/* Nút về trang chủ */}
          <a 
            href="/" 
            title="Về Trang Chủ MINDA"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-cream-100 text-ink/60 hover:bg-rose-soft hover:text-pink-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </a>

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
        </div>

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

        {/* Buttons on the right */}
        <div className="flex items-center gap-2">
          {/* Mã sổ — học sinh copy nhanh */}
          {yearbookId && (
            <button
              onClick={handleCopyCode}
              title="Copy mã sổ"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-700 border transition-all duration-200 ${
                copied
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-cream-100 text-ink/60 border-cream-200 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200'
              }`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Đã chép!' : yearbookId}
            </button>
          )}

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-body font-700 text-pink-600 hover:bg-pink-50 rounded-full transition-colors border border-pink-100 bg-white"
            >
              {backButtonLabel}
            </button>
          )}
          
          {/* Nút gửi lưu bút — luôn hiện */}
          <button
            onClick={onOpenForm}
            className="btn-primary text-sm gap-1.5"
          >
            <PenLine size={15} />
            <span className="hidden sm:inline">Gửi lưu bút</span>
            <span className="sm:hidden">Gửi</span>
          </button>
        </div>
      </nav>

      {/* Nav mobile bottom */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-cream-200">
        {/* Row 1: Mã sổ + Đổi sổ (student only) */}
        {yearbookId && (
          <div className="flex items-center justify-between px-4 py-1.5 border-b border-cream-100">
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-700 border transition-all ${
                copied
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-cream-100 text-ink/60 border-cream-200'
              }`}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Đã chép!' : `Mã: ${yearbookId}`}
            </button>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="text-xs font-body font-600 text-pink-500 px-3 py-1 rounded-full bg-pink-50"
              >
                {backButtonLabel}
              </button>
            )}
          </div>
        )}

        {/* Row 2: Nav tabs */}
        <div className="flex">
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
          {!yearbookId && onBackToDashboard && (
            <MobileNavBtn
              icon="←"
              label={backButtonLabel}
              active={false}
              onClick={onBackToDashboard}
            />
          )}
        </div>
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
