"use client";
import { useState, useEffect, useRef } from "react";
import { Bot, X, Sparkles, Send, Loader2, TrendingUp } from "lucide-react";
import StatsPanel from "@/app/(dashboard)/assignments/StatsPanel";

export default function StudentAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [userName, setUserName] = useState("");
  const [studentId, setStudentId] = useState("");
  
  const [messages, setMessages] = useState<{role: "user" | "ai", content: string}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const role = localStorage.getItem("minda_role");
    if (role !== "student") return;

    const name = localStorage.getItem("minda_user_name") || "Học sinh";
    // minda_student_id có thể là "#MND-0042" hoặc "42" - lấy phần số
    const rawId = localStorage.getItem("minda_user_id") || "0";
    const numId = rawId.replace(/\D/g, "");
    setUserName(name);
    setStudentId(numId);

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/assignments/student/my-submissions`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("minda_token")}` }
    })
      .then(res => res.json())
      .then(data => {
         if(Array.isArray(data)) setSubmissions(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput("");
    
    const contextStr = messages.map(m => `${m.role === 'user' ? 'Học sinh' : 'AI'}: ${m.content}`).join("\n");
    const fullPrompt = contextStr ? `Lịch sử trò chuyện:\n${contextStr}\n\nHọc sinh: ${userMsg}\nAI:` : userMsg;

    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://minda.io.vn'}/api/ai/solve-math`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("minda_token")}`,
        },
        body: JSON.stringify({ prompt: fullPrompt }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: "ai", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: "AI không phản hồi, thử lại sau nhé." }]);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e?.name === "AbortError") {
        setMessages(prev => [...prev, { role: "ai", content: "AI mất quá lâu để phản hồi. Vui lòng thử lại." }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", content: "Lỗi kết nối AI. Vui lòng thử lại sau." }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  if (!isMounted) return null;
  const role = localStorage.getItem("minda_role");
  if (role !== "student") return null;

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.5)] hover:scale-110 hover:shadow-[0_0_30px_rgba(217,70,239,0.6)] transition-all duration-300 group cursor-pointer"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity cursor-pointer"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Right Sidebar Drawer */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[400px] bg-bg-card border-l border-border-card shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border-card flex items-center justify-between bg-bg-main/50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-lg text-text-primary tracking-tight">MINDA <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-fuchsia-500">Copilot</span></h2>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-bg-hover rounded-full text-text-secondary transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content: Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col custom-scrollbar">
          
          {/* Chart Section */}
          <div className="p-4 border-b border-border-card bg-bg-main/30">
             <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-1.5">
               <TrendingUp className="w-4 h-4 text-indigo-500" /> Tiến độ & Phân tích
             </h3>
             <div className="bg-bg-card rounded-2xl border border-border-card p-1 shadow-sm overflow-hidden min-h-[250px]">
                <StatsPanel 
                  submissions={submissions} 
                  statsStudent={{ id: Number(studentId.replace(/\D/g, '') || 0), name: userName, avatar: null }}
                  hideStudentSelector={true}
                />
             </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 flex flex-col gap-4">
             {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 mt-10">
                   <Bot className="w-12 h-12 text-indigo-500 mb-3 drop-shadow-md" />
                   <p className="text-sm text-text-primary font-bold">Xin chào, {userName}!</p>
                   <p className="text-xs text-text-secondary mt-1 px-4 leading-relaxed">Gửi biểu đồ cho AI phân tích, hoặc hỏi bất kỳ vấn đề gì về bài tập nhé.</p>
                </div>
             ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-tr from-indigo-600 to-fuchsia-600 text-white rounded-br-none' 
                        : 'bg-bg-hover border border-border-card text-text-primary rounded-bl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))
             )}
             {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-bg-hover border border-border-card rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    <span className="text-xs font-medium text-text-secondary">AI đang suy nghĩ...</span>
                  </div>
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-bg-main border-t border-border-card">
          <div className="flex items-center gap-2 bg-bg-card border border-border-card rounded-full p-1 pl-4 shadow-sm focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
             <input 
               type="text" 
               placeholder="Nhập câu hỏi tại đây..." 
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               className="flex-1 bg-transparent border-none outline-none text-[13px] text-text-primary placeholder:text-text-muted py-2.5"
             />
             <button 
               onClick={handleSend}
               disabled={isTyping || !input.trim()}
               className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm cursor-pointer"
             >
               <Send className="w-4 h-4" />
             </button>
          </div>
        </div>

      </div>
    </>
  );
}
