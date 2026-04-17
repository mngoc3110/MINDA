"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Upload, Sparkles, User, BrainCircuit, Loader2 } from "lucide-react";
import { ShapeType } from "./Math3DViewer";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface AILogicSolverProps {
  onDetectedShape: (shape: ShapeType) => void;
}

export default function AILogicSolver({ onDetectedShape }: AILogicSolverProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Chào bạn! Tôi là Trợ lý AI MINDA. Hãy tải lên ảnh chứa đề bài hoặc gõ câu hỏi Toán/Hình học vào đây, tôi sẽ phân tích và trực quan hoá dạng hình học 3D cho bạn nhé!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

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

      // Extract the hidden shape parameter inserted by LLM based on system instructions
      const shapeMatch = aiText.match(/\[MATH_SHAPE=([a-zA-Z]+)\]/);
      let matchedShape: ShapeType | null = null;
      if (shapeMatch && shapeMatch[1]) {
         matchedShape = shapeMatch[1].toLowerCase() as ShapeType;
         // Strip the system tag before rendering the chat message naturally
         aiText = aiText.replace(shapeMatch[0], "").trim();
      }

      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: aiText },
      ]);

      if (matchedShape) {
        onDetectedShape(matchedShape);
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

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative">
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 z-10 shadow-md">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center p-1 backdrop-blur-md border border-white/30">
          <BrainCircuit className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
           <h2 className="text-xl font-bold font-outfit text-white leading-tight">AI Math Solver</h2>
           <p className="text-indigo-100 text-xs font-medium">Trợ lý Tối thượng Phân tích & Hình học không gian</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 relative">
         <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

         {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 relative z-10 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.sender === "user" ? "bg-slate-200 border-slate-300" : "bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-400 shadow-sm"}`}>
                  {msg.sender === "user" ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4 text-white" />}
               </div>
               
               <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
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
             <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
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
