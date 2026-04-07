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
    Format: Moi cau bat dau bang "Cau X". Cac lua chon A., B., C., D.
    """
    questions = []
    
    text = raw_text.strip()
    
    # Ghi log text tho de debug
    try:
        with open('/tmp/last_ocr_raw.txt', 'w') as f:
            f.write(text)
    except:
        pass
    
    # Cat theo "Cau X" (ho tro Cau 1, Cau 2, ..., Cau 1:, Cau 1., Cau1)
    # Cung ho tro truong hop OCR dinh lien: "Cau1" hoac "(Cau2"
    chunks = re.split(r'(?i)(?=\(?C[aâ]u\s*\d+[\s:\.\)]?)', text)
    
    valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'(?i)\(?C[aâ]u\s*\d+', c.strip())]
    
    # Neu khong tim thay "Cau X", thu chia theo so thu tu 1., 2., 3.
    if not valid_chunks:
        chunks = re.split(r'(?m)(?=^\d+[\.\)]\s+)', text)
        valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'\d+[\.\)]', c.strip())]

    # Fallback: thu Question X
    if not valid_chunks:
        chunks = re.split(r'(?i)(?=Question\s*\d+)', text)
        valid_chunks = [c.strip() for c in chunks if c.strip() and re.match(r'(?i)Question\s*\d+', c.strip())]

    # Neu van khong co gi, coi toan bo text la 1 cau hoi
    if not valid_chunks and text:
        valid_chunks = [text]

    for chunk in valid_chunks:
        if not chunk:
            continue

        # Tim noi dung cau hoi va cac dap an
        # Ho tro nhieu format OCR:
        #   A. xxx    A) xxx    A xxx    a. xxx
        #   Truong hop OCR dinh: A4 (A + so truc tiep)
        
        # Thu 1: tim A. hoac A) tren moi dong
        options_split = re.split(r'(?m)^([A-Da-d][\.\)])\s*', chunk)
        
        # Thu 2: inline A. hoac A)
        if len(options_split) < 9:
            options_split = re.split(r'([A-Da-d][\.\)])\s*', chunk)
        
        # Thu 3: flexible — A co the co hoac khong co dau cham/ngoac
        # Match: "A.5", "B.6", "C7", "D.8" (hon hop)
        if len(options_split) < 9:
            options_split = re.split(r'(?m)^([A-Da-d])[\.\)]?\s*', chunk)
        
        # Thu 4: inline flexible
        if len(options_split) < 9:
            options_split = re.split(r'\n([A-Da-d])[\.\)]?\s*', '\n' + chunk)

        if len(options_split) >= 9:
            q_text = options_split[0].strip()
            
            options = ["", "", "", ""]
            for i in range(1, min(len(options_split), 9), 2):
                letter = options_split[i].upper().replace('.', '').replace(')', '')
                idx = ord(letter) - ord('A')
                if i + 1 < len(options_split):
                    opt_val = options_split[i + 1].strip()
                    if 0 <= idx < 4:
                        options[idx] = opt_val

            questions.append({
                "id": f"q{len(questions)+1}",
                "text": q_text,
                "options": options,
                "correctAnswer": 0,
                "explanation": ""
            })

    # Wrap vao sections format (tuong thich voi frontend)
    if questions:
        return {
            "sections": [{
                "type": "mcq",
                "instruction": f"Phan Trac Nghiem ({len(questions)} cau)",
                "questions": questions
            }]
        }
    
    return {"questions": questions}


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
