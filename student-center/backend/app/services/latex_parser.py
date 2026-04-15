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

    # Detect section boundaries
    section_splits = re.split(
        r'\\section\*?\{(.*?)\}',
        latex_text,
        flags=re.DOTALL
    )
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

            if any(kw in title_lower for kw in ['trắc nghiệm nhiều', 'phương án', 'trắc nghiệm']):
                if 'đúng sai' not in title_lower and 'trả lời ngắn' not in title_lower:
                    mcq = _parse_mcq_section(content)
                    if mcq:
                        sections.append({
                            "type": "mcq",
                            "instruction": title,
                            "questions": mcq
                        })

            if 'đúng sai' in title_lower or 'đúng/sai' in title_lower:
                tf = _parse_tf_section(content)
                if tf:
                    sections.append({
                        "type": "true_false",
                        "instruction": title,
                        "questions": tf
                    })

            if 'trả lời ngắn' in title_lower:
                sa = _parse_sa_section(content)
                if sa:
                    sections.append({
                        "type": "short_answer",
                        "instruction": title,
                        "questions": sa
                    })

    total = sum(len(s.get("questions", [])) for s in sections)
    print(f"[LaTeX Parser] ✅ Parsed {total} questions trực tiếp từ LaTeX")

    if not sections:
        raise ValueError("Không tìm thấy câu hỏi nào trong file LaTeX. Vui lòng kiểm tra cấu trúc file.")

    return {"sections": sections}


def _clean_latex(text: str) -> str:
    """Clean LaTeX formatting for display. Keep $math$ intact."""
    text = text.strip()
    # Remove \textbf, \textit etc. but keep content
    text = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\underline\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]*)\}', r'\1', text)
    # Remove layout commands
    text = re.sub(r'\\[vh]space\*?\{[^}]*\}', '', text)
    text = re.sub(r'\\noindent\b', '', text)
    text = re.sub(r'\\newline\b', ' ', text)
    # Remove \begin{center}...\end{center} with images inside
    text = re.sub(r'\\begin\{center\}.*?\\end\{center\}', '', text, flags=re.DOTALL)
    # Remove standalone \includegraphics
    text = re.sub(r'\\includegraphics\[.*?\]\{.*?\}', '', text)
    # Remove \\IfFileExists blocks
    text = re.sub(r'\\IfFileExists\{[^}]*\}\{.*?\}\{.*?\}', '', text, flags=re.DOTALL)
    # Remove trailing \\
    text = re.sub(r'\\\\\s*$', '', text)
    text = re.sub(r'\\\\(?!\S)', ' ', text)
    # Remove \item
    text = re.sub(r'\\item\b', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _split_questions(content: str) -> list:
    """Split content by \\textbf{Câu X} markers. Returns list of (number, block)."""
    # Pattern: \textbf{Câu X}  or  \textbf{Câu X.}
    pattern = r'\\textbf\{Câu\s+(\d+)\s*\.?\}'
    parts = re.split(pattern, content)
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
    # Find where the options start: look for a line starting with A. or A)
    # Options can be on same line or separate lines
    lines = block.split('\n')
    q_lines = []
    found_option = False
    for line in lines:
        stripped = line.strip()
        # Check if this line starts with "A." or "A)" (the first option)
        if re.match(r'^A\s*[.)]\s', stripped):
            found_option = True
            break
        q_lines.append(line)

    if not found_option:
        # Maybe options are inline, try splitting by "A."
        parts = re.split(r'(?:^|\n)\s*A\s*[.)]\s', block, maxsplit=1)
        if len(parts) > 1:
            return _clean_latex(parts[0])
        return _clean_latex(block)

    return _clean_latex('\n'.join(q_lines))


def _extract_abcd_options(block: str) -> list:
    """Extract A/B/C/D options from a text block. Handles \\\\ separators."""
    options = []

    # Strategy 1: Options on separate lines or separated by \\
    # Normalize: replace \\ with newlines for easier parsing
    normalized = block.replace('\\\\', '\n')

    # Match: A. text, B. text, C. text, D. text
    pattern = r'(?:^|\n)\s*([A-D])\s*[.)]\s*(.*?)(?=(?:^|\n)\s*[A-D]\s*[.)]|\Z)'
    matches = re.findall(pattern, normalized, re.DOTALL | re.MULTILINE)

    if len(matches) >= 2:
        for letter, text in matches:
            cleaned = text.strip()
            # Remove trailing \\ or newlines
            cleaned = re.sub(r'\\\\\s*$', '', cleaned).strip()
            if cleaned:
                options.append(cleaned)

    return options


def _parse_tf_section(content: str) -> list:
    """Parse True/False section with a)/b)/c)/d) items."""
    questions = []
    q_blocks = _split_questions(content)

    for num, block in q_blocks:
        # Extract question context (before a))
        context_match = re.split(r'\n\s*a\s*\)', block, maxsplit=1)
        q_text = _clean_latex(context_match[0]) if context_match else ""

        # Extract a), b), c), d) items
        items = _extract_abcd_items(block)
        if items:
            questions.append({
                "id": f"tf{num}",
                "text": q_text,
                "items": items
            })

    return questions


def _extract_abcd_items(block: str) -> list:
    """Extract a)/b)/c)/d) items for True/False questions."""
    items = []

    # Normalize \\ to newlines
    normalized = block.replace('\\\\', '\n')

    # Match a) text, b) text, c) text, d) text
    pattern = r'(?:^|\n)\s*([a-d])\s*\)\s*(.*?)(?=(?:^|\n)\s*[a-d]\s*\)|\Z)'
    matches = re.findall(pattern, normalized, re.DOTALL | re.MULTILINE)

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
            questions.append({
                "id": f"q{num}",
                "text": q_text,
                "options": [_clean_latex(o) for o in options],
                "correctAnswer": 0,
                "explanation": ""
            })

    return questions
