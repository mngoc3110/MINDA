import React from "react";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";

export default function MathText({ 
   children, 
   className = "" 
}: { 
   children: React.ReactNode, 
   className?: string 
}) {
   if (typeof children !== "string") {
      return <span className={className}>{children}</span>;
   }
   // Escape HTML tags outside of math blocks to prevent raw HTML rendering (e.g. IT questions)
   const escapeHtmlInText = (str: string) => {
      // Split by common LaTeX delimiters: $$, $, \[, \], \(, \)
      const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
      return str.split(regex).map((part, i) => {
         // Even indices are normal text, odd indices are math blocks
         if (i % 2 === 0) {
            return part.replace(/</g, "&lt;").replace(/>/g, "&gt;");
         }
         return part; // keep math exactly as is
      }).join('');
   };
   
   return (
      <span className={`math-text-wrapper ${className}`}>
         <Latex>{escapeHtmlInText(children)}</Latex>
      </span>
   );
}
