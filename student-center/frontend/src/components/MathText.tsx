import React from "react";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";

// Syntax highlight for code blocks using inline styles (no extra lib needed)
const LANG_COLORS: Record<string, { bg: string; border: string; label: string }> = {
  html:       { bg: "#1e1b2e", border: "#7c3aed40", label: "HTML" },
  css:        { bg: "#0f1f2e", border: "#0ea5e940", label: "CSS" },
  javascript: { bg: "#1a1a0f", border: "#eab30840", label: "JavaScript" },
  js:         { bg: "#1a1a0f", border: "#eab30840", label: "JavaScript" },
  python:     { bg: "#0f1e0f", border: "#22c55e40", label: "Python" },
  py:         { bg: "#0f1e0f", border: "#22c55e40", label: "Python" },
  cpp:        { bg: "#0f1828", border: "#3b82f640", label: "C++" },
  c:          { bg: "#0f1828", border: "#3b82f640", label: "C" },
  java:       { bg: "#1f1000", border: "#f97316 40", label: "Java" },
  pascal:     { bg: "#1a0f2e", border: "#a78bfa40", label: "Pascal" },
  sql:        { bg: "#0f1a1a", border: "#06b6d440", label: "SQL" },
  default:    { bg: "#141414", border: "#ffffff18", label: "Code" },
};

/** Renders a fenced code block segment as a styled <pre> */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const scheme = LANG_COLORS[lang.toLowerCase()] ?? LANG_COLORS.default;
  const label = (LANG_COLORS[lang.toLowerCase()]?.label ?? lang.toUpperCase()) || "Code";
  return (
    <span
      style={{
        display: "block",
        margin: "0.75em 0",
        borderRadius: 10,
        border: `1px solid ${scheme.border}`,
        background: scheme.bg,
        overflow: "hidden",
      }}
    >
      {/* Language bar */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderBottom: `1px solid ${scheme.border}`,
          fontSize: 11,
          color: "#9ca3af",
          fontFamily: "monospace",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: scheme.border.replace("40", "99"), display: "inline-block" }} />
        {label}
      </span>
      <pre
        style={{
          margin: 0,
          padding: "12px 16px",
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
          fontSize: "0.82em",
          lineHeight: 1.65,
          color: "#e2e8f0",
          overflowX: "auto",
          whiteSpace: "pre",
        }}
      >
        <code>{code.replace(/^\n/, "").replace(/\n$/, "")}</code>
      </pre>
    </span>
  );
}

/**
 * Splits raw text into segments:
 * - { type: "code", lang, content } for fenced code blocks
 * - { type: "text", content } for normal text (will be LaTeX-rendered)
 */
function splitSegments(str: string) {
  const segments: Array<{ type: "code" | "text"; lang?: string; content: string }> = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: str.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", lang: match[1] || "text", content: match[2] });
    lastIndex = codeBlockRegex.lastIndex;
  }
  if (lastIndex < str.length) {
    segments.push({ type: "text", content: str.slice(lastIndex) });
  }
  return segments;
}

/** Escapes raw HTML tags in non-math, non-code text to prevent DOM injection */
function escapeHtmlInText(str: string): string {
  // Split by LaTeX delimiters (do not escape inside math blocks)
  const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;
  return str.split(regex).map((part, i) => {
    if (i % 2 === 0) return part.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return part;
  }).join("");
}

/** Helper to parse inline Markdown bold **text** and render LaTeX */
function InlineMarkdownLatex({ text }: { text: string }) {
  if (!text) return null;

  // Replace **bold** with <strong> and preserve KaTeX math
  const parts = text.split(/(\*\*[\s\S]+?\*\*)/g);
  return (
    <>
      {parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          const content = part.slice(2, -2);
          return (
            <strong key={idx} className="font-bold text-text-primary">
              <Latex>{escapeHtmlInText(content)}</Latex>
            </strong>
          );
        }
        return <Latex key={idx}>{escapeHtmlInText(part)}</Latex>;
      })}
    </>
  );
}

/** Renders a section of non-code text with Markdown elements (headings, lists, linebreaks) */
function MarkdownBlock({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="my-2.5 space-y-1.5 pl-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`list-${idx}`);
      return;
    }

    // Heading 3: ### Title
    if (trimmed.startsWith("### ")) {
      flushList(`list-${idx}`);
      elements.push(
        <h3 key={idx} className="text-base font-black text-indigo-300 mt-5 mb-2 flex items-center gap-2 border-b border-indigo-500/20 pb-1.5">
          <InlineMarkdownLatex text={trimmed.slice(4)} />
        </h3>
      );
    }
    // Heading 4: #### Title
    else if (trimmed.startsWith("#### ")) {
      flushList(`list-${idx}`);
      elements.push(
        <h4 key={idx} className="text-sm font-bold text-text-primary mt-4 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
          <InlineMarkdownLatex text={trimmed.slice(5)} />
        </h4>
      );
    }
    // Bullet item: - Item or * Item
    else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      currentList.push(
        <li key={idx} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
          <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
          <div>
            <InlineMarkdownLatex text={trimmed.slice(2)} />
          </div>
        </li>
      );
    }
    // Normal paragraph
    else {
      flushList(`list-${idx}`);
      elements.push(
        <p key={idx} className="text-xs text-text-secondary leading-relaxed mb-2.5">
          <InlineMarkdownLatex text={trimmed} />
        </p>
      );
    }
  });

  flushList(`list-end`);
  return <div className="space-y-1">{elements}</div>;
}

export default function MathText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (typeof children !== "string") {
    return <span className={className}>{children}</span>;
  }

  const segments = splitSegments(children);

  return (
    <div className={`math-text-wrapper space-y-2 ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "code") {
          return <CodeBlock key={idx} lang={seg.lang ?? ""} code={seg.content} />;
        }
        return <MarkdownBlock key={idx} content={seg.content} />;
      })}
    </div>
  );
}
