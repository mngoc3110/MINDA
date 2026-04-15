"""
LaTeX Direct Parser - Parse LaTeX exam files directly without AI.
Supports common Vietnamese exam LaTeX packages: ex_test, exam, custom macros.
"""
import re


def parse_latex_directly(latex_text: str) -> dict:
    """
    Parse a LaTeX .tex file directly into quiz JSON structure.
    No AI needed - pure regex/text parsing.
    """
    print("[LaTeX Parser] Bắt đầu parse trực tiếp file LaTeX (không dùng AI)...")

    sections = []
    
    # Try multiple parsing strategies
    mcq_questions = []
    tf_questions = []
    sa_questions = []

    # ── Strategy 1: \begin{ex} ... \end{ex} with \choice ──
    mcq_questions += _parse_ex_choice(latex_text)

    # ── Strategy 2: \Cau{} or \cmark macro style ──
    if not mcq_questions:
        mcq_questions += _parse_cau_macro(latex_text)

    # ── Strategy 3: \begin{questions} ... \question (exam class) ──
    if not mcq_questions:
        mcq_questions += _parse_exam_class(latex_text)

    # ── Strategy 4: Generic numbered questions (Câu 1, Câu 2...) ──
    if not mcq_questions:
        mcq_questions += _parse_generic_numbered(latex_text)

    # ── Parse True/False sections ──
    tf_questions += _parse_true_false(latex_text)

    # ── Parse Short Answer sections ──
    sa_questions += _parse_short_answer(latex_text)

    # Build sections
    if mcq_questions:
        sections.append({
            "type": "mcq",
            "instruction": "Phần Trắc nghiệm",
            "questions": mcq_questions
        })

    if tf_questions:
        sections.append({
            "type": "true_false",
            "instruction": "Phần Đúng/Sai",
            "questions": tf_questions
        })

    if sa_questions:
        sections.append({
            "type": "short_answer",
            "instruction": "Phần Trả lời ngắn",
            "questions": sa_questions
        })

    total = sum(len(s.get("questions", [])) for s in sections)
    print(f"[LaTeX Parser] ✅ Parsed {total} questions trực tiếp từ LaTeX")

    if not sections:
        raise ValueError("Không tìm thấy câu hỏi nào trong file LaTeX. Vui lòng kiểm tra cấu trúc file.")

    return {"sections": sections}


def _clean_latex(text: str) -> str:
    """Clean common LaTeX formatting for display, keep math intact."""
    text = text.strip()
    # Remove \textbf, \textit wrappers but keep content
    text = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\underline\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]*)\}', r'\1', text)
    # Remove \vspace, \hspace, \noindent
    text = re.sub(r'\\[vh]space\*?\{[^}]*\}', '', text)
    text = re.sub(r'\\noindent\b', '', text)
    text = re.sub(r'\\newline\b', ' ', text)
    text = re.sub(r'\\\\', ' ', text)
    # Remove \item
    text = re.sub(r'\\item\b', '', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _extract_correct_answer_index(block: str) -> int:
    """Try to find correct answer marker in the block."""
    # \dmark{A} or \dmark A or \DAP{A}
    m = re.search(r'\\(?:dmark|DAP|ans|answer|DapAn)\s*\{?\s*([A-Da-d])\s*\}?', block)
    if m:
        return ord(m.group(1).upper()) - ord('A')
    
    # \True after choice -> marked correct
    # \choice[\True] pattern (ex_test package)
    choices_with_true = re.finditer(r'\\choice\[\\True\]', block)
    choice_idx = 0
    for match in re.finditer(r'\\choice(?:\[\\True\])?', block):
        if '\\True' in match.group(0):
            return choice_idx
        choice_idx += 1
    
    return 0  # Default to A if no marker found


def _parse_ex_choice(latex_text: str) -> list:
    """Parse \\begin{ex}...\\end{ex} blocks with \\choice options."""
    questions = []
    
    # Find all \begin{ex} ... \end{ex} blocks
    pattern = r'\\begin\{ex\}(.*?)\\end\{ex\}'
    blocks = re.findall(pattern, latex_text, re.DOTALL)
    
    for idx, block in enumerate(blocks):
        # Split into question text and choices
        # Look for \choice pattern
        choice_pattern = r'\\choice(?:\[\\True\])?\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
        choices = re.findall(choice_pattern, block)
        
        if not choices and '\\choice' in block:
            # Alternative: choices separated by \choice
            parts = re.split(r'\\choice(?:\[\\True\])?', block)
            if len(parts) > 1:
                q_text = parts[0]
                choices = []
                for p in parts[1:]:
                    p = p.strip()
                    if p:
                        # Get content until next \choice or end
                        choice_text = re.sub(r'[\{\}]', '', p).strip()
                        if choice_text:
                            choices.append(choice_text)
        
        if len(choices) >= 2:
            # Get question text (everything before first \choice)
            q_text = re.split(r'\\choice', block)[0]
            q_text = _clean_latex(q_text)
            
            correct = _extract_correct_answer_index(block)
            
            questions.append({
                "id": f"q{idx + 1}",
                "text": q_text,
                "options": [_clean_latex(c) for c in choices[:4]],
                "correctAnswer": correct,
                "explanation": ""
            })
    
    return questions


def _parse_cau_macro(latex_text: str) -> list:
    """Parse \\Cau{} or custom numbered question macros."""
    questions = []
    
    # Match: \Cau{1} question text \begin{opts} A. ... B. ... etc.
    pattern = r'\\[Cc]au\s*\{?\s*(\d+)\s*\}?\s*[.:]?\s*(.*?)(?=\\[Cc]au\s*\{?\s*\d+|$)'
    matches = re.findall(pattern, latex_text, re.DOTALL)
    
    for num, block in matches:
        options = _extract_abcd_options(block)
        if options:
            q_text = block
            # Remove options part from question text
            for letter in ['A', 'B', 'C', 'D']:
                q_text = re.split(rf'\b{letter}\s*[.)]\s', q_text)[0]
            q_text = _clean_latex(q_text)
            
            questions.append({
                "id": f"q{num}",
                "text": q_text,
                "options": [_clean_latex(o) for o in options],
                "correctAnswer": 0,
                "explanation": ""
            })
    
    return questions


def _parse_exam_class(latex_text: str) -> list:
    """Parse exam document class style: \\question ... \\begin{choices}."""
    questions = []
    
    pattern = r'\\question\s*(.*?)(?=\\question\b|\\end\{questions\}|$)'
    matches = re.findall(pattern, latex_text, re.DOTALL)
    
    for idx, block in enumerate(matches):
        # Look for \choice items
        choice_pattern = r'\\(?:choice|CorrectChoice)\s+(.*?)(?=\\(?:choice|CorrectChoice)\b|\\end\{|$)'
        choices = re.findall(choice_pattern, block, re.DOTALL)
        
        correct = 0
        correct_matches = list(re.finditer(r'\\CorrectChoice', block))
        if correct_matches:
            all_choices = list(re.finditer(r'\\(?:choice|CorrectChoice)', block))
            for i, m in enumerate(all_choices):
                if 'CorrectChoice' in m.group(0):
                    correct = i
                    break
        
        if choices:
            q_text = re.split(r'\\begin\{(?:choices|oneparchoices)\}', block)[0]
            q_text = _clean_latex(q_text)
            
            questions.append({
                "id": f"q{idx + 1}",
                "text": q_text,
                "options": [_clean_latex(c) for c in choices[:4]],
                "correctAnswer": correct,
                "explanation": ""
            })
        
    return questions


def _parse_generic_numbered(latex_text: str) -> list:
    """Parse generic format: Câu 1: ... A. ... B. ... C. ... D. ..."""
    questions = []
    
    # Match: Câu X. or Câu X: or Câu X) 
    pattern = r'(?:Câu|C[aâ]u|Question)\s*(\d+)\s*[.:)]\s*(.*?)(?=(?:Câu|C[aâ]u|Question)\s*\d+\s*[.:)]|$)'
    matches = re.findall(pattern, latex_text, re.DOTALL | re.IGNORECASE)
    
    for num, block in matches:
        options = _extract_abcd_options(block)
        if options:
            # Question text is everything before first option
            q_text = re.split(r'\n\s*A\s*[.):]', block)[0]
            q_text = _clean_latex(q_text)
            
            questions.append({
                "id": f"q{num}",
                "text": q_text,
                "options": [_clean_latex(o) for o in options],
                "correctAnswer": 0,
                "explanation": ""
            })
    
    return questions


def _extract_abcd_options(block: str) -> list:
    """Extract A/B/C/D options from a text block."""
    options = []
    
    # Pattern: A. text B. text C. text D. text
    # or A) text B) text ...
    pattern = r'(?:^|\n)\s*([A-D])\s*[.)]\s*(.*?)(?=(?:^|\n)\s*[A-D]\s*[.)]|$)'
    matches = re.findall(pattern, block, re.DOTALL | re.MULTILINE)
    
    if len(matches) >= 2:
        for letter, text in matches:
            options.append(text.strip())
    
    return options


def _parse_true_false(latex_text: str) -> list:
    """Parse True/False question blocks."""
    questions = []
    
    # Look for \begin{bt} (bai tap) with a), b), c), d) items that are Đúng/Sai
    # This is highly format-specific, start with common patterns
    tf_pattern = r'\\begin\{tf\}(.*?)\\end\{tf\}'
    blocks = re.findall(tf_pattern, latex_text, re.DOTALL)
    
    for idx, block in enumerate(blocks):
        items = []
        item_pattern = r'([a-d])\s*[.)]\s*(.*?)(?=[a-d]\s*[.)]|$)'
        matches = re.findall(item_pattern, block, re.DOTALL)
        for label, text in matches:
            items.append({
                "label": label,
                "text": _clean_latex(text),
                "isTrue": False
            })
        
        if items:
            questions.append({
                "id": f"tf{idx + 1}",
                "text": "",
                "items": items
            })
    
    return questions


def _parse_short_answer(latex_text: str) -> list:
    """Parse short answer questions."""
    questions = []
    
    # Look for \begin{sa} blocks
    sa_pattern = r'\\begin\{sa\}(.*?)\\end\{sa\}'
    blocks = re.findall(sa_pattern, latex_text, re.DOTALL)
    
    for idx, block in enumerate(blocks):
        q_text = _clean_latex(block)
        if q_text:
            questions.append({
                "id": f"sa{idx + 1}",
                "text": q_text,
                "correctAnswer": "",
                "explanation": ""
            })
    
    return questions
