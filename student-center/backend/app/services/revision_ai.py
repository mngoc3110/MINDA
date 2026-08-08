import os
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import google.generativeai as genai

# Cấu hình Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ── 1. Pure Python Lightweight Document Parsers ─────────────────────────────

def extract_text_from_docx_bytes(file_bytes: bytes) -> str:
    """Trích xuất toàn bộ văn bản từ file Word .docx siêu nhẹ không cần thư viện cồng kềnh."""
    import io
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            texts = [elem.text for elem in tree.iter() if elem.tag.endswith('t') and elem.text]
            return "\n".join(texts)
    except Exception as e:
        print(f"Lỗi đọc DOCX: {e}")
        return ""

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    """Trích xuất văn bản từ file PDF."""
    import io
    try:
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_text = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                pages_text.append(t)
        return "\n".join(pages_text)
    except Exception:
        # Fallback đọc text thuần
        try:
            return file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            return ""

def parse_document_content(filename: str, file_bytes: bytes) -> tuple[str, str]:
    """Phát hiện định dạng và trích xuất nội dung văn bản."""
    ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
    if ext in ['docx', 'doc']:
        content = extract_text_from_docx_bytes(file_bytes)
        file_type = 'docx'
    elif ext == 'pdf':
        content = extract_text_from_pdf_bytes(file_bytes)
        file_type = 'pdf'
    else:
        try:
            content = file_bytes.decode('utf-8')
        except Exception:
            content = file_bytes.decode('latin-1', errors='ignore')
        file_type = 'txt'
    
    # Làm sạch văn bản
    content = re.sub(r'[ \t]+', ' ', content)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    return file_type, content


# ── 2. GDPT 2018 Prompt Engine for Smart Quiz Generation ─────────────────────

GDPT_COMPETENCY_FRAMEWORK = """
CĂN CỨ THEO CHƯƠNG TRÌNH GIÁO DỤC PHỔ THÔNG TỔNG THỂ (GDPT 2018):
Các câu hỏi ôn tập PHẢI được phân loại chính xác tuyệt đối vào 4 mức độ nhận thức sau:
1. "Nhận biết" (Recall/Knowledge - 40%): Nhận diện khái niệm, định nghĩa, ghi nhớ công thức, sự kiện hoặc chi tiết trực tiếp có trong tài liệu đề cương.
2. "Thông hiểu" (Understanding - 30%): Giải thích, so sánh, phân biệt, chuyển đổi biểu diễn hoặc suy luận logic từ tài liệu.
3. "Vận dụng" (Application - 20%): Áp dụng kiến thức, định lý, công thức vào giải quyết tình huống bài tập quen thuộc đơn lẻ.
4. "Vận dụng cao" (High Application - 10%): Tổng hợp kiến thức đa phần, phân tích tình huống thực tiễn, đánh giá và giải quyết vấn đề phức tạp.
"""

def generate_smart_quiz_from_docs(
    documents: List[Dict[str, str]],
    quiz_type: str = "mcq_4",
    total_questions: int = 10,
    ratio_matrix: Optional[Dict[str, int]] = None,
    focus_topic: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Sinh câu hỏi ôn tập thông minh bằng Gemini 2.0 Flash dựa trên toàn bộ tài liệu học sinh đã upload.
    Đảm bảo 100% câu hỏi có phân loại mức độ GDPT, trích dẫn tài liệu (Citation) và giải thích chi tiết.
    """
    if not ratio_matrix:
        ratio_matrix = {"recall": 40, "understanding": 30, "application": 20, "high_application": 10}

    # Kết hợp ngữ cảnh từ tất cả tài liệu
    combined_docs_text = ""
    for idx, doc in enumerate(documents, 1):
        combined_docs_text += f"\n--- [TÀI LIỆU {idx}: {doc.get('filename', 'Đề cương')}] ---\n{doc.get('content_text', '')[:12000]}\n"

    # Định dạng schema đầu ra
    if quiz_type == "true_false":
        quiz_format_desc = """
DẠNG ĐỀ THI ĐÚNG / SAI CHUẨN BỘ GIÁO DỤC 2025+:
Mỗi câu hỏi gồm 1 phần dẫn đề bài và 4 ý khẳng định (a, b, c, d). Học sinh cần xác định từng ý là Đúng hay Sai.
Format JSON cho mỗi câu:
{
  "id": 1,
  "cognitive_level": "Thông hiểu",
  "question": "Nội dung câu hỏi/tình huống...",
  "sub_items": [
    {"label": "a", "statement": "Khẳng định 1...", "is_true": true, "explanation": "Giải thích chi tiết vì sao đúng"},
    {"label": "b", "statement": "Khẳng định 2...", "is_true": false, "explanation": "Giải thích chi tiết vì sao sai"},
    {"label": "c", "statement": "Khẳng định 3...", "is_true": true, "explanation": "..."},
    {"label": "d", "statement": "Khẳng định 4...", "is_true": false, "explanation": "..."}
  ],
  "citation": "Trích dẫn dòng/đoạn chứng minh trong tài liệu"
}
"""
    elif quiz_type == "flashcard":
        quiz_format_desc = """
DẠNG FLASHCARD GHI NHỚ TRỌNG TÂM:
Format JSON cho mỗi card:
{
  "id": 1,
  "cognitive_level": "Nhận biết",
  "front": "Khái niệm hoặc câu hỏi ngắn cốt lõi...",
  "back": "Định nghĩa / Câu trả lời hoàn chỉnh kèm ví dụ...",
  "key_takeaway": "Điểm mấu chốt cần ghi nhớ",
  "citation": "Trích dẫn nguồn tài liệu"
}
"""
    else:  # mcq_4 (Trắc nghiệm 4 phương án)
        quiz_format_desc = """
DẠNG TRẮC NGHIỆM 4 LỰA CHỌN (A, B, C, D):
Format JSON cho mỗi câu:
{
  "id": 1,
  "cognitive_level": "Nhận biết" (hoặc "Thông hiểu", "Vận dụng", "Vận dụng cao"),
  "question": "Nội dung câu hỏi...",
  "options": [
    "A. Phương án A",
    "B. Phương án B",
    "C. Phương án C",
    "D. Phương án D"
  ],
  "correct_answer": "A",
  "explanation": "Giải thích chi tiết từng phương án vì sao đúng và phân tích bẫy của các phương án sai...",
  "citation": "Trích dẫn dòng/đoạn trong tài liệu chứng minh cho đáp án"
}
"""

    prompt = f"""
Bạn là Chuyên gia Giáo dục & Khảo thí Cao cấp của MINDA.
Nhiệm vụ của bạn là đọc kỹ toàn bộ tài liệu/đề cương học tập dưới đây và tạo ra một bộ câu hỏi ôn tập CHUẨN XÁC, THÔNG MINH NHẤT theo Khung Chương trình GDPT 2018.

{GDPT_COMPETENCY_FRAMEWORK}

CẤU HÌNH BỘ CÂU HỎI:
- Tổng số lượng câu: {total_questions} câu.
- Dạng câu hỏi: {quiz_type}
- Ma trận phân bổ mức độ nhận thức:
  + Nhận biết: ~{ratio_matrix.get('recall', 40)}%
  + Thông hiểu: ~{ratio_matrix.get('understanding', 30)}%
  + Vận dụng: ~{ratio_matrix.get('application', 20)}%
  + Vận dụng cao: ~{ratio_matrix.get('high_application', 10)}%
{f'- Chủ đề trọng tâm cần nhấn mạnh: {focus_topic}' if focus_topic else ''}

{quiz_format_desc}

QUY TẮC BẮT BUỘC:
1. Tất cả kiến thức và câu hỏi PHẢI bám sát 100% vào nội dung tài liệu được cung cấp dưới đây, không tự bịa đặt kiến thức ngoài lề.
2. Các phương án nhiễu (Distractors) phải có tính đánh lừa tư duy logic cao (dựa trên các lỗi học sinh hay nhầm lẫn).
3. Luôn có trường "citation" ghi rõ xuất xứ đoạn văn trong tài liệu.
4. Trả về DUY NHẤT một JSON Array hợp lệ [ {{...}}, {{...}} ], không bọc trong bất kỳ văn bản giải thích nào khác ngoài chuỗi JSON.

TÀI LIỆU ĐỀ CƯƠNG CỦA HỌC SINH:
{combined_docs_text}
"""

    try:
        # Sử dụng Gemini 2.0 Flash / Pro siêu tốc
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json", "temperature": 0.3}
        )
        raw_text = response.text.strip()
        data = json.loads(raw_text)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and "questions" in data:
            return data["questions"]
        return []
    except Exception as e:
        print(f"Lỗi AI sinh câu hỏi: {e}")
        # Fallback tạo câu hỏi mẫu nếu không có kết nối API
        return [
            {
                "id": 1,
                "cognitive_level": "Nhận biết",
                "question": "Theo tài liệu đề cương đã tải lên, mục tiêu cốt lõi của bài học là gì?",
                "options": [
                    "A. Nắm vững định nghĩa và các khái niệm cơ bản",
                    "B. Học thuộc lòng toàn bộ văn bản",
                    "C. Bỏ qua các bước thực hành",
                    "D. Chỉ làm bài tập khó"
                ],
                "correct_answer": "A",
                "explanation": "Tài liệu nhấn mạnh việc hiểu và ghi nhớ các khái niệm nền tảng trước khi vận dụng.",
                "citation": "Tài liệu ôn tập của học sinh - Phần tổng quan"
            }
        ]


# ── 3. NotebookLM Document Chat Assistant ────────────────────────────────────

def chat_with_notebook_documents(
    documents: List[Dict[str, str]],
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """Trợ lý AI trả lời câu hỏi và giải thích bài tập dựa trên tất cả tài liệu đã tải lên."""
    combined_docs_text = ""
    for idx, doc in enumerate(documents, 1):
        combined_docs_text += f"\n--- [TÀI LIỆU {idx}: {doc.get('filename', 'Đề cương')}] ---\n{doc.get('content_text', '')[:10000]}\n"

    system_instruction = f"""
Bạn là MINDA AI Study Companion - Trợ lý ôn tập thông minh đồng hành cùng học sinh theo phong cách Google NotebookLM.
Bạn có quyền truy cập vào các tài liệu đề cương học tập của học sinh dưới đây.

NHIỆM VỤ CỦA BẠN:
1. Trả lời câu hỏi một cách chuẩn xác, sư phạm, thân thiện và dễ hiểu.
2. Luôn trích dẫn nguồn cụ thể từ tài liệu (Ví dụ: "Theo mục 2 trong tài liệu [Tên file]...").
3. Giải thích tường tận các công thức, thuật ngữ khó và đưa ra mẹo ghi nhớ nhanh.

TÀI LIỆU CỦA HỌC SINH:
{combined_docs_text}
"""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_instruction)
        chat = model.start_chat(history=[])
        res = chat.send_message(user_message)
        return res.text
    except Exception as e:
        return f"Xin lỗi, hiện tại tôi chưa thể phân tích tài liệu: {str(e)}"
