"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Upload, Sparkles, User, BrainCircuit, Loader2, Maximize2, Minimize2, Trash2 } from "lucide-react";
import { ShapeType } from "./Math3DViewer";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  imageUrl?: string;
}

export interface GeometryData {
  points: Record<string, string>;
  lines: { from: string; to: string; style: "solid" | "dashed"; color?: string }[];
}

interface AILogicSolverProps {
  onDetectedShape: (shape: ShapeType) => void;
  onDetectedGeometry?: (geo: GeometryData | null) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function AILogicSolver({ onDetectedShape, onDetectedGeometry, isFullscreen, onToggleFullscreen }: AILogicSolverProps) {
  const defaultMessages: Message[] = [
    {
      id: "1",
      sender: "ai",
      text: "Chào bạn! Tôi là Trợ lý AI MINDA. Hãy tải lên ảnh chứa đề bài hoặc gõ câu hỏi Toán/Hình học vào đây, tôi sẽ phân tích và trực quan hoá dạng hình học 3D cho bạn nhé!",
    },
  ];
  
  const [messages, setMessages] = useState<Message[]>(defaultMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khôi phục tin nhắn từ LocalStorage khi trang tải xong
  useEffect(() => {
    const saved = localStorage.getItem("minda_ai_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
  }, []);

  // Lưu tin nhắn vào LocalStorage mỗi khi có thay đổi
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("minda_ai_chat_history", JSON.stringify(messages));
    } else if (messages.length === 1) {
      // Nếu chỉ có 1 tin nhắn mặc định, xóa history
      localStorage.removeItem("minda_ai_chat_history");
    }
  }, [messages]);

  const handleClearHistory = () => {
    setMessages(defaultMessages);
    localStorage.removeItem("minda_ai_chat_history");
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("minda_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/ai/solve-math`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ prompt: userMsg.text })
      });

      if (!res.ok) throw new Error("API call failed.");
      const data = await res.json();
      let aiText = data.reply as string;

      // Extract shape tag
      const shapeMatch = aiText.match(/\[MATH_SHAPE=([a-zA-Z]+)\]/);
      let matchedShape: ShapeType | null = null;
      if (shapeMatch && shapeMatch[1]) {
         matchedShape = shapeMatch[1].toLowerCase() as ShapeType;
         aiText = aiText.replace(shapeMatch[0], "").trim();
      }

      // Extract geometry tag
      const geoMatch = aiText.match(/\[MATH_GEOMETRY=(\{.*\})\]/);
      let geometryData: GeometryData | null = null;
      if (geoMatch && geoMatch[1]) {
         try { geometryData = JSON.parse(geoMatch[1]); } catch (e) { console.error("Failed to parse geometry", e); }
         aiText = aiText.replace(geoMatch[0], "").trim();
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: aiText },
      ]);

      if (matchedShape) {
        onDetectedShape(matchedShape);
      }
      if (onDetectedGeometry) {
        onDetectedGeometry(geometryData);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: "Xin lỗi, hiện tại Trí Tuệ Mạng của tôi đang gặp trục trặc đường truyền tới Máy chủ Google Gemini. Xin hãy thử lại sau nhé!" },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hiển thị ảnh preview ngay lập tức
    const objectUrl = URL.createObjectURL(file);
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: "Đã gửi một hình ảnh chứa bài toán.",
      imageUrl: objectUrl
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem("minda_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/ai/solve-image`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        },
        body: formData
      });

      if (!res.ok) throw new Error("API call failed.");
      const data = await res.json();
      let aiText = data.reply as string;

      const shapeMatch = aiText.match(/\[MATH_SHAPE=([a-zA-Z]+)\]/);
      let matchedShape: ShapeType | null = null;
      if (shapeMatch && shapeMatch[1]) {
         matchedShape = shapeMatch[1].toLowerCase() as ShapeType;
         aiText = aiText.replace(shapeMatch[0], "").trim();
      }

      const geoMatch = aiText.match(/\[MATH_GEOMETRY=(\{.*\})\]/);
      let geometryData: GeometryData | null = null;
      if (geoMatch && geoMatch[1]) {
         try { geometryData = JSON.parse(geoMatch[1]); } catch (e) { console.error("Failed to parse geometry", e); }
         aiText = aiText.replace(geoMatch[0], "").trim();
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: aiText },
      ]);

      if (matchedShape) {
        onDetectedShape(matchedShape);
      }
      if (onDetectedGeometry) {
        onDetectedGeometry(geometryData);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: "Lỗi phân tích hình ảnh! Xin hãy thử lại sau." },
      ]);
    } finally {
      setIsTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center p-1 backdrop-blur-md border border-white/30">
            <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
             <h2 className="text-xl font-bold font-outfit text-white leading-tight">AI Math Solver</h2>
             <p className="text-indigo-100 text-xs font-medium">Trợ lý Tối thượng Phân tích & Hình học</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleClearHistory}
             className="p-2 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-colors"
             title="Xóa lịch sử trò chuyện"
           >
             <Trash2 className="w-5 h-5" />
           </button>
           {onToggleFullscreen && (
              <button 
                onClick={onToggleFullscreen}
                className="p-2 rounded-xl text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
           )}
        </div>
      </div>

      {/* API Key Status Bar */}
      <div className="bg-slate-800 text-slate-300 text-[10px] sm:text-xs py-1.5 px-4 flex items-center justify-between z-10 border-b border-slate-700 shadow-inner">
         <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono uppercase tracking-wider">Hệ thống AI: Hoạt động Tốt</span>
         </div>
         <div className="flex items-center gap-3 font-mono">
            <span className="hidden sm:inline-block">🟢 Primary: 5/5 Gemini Keys</span>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="text-emerald-400">🟢 Fallback: OpenRouter Ready</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative">
         <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

         {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 relative z-10 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === "user" ? "bg-slate-200 border-slate-300" : "bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-400 shadow-sm"}`}>
                  {msg.sender === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4 text-white" />}
               </div>
               
               <div className={`max-w-[90%] px-4 py-3 rounded-2xl overflow-x-auto ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"}`}>
                  {msg.sender === "user" ? (
                     <div className="space-y-2">
                        {msg.imageUrl && (
                           <img src={msg.imageUrl} alt="Uploaded problem" className="max-w-[200px] sm:max-w-xs rounded-xl border border-white/20 shadow-sm" />
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                     </div>
                  ) : (
                     <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        <ReactMarkdown
                           remarkPlugins={[remarkGfm, remarkMath]}
                           rehypePlugins={[rehypeKatex]}
                           components={{
                              table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table className="min-w-full divide-y divide-slate-200 border border-slate-200 rounded-lg text-xs md:text-sm" {...props} /></div>,
                              thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                              th: ({node, ...props}) => <th className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200" {...props} />,
                              td: ({node, ...props}) => <td className="px-3 py-2 whitespace-nowrap border-b border-slate-100" {...props} />,
                              p: ({node, ...props}) => <p className="my-1.5" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-5 my-1.5" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-1.5" {...props} />,
                              a: ({node, ...props}) => <a className="text-indigo-500 hover:underline font-medium" {...props} />,
                              code: ({node, className, children, ...props}: any) => {
                                 const match = /language-(\w+)/.exec(className || '');
                                 return !match ? (
                                    <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded text-xs" {...props}>{children}</code>
                                 ) : (
                                    <pre className="bg-slate-800 text-slate-100 p-3 rounded-xl overflow-x-auto text-xs my-2">
                                       <code className={className} {...props}>{children}</code>
                                    </pre>
                                 );
                              }
                           }}
                        >
                           {msg.text}
                        </ReactMarkdown>
                     </div>
                  )}
               </div>
            </div>
         ))}

         {isTyping && (
            <div className="flex gap-3 relative z-10">
               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 border border-indigo-400 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
               </div>
               <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
               </div>
            </div>
         )}
         
         <div ref={endOfMessagesRef} className="h-2" />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
         <div className="flex items-center gap-2">
             <input 
                type="file" 
                accept="image/*"
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImageUpload}
             />
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isTyping}
                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
             >
                <Upload className="w-5 h-5" />
             </button>
             <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Nhập bài toán Hình học của bạn tại đây..."
                className="flex-1 bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all text-slate-700 placeholder:text-slate-400"
             />
             <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2"
             >
                {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
             </button>
         </div>
         <p className="text-center text-[10px] text-slate-400 mt-2">MINDA AI có thể mắc lỗi trong quá trình nháp phương trình mô phỏng.</p>
      </div>

    </div>
  );
}
