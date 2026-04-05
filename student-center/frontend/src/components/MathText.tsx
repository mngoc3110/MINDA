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
   
   return (
      <span className={`math-text-wrapper ${className}`}>
         <Latex>{children}</Latex>
      </span>
   );
}
