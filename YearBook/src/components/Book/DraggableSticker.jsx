import { useState } from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';

export default function DraggableSticker({ sticker, onUpdate, onDelete, readonly = false }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Rnd
      size={{ width: sticker.width, height: sticker.height }}
      position={{ x: sticker.x, y: sticker.y }}
      onDragStop={(e, d) => {
        if (readonly) return;
        onUpdate(sticker.id, { x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        if (readonly) return;
        onUpdate(sticker.id, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          x: position.x,
          y: position.y
        });
      }}
      disableDragging={readonly}
      enableResizing={!readonly}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      bounds="parent"
      className={readonly ? '' : 'hover:outline hover:outline-2 hover:outline-pink-400 hover:outline-dashed rounded-md group'}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Render sticker content based on type (emoji, image) */}
        {sticker.type === 'emoji' ? (
          <div style={{ fontSize: `${sticker.width * 0.8}px`, lineHeight: 1 }} className="select-none pointer-events-none">
            {sticker.src}
          </div>
        ) : (
          <img src={sticker.src} alt="sticker" className="w-full h-full object-contain select-none pointer-events-none" />
        )}
        
        {/* Delete button */}
        {!readonly && isHovered && (
          <button
            onClick={() => onDelete(sticker.id)}
            className="absolute -top-3 -right-3 bg-white text-rose-500 rounded-full p-1 shadow-md hover:bg-rose-50 hover:text-rose-600 transition-colors z-50"
            onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when clicking delete
          >
            <X size={14} />
          </button>
        )}
      </div>
    </Rnd>
  );
}
