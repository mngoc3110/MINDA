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

def parse_docx_to_questions(file_path):
    doc = docx.Document(file_path)
    questions = []
    current_q = None
    
    # Regex để tìm câu hỏi và phương án
    q_pattern = re.compile(r'^(Câu|Câu hỏi)\s+(\d+)[:.]\s*(.*)', re.IGNORECASE)
    opt_pattern = re.compile(r'([A-D])\.\s*([^\t]+)')

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text: continue
        
        q_match = q_pattern.match(text)
        if q_match:
            if current_q: questions.append(current_q)
            current_q = {
                "question_text": q_match.group(3),
                "question_type": "mc",
                "options": [],
                "correct_answer": "",
                "points": 1 # Theo tiêu chí 2026 là 0.25 nhưng API dùng int? Tôi để tạm 1
            }
        elif current_q and opt_pattern.findall(text):
            opts = opt_pattern.findall(text)
            for label, opt_text in opts:
                current_q["options"].append(f"{label}. {opt_text.strip()}")
        elif current_q:
            current_q["question_text"] += "\n" + text

    if current_q: questions.append(current_q)
    
    # Tìm đáp án (Thường ở cuối hoặc bảng)
    # Đây là logic đơn giản, tôi sẽ map đáp án nếu tìm thấy từ "Đáp án: A"
    for q in questions:
        ans_match = re.search(r'Đáp án[:\s]+([A-D])', q["question_text"])
        if ans_match:
            q["correct_answer"] = ans_match.group(1)
            q["question_text"] = q["question_text"].split('Đáp án')[0].strip()
            
    return questions

def upload_exam_with_questions(token, title, questions):
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # 1. Tạo Exam
    exam_payload = {
        "title": title,
        "description": "Số hóa từ file Word - Cấu trúc 2026",
        "time_limit": 50,
        "total_points": 10
    }
    # Lưu ý: Tôi cần check API tạo Exam trước
    print(f"📝 Đang tạo bài thi: {title}...")
    # Giả định endpoint tạo exam là /api/courses/{course_id}/exams hoặc tương tự
    # Tôi sẽ dùng /api/assignments với quiz_data vì nó linh hoạt hơn trong schema của bạn
    
    assignment_payload = {
        "title": title,
        "description": "Bài tập trắc nghiệm số hóa",
        "assignment_type": "quiz",
        "quiz_data": {"questions": questions},
        "folder_id": 9 # Thư mục 2k8 đã tạo
    }
    res = requests.post(f"{BASE_URL}/api/assignments", headers=headers, json=assignment_payload)
    if res.status_code == 200:
        print(f"✅ Đã số hóa thành công bài thi lên Web!")
    else:
        print(f"❌ Lỗi: {res.text}")

token = get_token()
folder = "projects/MINDA/de_tin_hoc"
target_file = os.path.join(folder, "thuvienhoclieu.com-De-thi-thu-TN-THPT-2026-mon-Tin-So-GD-Ha-Tinh-Lan-1.docx")

questions = parse_docx_to_questions(target_file)
upload_exam_with_questions(token, "Đề Tin Hà Tĩnh 2026 (Số hóa)", questions)
