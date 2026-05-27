import DraggableSticker from './DraggableSticker';
import { Heart } from 'lucide-react';

export default function StudentPage({ pageData, onUpdatePage, isEditing }) {
  const { content, stickers } = pageData;

  const updateSticker = (id, newProps) => {
    const updatedStickers = stickers.map(s => s.id === id ? { ...s, ...newProps } : s);
    onUpdatePage({ ...pageData, stickers: updatedStickers });
  };

  const deleteSticker = (id) => {
    const updatedStickers = stickers.filter(s => s.id !== id);
    onUpdatePage({ ...pageData, stickers: updatedStickers });
  };

  return (
    <div className="relative w-full aspect-[1/1.414] bg-white rounded-md shadow-lg overflow-hidden border border-cream-200 print:shadow-none print:border-none">
      {/* Background texture giấy mỏng */}
      <div className="absolute inset-0 opacity-40 pointer-events-none paper-bg" />
      
      {/* Gáy sách mờ mờ */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />

      {/* Nội dung lưu bút */}
      <div className="absolute inset-0 p-10 flex flex-col z-10">
        
        {/* Header: Info Học sinh */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border-2 border-pink-100 flex-shrink-0">
            {content.image ? (
              <img src={content.image} alt={content.author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-cream-100 flex items-center justify-center text-3xl">
                {content.emoji || '😎'}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-ink leading-tight">{content.author}</h2>
            <p className="font-body text-ink/60 text-sm">Gửi gắm lúc {new Date(content.date).toLocaleDateString('vi-VN')}</p>
          </div>
        </div>

        {/* Lời nhắn chính */}
        <div className="flex-1">
          <p className="font-caveat text-2xl sm:text-3xl text-ink leading-relaxed whitespace-pre-wrap px-4">
            {content.text}
          </p>
        </div>

        {/* Footer: Hearts & Chữ ký */}
        <div className="mt-8 flex items-end justify-between">
          <div className="flex items-center gap-1.5 text-pink-400">
            <Heart className="fill-pink-400" size={18} />
            <span className="font-body font-700">{content.hearts || 0}</span>
          </div>
          <div className="text-right">
            <p className="font-body text-ink/40 text-xs uppercase tracking-widest mb-1">Chữ ký</p>
            <p className="font-display font-bold text-xl italic text-ink/80">{content.author}</p>
          </div>
        </div>
      </div>

      {/* Render Stickers */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="relative w-full h-full pointer-events-auto">
          {stickers && stickers.map(sticker => (
            <DraggableSticker
              key={sticker.id}
              sticker={sticker}
              onUpdate={updateSticker}
              onDelete={deleteSticker}
              readonly={!isEditing}
            />
          ))}
        </div>
      </div>
      
      {/* Footer Page Number */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-xs font-body text-ink/30 font-600 print:block">
        Trang {pageData.pageIndex || ''}
      </div>
    </div>
  );
}
