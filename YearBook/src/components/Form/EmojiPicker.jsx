// Component chọn icon / cảm xúc và màu nền cho lưu bút
import { EMOTIONS } from '../../data/sampleMessages';

export default function EmojiPicker({ selected, onSelect }) {
  return (
    <div>
      <label className="block text-sm font-body font-700 text-ink mb-2">
        Cảm xúc của bạn ✨
      </label>
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map(emotion => (
          <button
            key={emotion.emoji}
            type="button"
            onClick={() => onSelect(emotion)}
            className={`emotion-chip ${selected?.emoji === emotion.emoji ? 'selected' : ''}`}
            style={{
              backgroundColor: emotion.bg,
              borderColor: selected?.emoji === emotion.emoji ? '#ec4899' : 'transparent',
            }}
            title={emotion.label}
          >
            <span className="text-2xl">{emotion.emoji}</span>
            <span className="text-xs font-body text-ink/60 leading-none">
              {emotion.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
