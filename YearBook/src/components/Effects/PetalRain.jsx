// Component hiệu ứng cánh hoa anh đào rơi khi vào trang
import { useEffect, useRef, useState } from 'react';

// Các loại cánh hoa / hạt lấp lánh
const PETALS = ['🌸', '🌺', '✨', '🌼', '💫', '⭐'];

function createPetal() {
  return {
    id:       Math.random().toString(36).slice(2),
    emoji:    PETALS[Math.floor(Math.random() * PETALS.length)],
    left:     Math.random() * 100,           // % từ trái
    duration: 4 + Math.random() * 6,         // giây
    delay:    Math.random() * 3,             // giây delay
    size:     0.8 + Math.random() * 0.8,     // em
  };
}

export default function PetalRain({ count = 25, duration = 12000 }) {
  const [petals, setPetals] = useState([]);
  const [visible, setVisible] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    // Tạo cánh hoa ban đầu
    setPetals(Array.from({ length: count }, createPetal));

    // Tự động dừng sau `duration` ms
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timerRef.current);
  }, [enabled]);

  if (!enabled) return (
    <button
      onClick={() => { setEnabled(true); setVisible(true); }}
      className="fixed bottom-28 right-6 z-50 glass-card p-2 text-xl hover:scale-110 transition-transform"
      title="Bật hiệu ứng hoa rơi"
    >
      🌸
    </button>
  );

  return (
    <>
      {/* Nút tắt hiệu ứng */}
      <button
        onClick={() => setEnabled(false)}
        className="fixed bottom-28 right-6 z-50 glass-card px-3 py-1.5 text-xs font-body text-ink/60 hover:text-ink transition-colors"
        title="Tắt hiệu ứng hoa rơi"
      >
        🌸 Tắt
      </button>

      {/* Render cánh hoa */}
      {visible && petals.map(petal => (
        <div
          key={petal.id}
          className="petal select-none"
          style={{
            left:             `${petal.left}%`,
            fontSize:         `${petal.size}rem`,
            animationDuration: `${petal.duration}s`,
            animationDelay:   `${petal.delay}s`,
          }}
        >
          {petal.emoji}
        </div>
      ))}
    </>
  );
}
