import { useRef, useState, useCallback, useEffect } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';

const PEN_COLORS = ['#3d2c1e', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
const PEN_SIZES  = [2, 4, 7];

export default function SignatureInput({ value, onChange }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const [penSize, setPenSize] = useState(PEN_SIZES[1]);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Load existing signature once on mount
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHasStrokes(true);
        setConfirmed(true);
      };
      img.src = value;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    setConfirmed(false); // reset khi vẽ lại
  }, []);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.strokeStyle = penColor;
    ctx.lineWidth   = penSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.globalAlpha = 0.92;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setHasStrokes(true);
  }, [drawing, penColor, penSize]);

  const stopDraw = useCallback((e) => {
    if (e) e.preventDefault();
    setDrawing(false);
    
    // Auto-save the signature so it doesn't get lost if they forget to click "Dùng chữ ký này"
    const canvas = canvasRef.current;
    if (canvas && hasStrokes) {
      onChange(canvas.toDataURL('image/png'));
    }
  }, [hasStrokes, onChange]);

  // Người dùng bấm "Dùng chữ ký này"
  const confirmSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
    setConfirmed(true);
  }, [onChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange(null);
    setHasStrokes(false);
    setConfirmed(false);
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 w-full justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            {PEN_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setPenColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  penColor === color ? 'border-ink scale-125' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="w-[1px] h-4 bg-black/10 hidden sm:block" />
          <div className="items-center gap-1.5 hidden sm:flex">
            {PEN_SIZES.map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setPenSize(size)}
                className={`rounded-full bg-ink transition-all ${
                  penSize === size ? 'ring-2 ring-pink-400 ring-offset-1' : 'opacity-40 hover:opacity-70'
                }`}
                style={{ width: size + 6, height: size + 6 }}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-xs font-body font-600 transition-colors"
        >
          <Trash2 size={12} />
          Xóa
        </button>
      </div>

      {/* Canvas */}
      <div
        className="relative w-full rounded-xl overflow-hidden aspect-[2.5/1]"
        style={{
          border: `2px solid ${confirmed ? '#22c55e' : hasStrokes ? '#ec4899' : '#e5e0d6'}`
        }}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={320}
          className="w-full h-full touch-none cursor-crosshair bg-cream-50"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasStrokes && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="font-caveat text-xl text-ink/20 rotate-[-2deg]">
              Ký tên của bạn vào đây…
            </p>
          </div>
        )}
      </div>

      {/* Confirm / status */}
      {hasStrokes && !confirmed && (
        <button
          type="button"
          onClick={confirmSignature}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-body font-700 text-sm transition-colors active:scale-95"
        >
          <CheckCircle2 size={16} />
          Xác nhận chữ ký này ✓
        </button>
      )}
      {confirmed && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-body font-600">
          <CheckCircle2 size={16} />
          Chữ ký đã sẵn sàng · Vẽ lại để đổi
        </div>
      )}
    </div>
  );
}
