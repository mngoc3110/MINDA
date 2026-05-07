"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  FileText, Merge, Scissors, Minimize2, RotateCw, Hash, Image, FileOutput,
  Presentation, FileSpreadsheet, ScanText, Droplets, Upload, X, Download,
  Loader2, ArrowLeft, CheckCircle2, Eye, ZoomIn, ZoomOut
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

const STIRLING_API = process.env.NEXT_PUBLIC_STIRLING_API || "/stirling-api";

/* ── Tool Definitions ── */
interface PdfTool {
  id: string; name: string; desc: string; icon: any; endpoint: string;
  accept: string; multiple?: boolean; color: string; group: string;
  visualSplit?: boolean;
  fields?: { name: string; label: string; type: string; options?: { value: string; label: string }[]; default?: string }[];
  hiddenFields?: Record<string, string>;
}

const TOOLS: PdfTool[] = [
  { id: "pdf-word", name: "PDF → Word", desc: "Chuyển PDF sang DOCX", icon: FileOutput, endpoint: "/convert/pdf/word", accept: ".pdf", color: "from-blue-600 to-cyan-500", group: "Chuyển đổi",
    hiddenFields: { outputFormat: "docx" } },
  { id: "pdf-img", name: "PDF → Hình ảnh", desc: "Xuất trang PDF thành PNG/JPG", icon: Image, endpoint: "/convert/pdf/img", accept: ".pdf", color: "from-emerald-600 to-teal-500", group: "Chuyển đổi",
    fields: [{ name: "imageFormat", label: "Định dạng", type: "select", options: [{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPEG" }], default: "png" }],
    hiddenFields: { pageNumbers: "all", singleOrMultiple: "multiple", colorType: "color", dpi: "150" } },
  { id: "pdf-pptx", name: "PDF → PowerPoint", desc: "Chuyển PDF sang trình chiếu", icon: Presentation, endpoint: "/convert/pdf/presentation", accept: ".pdf", color: "from-orange-600 to-amber-500", group: "Chuyển đổi",
    hiddenFields: { outputFormat: "pptx" } },
  { id: "pdf-xlsx", name: "PDF → Excel", desc: "Trích xuất bảng sang XLSX", icon: FileSpreadsheet, endpoint: "/convert/pdf/xlsx", accept: ".pdf", color: "from-green-600 to-lime-500", group: "Chuyển đổi" },
  { id: "img-pdf", name: "Ảnh → PDF", desc: "Gộp ảnh thành 1 PDF", icon: FileText, endpoint: "/convert/img/pdf", accept: "image/*", multiple: true, color: "from-violet-600 to-fuchsia-500", group: "Chuyển đổi" },
  { id: "file-pdf", name: "Office → PDF", desc: "Word/Excel/PPT sang PDF", icon: FileText, endpoint: "/convert/file/pdf", accept: ".doc,.docx,.ppt,.pptx,.xls,.xlsx", color: "from-red-600 to-pink-500", group: "Chuyển đổi" },
  { id: "merge", name: "Gộp PDF", desc: "Gộp nhiều PDF thành một", icon: Merge, endpoint: "/general/merge-pdfs", accept: ".pdf", multiple: true, color: "from-indigo-600 to-blue-500", group: "Chỉnh sửa",
    hiddenFields: { sortType: "orderProvided", removeCertSign: "false" } },
  { id: "split", name: "Tách PDF", desc: "Tách PDF bằng cách chọn trực quan", icon: Scissors, endpoint: "/general/split-pages", accept: ".pdf", color: "from-rose-600 to-pink-500", group: "Chỉnh sửa", visualSplit: true },
  { id: "compress", name: "Nén PDF", desc: "Giảm dung lượng PDF", icon: Minimize2, endpoint: "/misc/compress-pdf", accept: ".pdf", color: "from-amber-600 to-yellow-500", group: "Chỉnh sửa",
    fields: [{ name: "optimizeLevel", label: "Mức nén", type: "select", options: [{ value: "1", label: "Nhẹ" }, { value: "3", label: "Vừa" }, { value: "5", label: "Mạnh" }], default: "3" }] },
  { id: "rotate", name: "Xoay PDF", desc: "Xoay trang PDF", icon: RotateCw, endpoint: "/general/rotate-pdf", accept: ".pdf", color: "from-cyan-600 to-sky-500", group: "Chỉnh sửa",
    fields: [{ name: "angle", label: "Góc xoay", type: "select", options: [{ value: "90", label: "90°" }, { value: "180", label: "180°" }, { value: "270", label: "270°" }], default: "90" }] },
  { id: "page-numbers", name: "Đánh số trang", desc: "Thêm số trang vào PDF", icon: Hash, endpoint: "/misc/add-page-numbers", accept: ".pdf", color: "from-slate-600 to-gray-500", group: "Chỉnh sửa",
    hiddenFields: { pageNumbers: "all", fontSize: "12", fontType: "HELVETICA", position: "5", startingNumber: "1" } },
  { id: "watermark", name: "Watermark", desc: "Thêm chữ chìm bảo vệ", icon: Droplets, endpoint: "/security/add-watermark", accept: ".pdf", color: "from-purple-600 to-violet-500", group: "Bảo mật",
    fields: [{ name: "watermarkText", label: "Nội dung", type: "text", default: "MINDA" }],
    hiddenFields: { watermarkType: "text", fontSize: "30", rotation: "45", opacity: "0.3", widthSpacer: "50", heightSpacer: "50", convertPDFToImage: "false", alphabet: "roman", customColor: "#000000" } },
  { id: "ocr", name: "OCR", desc: "Nhận dạng chữ từ PDF scan", icon: ScanText, endpoint: "/misc/ocr-pdf", accept: ".pdf", color: "from-teal-600 to-emerald-500", group: "Bảo mật",
    hiddenFields: { languages: "vie", ocrType: "FORCE_OCR", ocrRenderType: "HOCR" } },
];

/* ── PDF Page Renderer ── */
function usePdfPages(file: File | null) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!file) { setPages([]); setTotal(0); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Polyfill for Promise.withResolvers (needed for older browsers/Node with pdfjs v4+)
        if (typeof (Promise as any).withResolvers === 'undefined') {
          (Promise as any).withResolvers = function () {
            let resolve, reject;
            const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
            return { promise, resolve, reject };
          };
        }
        
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        setTotal(pdf.numPages);
        const urls: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const scale = 1.0;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          urls.push(canvas.toDataURL("image/jpeg", 0.7));
        }
        if (!cancelled) setPages(urls);
      } catch (e: any) {
        console.error("PDF render error:", e);
        setTotal(-1); // signal error
        if (!cancelled) setPages([e.message || String(e)]);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [file]);

  return { pages, loading, total };
}

export default function PdfToolsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeTool, setActiveTool] = useState<PdfTool | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [splitPoints, setSplitPoints] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const singleFile = files.length > 0 ? files[0] : null;
  const { pages, loading: pagesLoading, total: pageCount } = usePdfPages(
    activeTool?.visualSplit ? singleFile : null
  );

  const openTool = (tool: PdfTool) => {
    setActiveTool(tool); setFiles([]); setDone(false); setResultUrl(null); setError("");
    setSplitPoints(new Set());
    const defaults: Record<string, string> = {};
    tool.fields?.forEach((f) => { if (f.default) defaults[f.name] = f.default; });
    setFieldValues(defaults);
  };
  const closeTool = () => { setActiveTool(null); setFiles([]); setDone(false); setResultUrl(null); setError(""); setSplitPoints(new Set()); };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (!activeTool?.multiple) setFiles([dropped[0]]); else setFiles(prev => [...prev, ...dropped]);
  }, [activeTool]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (!activeTool?.multiple) setFiles([selected[0]]); else setFiles(prev => [...prev, ...selected]);
    setSplitPoints(new Set());
  };

  const toggleSplit = (afterPage: number) => {
    setSplitPoints(prev => {
      const next = new Set(prev);
      next.has(afterPage) ? next.delete(afterPage) : next.add(afterPage);
      return next;
    });
  };

  const processFiles = async () => {
    if (!activeTool || files.length === 0) return;
    setProcessing(true); setError(""); setDone(false);
    try {
      const formData = new FormData();
      if (activeTool.multiple) files.forEach(f => formData.append("fileInput", f));
      else formData.append("fileInput", files[0]);

      // For visual split, convert split points to comma-separated string
      if (activeTool.visualSplit && splitPoints.size > 0) {
        const sorted = [...splitPoints].sort((a, b) => a - b);
        formData.append("pages", sorted.join(","));
      }

      Object.entries(fieldValues).forEach(([k, v]) => formData.append(k, v));
      // Add hidden required fields
      if (activeTool.hiddenFields) {
        Object.entries(activeTool.hiddenFields).forEach(([k, v]) => {
          if (!formData.has(k)) formData.append(k, v);
        });
      }

      const res = await fetch(`${STIRLING_API}${activeTool.endpoint}`, { method: "POST", body: formData });
      if (!res.ok) { const t = await res.text(); throw new Error(`Lỗi ${res.status}: ${t.slice(0, 200)}`); }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const contentType = res.headers.get("Content-Type") || "";
      const isZip = contentType.includes("zip") || contentType.includes("x-zip-compressed");
      let filename = `result_${activeTool.id}${isZip ? ".zip" : ".pdf"}`;
      if (disposition) { const m = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/); if (m) filename = m[1].replace(/['"]/g, ""); }
      setResultUrl(URL.createObjectURL(blob)); setResultName(filename); setDone(true);
    } catch (err: any) { setError(err.message || "Có lỗi xảy ra"); }
    finally { setProcessing(false); }
  };

  const downloadResult = () => { if (!resultUrl) return; const a = document.createElement("a"); a.href = resultUrl; a.download = resultName; a.click(); };
  const formatSize = (b: number) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
  const groups = [...new Set(TOOLS.map(t => t.group))];

  /* ── Active Tool View ── */
  if (activeTool) {
    const showVisualSplit = activeTool.visualSplit && pages.length > 0;
    return (
      <div className="min-h-screen bg-bg-main text-text-primary p-6 md:p-8 font-outfit">
        <button onClick={closeTool} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </button>
        <div className={showVisualSplit ? "max-w-5xl mx-auto" : "max-w-2xl mx-auto"}>
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeTool.color} flex items-center justify-center shadow-lg`}>
              <activeTool.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl">{activeTool.name}</h1>
              <p className="text-text-secondary text-sm">{activeTool.desc}</p>
            </div>
            {showVisualSplit && splitPoints.size > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${isDark ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" : "bg-rose-100 text-rose-600"}`}>
                  ✂️ {splitPoints.size} điểm cắt → {splitPoints.size + 1} phần
                </span>
              </div>
            )}
          </div>

          {/* Drop Zone (only show when no files) */}
          {files.length === 0 && (
            <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all ${
                dragOver ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]" : isDark ? "border-white/15 hover:border-white/30 bg-white/[0.02]" : "border-gray-300 hover:border-gray-400 bg-gray-50"
              }`}>
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? "text-indigo-400" : "text-gray-400"}`} />
              <p className="font-semibold text-lg mb-1">Kéo thả file vào đây</p>
              <p className="text-sm text-text-secondary">hoặc nhấn để chọn • {activeTool.multiple ? "Nhiều file" : "1 file"}</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept={activeTool.accept} multiple={activeTool.multiple} onChange={onFileChange} className="hidden" />

          {/* File info bar */}
          {files.length > 0 && !showVisualSplit && (
            <div className="space-y-2 mb-6">
              {files.map((f, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                  <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">{f.name}</span>
                  <span className="text-xs text-text-secondary">{formatSize(f.size)}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          {/* ── Visual PDF Split View ── */}
          {activeTool.visualSplit && files.length > 0 && (
            <div className="mb-6">
              {pagesLoading ? (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                  <p className="text-text-secondary text-sm">Đang tải {singleFile?.name}...</p>
                </div>
              ) : (
                <>
                  {/* File info */}
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-4 ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <span className="flex-1 text-sm font-medium truncate">{singleFile?.name}</span>
                    <span className="text-xs text-text-secondary">{pageCount === -1 ? <span className="text-red-500 font-bold">Lỗi: {pages[0]}</span> : `${pageCount} trang`} • {formatSize(singleFile?.size || 0)}</span>
                    <button onClick={() => { setFiles([]); setSplitPoints(new Set()); }} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Instruction */}
                  <div className={`text-center py-3 px-4 rounded-xl mb-6 text-sm ${isDark ? "bg-rose-500/10 border border-rose-500/20 text-rose-300" : "bg-rose-50 border border-rose-200 text-rose-600"}`}>
                    <Scissors className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Nhấn vào <strong>đường nét đứt</strong> giữa các trang để đánh dấu điểm cắt
                  </div>

                  {/* Pages grid with split lines */}
                  <div className="space-y-0">
                    {pages.map((dataUrl, idx) => (
                      <div key={idx}>
                        {/* Page thumbnail */}
                        <div className={`relative group rounded-2xl overflow-hidden border-2 transition-all ${
                          isDark ? "border-white/10 bg-white/5" : "border-gray-200 bg-white"
                        }`}>
                          <div className="absolute top-3 left-3 z-10">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${isDark ? "bg-black/60 text-white/80 backdrop-blur" : "bg-white/90 text-gray-600 shadow-sm"}`}>
                              Trang {idx + 1}
                            </span>
                          </div>
                          <img src={dataUrl} alt={`Trang ${idx + 1}`}
                            className="w-full h-auto block" style={{ maxHeight: "400px", objectFit: "contain", background: "white" }} />
                        </div>

                        {/* Split line between pages (not after last page) */}
                        {idx < pages.length - 1 && (
                          <button
                            onClick={() => toggleSplit(idx + 1)}
                            className={`w-full py-3 my-1 flex items-center justify-center gap-3 rounded-xl transition-all group/split ${
                              splitPoints.has(idx + 1)
                                ? "bg-rose-500/15 border-2 border-rose-500/40 hover:bg-rose-500/20"
                                : isDark
                                  ? "bg-transparent border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5"
                                  : "bg-transparent border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <Scissors className={`w-4 h-4 transition-colors ${
                              splitPoints.has(idx + 1) ? "text-rose-500" : isDark ? "text-white/20 group-hover/split:text-white/50" : "text-gray-300 group-hover/split:text-gray-500"
                            }`} />
                            <span className={`text-xs font-bold tracking-wide uppercase transition-colors ${
                              splitPoints.has(idx + 1) ? "text-rose-500" : isDark ? "text-white/20 group-hover/split:text-white/50" : "text-gray-300 group-hover/split:text-gray-500"
                            }`}>
                              {splitPoints.has(idx + 1) ? "✂️ Cắt tại đây" : "Nhấn để cắt tại đây"}
                            </span>
                            <Scissors className={`w-4 h-4 transition-colors ${
                              splitPoints.has(idx + 1) ? "text-rose-500" : isDark ? "text-white/20 group-hover/split:text-white/50" : "text-gray-300 group-hover/split:text-gray-500"
                            }`} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Extra fields */}
          {activeTool.fields && (
            <div className="mb-6 space-y-4">
              {activeTool.fields.map(field => (
                <div key={field.name}>
                  <label className="text-sm font-semibold text-text-secondary mb-1 block">{field.label}</label>
                  {field.type === "select" ? (
                    <select value={fieldValues[field.name] || ""} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`}>
                      {field.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={fieldValues[field.name] || ""} onChange={e => setFieldValues(p => ({ ...p, [field.name]: e.target.value }))}
                      placeholder={field.label} className={`w-full px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-white/5 border-white/10" : "bg-white border-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          {/* Action */}
          <div className="flex gap-4 sticky bottom-6">
            {!done ? (
              <button onClick={processFiles} disabled={files.length === 0 || processing}
                className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl ${
                  files.length === 0 || processing ? "bg-gray-500 cursor-not-allowed opacity-50" : `bg-gradient-to-r ${activeTool.color} hover:opacity-90 hover:-translate-y-0.5`
                }`}>
                {processing ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</> : activeTool.visualSplit && splitPoints.size > 0 ? `Tách thành ${splitPoints.size + 1} phần` : "Xử lý ngay"}
              </button>
            ) : (
              <button onClick={downloadResult}
                className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-green-500 hover:opacity-90 shadow-xl flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all">
                <Download className="w-5 h-5" /> Tải xuống
              </button>
            )}
          </div>
          {done && <div className="mt-4 flex items-center gap-2 justify-center text-emerald-400"><CheckCircle2 className="w-5 h-5" /><span className="font-semibold text-sm">Hoàn tất!</span></div>}
        </div>
      </div>
    );
  }

  /* ── Tool Grid ── */
  return (
    <div className="min-h-screen bg-bg-main text-text-primary p-6 md:p-8 font-outfit">
      <header className="flex items-center gap-4 mb-10 pb-6 border-b border-border-card relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <FileText className="w-7 h-7 text-white" />
        </div>
        <div className="relative z-10">
          <h1 className="font-bold text-3xl tracking-tight leading-none mb-1.5">Công cụ PDF</h1>
          <p className="text-text-secondary text-sm">Chuyển đổi, chỉnh sửa và bảo mật PDF — nhanh gọn, không giới hạn</p>
        </div>
      </header>
      <div className="space-y-10">
        {groups.map(group => (
          <div key={group}>
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 ml-1">{group}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {TOOLS.filter(t => t.group === group).map(tool => {
                const Icon = tool.icon;
                return (
                  <button key={tool.id} onClick={() => openTool(tool)}
                    className={`group flex flex-col items-center text-center p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      isDark ? "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]" : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-gray-200/50"
                    }`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-bold text-sm mb-1">{tool.name}</span>
                    <span className="text-xs text-text-secondary leading-relaxed">{tool.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
