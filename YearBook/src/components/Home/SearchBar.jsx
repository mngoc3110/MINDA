// Thanh tìm kiếm lời nhắn theo tên học sinh
import { Search, X } from 'lucide-react';

export default function SearchBar({ value, onChange, resultCount, total }) {
  return (
    <div className="max-w-xl mx-auto mb-8">
      {/* Input tìm kiếm */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Tìm kiếm theo tên học sinh…"
          className="form-input pl-10 pr-10"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cream-200 hover:bg-cream-300 flex items-center justify-center transition-colors"
          >
            <X size={12} className="text-ink/60" />
          </button>
        )}
      </div>

      {/* Thông báo kết quả tìm kiếm */}
      {value && (
        <p className="text-sm font-body text-ink/50 mt-2 text-center animate-fade-in-up">
          {resultCount === 0 ? (
            <span>
              😢 Không tìm thấy lưu bút nào của{' '}
              <strong className="text-ink">"{value}"</strong>
            </span>
          ) : (
            <span>
              Tìm thấy{' '}
              <strong className="text-pink-500">{resultCount}</strong>
              {' '}trong{' '}
              <strong>{total}</strong> lưu bút
            </span>
          )}
        </p>
      )}
    </div>
  );
}
