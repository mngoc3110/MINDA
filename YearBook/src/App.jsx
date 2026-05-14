// App.jsx — Component gốc, quản lý state toàn cục và routing section
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import Navbar             from './components/Layout/Navbar';
import FloatingMusicPlayer from './components/Layout/FloatingMusicPlayer';
import PetalRain          from './components/Effects/PetalRain';
import HeroSection        from './components/Home/HeroSection';
import MemoryWall         from './components/Home/MemoryWall';
import SignatureWall       from './components/Signature/SignatureWall';
import GalleryWall        from './components/Gallery/GalleryWall';
import SubmitForm         from './components/Form/SubmitForm';

// Utilities
import { initStorage, getMessages } from './utils/storage';

// Khởi tạo dữ liệu mẫu ngay khi load
initStorage();

export default function App() {
  const [section, setSection]       = useState('wall');    // 'wall' | 'signature' | 'gallery'
  const [messages, setMessages]     = useState([]);
  const [formOpen, setFormOpen]     = useState(false);
  const [viewMode, setViewMode]     = useState('public');  // 'public' | 'teacher'

  // Load messages từ storage
  useEffect(() => {
    setMessages(getMessages());
  }, []);

  // Callback khi học sinh gửi lưu bút mới
  const handleNewMessage = useCallback((newMsg) => {
    setMessages(prev => [newMsg, ...prev]);
  }, []);

  // Callback khi cập nhật tim
  const handleHeartUpdate = useCallback((id, newCount) => {
    setMessages(prev =>
      prev.map(m => m.id === id ? { ...m, hearts: newCount } : m)
    );
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 font-body">
      {/* Hiệu ứng cánh hoa rơi */}
      <PetalRain count={30} duration={15000} />

      {/* Thanh điều hướng */}
      <Navbar
        onOpenForm={() => setFormOpen(true)}
        activeSection={section}
        onNav={setSection}
      />

      {/* Nội dung chính */}
      <main>
        <AnimatePresence mode="wait">
          {section === 'wall' ? (
            <motion.div
              key="wall"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Banner chào mừng */}
              <HeroSection
                totalMessages={messages.length}
                onOpenForm={() => setFormOpen(true)}
              />

              {/* Tường lưu bút */}
              <MemoryWall
                messages={messages}
                viewMode={viewMode}
                onHeartUpdate={handleHeartUpdate}
              />
            </motion.div>
          ) : section === 'gallery' ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-24"
            >
              <GalleryWall />
            </motion.div>
          ) : (
            <motion.div
              key="signature"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-24"
            >
              <SignatureWall />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Form gửi lưu bút (modal) */}
      <SubmitForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleNewMessage}
      />

      {/* Music Player nổi */}
      <FloatingMusicPlayer />

      {/* ── Nút gạt giả lập góc nhìn (Dành cho Dev/Demo) ── */}
      <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-float border border-pink-100 flex items-center gap-2">
        <span className="text-xs font-body font-700 text-ink/60 hidden sm:block">Góc nhìn:</span>
        <div className="flex bg-cream-100 rounded-full p-1 relative">
          <button
            onClick={() => setViewMode('public')}
            className={`relative z-10 px-3 py-1 rounded-full text-xs font-body font-600 transition-colors ${
              viewMode === 'public' ? 'text-white' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Khách
          </button>
          <button
            onClick={() => setViewMode('teacher')}
            className={`relative z-10 px-3 py-1 rounded-full text-xs font-body font-600 transition-colors ${
              viewMode === 'teacher' ? 'text-white' : 'text-ink/60 hover:text-ink'
            }`}
          >
            Thầy giáo
          </button>
          
          {/* Active Pill Background */}
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-pink-500 rounded-full transition-transform duration-300"
            style={{
              transform: viewMode === 'public' ? 'translateX(0)' : 'translateX(100%)',
              left: viewMode === 'public' ? '4px' : '0' // bù trừ padding
            }}
          />
        </div>
      </div>
    </div>
  );
}
