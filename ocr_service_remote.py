import os
import gc
import json
import re
import fitz  # PyMuPDF
import torch
from transformers import AutoModel, AutoTokenizer
from PIL import Image
import base64
import io

def _clean_markdown_to_quiz_json(markdown_text: str) -> dict:
    """
    Phân tích raw markdown (sau khi OCR) thành Quiz JSON.
    Vẫn dựa theo format:
    Mỗi câu bắt đầu bằng "Câu X". Các lựa chọn A., B., C., D.
    """
    import re
    questions = []
    
    # Split by "Câu X" or "Câu X:"
    chunks = re.split(r'(?i)(?=câu\s*\d+\s*[:\.])', markdown_text.strip())
    
    for chunk in chunks:
        chunk = chunk.strip()
        if not chunk.lower().startswith('câu'):
            continue
            
        # Tìm nội dung câu hỏi và các đáp án
        # Splitting by A., B., C., D. (hoặc A., B., C., D. ở đầu dòng)
        options_split = re.split(r'(?m)^([A-D][\.\)])\s*', chunk)
        
        if len(options_split) >= 9: # Has Question text + 4 parts (A, B, C, D)
            q_text = options_split[0]
            # Replace escapes safely for MathJax
            q_text = q_text.replace('\\', '\\\\')
            
            # Khởi tạo mảng options rỗng
            options = ["", "", "", ""]
            
            # Map letters to indices
            for i in range(1, len(options_split), 2):
                letter = options_split[i].upper().replace('.', '').replace(')', '')
                idx = ord(letter) - ord('A')
                opt_val = options_split[i+1].strip()
                # Clean up latex in options
                opt_val = opt_val.replace('\\', '\\\\')
                if 0 <= idx < 4:
                    options[idx] = opt_val

            questions.append({
                "question": q_text.strip(),
                "options": options,
                "correctAnswer": 0, # Mặc định 0 vì OCR không tự giải bài
                "explanation": "Được AI tự động bóc tách từ ảnh"
            })
            
    return {"questions": questions}


def extract_quiz_from_pdf_local(pdf_bytes: bytes) -> dict:
    """
    Sử dụng GOT-OCR-2.0 chạy qua CPU để đẩy PDF thành Markdown, 
    sau đó phân tích ra mảng JSON.
    Load tĩnh rồi giải phóng RAM ngay để bảo vệ Server.
    """
    print("[OCR Service] Đang nạp Model GOT-OCR-2.0 vào RAM Ảo...")
    tokenizer = AutoTokenizer.from_pretrained('stepfun-ai/GOT-OCR2_0', trust_remote_code=True)
    # Load low_cpu_mem_usage để an toàn
    model = AutoModel.from_pretrained('stepfun-ai/GOT-OCR2_0', trust_remote_code=True, low_cpu_mem_usage=True, device_map='cpu')
    model = model.eval()

    print("[OCR Service] Mở file PDF chuẩn bị băm hình...")
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    
    full_markdown = ""
    
    for page_num, page in enumerate(doc):
        print(f"[OCR Service] Đang bóc tách Trang {page_num + 1}...")
        pix = page.get_pixmap(dpi=150)
        img_bytes = pix.tobytes("jpeg")
        
        # Save temp image for GOT-OCR (it requires file path usually, or we can see if it supports base64)
        # stepfun codebase `model.chat(tokenizer, image_file)` accepts string path.
        temp_img = f"/tmp/minda_page_{page_num}.jpeg"
        with open(temp_img, "wb") as f:
            f.write(img_bytes)
            
        try:
            # ocr_type="format" keeps tables and math formulas perfectly intact!
            res = model.chat(tokenizer, temp_img, ocr_type='format')
            full_markdown += res + "\n\n"
        except Exception as e:
            print(f"[OCR Service] Lỗi khi xử lý trang {page_num}: {str(e)}")
        finally:
             if os.path.exists(temp_img):
                 os.remove(temp_img)

    # Giải phóng RAM lập tức 
    print("[OCR Service] Giải phóng RAM!")
    del model
    del tokenizer
    gc.collect()
    
    print("[OCR Service] Bắt đầu phân rã Markdown thành JSON...")
    with open('/tmp/last_ocr.txt', 'w') as f: f.write(full_markdown)
    return _clean_markdown_to_quiz_json(full_markdown)

def extract_quiz_from_image_local(img_bytes: bytes) -> dict:
    print("[OCR Service] Đang nạp Model GOT-OCR-2.0 vào RAM Ảo...")
    tokenizer = AutoTokenizer.from_pretrained('stepfun-ai/GOT-OCR2_0', trust_remote_code=True)
    model = AutoModel.from_pretrained('stepfun-ai/GOT-OCR2_0', trust_remote_code=True, low_cpu_mem_usage=True, device_map='cpu')
    model = model.eval()

    temp_img = "/tmp/minda_upload_img.jpeg"
    with open(temp_img, "wb") as f:
        f.write(img_bytes)
        
    full_markdown = ""
    try:
        res = model.chat(tokenizer, temp_img, ocr_type='format')
        full_markdown = res
    except Exception as e:
        print(f"[OCR Service] Lỗi xử lý ảnh: {str(e)}")
    finally:
        if os.path.exists(temp_img):
            os.remove(temp_img)

    del model
    del tokenizer
    gc.collect()
    
    with open('/tmp/last_ocr.txt', 'w') as f: f.write(full_markdown)
    return _clean_markdown_to_quiz_json(full_markdown)
