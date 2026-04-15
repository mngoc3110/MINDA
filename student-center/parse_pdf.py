import sys
import json
import os

backend_path = os.path.join(os.getcwd(), 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.services.ocr_service import extract_quiz_from_pdf_local

pdf_path = "/Users/minhngoc/HCMUE/MINDA/Chuyên phan bội châu.pdf"
with open(pdf_path, 'rb') as f:
    pdf_bytes = f.read()

print("Parsing PDF...")
quiz_data = extract_quiz_from_pdf_local(pdf_bytes)

with open('quiz_parsed.json', 'w', encoding='utf-8') as f:
    json.dump(quiz_data, f, ensure_ascii=False, indent=2)

print("Saved to quiz_parsed.json")
