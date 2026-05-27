import { useEffect, useRef, useState, useCallback } from 'react';
import { Trash2, Type, ImagePlus, Pen, MousePointer2, RotateCcw, PaintBucket, Minus, Plus, Eraser } from 'lucide-react';

const PEN_COLORS = [
  '#3d2c1e', '#ec4899', '#3b82f6', '#22c55e',
  '#f59e0b', '#8b5cf6', '#ef4444', '#ffffff'
];

const BG_COLORS = [
  '#ffffff', '#fff8f0', '#f0fdf4', '#fdf4ff',
  '#eff6ff', '#fefce8', '#fce7f3', '#f0f9ff'
];

export default function PageCanvasEditor({ bgColor: initialBg = '#ffffff', value, oldMessage, oldImage, onReady }) {
  const canvasEl  = useRef(null);
  const fabricRef = useRef(null);
  const fileRef   = useRef(null);
  const historyRef = useRef([]);
  const containerRef = useRef(null);

  const [tool, setTool]         = useState('select'); // select | draw | text
  const [penColor, setPenColor] = useState('#3d2c1e');
  const [penSize, setPenSize]   = useState(4);
  const [bgColor, setBgColor]   = useState(initialBg);
  const [ready, setReady]       = useState(false);
  const [activeObj, setActiveObj] = useState(null);

  // ── Calculate Scale for Responsiveness ────────────────────────
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !fabricRef.current) return;
      const parentWidth = containerRef.current.parentElement.clientWidth;
      const scale = (parentWidth - 16) / 560; // 16px padding
      
      const canvas = fabricRef.current;
      canvas.setDimensions({ width: 560 * scale, height: 792 * scale });
      canvas.setZoom(scale);
    };
    
    // Initial call might need a short delay to ensure DOM is ready
    setTimeout(updateScale, 50);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // ── Init Fabric ──────────────────────────────────────────────
  useEffect(() => {
    let canvas;
    import('fabric').then(({ Canvas, FabricText, IText, FabricImage, PencilBrush }) => {
      canvas = new Canvas(canvasEl.current, {
        width: 560,
        height: 792,
        backgroundColor: initialBg,
        preserveObjectStacking: true,
      });
      fabricRef.current = canvas;

      if (value?.json) {
        canvas.loadFromJSON(value.json, () => canvas.renderAll());
      } else {
        // Fallback for empty init
        if (oldMessage) {
          const msgText = new IText(oldMessage, {
            left: 50, top: 150,
            fontFamily: 'Caveat, cursive',
            fontSize: 26, fill: '#3d2c1e',
            selectable: true, editable: true,
          });
          canvas.add(msgText);
        }

        if (oldImage) {
          FabricImage.fromURL(oldImage, { crossOrigin: 'anonymous' }).then(img => {
            const maxW = 350;
            if (img.width > maxW) img.scaleToWidth(maxW);
            img.set({ left: 100, top: 300, selectable: true });
            canvas.add(img);
            canvas.renderAll();
          });
        }
        
        canvas.renderAll();
      }

      // Save to history on each action
      const saveHistory = () => {
        historyRef.current.push(JSON.stringify(canvas.toJSON()));
        if (historyRef.current.length > 30) historyRef.current.shift();
      };
      
      const updateSelection = () => setActiveObj(canvas.getActiveObject());
      
      canvas.on('object:added', saveHistory);
      canvas.on('object:modified', saveHistory);
      canvas.on('object:removed', saveHistory);
      canvas.on('selection:created', updateSelection);
      canvas.on('selection:updated', updateSelection);
      canvas.on('selection:cleared', updateSelection);

      // Expose getters to parent
      if (onReady) {
        onReady({
          getJSON:    () => canvas.toJSON(),
          getPreview: () => canvas.toDataURL({ 
            format: 'jpeg', 
            quality: 1.0, 
            multiplier: 3 / (canvas.getZoom() || 1) 
          }),
        });
      }
      setReady(true);
    });

    return () => {
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line

  // ── Tool switching ────────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    import('fabric').then(({ PencilBrush }) => {
      if (tool === 'draw') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = penColor;
        canvas.freeDrawingBrush.width = penSize;
      } else if (tool === 'eraser') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = bgColor; // Paint with background color to act as eraser
        canvas.freeDrawingBrush.width = penSize * 2; // Eraser is slightly larger
      } else {
        canvas.isDrawingMode = false;
      }
    });
  }, [tool, penColor, penSize, bgColor, ready]);

  // ── Background color ──────────────────────────────────────────
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    canvas.backgroundColor = bgColor;
    canvas.renderAll();
  }, [bgColor, ready]);

  // ── Add text ─────────────────────────────────────────────────
  const addText = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    import('fabric').then(({ IText }) => {
      const t = new IText('Nhập văn bản...', {
        left: 80, top: 100,
        fontFamily: 'Caveat, cursive',
        fontSize: 32, fill: penColor,
        selectable: true, editable: true,
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      t.enterEditing();
      canvas.renderAll();
      setTool('select');
    });
  }, [penColor]);

  // ── Add image ─────────────────────────────────────────────────
  const handleImageFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      import('fabric').then(({ FabricImage }) => {
        FabricImage.fromURL(ev.target.result, { crossOrigin: 'anonymous' }).then(img => {
          const maxW = 280;
          if (img.width > maxW) img.scaleToWidth(maxW);
          img.set({ left: 60, top: 60, selectable: true });
          fabricRef.current?.add(img);
          fabricRef.current?.renderAll();
        });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // ── Delete selected ──────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  // ── Undo ──────────────────────────────────────────────────────
  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    historyRef.current.pop(); // remove current
    const prev = historyRef.current[historyRef.current.length - 1];
    if (prev) {
      canvas.loadFromJSON(JSON.parse(prev), () => canvas.renderAll());
    } else {
      canvas.clear();
      canvas.backgroundColor = bgColor;
      canvas.renderAll();
    }
  }, [bgColor]);

  // ── Keyboard delete ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.matches('input,textarea')) {
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [deleteSelected]);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* ── Toolbar ── */}
      <div className="w-full flex flex-wrap items-center gap-2 px-1">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-cream-100 rounded-xl p-1">
          <ToolBtn active={tool==='select'} onClick={() => setTool('select')} title="Chọn">
            <MousePointer2 size={15}/>
          </ToolBtn>
          <ToolBtn active={tool==='draw'} onClick={() => setTool('draw')} title="Bút vẽ / Apple Pencil">
            <Pen size={15}/>
          </ToolBtn>
          <ToolBtn active={tool==='eraser'} onClick={() => setTool('eraser')} title="Cục tẩy">
            <Eraser size={15}/>
          </ToolBtn>
          <ToolBtn active={false} onClick={addText} title="Thêm văn bản">
            <Type size={15}/>
          </ToolBtn>
          <ToolBtn active={false} onClick={() => fileRef.current?.click()} title="Thêm ảnh">
            <ImagePlus size={15}/>
          </ToolBtn>
        </div>

        {/* Pen color (hide in eraser mode) */}
        {tool !== 'eraser' && (
          <div className="flex items-center gap-1 flex-wrap">
            {PEN_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  penColor === c ? 'border-ink scale-125' : 'border-white shadow-sm'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* Pen size (draw and eraser mode) */}
        {(tool === 'draw' || tool === 'eraser') && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPenSize(s => Math.max(1,s-1))}
              className="p-1 rounded-full hover:bg-cream-200"><Minus size={12}/></button>
            <span className="text-xs font-mono font-700 w-4 text-center">{penSize}</span>
            <button type="button" onClick={() => setPenSize(s => Math.min(20,s+1))}
              className="p-1 rounded-full hover:bg-cream-200"><Plus size={12}/></button>
          </div>
        )}

        <div className="flex-1"/>

        {/* Layering & Actions */}
        {activeObj && (
          <div className="flex items-center gap-1 bg-cream-100 rounded-xl p-1 mr-2">
            <button type="button" onClick={() => { fabricRef.current?.bringForward(activeObj); fabricRef.current?.renderAll(); }} title="Đưa lên trên"
              className="p-1.5 rounded-lg hover:bg-white text-ink/60 hover:text-ink transition-colors text-xs font-bold">
              Lên
            </button>
            <button type="button" onClick={() => { fabricRef.current?.sendBackwards(activeObj); fabricRef.current?.renderAll(); }} title="Đưa xuống dưới"
              className="p-1.5 rounded-lg hover:bg-white text-ink/60 hover:text-ink transition-colors text-xs font-bold">
              Xuống
            </button>
            <button type="button" onClick={() => { 
                activeObj.clone((cloned) => {
                  cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
                  fabricRef.current?.add(cloned);
                  fabricRef.current?.setActiveObject(cloned);
                });
              }} title="Nhân bản"
              className="p-1.5 rounded-lg hover:bg-white text-ink/60 hover:text-ink transition-colors text-xs font-bold">
              Nhân bản
            </button>
          </div>
        )}

        <button type="button" onClick={undo} title="Hoàn tác"
          className="p-1.5 rounded-lg hover:bg-cream-200 text-ink/50 hover:text-ink transition-colors">
          <RotateCcw size={15}/>
        </button>
        <button type="button" onClick={deleteSelected} title="Xóa mục đang chọn"
          className="p-1.5 rounded-lg hover:bg-red-50 text-ink/50 hover:text-red-500 transition-colors">
          <Trash2 size={15}/>
        </button>
      </div>

      {/* ── Contextual Toolbar ── */}
      {activeObj && activeObj.type === 'i-text' && (
        <div className="w-full flex items-center gap-3 px-2 bg-pink-50/50 p-2 rounded-xl border border-pink-100">
          <span className="text-xs text-ink/50 font-body shrink-0">Chữ:</span>
          
          <select 
            className="text-xs border border-cream-200 rounded p-1"
            value={activeObj.fontFamily}
            onChange={(e) => { activeObj.set('fontFamily', e.target.value); fabricRef.current?.renderAll(); setReady(r => !r); }}
          >
            <option value="Caveat, cursive">Caveat</option>
            <option value="Inter, sans-serif">Inter</option>
            <option value="Times New Roman">Times</option>
          </select>
          
          <button onClick={() => { activeObj.set('fontWeight', activeObj.fontWeight === 'bold' ? 'normal' : 'bold'); fabricRef.current?.renderAll(); setReady(r => !r); }}
             className={`text-xs font-bold p-1 border rounded ${activeObj.fontWeight === 'bold' ? 'bg-ink text-white' : 'bg-white text-ink'}`}>B</button>
          <button onClick={() => { activeObj.set('fontStyle', activeObj.fontStyle === 'italic' ? 'normal' : 'italic'); fabricRef.current?.renderAll(); setReady(r => !r); }}
             className={`text-xs italic p-1 border rounded ${activeObj.fontStyle === 'italic' ? 'bg-ink text-white' : 'bg-white text-ink'}`}>I</button>
          
          <div className="flex gap-1 ml-auto">
            {PEN_COLORS.map(c => (
              <button key={`t-${c}`} type="button" onClick={() => { activeObj.set('fill', c); fabricRef.current?.renderAll(); setReady(r => !r); }}
                className={`w-4 h-4 rounded-full border shadow-sm`} style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Background color ── */}
      {!activeObj && (
        <div className="w-full flex items-center gap-2 px-1">
          <PaintBucket size={13} className="text-ink/40 shrink-0"/>
          <span className="text-xs text-ink/50 font-body shrink-0">Nền trang:</span>
          <div className="flex gap-1.5 flex-wrap">
            {BG_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setBgColor(c)}
                className={`w-5 h-5 rounded-md border-2 transition-transform hover:scale-110 ${
                  bgColor === c ? 'border-pink-400 scale-125' : 'border-cream-200'
                }`}
                style={{ backgroundColor: c }}/>
            ))}
          </div>
        </div>
      )}

      {/* ── Canvas ── */}
      <div className="w-full overflow-y-auto overflow-x-hidden rounded-xl border border-cream-200 shadow-sm bg-cream-50"
           style={{ maxHeight: '70vh' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0' }} ref={containerRef}>
          {/* We now use Fabric's setZoom instead of CSS transform */}
          <div>
            <canvas ref={canvasEl} />
          </div>
        </div>
      </div>

      <p className="text-xs text-ink/40 font-body text-center">
        ✍️ Hỗ trợ Apple Pencil · Chạm & giữ để chọn · Kéo thả tự do
      </p>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile}/>
    </div>
  );
}

function ToolBtn({ children, active, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        active ? 'bg-white shadow-sm text-pink-600' : 'text-ink/50 hover:text-ink hover:bg-white/50'
      }`}
    >
      {children}
    </button>
  );
}
