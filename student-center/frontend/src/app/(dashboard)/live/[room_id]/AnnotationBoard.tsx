"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Pen, Eraser, Highlighter, ChevronLeft, ChevronRight, Trash2, Download, Minus, Plus } from "lucide-react";

interface Stroke {
  type: "stroke_start" | "stroke_move" | "stroke_end" | "stroke_clear" | "stroke_page";
  x?: number;
  y?: number;
  pressure?: number;
  color?: string;
  size?: number;
  pageIndex?: number;
  canvasW?: number;
  canvasH?: number;
}

interface AnnotationBoardProps {
  fileUrl: string;
  isTeacher: boolean;
  onStroke: (data: Stroke) => void;
  remoteStrokes: Stroke[];
  onClose: () => void;
}

const COLORS = [
  { name: "Đen", value: "#1a1a1a" },
  { name: "Đỏ", value: "#ef4444" },
  { name: "Xanh lá", value: "#22c55e" },
  { name: "Xanh dương", value: "#3b82f6" },
  { name: "Tím", value: "#a855f7" },
];

export default function AnnotationBoard({ fileUrl, isTeacher, onStroke, remoteStrokes, onClose }: AnnotationBoardProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);   // PDF / image layer
  const drawCanvasRef = useRef<HTMLCanvasElement>(null); // Drawing overlay
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<"pen" | "eraser" | "highlight">("pen");
  const [color, setColor] = useState("#1a1a1a");
  const [penSize, setPenSize] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isImage, setIsImage] = useState(false);
  const [loading, setLoading] = useState(true);

  const pdfDocRef = useRef<any>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // ── Utilities ─────────────────────────────────────────────────────────────
  const getCanvasPoint = (e: PointerEvent | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getDrawCtx = () => {
    const canvas = drawCanvasRef.current;
    return canvas ? canvas.getContext("2d") : null;
  };

  const applyStrokeStyle = (ctx: CanvasRenderingContext2D, strokeColor: string, size: number, strokeTool: string, pressure = 1) => {
    if (strokeTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
      ctx.lineWidth = size * 8 * Math.max(0.3, pressure);
    } else if (strokeTool === "highlight") {
      ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = strokeColor === "#1a1a1a" ? "rgba(255,230,0,0.4)" : hexToRgba(strokeColor, 0.35);
      ctx.lineWidth = size * 6 * Math.max(0.5, pressure);
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = size * Math.max(0.5, pressure);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  function hexToRgba(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── Render PDF page ────────────────────────────────────────────────────────
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDocRef.current) return;
    const bgCanvas = bgCanvasRef.current;
    const drawCanvas = drawCanvasRef.current;
    if (!bgCanvas || !drawCanvas) return;

    const page = await pdfDocRef.current.getPage(pageNum + 1);
    const viewport = page.getViewport({ scale: 2 });

    bgCanvas.width = viewport.width;
    bgCanvas.height = viewport.height;
    drawCanvas.width = viewport.width;
    drawCanvas.height = viewport.height;

    const ctx = bgCanvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }, []);

  // ── Load file ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    const ext = fileUrl.split("?")[0].toLowerCase();
    const isImg = ext.endsWith(".jpg") || ext.endsWith(".jpeg") || ext.endsWith(".png") || ext.endsWith(".gif") || ext.includes("image");

    if (isImg) {
      setIsImage(true);
      setTotalPages(1);
      setCurrentPage(0);
      const bg = bgCanvasRef.current;
      const draw = drawCanvasRef.current;
      if (!bg || !draw) { setLoading(false); return; }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        bg.width = img.naturalWidth;
        bg.height = img.naturalHeight;
        draw.width = img.naturalWidth;
        draw.height = img.naturalHeight;
        bg.getContext("2d")!.drawImage(img, 0, 0);
        setLoading(false);
      };
      img.onerror = () => setLoading(false);
      img.src = fileUrl;
    } else {
      // Load as PDF
      (async () => {
        try {
          const pdfjsLib = await import("pdfjs-dist");
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
          const pdf = await pdfjsLib.getDocument({ url: fileUrl, cMapUrl: "https://unpkg.com/pdfjs-dist/cmaps/", cMapPacked: true }).promise;
          pdfDocRef.current = pdf;
          setTotalPages(pdf.numPages);
          await renderPage(0);
        } catch (err) {
          console.error("PDF load error:", err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [fileUrl, renderPage]);

  // ── Page navigation ────────────────────────────────────────────────────────
  const goToPage = useCallback(async (page: number) => {
    setCurrentPage(page);
    if (!isImage) await renderPage(page);
    // Clear draw canvas when changing page
    const ctx = getDrawCtx();
    if (ctx && drawCanvasRef.current) {
      ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    }
    if (isTeacher) {
      onStroke({ type: "stroke_page", pageIndex: page, canvasW: drawCanvasRef.current?.width, canvasH: drawCanvasRef.current?.height });
    }
  }, [isImage, renderPage, isTeacher, onStroke]);

  // ── Pointer events (Drawing) ───────────────────────────────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTeacher) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;

    const ctx = getDrawCtx();
    if (!ctx) return;
    ctx.save();
    applyStrokeStyle(ctx, color, penSize, tool, e.pressure || 0.5);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.restore();

    onStroke({ type: "stroke_start", x: pt.x, y: pt.y, pressure: e.pressure || 0.5, color, size: penSize, pageIndex: currentPage, canvasW: drawCanvasRef.current?.width, canvasH: drawCanvasRef.current?.height });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isTeacher || !isDrawingRef.current) return;
    const pt = getCanvasPoint(e);
    const ctx = getDrawCtx();
    if (!ctx || !lastPointRef.current) return;

    ctx.save();
    applyStrokeStyle(ctx, color, penSize, tool, e.pressure || 0.5);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = pt;
    onStroke({ type: "stroke_move", x: pt.x, y: pt.y, pressure: e.pressure || 0.5, color, size: penSize, pageIndex: currentPage });
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    onStroke({ type: "stroke_end" });
  };

  // ── Receive remote strokes ─────────────────────────────────────────────────
  useEffect(() => {
    if (!remoteStrokes.length) return;
    const latest = remoteStrokes[remoteStrokes.length - 1];

    // Page change from teacher
    if (latest.type === "stroke_page" && !isTeacher) {
      goToPage(latest.pageIndex ?? 0);
      return;
    }

    if (latest.type === "stroke_clear") {
      const ctx = getDrawCtx();
      if (ctx && drawCanvasRef.current) {
        ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
      }
      return;
    }

    const ctx = getDrawCtx();
    if (!ctx || !drawCanvasRef.current) return;

    // Scale coordinates to local canvas size
    const scaleX = latest.canvasW ? drawCanvasRef.current.width / latest.canvasW : 1;
    const scaleY = latest.canvasH ? drawCanvasRef.current.height / latest.canvasH : 1;
    const rx = (latest.x ?? 0) * scaleX;
    const ry = (latest.y ?? 0) * scaleY;

    if (latest.type === "stroke_start") {
      ctx.save();
      applyStrokeStyle(ctx, latest.color ?? "#1a1a1a", latest.size ?? 3, "pen", latest.pressure ?? 0.5);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.restore();
    } else if (latest.type === "stroke_move") {
      ctx.save();
      applyStrokeStyle(ctx, latest.color ?? "#1a1a1a", latest.size ?? 3, "pen", latest.pressure ?? 0.5);
      ctx.beginPath();
      if ((ctx as any)._lastX !== undefined) {
        ctx.moveTo((ctx as any)._lastX, (ctx as any)._lastY);
      } else {
        ctx.moveTo(rx, ry);
      }
      ctx.lineTo(rx, ry);
      ctx.stroke();
      ctx.restore();
    }
    (ctx as any)._lastX = rx;
    (ctx as any)._lastY = ry;
  }, [remoteStrokes, goToPage, isTeacher]);

  const handleClear = () => {
    const ctx = getDrawCtx();
    if (ctx && drawCanvasRef.current) {
      ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    }
    onStroke({ type: "stroke_clear" });
  };

  const handleDownload = () => {
    const bg = bgCanvasRef.current;
    const draw = drawCanvasRef.current;
    if (!bg || !draw) return;
    const merged = document.createElement("canvas");
    merged.width = bg.width;
    merged.height = bg.height;
    const ctx = merged.getContext("2d")!;
    ctx.drawImage(bg, 0, 0);
    ctx.drawImage(draw, 0, 0);
    const a = document.createElement("a");
    a.href = merged.toDataURL("image/png");
    a.download = `bai-chua-trang-${currentPage + 1}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col" style={{ touchAction: "none" }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-white/10 flex-wrap shrink-0">
        <span className="font-black text-white text-sm mr-2 hidden md:block">📝 Chữa bài</span>

        {isTeacher && (
          <>
            {/* Tool buttons */}
            <button onClick={() => setTool("pen")} title="Bút viết" className={`p-2 rounded-lg ${tool === "pen" ? "bg-indigo-600" : "bg-white/10 hover:bg-white/20"} text-white`}><Pen className="w-4 h-4" /></button>
            <button onClick={() => setTool("highlight")} title="Highlight" className={`p-2 rounded-lg ${tool === "highlight" ? "bg-yellow-500" : "bg-white/10 hover:bg-white/20"} text-white`}><Highlighter className="w-4 h-4" /></button>
            <button onClick={() => setTool("eraser")} title="Tẩy" className={`p-2 rounded-lg ${tool === "eraser" ? "bg-rose-600" : "bg-white/10 hover:bg-white/20"} text-white`}><Eraser className="w-4 h-4" /></button>

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Color picker */}
            {COLORS.map(c => (
              <button key={c.value} onClick={() => { setColor(c.value); setTool("pen"); }} title={c.name}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${color === c.value ? "border-white scale-125" : "border-transparent"}`}
                style={{ backgroundColor: c.value }}
              />
            ))}

            <div className="w-px h-6 bg-white/20 mx-1" />

            {/* Pen size */}
            <button onClick={() => setPenSize(Math.max(1, penSize - 1))} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><Minus className="w-3.5 h-3.5" /></button>
            <span className="text-white text-xs font-bold w-4 text-center">{penSize}</span>
            <button onClick={() => setPenSize(Math.min(20, penSize + 1))} className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white"><Plus className="w-3.5 h-3.5" /></button>

            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={handleClear} title="Xóa toàn bộ nét bút" className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/50 text-white"><Trash2 className="w-4 h-4" /></button>
            <button onClick={handleDownload} title="Tải ảnh đã chữa" className="p-2 rounded-lg bg-white/10 hover:bg-emerald-500/50 text-white"><Download className="w-4 h-4" /></button>
          </>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <>
            <div className="w-px h-6 bg-white/20 mx-1" />
            <button onClick={() => goToPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-white text-xs font-bold">{currentPage + 1}/{totalPages}</span>
            <button onClick={() => goToPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
          </>
        )}

        <div className="flex-1" />
        <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/50 text-white"><X className="w-5 h-5" /></button>
      </div>

      {/* ── Canvas Area ── */}
      <div ref={containerRef} className="flex-1 overflow-auto flex items-start justify-center bg-gray-800 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/60 text-xl">Đang tải tài liệu...</div>
        ) : (
          <div className="relative shadow-2xl">
            {/* Background (PDF/Image) canvas */}
            <canvas ref={bgCanvasRef} className="block max-w-full" style={{ maxHeight: "calc(100vh - 120px)", objectFit: "contain" }} />
            {/* Drawing overlay canvas */}
            <canvas
              ref={drawCanvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ cursor: isTeacher ? (tool === "eraser" ? "cell" : "crosshair") : "default", touchAction: "none" }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
          </div>
        )}
      </div>

      {!isTeacher && (
        <div className="text-center text-white/40 text-xs py-2 shrink-0">
          Giáo viên đang chữa bài — bạn đang xem trực tiếp
        </div>
      )}
    </div>
  );
}
