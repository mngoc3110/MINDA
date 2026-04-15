import google.generativeai as genai
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter()

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

class ChatRequest(BaseModel):
    prompt: str

@router.post("/solve-math")
async def solve_math(req: ChatRequest, current_user = Depends(get_current_user)):
    """
    Nhận prompt của học viên, gọi tới Gemini Cloud API để giải toán 
    kèm theo kỹ thuật System Prompt Injection trích xuất tham số 3D.
    """
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Chưa cài đặt Gemini API Key trong môi trường Backend.")

    system_instruction = """Bạn là một Trợ lý Toán Học Xuất Sắc cho học sinh tư thục (Trường MINDA).
Hãy trả lời thân thiện, mạch lạc, sử dụng định dạng \LaTeX cho các công thức, và giải chi tiết từng bước rõ ràng.
ĐẶC BIẾT LƯU Ý, nếu bài toán mà học sinh hỏi MIÊU TẢ HOẶC CHỨA DỮ KIỆN về một khối Hình Học Gian Cụ Thể, BẠN BẮT BUỘC phải đính kèm BÍ DANH mã hóa sau vào DÒNG CUỐI CÙNG của đoạn trả lời (để hệ thống 3D phía Client có thể Render Hình học đó):
- Nếu bài toán rơi vào Khối Lập Phương, in kèm: [MATH_SHAPE=cube]
- Nếu bài toán rơi vào Hình Cầu / Khối Cầu: [MATH_SHAPE=sphere]
- Nếu bài toán rơi vào Hình Nón / Khối Nón: [MATH_SHAPE=cone]
- Nếu bài toán rơi vào Hình Trụ / Khối Trụ / Cốc nước hình trụ: [MATH_SHAPE=cylinder]

Luật:
1. Bạn CHỈ ĐƯỢC IN DUY NHẤT 1 thẻ ngoặc vuông phù hợp nhất với bài toán.
2. Từ ngữ trong thẻ phải ghi đúng tiếng Anh chuẩn xác (cube, sphere, cone, cylinder). Ví dụ học sinh bảo tính thể tích cốc trụ, hãy chèn [MATH_SHAPE=cylinder].
3. Nếu bài đại số bình thường không lồng ghép hình không gian nào ở trên, tuyệt đối KHÔNG in thẻ ngoặc vuông nào cả.
Cuối bài, nhớ gửi lời chúc / cổ vũ học viên học tốt nhé!"""

    try:
        model = genai.GenerativeModel('gemini-pro', system_instruction=system_instruction)
        response = model.generate_content(req.prompt)
        
        return {"reply": response.text}
    except Exception as e:
        print(f"[Gemini Exception]: {e}")
        raise HTTPException(status_code=500, detail="Có lỗi xảy ra khi truy xuất từ Google AI Cloud, vui lòng báo cáo lỗi này với kỹ thuật viên!")
