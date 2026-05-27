import { useState } from 'react';
import DraggableSticker from './DraggableSticker';

export default function CoverDesigner({ coverData, onUpdateCover, isEditing }) {
  const handleBgColorChange = (color) => {
    onUpdateCover({ ...coverData, bgColor: color });
  };

  const updateSticker = (id, newProps) => {
    const updatedStickers = coverData.stickers.map(s => s.id === id ? { ...s, ...newProps } : s);
    onUpdateCover({ ...coverData, stickers: updatedStickers });
  };

  const deleteSticker = (id) => {
    const updatedStickers = coverData.stickers.filter(s => s.id !== id);
    onUpdateCover({ ...coverData, stickers: updatedStickers });
  };

  return (
    <div 
      className="relative w-full aspect-[1/1.414] rounded-r-3xl rounded-l-md shadow-2xl overflow-hidden transition-colors duration-500 print:shadow-none print:rounded-none"
      style={{ backgroundColor: coverData.bgColor || '#fdf2f8' }}
    >
      {/* Texture bìa sách */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')]" />
      
      {/* Gáy sách */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-black/10 border-r border-black/5" />

      {/* Cấu hình màu nền (chỉ hiện khi edit) */}
      {isEditing && (
        <div className="absolute top-4 right-4 z-50 flex gap-2 bg-white/80 p-2 rounded-xl backdrop-blur-sm shadow-sm print:hidden">
          {['#fdf2f8', '#f0fdf4', '#eff6ff', '#fffbeb', '#f3f4f6'].map(color => (
            <button
              key={color}
              onClick={() => handleBgColorChange(color)}
              className={`w-6 h-6 rounded-full border-2 ${coverData.bgColor === color ? 'border-ink' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {/* Nội dung bìa */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-10">
        {isEditing ? (
          <>
            <input
              type="text"
              value={coverData.title || ''}
              onChange={(e) => onUpdateCover({ ...coverData, title: e.target.value })}
              placeholder="Lưu Bút Kỷ Yếu"
              className="font-display font-bold text-5xl sm:text-6xl text-ink leading-tight mb-4 drop-shadow-sm bg-transparent border-b-2 border-dashed border-ink/30 text-center focus:outline-none focus:border-ink/60 w-full"
            />
            <input
              type="text"
              value={coverData.subtitle ?? 'Năm Học 2025 - 2026'}
              onChange={(e) => onUpdateCover({ ...coverData, subtitle: e.target.value })}
              className="font-body text-xl text-ink/70 uppercase tracking-widest font-600 bg-transparent border-b-2 border-dashed border-ink/30 text-center focus:outline-none focus:border-ink/60 w-full"
            />
          </>
        ) : (
          <>
            <h1 className="font-display font-bold text-5xl sm:text-6xl text-ink leading-tight mb-4 drop-shadow-sm">
              {coverData.title || 'Lưu Bút Kỷ Yếu'}
            </h1>
            <p className="font-body text-xl text-ink/70 uppercase tracking-widest font-600">
              {coverData.subtitle ?? 'Năm Học 2025 - 2026'}
            </p>
          </>
        )}
      </div>

      {/* Render Stickers */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="relative w-full h-full pointer-events-auto">
          {coverData.stickers.map(sticker => (
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
    </div>
  );
}
