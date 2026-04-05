import React from "react";
import MathText from "./MathText";

// Dictionary of predefined LaTeX snippets. The `offset` determines where the cursor goes inside the snippet.
export const LATEX_SNIPPETS = [
   { label: "Phân số", snippet: "\\frac{ }{ } ", offset: 4 }, // \frac{ | }{ } -> 9 char, offset is from the end (offset=4 -> \frac{|}{ })
   { label: "Căn bậc 2", snippet: "\\sqrt{ } ", offset: 3 },
   { label: "Căn bậc n", snippet: "\\sqrt[n]{ } ", offset: 3 },
   { label: "Số mũ", snippet: "^{ } ", offset: 3 },
   { label: "Chỉ số dưới", snippet: "_{ } ", offset: 3 },
   { label: "Tích phân", snippet: "\\int_{}^{} dx ", offset: 7 },
   { label: "Tổng (Sigma)", snippet: "\\sum_{i=1}^{n} ", offset: 1 },
   { label: "Giới hạn", snippet: "\\lim_{{x \\to 0}} ", offset: 1 },
   { label: "Vô cùng", snippet: "\\infty ", offset: 1 },
   { label: "Pi", snippet: "\\pi ", offset: 1 },
   { label: "Alpha", snippet: "\\alpha ", offset: 1 },
   { label: "Góc", snippet: "\\widehat{A} ", offset: 4 },
   { label: "Véc tơ", snippet: "\\vec{v} ", offset: 4 },
   { label: "Hệ PT", snippet: "\\begin{cases} x+y=0 \\\\ x-y=1 \\end{cases} ", offset: 27 },
   { label: "Khoảng", snippet: "\\in (a; b) ", offset: 8 },
];

interface LatexToolbarProps {
   onInsertSnippet: (snippet: string, cursorOffsetFromEnd: number) => void;
}

export default function LatexToolbar({ onInsertSnippet }: LatexToolbarProps) {
   return (
      <div className="flex flex-wrap items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-t-xl mb-4 backdrop-blur-md sticky top-0 z-50 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
         <div className="text-[11px] font-black uppercase text-indigo-400 mr-2 shrink-0">
            KÝ HIỆU TOÁN
         </div>
         {LATEX_SNIPPETS.map((item, idx) => (
            <button
               key={idx}
               type="button"
               onMouseDown={(e) => {
                  e.preventDefault(); // Giữ nguyên focus ở ô text
                  onInsertSnippet(item.snippet, item.offset);
               }}
               className="shrink-0 px-2.5 py-1.5 rounded-lg bg-black/20 hover:bg-indigo-500/30 text-indigo-300 font-mono text-xs border border-white/5 hover:border-indigo-500/50 transition-colors flex items-center gap-2 group"
               title={item.label}
            >
               <span>{item.label}</span>
               <span className="opacity-40 group-hover:opacity-100 flex items-center justify-center scale-90">
                  <MathText>{`$${item.snippet.replace(/ /g, "")}$`}</MathText>
               </span>
            </button>
         ))}
      </div>
   );
}
