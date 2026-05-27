import docx
import re
import requests
import json
import os

BASE_URL = "http://14.225.206.241:8000"
EMAIL = "darber3110@gmail.com"
PASSWORD = "Bin@31102004"

def get_token():
    res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": EMAIL, "password": PASSWORD})
    return res.json().get("access_token")

def to_latex(text):
    # Chuyển đổi các ký hiệu phổ biến sang LaTeX cho MINDA
    replacements = {
        '#': r'\#',
        '_': r'\_',
        '&': r'\&',
        '<': r'$<$',
        '>': r'$>$',
        'IPv6': r'\text{IPv6}',
        'CSS': r'\text{CSS}',
        'HTML': r'\text{HTML}',
        'Python': r'\text{Python}',
        'C++': r'\text{C++}'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

def parse_to_minda_mcq(file_path):
    doc = docx.Document(file_path)
    sections = [
        {"id": "sec_1", "instruction": "Phần I: Câu trắc nghiệm nhiều phương án lựa chọn", "questions": []},
        {"id": "sec_2", "instruction": "Phần II: Câu trắc nghiệm đúng/sai", "questions": []},
        {"id": "sec_3", "instruction": "Phần III: Câu trắc nghiệm trả lời ngắn", "questions": []}
    ]
    
    current_sec = 0
    current_q = None
    
    q_pattern = re.compile(r'^(Câu|Câu hỏi)\s+(\d+)[:.]\s*(.*)', re.IGNORECASE)
    opt_pattern = re.compile(r'([A-D])\.\s*([^\t]+)')

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text: continue
        
        if "Phần I" in text: current_sec = 0
        elif "Phần II" in text: current_sec = 1
        elif "Phần III" in text: current_sec = 2

        m = q_pattern.match(text)
        if m:
            q_id = f"{current_sec}_{len(sections[current_sec]['questions'])}"
            if current_sec == 0:
                current_q = {"id": q_id, "text": to_latex(m.group(3)), "options": [], "correctAnswer": 0, "type": "mcq"}
            elif current_sec == 1:
                current_q = {"id": q_id, "text": to_latex(m.group(3)), "items": [], "type": "true_false"}
            else:
                current_q = {"id": q_id, "text": to_latex(m.group(3)), "correctAnswer": "", "type": "short_answer"}
            sections[current_sec]['questions'].append(current_q)
        elif current_q and current_sec == 0:
            opts = opt_pattern.findall(text)
            for _, opt_text in opts:
                current_q["options"].append(to_latex(opt_text.strip()))
        elif current_q and current_sec == 1:
            item_m = re.match(r'^([a-d])\)\s*(.*)', text.lower())
            if item_m:
                current_q["items"].append({"label": item_m.group(1), "text": to_latex(item_m.group(2)), "isTrue": False})
        elif current_q:
            current_q["text"] += " " + to_latex(text)

    return {"sections": sections}

def upload(token, title, data):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "title": title,
        "description": "Số hóa MCQ chuẩn MINDA + LaTeX",
        "assignment_type": "quiz",
        "quiz_data": data,
        "folder_id": 9,
        "exam_format": "standard",
        "max_score": 10
    }
    res = requests.post(f"{BASE_URL}/api/assignments", headers=headers, json=payload)
    print(f"Status: {res.status_code}, Response: {res.text}")

token = get_token()
data = parse_to_minda_mcq("projects/MINDA/de_tin_hoc/thuvienhoclieu.com-De-thi-thu-TN-THPT-2026-mon-Tin-So-GD-Ha-Tinh-Lan-1.docx")
upload(token, "Đề Hà Tĩnh 2026 - CHUẨN MCQ LATEX", data)
