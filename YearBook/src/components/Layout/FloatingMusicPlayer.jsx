// Trình phát nhạc nổi — floating music player ở góc dưới
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, Music, ChevronDown, ChevronUp } from 'lucide-react';

// Danh sách nhạc mặc định (file audio public hoặc link)
const PLAYLIST = [
  { title: 'Thầy Cô Là Tất Cả', artist: 'Nhạc học đường', src: null },
  { title: 'Bạn Bè Tôi', artist: 'Hoài niệm tuổi thơ', src: null },
  { title: 'Ngày Đầu Tiên Đi Học', artist: 'Ký ức trường xưa', src: null },
  { title: 'Những Ngày Đẹp Nhất', artist: 'Thanh xuân', src: null },
];

export default function FloatingMusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const currentSong = PLAYLIST[currentIdx];

  // Cập nhật progress bar
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => handleNext();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [currentIdx]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !currentSong.src) {
      // Không có file audio thật — toggle animation chỉ để demo
      setIsPlaying(p => !p);
      return;
    }
    if (isPlaying) { audio.pause(); setIsPlaying(false); }
    else           { audio.play(); setIsPlaying(true); }
  };

  const handleNext = () => {
    setCurrentIdx(i => (i + 1) % PLAYLIST.length);
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="music-player-mini">
      {/* Audio element ẩn */}
      {currentSong.src && (
        <audio ref={audioRef} src={currentSong.src} />
      )}

      <div className="glass-card overflow-hidden transition-all duration-300 border border-white/70"
           style={{ width: expanded ? '220px' : 'auto' }}>

        {/* Header luôn hiện — nút thu gọn / mở rộng */}
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Icon nhạc — xoay khi đang phát */}
          <div className={`text-lg ${isPlaying ? 'animate-spin-slow' : ''}`}>
            🎵
          </div>

          {expanded && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-body font-700 text-ink truncate">
                {currentSong.title}
              </p>
              <p className="text-xs text-ink/40 truncate">{currentSong.artist}</p>
            </div>
          )}

          {/* Controls */}
          <button
            onClick={handlePlayPause}
            className="w-7 h-7 rounded-full bg-pink-100 hover:bg-pink-200 flex items-center justify-center text-pink-500 transition-colors"
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>

          {expanded && (
            <button
              onClick={handleNext}
              className="w-7 h-7 rounded-full hover:bg-cream-100 flex items-center justify-center text-ink/50 transition-colors"
            >
              <SkipForward size={12} />
            </button>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className="w-6 h-6 flex items-center justify-center text-ink/40 hover:text-ink transition-colors"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Progress bar */}
        {expanded && (
          <div className="px-3 pb-2.5">
            <div className="h-1 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-ink/30 mt-1.5 font-body text-center">
              {currentSong.src ? '' : '♩ Thêm file nhạc vào /public/audio/'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
