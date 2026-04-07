"""
OCR Service - Pipeline 2 tang:
  Tang 1: Tesseract OCR (doc anh/PDF thanh text tho)
  Tang 2: TextToLatex (Mamba) chuyen bieu thuc toan thanh LaTeX

Thay the hoan toan Nougat OCR (facebook/nougat-small) de giam tai.
"""
import os
import re
import gc
import fitz  # PyMuPDF
from PIL import Image
import io

# === TANG 1: Tesseract OCR ===

def _ocr_image_to_text(img: Image.Image) -> str:
    """OCR 1 hinh anh thanh text bang Tesseract."""
    try:
        import pytesseract
        # Nhan dien tieng Viet + tieng Anh
        text = pytesseract.image_to_string(img, lang="vie+eng")
        return text.strip()
    except ImportError:
        print("[OCR] pytesseract chua cai. Dung: pip install pytesseract")
        print("[OCR] Va cai Tesseract: brew install tesseract tesseract-lang")
        raise
    except Exception as e:
        print(f"[OCR] Loi Tesseract: {e}")
        # Fallback: thu voi chi eng
        try:
            import pytesseract
            text = pytesseract.image_to_string(img, lang="eng")
            return text.strip()
        except:
            return ""


def _ocr_pdf_to_text(pdf_bytes: bytes) -> str:
    """Doc toan bo cac trang PDF thanh text."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    full_text = ""

    for page_num, page in enumerate(doc):
        print(f"[OCR] Dang xu ly trang {page_num + 1}/{len(doc)}...")
        
        # Thu doc text truc tiep tu PDF (neu la PDF text-based)
        page_text = page.get_text("text")
        
        if page_text and len(page_text.strip()) > 20:
            # PDF co text san (khong can OCR)
            full_text += page_text + "\n\n"
        else:
            # PDF la hinh anh -> can OCR
            pix = page.get_pixmap(dpi=200)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            ocr_text = _ocr_image_to_text(img)
            full_text += ocr_text + "\n\n"

    doc.close()
    return full_text.strip()


# === TANG 2: Parse Quiz Structure ===

def _clean_text_to_quiz_json(raw_text: str) -> dict:
    """
    Phan tich raw text (sau khi OCR) thanh Quiz JSON.
    Ho tro de thi THPT 3 phan:
      - Phan I: Trac nghiem (MCQ) — Cau 1-12, moi cau co 4 dap an A/B/C/D
      - Phan II: Dung/Sai — Cau 1-4, moi cau co 4 menh de a/b/c/d
      - Phan III: Tra loi ngan — Cau 1-6, dien so/ket qua
    """
    text = raw_text.strip()
    
    # Ghi log text tho de debug
    try:
        with open('/tmp/last_ocr_raw.txt', 'w') as f:
            f.write(text)
    except:
        pass
    
    sections = []
    
    # === BUOC 1: Chia text thanh cac PHAN (I, II, III) ===
    # OCR thuong doc sai: "III" -> "IH", "IIT", "IIl", "lII"
    # Nen dung pattern linh hoat: PHAN + so/roman
    phan_pattern = r'PH[AẦaầ]N\s+(I{1,3}|IH|IIT|IIl|lII|IV|[1-3])[\.\:\s]'
    phan_splits = re.split(r'(?=' + phan_pattern + r')', text, flags=re.IGNORECASE)
    
    # Xac dinh cac phan
    phan_texts = {}
    for part in phan_splits:
        part = part.strip()
        if not part:
            continue
        m = re.match(phan_pattern, part, re.IGNORECASE)
        if m:
            roman = m.group(1).upper()
            # Chuyen doi: I->1, II->2, III/IH/IIT->3
            phan_map = {
                'I': 1, 'II': 2, 'III': 3,
                'IH': 3, 'IIT': 3, 'IIL': 3, 'LII': 3,
                '1': 1, '2': 2, '3': 3
            }
            phan_num = phan_map.get(roman, 0)
            if phan_num > 0:
                phan_texts[phan_num] = part
        elif not phan_texts:
            # Text truoc phan dau tien — bo qua header
            pass
    
    # Neu khong tim thay PHAN markers, xu ly nhu cu (tat ca la MCQ)
    if not phan_texts:
        mcq_questions = _parse_mcq_section(text)
        if mcq_questions:
            sections.append({
                "type": "mcq",
                "instruction": f"Phan Trac Nghiem ({len(mcq_questions)} cau)",
                "questions": mcq_questions
            })
        return {"sections": sections} if sections else {"questions": []}
    
    # === BUOC 2: Parse tung phan ===
    
    # PHAN I: Trac nghiem
    if 1 in phan_texts:
        mcq_questions = _parse_mcq_section(phan_texts[1])
        if mcq_questions:
            sections.append({
                "type": "mcq",
                "instruction": f"Phan I: Trac nghiem ({len(mcq_questions)} cau)",
                "questions": mcq_questions
            })
    
    # PHAN II: Dung/Sai
    if 2 in phan_texts:
        tf_questions = _parse_true_false_section(phan_texts[2])
        if tf_questions:
            sections.append({
                "type": "true_false",
                "instruction": f"Phan II: Dung/Sai ({len(tf_questions)} cau)",
                "questions": tf_questions
            })
    
    # PHAN III: Tra loi ngan
    if 3 in phan_texts:
        sa_questions = _parse_short_answer_section(phan_texts[3])
        if sa_questions:
            sections.append({
                "type": "short_answer",
                "instruction": f"Phan III: Tra loi ngan ({len(sa_questions)} cau)",
                "questions": sa_questions
            })
    
    return {"sections": sections} if sections else {"questions": []}



def _filter_header_chunks(chunks: list) -> list:
    """Loc bo cac chunk la header/instruction, khong phai cau hoi thuc."""
    filtered = []
    for c in chunks:
        c_lower = c.lower().strip()
        # Bo qua header "cau X den cau Y", "thi sinh tra loi tu cau..."
        if re.match(r'(?i)c[aâ]u\s*\d+\s*(đến|den|tới|toi)', c_lower):
            continue
        if re.match(r'(?i)c[aâ]u\s*\d+\.\s*(mỗi|trong|thí)', c_lower):
            continue
        # Bo cau qua ngan (< 15 ky tu) — thuong la header
        text_no_marker = re.sub(r'(?i)^\(?c[aâ]u\s*\d+[\s:\.\)]*', '', c).strip()
        if len(text_no_marker) < 10:
            continue
        filtered.append(c)
    return filtered

def _parse_mcq_section(text: str) -> list:
    """Parse phan trac nghiem: Cau X, A. B. C. D."""
    questions = []
    
    # Cat theo "Cau X" 
    chunks = re.split(r'(?i)(?=\(?C[aâ]u\s*\d+[\s:\.\)])', text)
    valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'(?i)\(?C[aâ]u\s*\d+', c.strip())]
    valid_chunks = _filter_header_chunks(valid_chunks)
    
    for chunk in valid_chunks:
        if not chunk:
            continue
        
        # Loai bo page markers va watermarks
        chunk = re.sub(r'Mã đề.*?Trang\s*\d+/\d+', '', chunk, flags=re.IGNORECASE)
        chunk = re.sub(r'https?://\S+', '', chunk)
        chunk = re.sub(r'Tài Liệu Ôn Thi.*', '', chunk)
        
        # Thu cac pattern regex de tach A/B/C/D
        best_split = None
        
        # Pattern 1: A. hoac A) inline (pho bien nhat trong de thi)
        for pattern in [
            r'([A-Da-d][\.\)])\s*',              # A. hoac A) inline
            r'(?m)^([A-Da-d][\.\)])\s*',          # A. hoac A) dau dong
            r'(?m)^([A-Da-d])[\.\)]?\s+',         # A (co/khong dau cham) dau dong
            r'\n([A-Da-d])[\.\)]?\s*',             # A sau xuong dong
        ]:
            test_text = chunk if not pattern.startswith(r'\n') else '\n' + chunk
            split = re.split(pattern, test_text)
            if best_split is None or len(split) > len(best_split):
                best_split = split
        
        options_split = best_split if best_split else [chunk]

        # Chi can >= 5 phan tu (toi thieu 2 dap an) thay vi 9 (4 dap an)
        if len(options_split) >= 5:
            q_text = options_split[0].strip()
            
            options = ["", "", "", ""]
            for i in range(1, min(len(options_split), 9), 2):
                letter = options_split[i].upper().replace('.', '').replace(')', '')
                idx = ord(letter) - ord('A')
                if i + 1 < len(options_split) and 0 <= idx < 4:
                    opt_val = options_split[i + 1].strip()
                    opt_val = re.sub(r'\s+$', '', opt_val)
                    options[idx] = opt_val

            questions.append({
                "id": f"q{len(questions)+1}",
                "text": q_text,
                "options": options,
                "correctAnswer": 0,
                "explanation": ""
            })
        else:
            # Fallback: cau hoi co hinh/do thi, OCR khong doc duoc A/B/C/D ro
            # Van giu cau hoi de giao vien chinh sua thu cong
            q_text = chunk.strip()
            if q_text:
                questions.append({
                    "id": f"q{len(questions)+1}",
                    "text": q_text,
                    "options": ["", "", "", ""],
                    "correctAnswer": 0,
                    "explanation": "(Cau nay co hinh/do thi, can chinh sua thu cong)"
                })
    
    return questions


def _parse_true_false_section(text: str) -> list:
    """Parse phan Dung/Sai: Cau X, moi cau co 4 menh de a), b), c), d)."""
    questions = []
    
    # Cat theo "Cau X"
    chunks = re.split(r'(?i)(?=\(?C[aâ]u\s*\d+[\s:\.\)])', text)
    valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'(?i)\(?C[aâ]u\s*\d+', c.strip())]
    valid_chunks = _filter_header_chunks(valid_chunks)
    
    for chunk in valid_chunks:
        if not chunk:
            continue
        
        # Loai bo watermarks
        chunk = re.sub(r'Mã đề.*?Trang\s*\d+/\d+', '', chunk, flags=re.IGNORECASE)
        chunk = re.sub(r'https?://\S+', '', chunk)
        chunk = re.sub(r'Tài Liệu Ôn Thi.*', '', chunk)
        
        # Tach cau hoi chinh va cac menh de a), b), c), d)
        # Tim cac muc: a) hoac a. hoac a, — nho (lowercase)
        items_split = re.split(r'(?m)^([a-dđ][\)\.\,])\s*', chunk)
        
        # Thu inline
        if len(items_split) < 9:
            items_split = re.split(r'\n([a-dđ][\)\.\,])\s*', '\n' + chunk)
        
        # Thu khong co dau
        if len(items_split) < 9:
            items_split = re.split(r'(?m)^([a-dđ])\)\s*', chunk)

        q_text = items_split[0].strip() if items_split else chunk.strip()
        
        items = []
        labels = ['a', 'b', 'c', 'd']
        
        if len(items_split) >= 9:
            for i in range(1, min(len(items_split), 9), 2):
                label_raw = items_split[i].replace(')', '').replace('.', '').replace(',', '').strip().lower()
                item_text = items_split[i + 1].strip() if i + 1 < len(items_split) else ""
                # Loai bo ky tu thua
                item_text = re.sub(r'\s+$', '', item_text)
                
                label = label_raw if label_raw in labels else labels[len(items)] if len(items) < 4 else label_raw
                items.append({
                    "label": label,
                    "text": item_text,
                    "isTrue": False  # Giao vien se chinh lai
                })
        else:
            # Fallback: khong tim thay menh de, tao 4 menh de rong
            for label in labels:
                items.append({
                    "label": label,
                    "text": "",
                    "isTrue": False
                })
        
        questions.append({
            "id": f"tf{len(questions)+1}",
            "text": q_text,
            "items": items
        })
    
    return questions


def _parse_short_answer_section(text: str) -> list:
    """Parse phan Tra loi ngan: Cau X, hoc sinh dien so/ket qua."""
    questions = []
    
    # Cat theo "Cau X"
    chunks = re.split(r'(?i)(?=\(?C[aâ]u\s*\d+[\s:\.\)])', text)
    valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'(?i)\(?C[aâ]u\s*\d+', c.strip())]
    valid_chunks = _filter_header_chunks(valid_chunks)
    
    for chunk in valid_chunks:
        if not chunk:
            continue
        
        # Loai bo watermarks  
        chunk = re.sub(r'Mã đề.*?Trang\s*\d+/\d+', '', chunk, flags=re.IGNORECASE)
        chunk = re.sub(r'https?://\S+', '', chunk)
        chunk = re.sub(r'Tài Liệu Ôn Thi.*', '', chunk)
        chunk = re.sub(r'—+\s*H[EẾ]T\s*—+', '', chunk, flags=re.IGNORECASE)
        chunk = chunk.strip()
        
        if not chunk:
            continue
        
        questions.append({
            "id": f"sa{len(questions)+1}",
            "text": chunk,
            "correctAnswer": "",
            "explanation": ""
        })
    
    return questions


# === TANG 3 (Optional): Enhance voi TextToLatex ===

def _enhance_quiz_with_latex(quiz_data: dict) -> dict:
    """Tang cuong quiz: chuyen cac bieu thuc toan thanh LaTeX."""
    try:
        from app.services.text2latex_service import enhance_math_with_latex
        
        sections = quiz_data.get("sections", [])
        for sec in sections:
            for q in sec.get("questions", []):
                # Enhance question text
                q["text"] = enhance_math_with_latex(q.get("text", ""))
                # Enhance options
                if "options" in q:
                    q["options"] = [enhance_math_with_latex(opt) for opt in q["options"]]
    except ImportError:
        print("[OCR] TextToLatex service khong kha dung, bo qua buoc enhance LaTeX.")
    except Exception as e:
        print(f"[OCR] Loi enhance LaTeX: {e}")
    
    return quiz_data


# === PUBLIC API (giu nguyen contract cu) ===

def extract_quiz_from_pdf_local(pdf_bytes: bytes) -> dict:
    """
    Pipeline chinh: PDF -> OCR -> Parse Quiz -> (Optional) LaTeX enhance.
    Thay the Nougat OCR bang Tesseract + TextToLatex.
    """
    print("[OCR Service] === BAT DAU PIPELINE OCR (Tesseract + TextToLatex) ===")
    
    # Tang 1: OCR
    print("[OCR Service] Tang 1: Tesseract OCR dang doc PDF...")
    raw_text = _ocr_pdf_to_text(pdf_bytes)
    
    if not raw_text:
        raise ValueError("OCR khong doc duoc noi dung tu PDF")
    
    print(f"[OCR Service] OCR xong! Doc duoc {len(raw_text)} ky tu.")
    
    # Tang 2: Parse quiz structure
    print("[OCR Service] Tang 2: Parse cau truc de thi...")
    quiz_data = _clean_text_to_quiz_json(raw_text)
    
    # Tang 3 (Optional): Enhance math voi TextToLatex
    # Chi chay neu co cau hoi va server du RAM
    if quiz_data.get("sections") and len(quiz_data["sections"]) > 0:
        total_questions = sum(len(s.get("questions", [])) for s in quiz_data["sections"])
        print(f"[OCR Service] Tim thay {total_questions} cau hoi!")
        
        # Chi enhance LaTeX neu thuc su can (co bieu thuc toan)
        has_math = False
        for sec in quiz_data["sections"]:
            for q in sec.get("questions", []):
                text = q.get("text", "") + " ".join(q.get("options", []))
                if re.search(r'[x-z]\^|sqrt|frac|\\|[0-9]+/[0-9]+|\bsin\b|\bcos\b|\blog\b|\bln\b', text, re.IGNORECASE):
                    has_math = True
                    break
        
        if has_math:
            print("[OCR Service] Tang 3: Phat hien bieu thuc toan, dang convert LaTeX...")
            try:
                quiz_data = _enhance_quiz_with_latex(quiz_data)
            except Exception as e:
                print(f"[OCR Service] Bo qua LaTeX enhance: {e}")
    
    print("[OCR Service] === HOAN TAT! ===")
    return quiz_data


def extract_quiz_from_image_local(img_bytes: bytes) -> dict:
    """
    Pipeline: Image -> OCR -> Parse Quiz -> (Optional) LaTeX enhance.
    """
    print("[OCR Service] === BAT DAU PIPELINE OCR ANH (Tesseract + TextToLatex) ===")
    
    # Tang 1: OCR anh
    print("[OCR Service] Tang 1: Tesseract OCR dang doc anh...")
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    raw_text = _ocr_image_to_text(img)
    
    if not raw_text:
        raise ValueError("OCR khong doc duoc noi dung tu anh")
    
    print(f"[OCR Service] OCR xong! Doc duoc {len(raw_text)} ky tu.")
    
    # Ghi log de debug
    try:
        with open('/tmp/last_ocr_raw.txt', 'w') as f:
            f.write(raw_text)
    except:
        pass
    
    # Tang 2: Parse quiz
    print("[OCR Service] Tang 2: Parse cau truc de thi...")
    quiz_data = _clean_text_to_quiz_json(raw_text)
    
    # Tang 3 (Optional): Enhance LaTeX
    if quiz_data.get("sections"):
        try:
            quiz_data = _enhance_quiz_with_latex(quiz_data)
        except Exception as e:
            print(f"[OCR Service] Bo qua LaTeX: {e}")
    
    print("[OCR Service] === HOAN TAT! ===")
    return quiz_data
