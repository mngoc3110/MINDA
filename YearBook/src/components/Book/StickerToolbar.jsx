import { Sticker, Smile, Sparkles, Heart } from 'lucide-react';

const EMOJI_STICKERS = ['🌸', '🎓', '✨', '💖', '📚', '🚀', '🔥', '🎉', '🥺', '😎'];

export default function StickerToolbar({ onAddSticker }) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-pink-100 rounded-2xl p-4 shadow-sm w-full sm:w-64 flex-shrink-0">
      <div className="flex items-center gap-2 mb-4 text-ink font-700 font-body">
        <Sticker size={18} className="text-pink-500" />
        <h3>Kho Sticker</h3>
      </div>
      
      <div className="space-y-4">
        {/* Emojis */}
        <div>
          <h4 className="text-xs text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1 font-600">
            <Smile size={12} /> Cảm xúc
          </h4>
          <div className="grid grid-cols-5 gap-2">
            {EMOJI_STICKERS.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => onAddSticker({ type: 'emoji', src: emoji })}
                className="text-2xl hover:scale-125 transition-transform origin-center aspect-square flex items-center justify-center bg-cream-50 hover:bg-pink-50 rounded-lg cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Text Stickers */}
        <div>
          <h4 className="text-xs text-ink/50 uppercase tracking-wider mb-2 flex items-center gap-1 font-600">
            <Sparkles size={12} /> Chữ nghệ thuật
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onAddSticker({ type: 'emoji', src: 'Best Class Ever' })}
              className="text-xs font-display font-bold italic px-3 py-1.5 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 rounded-full hover:scale-105 transition-transform"
            >
              Best Class Ever
            </button>
            <button
              onClick={() => onAddSticker({ type: 'emoji', src: 'Miss you guys!' })}
              className="text-xs font-caveat font-bold px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full hover:scale-105 transition-transform"
            >
              Miss you guys!
            </button>
          </div>
        </div>
        
        {/* Info text */}
        <div className="mt-4 p-3 bg-pink-50/50 rounded-xl text-xs text-ink/60 font-body text-center flex items-center justify-center gap-1.5">
          <Heart size={12} className="text-pink-400" />
          <span>Bấm để dán lên trang</span>
        </div>
      </div>
    </div>
  );
}
