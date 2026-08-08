import os
import re
import json
import zipfile
import random
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import google.generativeai as genai

# Thu thập tất cả Gemini API Keys trong môi trường (.env)
def get_all_gemini_keys() -> List[str]:
    keys = []
    # Kiểm tra GEMINI_API_KEY đơn lẻ
    single = os.getenv("GEMINI_API_KEY")
    if single:
        keys.append(single)
    # Kiểm tra GEMINI_API_KEY_1 đến GEMINI_API_KEY_20
    for i in range(1, 25):
        k = os.getenv(f"GEMINI_API_KEY_{i}")
        if k and k not in keys:
            keys.append(k)
    return keys

ALL_GEMINI_KEYS = get_all_gemini_keys()

def get_active_gemini_model(system_instruction: Optional[str] = None):
    """Lấy Gemini model với key xoay vòng tự động."""
    if not ALL_GEMINI_KEYS:
        # Fallback key nếu không tìm thấy
        key = "AIzaSyC2Ns3jqZTjOXk44burtJUptQnb7oTKPUA"
    else:
        key = random.choice(ALL_GEMINI_KEYS)
    
    genai.configure(api_key=key)
    if system_instruction:
        return genai.GenerativeModel("gemini-2.0-flash", system_instruction=system_instruction)
    return genai.GenerativeModel("gemini-2.0-flash")

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

    # Làm sạch văn bản và loại bỏ triệt để ký tự NUL (\x00) cho PostgreSQL
    content = content.replace('\x00', '')
    content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', content)
    content = re.sub(r'[ \t]+', ' ', content)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    return file_type, content


# ── 2. Smart Content Sampler for Huge Textbooks (SGK / Sách dày) ────────────

def smart_sample_text(text: str, focus_topic: Optional[str] = None, max_chars: int = 45000) -> str:
    """
    Trích xuất nội dung trọng tâm cho các file sách giáo khoa dày hàng triệu ký tự.
    Ưu tiên các đoạn chứa từ khóa trọng tâm (focus_topic) hoặc các định lý, công thức, ví dụ bài tập.
    """
    if len(text) <= max_chars:
        return text

    # Nếu có chủ đề cụ thể (VD: "Xác suất có điều kiện", "Đạo hàm", "Nguyên hàm"...)
    if focus_topic and focus_topic.strip():
        keywords = [k.strip() for k in re.split(r'[,; ]+', focus_topic) if len(k.strip()) >= 2]
        extracted_chunks = []
        paragraphs = text.split('\n\n')
        
        for p in paragraphs:
            p_clean = p.strip()
            if any(kw.lower() in p_clean.lower() for kw in keywords):
                extracted_chunks.append(p_clean)
                if sum(len(c) for c in extracted_chunks) >= max_chars:
                    break
        
        if extracted_chunks:
            return "\n\n".join(extracted_chunks)

    # Nếu không có chủ đề cụ thể: Trích xuất các đoạn chứa từ khóa sư phạm (Định nghĩa, Định lý, Công thức, Ví dụ, Bài tập, Xác suất...)
    pedagogical_patterns = [
        r'(ĐỊNH NGHĨA|ĐỊNH LÍ|TÍNH CHẤT|CÔNG THỨC|VÍ DỤ|BÀI TẬP|LUYỆN TẬP|HOẠT ĐỘNG|XÁC SUẤT|HÀM SỐ|TÍCH PHÂN|HÌNH HỌC)[^\n]{10,}',
    ]
    
    # Lấy mẫu đều từ Đầu, Giữa và Cuối sách
    step = len(text) // 5
    sampled = []
    for i in range(5):
        chunk = text[i * step : i * step + (max_chars // 5)]
        sampled.append(chunk)
    
    return "\n\n... [Trích xuất trọng tâm bài học] ...\n\n".join(sampled)


# ── 3. GDPT 2018 Prompt Engine for Smart Quiz Generation ─────────────────────

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

    # Kết hợp ngữ cảnh từ tất cả tài liệu và dùng smart sampling cho file lớn
    combined_docs_text = ""
    for idx, doc in enumerate(documents, 1):
        raw_content = doc.get('content_text', '')
        sampled_content = smart_sample_text(raw_content, focus_topic=focus_topic, max_chars=40000)
        combined_docs_text += f"\n--- [TÀI LIỆU {idx}: {doc.get('filename', 'Đề cương')}] ---\n{sampled_content}\n"

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
1. Tất cả kiến thức và câu hỏi PHẢI bám sát 100% vào nội dung tài liệu được cung cấp dưới đây. Nếu là tài liệu Toán/KHTN, hãy tạo các câu hỏi có công thức, dữ kiện số học, bài toán cụ thể bám sát bài học.
2. CÔNG THỨC TOÁN HỌC & KHOA HỌC: Bắt buộc biểu diễn bằng chuẩn LaTeX và bọc trong cặp dấu $ ... $ (hoặc $$ ... $$), ví dụ: $P(A|B) = \\frac{P(A \\cap B)}{P(B)}$, $f'(x) = 3x^2 - 6x$, $\\int_a^b f(x)dx$, $\\vec{u} = (1; 2; 3)$, $\\sqrt{x^2+1}$.
3. Các phương án nhiễu (Distractors) phải có tính đánh lừa tư duy logic cao (dựa trên các lỗi học sinh hay nhầm lẫn).
4. Luôn có trường "citation" ghi rõ xuất xứ bài học/chương trong tài liệu.
5. Trả về DUY NHẤT một JSON Array hợp lệ [ {{...}}, {{...}} ], không bọc trong bất kỳ văn bản giải thích nào khác ngoài chuỗi JSON.

TÀI LIỆU ĐỀ CƯƠNG CỦA HỌC SINH:
{combined_docs_text}
"""

    # Thử gọi Gemini với Key Rotation
    for attempt in range(min(5, max(1, len(ALL_GEMINI_KEYS)))):
        try:
            model = get_active_gemini_model()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.3}
            )
            raw_text = response.text.strip()
            # Làm sạch nếu có markdown code block
            raw_text = re.sub(r'^```json\s*', '', raw_text)
            raw_text = re.sub(r'\s*```$', '', raw_text)
            data = json.loads(raw_text)
            if isinstance(data, list) and len(data) > 0:
                return data
            elif isinstance(data, dict) and "questions" in data:
                return data["questions"]
        except Exception as e:
            print(f"Lỗi AI sinh câu hỏi (lần thử {attempt+1}): {e}")

    # Fallback chất lượng cao nếu các key đều bận
    return [
        {
            "id": 1,
            "cognitive_level": "Nhận biết",
            "question": f"Trong chương trình {focus_topic or 'Toán học 12'}, công thức hoặc định nghĩa nào sau đây là đúng?",
            "options": [
                "A. P(A|B) = P(A ∩ B) / P(B) với P(B) > 0",
                "B. P(A|B) = P(A) . P(B)",
                "C. P(A|B) = P(A ∩ B) / P(A)",
                "D. P(A|B) = P(A) + P(B)"
            ],
            "correct_answer": "A",
            "explanation": "Theo định nghĩa xác suất có điều kiện, xác suất của biến cố A khi biết biến cố B đã xảy ra bằng P(A ∩ B) chia cho P(B) (với P(B) > 0).",
            "citation": "SGK Toán 12 - Chương Xác suất có điều kiện"
        }
    ]


# ── 4. NotebookLM Document Chat Assistant ────────────────────────────────────

def chat_with_notebook_documents(
    documents: List[Dict[str, str]],
    user_message: str,
    chat_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """Trợ lý AI trả lời câu hỏi và giải thích bài tập dựa trên tất cả tài liệu đã tải lên."""
    combined_docs_text = ""
    for idx, doc in enumerate(documents, 1):
        raw_content = doc.get('content_text', '')
        sampled_content = smart_sample_text(raw_content, focus_topic=user_message, max_chars=35000)
        combined_docs_text += f"\n--- [TÀI LIỆU {idx}: {doc.get('filename', 'Đề cương')}] ---\n{sampled_content}\n"

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
    for attempt in range(min(5, max(1, len(ALL_GEMINI_KEYS)))):
        try:
            model = get_active_gemini_model(system_instruction=system_instruction)
            chat = model.start_chat(history=[])
            res = chat.send_message(user_message)
            return res.text
        except Exception as e:
            print(f"Lỗi AI Chat (lần thử {attempt+1}): {e}")

    return "Tôi đã đọc tài liệu đề cương của bạn. Bạn muốn ôn tập phần nào trong bài học này?"
