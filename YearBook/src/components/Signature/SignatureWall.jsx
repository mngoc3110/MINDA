// Khu vực Chữ Ký — bức tường chữ ký học sinh
// Vẽ chữ ký bằng chuột / ngón tay (touch) trên canvas
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Save, PenLine } from 'lucide-react';
import { addSignature, getSignatures } from '../../utils/storage';
import { generateId, formatDate } from '../../utils/helpers';

const PEN_COLORS = ['#3d2c1e', '#ec4899', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];
const PEN_SIZES  = [2, 4, 7, 12];

export default function SignatureWall() {
  const canvasRef     = useRef(null);
  const [drawing, setDrawing]     = useState(false);
  const [penColor, setPenColor]   = useState(PEN_COLORS[0]);
  const [penSize, setPenSize]     = useState(PEN_SIZES[1]);
  const [authorName, setAuthorName] = useState('');
  const [signatures, setSignatures] = useState([]);
  const [saved, setSaved]         = useState(false);
  const lastPos = useRef(null);

  // Load chữ ký đã lưu
  useEffect(() => {
    setSignatures(getSignatures());
  }, []);

  // Lấy tọa độ chuẩn từ sự kiện (hỗ trợ cả touch và mouse)
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
    lastPos.current = pos;
    setDrawing(true);
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
    lastPos.current = pos;
  }, [drawing, penColor, penSize]);

  const stopDraw = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  // Xóa canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSaved(false);
  };

  // Lưu chữ ký
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Kiểm tra canvas có trống không
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const isEmpty = !data.data.some(v => v !== 0);
    if (isEmpty) {
      alert('Hãy vẽ chữ ký của bạn trước nhé! ✍️');
      return;
    }
    if (!authorName.trim()) {
      alert('Hãy nhập tên của bạn để lưu chữ ký!');
      return;
    }

    // Tạo ảnh PNG với nền trắng
    const offscreen = document.createElement('canvas');
    offscreen.width  = canvas.width;
    offscreen.height = canvas.height;
    const offCtx = offscreen.getContext('2d');
    offCtx.fillStyle = '#fffef9';
    offCtx.fillRect(0, 0, offscreen.width, offscreen.height);
    offCtx.drawImage(canvas, 0, 0);

    const dataUrl = offscreen.toDataURL('image/png');
    const newSig = {
      id:              generateId(),
      name:            authorName.trim(),
      signatureDataUrl: dataUrl,
      date:            new Date().toISOString(),
    };

    addSignature(newSig);
    setSignatures(prev => [newSig, ...prev]);
    clearCanvas();
    setAuthorName('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Tải về chữ ký
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `chu-ky-${authorName || 'cua-toi'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <section className="max-w-5xl mx-auto px-4 pb-28">
      {/* Tiêu đề */}
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-1">
          ✍️ Bức Tường Chữ Ký
        </h2>
        <p className="text-ink/50 font-body text-sm">
          Hãy vẽ chữ ký của bạn và để lại dấu ấn trên bức tường này!
        </p>
      </div>

      {/* Khu vực vẽ */}
      <div className="glass-card p-4 sm:p-6 mb-8">
        {/* Thanh công cụ */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Chọn màu bút */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-body text-ink/50">Màu:</span>
            {PEN_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setPenColor(color)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  penColor === color ? 'border-ink scale-125' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Chọn kích thước bút */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-body text-ink/50">Cỡ bút:</span>
            {PEN_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setPenSize(size)}
                className={`rounded-full bg-ink transition-all ${
                  penSize === size ? 'ring-2 ring-pink-400 ring-offset-1' : 'opacity-40 hover:opacity-70'
                }`}
                style={{ width: size + 8, height: size + 8 }}
              />
            ))}
          </div>

          {/* Nút xóa */}
          <button
            onClick={clearCanvas}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-400 hover:bg-red-100 text-xs font-body font-600 transition-colors"
          >
            <Trash2 size={12} />
            Xóa
          </button>
        </div>

        {/* Canvas */}
        <div className="relative rounded-xl overflow-hidden border-2 border-cream-200 bg-cream-50">
          <canvas
            ref={canvasRef}
            width={800}
            height={220}
            className="signature-canvas w-full"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {/* Placeholder hint */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className="font-hand text-2xl text-cream-300 opacity-70">
              Vẽ chữ ký của bạn tại đây…
            </p>
          </div>
        </div>

        {/* Input tên + nút lưu */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
            placeholder="Tên của bạn…"
            className="form-input flex-1"
            maxLength={50}
          />
          <div className="flex gap-2">
            <button onClick={handleDownload} className="btn-ghost gap-1.5 shrink-0">
              <Download size={14} />
              Tải về
            </button>
            <button onClick={handleSave} className="btn-primary gap-1.5 shrink-0">
              <Save size={14} />
              Lưu chữ ký
            </button>
          </div>
        </div>

        {/* Thông báo lưu thành công */}
        <AnimatePresence>
          {saved && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-sm text-green-500 font-body font-600 mt-2 text-center"
            >
              ✅ Chữ ký đã được lưu thành công!
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Gallery chữ ký */}
      {signatures.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-bold text-ink mb-4">
            Chữ ký của mọi người ({signatures.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {signatures.map(sig => (
              <motion.div
                key={sig.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="memory-card p-3"
              >
                <img
                  src={sig.signatureDataUrl}
                  alt={`Chữ ký của ${sig.name}`}
                  className="w-full rounded-lg object-contain bg-cream-50"
                  style={{ height: '80px' }}
                />
                <p className="text-center text-xs font-body font-700 text-ink mt-2">
                  {sig.name}
                </p>
                <p className="text-center text-xs text-ink/40 font-body">
                  {formatDate(sig.date)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
