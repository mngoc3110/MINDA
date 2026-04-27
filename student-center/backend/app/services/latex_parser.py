"""
LaTeX Direct Parser - Parse LaTeX exam files directly without AI.
Handles Vietnamese math exam format:
  - \textbf{Câu X} with A./B./C./D. options
  - Sections: Phần I (MCQ), Phần II (True/False), Phần III (Short Answer)
  - a)/b)/c)/d) items for True/False
"""
import re


def parse_latex_directly(latex_text: str) -> dict:
    """
    Parse a LaTeX .tex file directly into quiz JSON structure.
    No AI needed - pure regex/text parsing.
    """
    print("[LaTeX Parser] Bắt đầu parse trực tiếp file LaTeX (không dùng AI)...")

    sections = []
    
    # Strip TikZ blocks before section splitting to avoid regex confusion
    cleaned_for_split = re.sub(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', '[TIKZ_PLACEHOLDER]', latex_text, flags=re.DOTALL)

    # Detect section boundaries
    section_splits = re.split(
        r'\\section\*?\{(.*?)\}',
        cleaned_for_split,
        flags=re.DOTALL
    )
    print(f"[LaTeX Parser] Found {len(section_splits)//2} sections")
    # section_splits = [before_first_section, title1, content1, title2, content2, ...]

    # If no \section found, treat entire document as one block
    if len(section_splits) <= 1:
        mcq, tf, sa = _parse_block(latex_text)
        if mcq:
            sections.append({"type": "mcq", "instruction": "Phần Trắc nghiệm", "questions": mcq})
        if tf:
            sections.append({"type": "true_false", "instruction": "Phần Đúng/Sai", "questions": tf})
        if sa:
            sections.append({"type": "short_answer", "instruction": "Phần Trả lời ngắn", "questions": sa})
    else:
        # Process each section
        for i in range(1, len(section_splits), 2):
            title = section_splits[i].strip()
            content = section_splits[i + 1] if i + 1 < len(section_splits) else ""

            title_lower = title.lower()
            print(f"[LaTeX Parser] Section: '{title_lower}'")

            # Detect MCQ: chọn một phương án / trắc nghiệm nhiều / phương án
            is_mcq = any(kw in title_lower for kw in [
                'chọn một phương án', 'trắc nghiệm nhiều', 'phương án lựa chọn',
                'trắc nghiệm', 'câu trắc nghiệm'
            ])
            is_tf = any(kw in title_lower for kw in [
                'đúng sai', 'đúng/sai', 'đúng hoặc sai', 'chọn đúng hoặc sai'
            ])
            is_sa = any(kw in title_lower for kw in [
                'trả lời ngắn', 'phần iii', 'phần 3'
            ])

            if is_mcq and not is_tf and not is_sa:
                mcq = _parse_mcq_section(content)
                if mcq:
                    sections.append({
                        "type": "mcq",
                        "instruction": title,
                        "questions": mcq
                    })
            elif is_tf:
                tf = _parse_tf_section(content)
                if tf:
                    sections.append({
                        "type": "true_false",
                        "instruction": title,
                        "questions": tf
                    })
            elif is_sa:
                sa = _parse_sa_section(content)
                if sa:
                    sections.append({
                        "type": "short_answer",
                        "instruction": title,
                        "questions": sa
                    })
            else:
                # Auto-detect from content
                mcq, tf, sa = _parse_block(content)
                if mcq:
                    sections.append({"type": "mcq", "instruction": title, "questions": mcq})
                if tf:
                    sections.append({"type": "true_false", "instruction": title, "questions": tf})
                if sa:
                    sections.append({"type": "short_answer", "instruction": title, "questions": sa})

    total = sum(len(s.get("questions", [])) for s in sections)
    print(f"[LaTeX Parser] ✅ Parsed {total} questions trực tiếp từ LaTeX")

    if not sections:
        raise ValueError("Không tìm thấy câu hỏi nào trong file LaTeX. Vui lòng kiểm tra cấu trúc file.")

    return {"sections": sections}


def _clean_latex(text: str) -> str:
    """Clean LaTeX formatting for display. Keep $math$ intact."""
    text = text.strip()
    
    # Protect tabular blocks
    tables = []
    def save_table(match):
        tables.append(match.group(0))
        return f"__TABLE_BLOCK_{len(tables)-1}__"
    
    text = re.sub(r'\\begin\{tabular\}.*?\\end\{tabular\}', save_table, text, flags=re.DOTALL)

    # Remove \textbf, \textit etc. but keep content
    text = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\underline\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]*)\}', r'\1', text)
    
    # Handle TikZ - placeholder only (compiling during parse is too slow)
    text = re.sub(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', '\n[Đồ thị TikZ]\n', text, flags=re.DOTALL)
    
    # Handle Includegraphics (replace with placeholder)
    text = re.sub(r'\\includegraphics(?:\[.*?\])?\{(.*?)\}', r'\n[Hình ảnh: \1]\n', text)
    
    # Handle Center tags (remove them, keep content)
    text = re.sub(r'\\begin\{center\}', '', text)
    text = re.sub(r'\\end\{center\}', '', text)
    
    # Remove layout commands
    text = re.sub(r'\\[vh]space\*?\{[^}]*\}', '', text)
    text = re.sub(r'\\noindent\b', '', text)
    text = re.sub(r'\\newline\b', ' ', text)
    
    # Remove \\IfFileExists blocks
    text = re.sub(r'\\IfFileExists\{[^}]*\}\{.*?\}\{.*?\}', '', text, flags=re.DOTALL)
    
    # Remove trailing \\
    text = re.sub(r'\\\\\s*$', '', text)
    text = re.sub(r'\\\\(?!\S)', ' ', text)
    
    # Remove \item
    text = re.sub(r'\\item\b', '', text)
    
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Restore tables, convert tabular to array so KaTeX can render them
    for i, table_text in enumerate(tables):
        # Remove '$' signs inside the table to prevent nested math mode errors in KaTeX
        table_text = table_text.replace('$', '')
        table_text = re.sub(r'\\begin\{tabular\}', r'$$\n\\begin{array}', table_text)
        table_text = re.sub(r'\\end\{tabular\}', r'\n\\end{array}\n$$', table_text)
        text = text.replace(f"__TABLE_BLOCK_{i}__", table_text)
        
    return text.strip()


def _split_questions(content: str) -> list:
    """Split content by \\textbf{Câu X} markers. Returns list of (number, block)."""
    # Pattern: \textbf{Câu X}  or  \textbf{Câu X.}  or  \textbf{Câu X:}  or  \textbf{Câu X}
    pattern = r'\\textbf\{Câu\s+(\d+)\s*[.:)]?\s*\}'
    parts = re.split(pattern, content)
    print(f"[LaTeX Parser] _split_questions found {len(parts)//2} questions")
    # parts = [before, num1, block1, num2, block2, ...]
    questions = []
    for i in range(1, len(parts), 2):
        num = parts[i]
        block = parts[i + 1] if i + 1 < len(parts) else ""
        questions.append((num, block.strip()))
    return questions


def _parse_mcq_section(content: str) -> list:
    """Parse MCQ section: \textbf{Câu X} with A./B./C./D. options."""
    questions = []
    q_blocks = _split_questions(content)

    for num, block in q_blocks:
        options = _extract_abcd_options(block)
        if len(options) >= 2:
            # Question text = everything before first "A." option line
            q_text = _get_question_text(block)
            q_text = f"Câu {num}. {q_text}"
            questions.append({
                "id": f"q{num}",
                "text": q_text,
                "options": [_clean_latex(o) for o in options],
                "correctAnswer": 0,
                "explanation": ""
            })

    return questions


def _get_question_text(block: str) -> str:
    """Extract question text from block (everything before A. option)."""
    # Protect math content to avoid matching A/B inside formulas
    math_blocks = []
    def save_math(m):
        math_blocks.append(m.group(0))
        return f"__MATH_{len(math_blocks)-1}__"
    protected = re.sub(r'\$[^$]+\$', save_math, block)
    
    lines = protected.split('\n')
    q_lines = []
    found_option = False
    for line in lines:
        stripped = line.strip()
        if re.match(r'^A\s*[.:)]\s', stripped):
            found_option = True
            break
        q_lines.append(line)

    if found_option:
        result = '\n'.join(q_lines)
    else:
        parts = re.split(r'(?:^|\n)\s*A\s*[.:)]\s', protected, maxsplit=1)
        result = parts[0] if len(parts) > 1 else protected
    
    # Restore math blocks
    for i, mb in enumerate(math_blocks):
        result = result.replace(f"__MATH_{i}__", mb)
    
    return _clean_latex(result)


def _extract_abcd_options(block: str) -> list:
    """Extract A/B/C/D options from a text block. Handles \\\\ or inline separators."""
    options = []

    # Replace \hfill and \\ with newlines for uniform processing
    normalized = block.replace('\\\\', '\n').replace('\\hfill', '\n')
    
    # Protect math content: temporarily replace $...$ with placeholders
    math_blocks = []
    def save_math(m):
        math_blocks.append(m.group(0))
        return f"__MATH_{len(math_blocks)-1}__"
    protected = re.sub(r'\$[^$]+\$', save_math, normalized)
    
    # Now split by A. B. C. D. at start of line only
    # Force each option letter to start on a new line
    protected = re.sub(r'\n\s*([A-D])\s*[.)]\s', r'\n\1. ', protected)
    
    # Match A. B. C. D. at start of line
    pattern = r'(?:^|\n)\s*([A-D])\s*[.)]\s*(.*?)(?=(?:^|\n)\s*[A-D]\s*[.)]|\Z)'
    matches = re.findall(pattern, protected, re.DOTALL)

    if len(matches) >= 2:
        for letter, text in matches:
            cleaned = text.strip()
            # Remove trailing \\ or newlines
            cleaned = re.sub(r'\\\\\s*$', '', cleaned).strip()
            # Restore math blocks
            for i, mb in enumerate(math_blocks):
                cleaned = cleaned.replace(f"__MATH_{i}__", mb)
            if cleaned:
                options.append(cleaned)

    return options


def _parse_tf_section(content: str) -> list:
    """Parse True/False section with a)/b)/c)/d) items."""
    questions = []
    q_blocks = _split_questions(content)

    for num, block in q_blocks:
        # Extract question context (before a) or \item)
        parts = re.split(r'(?:\n\s*a\s*\)|\\item\b)', block, maxsplit=1)
        if len(parts) > 1:
            ctx = parts[0]
            ctx = re.sub(r'\\begin\{enumerate\}.*', '', ctx, flags=re.DOTALL)
            q_text = _clean_latex(ctx)
        else:
            q_text = _clean_latex(block)
            
        q_text = f"Câu {num}. {q_text}"

        # Extract a), b), c), d) items or \item
        items = _extract_abcd_items(block)
        if items:
            questions.append({
                "id": f"tf{num}",
                "text": q_text,
                "items": items
            })

    return questions


def _extract_abcd_items(block: str) -> list:
    """Extract a)/b)/c)/d) or \item items for True/False questions."""
    items = []

    # Strategy 1: Look for literal a) b) c) d)
    normalized = block.replace('\\\\', '\n')
    pattern = r'(?:^|\n)\s*([a-d])\s*\)\s*(.*?)(?=(?:^|\n)\s*[a-d]\s*\)|\Z)'
    matches = re.findall(pattern, normalized, re.DOTALL | re.MULTILINE)

    if len(matches) < 2:
        # Strategy 2: Look for \item ...
        parts = re.split(r'\\item\b', block)
        if len(parts) > 1:
            matches = []
            labels = ['a', 'b', 'c', 'd']
            for i, p in enumerate(parts[1:]):
                label = labels[i] if i < len(labels) else f"item_{i}"
                p = re.sub(r'\\end\{enumerate\}.*', '', p, flags=re.DOTALL)
                matches.append((label, p.strip()))

    for label, text in matches:
        cleaned = _clean_latex(text)
        if cleaned:
            items.append({
                "label": label,
                "text": cleaned,
                "isTrue": False  # Teacher sẽ tự điền đáp án sau
            })

    return items


def _parse_sa_section(content: str) -> list:
    """Parse Short Answer section."""
    questions = []
    q_blocks = _split_questions(content)

    for num, block in q_blocks:
        q_text = _clean_latex(block)
        if q_text:
            q_text = f"Câu {num}. {q_text}"
            questions.append({
                "id": f"sa{num}",
                "text": q_text,
                "correctAnswer": "",
                "explanation": ""
            })

    return questions


def _parse_block(content: str) -> tuple:
    """Fallback: parse an entire block without section headers."""
    mcq = _parse_mcq_section(content)

    # If no \textbf{Câu} found, try generic format
    if not mcq:
        mcq = _parse_generic_numbered(content)

    tf = []  # Can't distinguish without section headers
    sa = []
    return mcq, tf, sa


def _parse_generic_numbered(latex_text: str) -> list:
    """Fallback: parse Câu X. or Câu X: format (without \\textbf)."""
    questions = []

    pattern = r'(?:Câu|C[aâ]u)\s*(\d+)\s*[.:)}\s]\s*(.*?)(?=(?:Câu|C[aâ]u)\s*\d+\s*[.:)}\s]|\Z)'
    matches = re.findall(pattern, latex_text, re.DOTALL | re.IGNORECASE)

    for num, block in matches:
        options = _extract_abcd_options(block)
        if options:
            q_text = _get_question_text(block)
            q_text = f"Câu {num}. {q_text}"
            questions.append({
                "id": f"q{num}",
                "text": q_text,
                "options": [_clean_latex(o) for o in options],
                "correctAnswer": 0,
                "explanation": ""
            })

    return questions
