// Memory Wall — tường lưu bút, hiển thị tất cả card theo dạng masonry grid
import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MessageCard from './MessageCard';
import SearchBar from './SearchBar';

export default function MemoryWall({ messages, onHeartUpdate, viewMode = 'public' }) {
  const [search, setSearch] = useState('');

  // Lọc theo tên học sinh và Quyền riêng tư (viewMode)
  const filtered = useMemo(() => {
    // 1. Lọc quyền riêng tư
    const privacyFiltered = messages.filter(m => 
      viewMode === 'teacher' ? true : m.isPublic !== false
    );

    // 2. Lọc theo tìm kiếm
    if (!search.trim()) return privacyFiltered;
    const q = search.toLowerCase().trim();
    return privacyFiltered.filter(m =>
      m.name.toLowerCase().includes(q)
    );
  }, [messages, search, viewMode]);

  return (
    <section className="max-w-6xl mx-auto px-4 pb-28">

      {/* Tiêu đề section */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
          💌 Tường Lưu Bút
        </h2>
        <p className="text-ink/50 font-body text-sm">
          {messages.length} lời nhắn yêu thương đã được gửi
        </p>
      </div>

      {/* Thanh tìm kiếm */}
      <SearchBar
        value={search}
        onChange={setSearch}
        resultCount={filtered.length}
        total={messages.length}
      />

      {/* Grid masonry */}
      {filtered.length > 0 ? (
        <div className="masonry-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((msg, idx) => (
              <div key={msg.id} className="masonry-item">
                <MessageCard
                  message={msg}
                  onHeartUpdate={onHeartUpdate}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Trạng thái trống */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🔍</div>
          <p className="font-display text-xl text-ink/50 mb-2">
            Không tìm thấy lưu bút nào
          </p>
          <p className="font-body text-sm text-ink/30">
            Thử tìm với tên khác nhé!
          </p>
        </motion.div>
      )}
    </section>
  );
}
