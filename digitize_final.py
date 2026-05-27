import docx
import re
import requests
import json
import os
import time

BASE_URL = "http://14.225.206.241:8000"
EMAIL = "darber3110@gmail.com"
PASSWORD = "Bin@31102004"

def get_token():
    res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": EMAIL, "password": PASSWORD})
    return res.json().get("access_token")

def parse_docx_to_minda_format(file_path):
    doc = docx.Document(file_path)
    
    quiz_data = {
        "sections": [
            {"id": "sec_1", "instruction": "Phần I: Câu trắc nghiệm nhiều phương án lựa chọn", "questions": []},
            {"id": "sec_2", "instruction": "Phần II: Câu trắc nghiệm đúng/sai", "questions": []},
            {"id": "sec_3", "instruction": "Phần III: Câu trắc nghiệm trả lời ngắn", "questions": []}
        ]
    }
    
    current_section_idx = 0
    current_q = None
    
    # Regex patterns
    q_pattern = re.compile(r'^(Câu|Câu hỏi)\s+(\d+)[:.]\s*(.*)', re.IGNORECASE)
    opt_pattern = re.compile(r'([A-D])\.\s*([^\t]+)')

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text: continue
        
        # Chuyển đổi một số ký tự sang LaTeX cơ bản
        text = text.replace('<=', r'$\le$').replace('>=', r'$\ge$').replace('->', r'$\rightarrow$')
        
        # Nhận diện phần
        if "Phần I" in text: current_section_idx = 0
        elif "Phần II" in text: current_section_idx = 1
        elif "Phần III" in text: current_section_idx = 2
        
        q_match = q_pattern.match(text)
        if q_match:
            q_text = q_match.group(3)
            q_id = f"q_{current_section_idx}_{len(quiz_data['sections'][current_section_idx]['questions'])}"
            
            if current_section_idx == 0: # MCQ
                current_q = {"id": q_id, "text": q_text, "options": [], "correctAnswer": 0}
            elif current_section_idx == 1: # True/False
                current_q = {"id": q_id, "text": q_text, "items": []}
            else: # Short Answer
                current_q = {"id": q_id, "text": q_text, "correctAnswer": ""}
            
            quiz_data['sections'][current_section_idx]['questions'].append(current_q)
            
        elif current_q and current_section_idx == 0: # Parse options for MCQ
            opts = opt_pattern.findall(text)
            for label, opt_text in opts:
                current_q["options"].append(opt_text.strip())
                # Giả định đáp án đúng nếu có dấu check hoặc in đậm (trong logic này tôi chỉ parse text)
        
        elif current_q and current_section_idx == 1: # Parse items for True/False
            # Thêm các mục a, b, c, d
            item_match = re.match(r'^([a-d])\)\s*(.*)', text.lower())
            if item_match:
                current_q["items"].append({"label": item_match.group(1), "text": item_match.group(2), "isTrue": False})
        
        elif current_q:
            current_q["text"] += "\n" + text

    return quiz_data

def upload_digitized_assignment(token, title, quiz_data):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    payload = {
        "title": title,
        "description": "Số hóa LaTeX - Cấu trúc 3 phần 2026",
        "assignment_type": "quiz",
        "quiz_data": quiz_data,
        "folder_id": 9,
        "exam_format": "standard", # Để max_score là 10
        "max_score": 10
    }
    
    # Xóa bản cũ nếu có (tùy chọn) hoặc tạo bản mới
    res = requests.post(f"{BASE_URL}/api/assignments", headers=headers, json=payload)
    if res.status_code == 200:
        print(f"✅ Đã số hóa thành công: {title}")
        print(f"🔗 ID Bài tập mới: {res.json().get('id')}")
    else:
        print(f"❌ Lỗi: {res.text}")

token = get_token()
folder = "projects/MINDA/de_tin_hoc"
target_file = os.path.join(folder, "thuvienhoclieu.com-De-thi-thu-TN-THPT-2026-mon-Tin-So-GD-Ha-Tinh-Lan-1.docx")

print("🔄 Đang bắt đầu số hóa chuyên sâu...")
minda_quiz_data = parse_docx_to_minda_format(target_file)
upload_digitized_assignment(token, "Đề Tin Hà Tĩnh 2026 - Bản FULL LaTeX", minda_quiz_data)
