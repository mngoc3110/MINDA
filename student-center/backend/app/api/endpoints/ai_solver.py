"""
AI Solver — Gemini API (google.genai SDK mới)
Hỗ trợ giải toán + phân tách đề từ ảnh/PDF
"""
from google import genai
from google.genai import types
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from app.core.config import settings
from app.core.security import get_current_user

router = APIRouter()

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

SYSTEM_INSTRUCTION = """Bạn là một Trợ lý Toán Học Xuất Sắc cho học sinh tư thục (Trường MINDA).
Hãy trả lời thân thiện, mạch lạc, sử dụng định dạng \\LaTeX cho các công thức, và giải chi tiết từng bước rõ ràng.
ĐẶC BIỆT LƯU Ý, nếu bài toán mà học sinh hỏi MIÊU TẢ HOẶC CHỨA DỮ KIỆN về một khối Hình Học Không Gian hoặc Hình Học Phẳng Cụ Thể, BẠN BẮT BUỘC phải đính kèm BÍ DANH mã hóa sau vào DÒNG CUỐI CÙNG của đoạn trả lời (để hệ thống 3D phía Client có thể Render Hình học đó):
- Nếu bài toán rơi vào Khối Lập Phương, in kèm: [MATH_SHAPE=cube]
- Nếu bài toán rơi vào Hình Cầu / Khối Cầu: [MATH_SHAPE=sphere]
- Nếu bài toán rơi vào Hình Nón / Khối Nón: [MATH_SHAPE=cone]
- Nếu bài toán rơi vào Hình Trụ / Khối Trụ / Cốc nước hình trụ: [MATH_SHAPE=cylinder]
- Nếu bài toán rơi vào Hình Tam Giác (vuông, cân, đều): [MATH_SHAPE=triangle]
- Nếu bài toán rơi vào Hình Vuông / Hình Chữ Nhật: [MATH_SHAPE=square]
- Nếu bài toán rơi vào Hình Tròn / Đường Tròn: [MATH_SHAPE=circle]
- Nếu bài toán rơi vào Hình Chóp Tứ Giác (chóp có đáy là tứ giác, ví dụ S.ABCD): [MATH_SHAPE=pyramid]
- Nếu bài toán rơi vào Tứ Diện / Hình Chóp Tam Giác (ví dụ S.ABC): [MATH_SHAPE=tetrahedron]

NGOÀI RA, nếu trong bài giải có nhắc đến các ĐIỂM PHỤ (ví dụ M là trung điểm SC, N là trung điểm CD, H là chân đường cao...), bạn PHẢI đính kèm thêm thẻ sau NGAY SAU thẻ MATH_SHAPE:
[MATH_GEOMETRY={"points":{"TÊN_ĐIỂM":"mid(ĐỈNH1,ĐỈNH2)"},"lines":[{"from":"ĐIỂM1","to":"ĐIỂM2","style":"dashed"}]}]

Quy tắc MATH_GEOMETRY:
- Tên đỉnh gốc phải dùng đúng: S, A, B, C, D (cho pyramid), S, A, B, C (cho tetrahedron), A, B, C, D, A1, B1, C1, D1 (cho cube).
- Định nghĩa điểm phụ bằng: "mid(X,Y)" = trung điểm X và Y.
- style của đường: "solid" (nét liền) hoặc "dashed" (nét đứt).
- color tùy chọn: "red", "blue", "green", "orange". Mặc định là "red".
- Ví dụ: M là trung điểm SC, N là trung điểm CD, vẽ đường MN nét đứt:
  [MATH_GEOMETRY={"points":{"M":"mid(S,C)","N":"mid(C,D)"},"lines":[{"from":"M","to":"N","style":"dashed","color":"orange"}]}]
- Nếu bài không có điểm phụ nào, KHÔNG in thẻ MATH_GEOMETRY.

Luật:
1. Bạn CHỈ ĐƯỢC IN DUY NHẤT 1 thẻ MATH_SHAPE phù hợp nhất với bài toán.
2. Từ ngữ trong thẻ phải ghi đúng tiếng Anh chuẩn xác (cube, sphere, cone, cylinder, triangle, square, circle, pyramid, tetrahedron).
3. Nếu bài đại số bình thường không liên quan đến các hình học trên, tuyệt đối KHÔNG in thẻ ngoặc vuông nào cả.
Cuối bài, nhớ gửi lời chúc / cổ vũ học viên học tốt nhé!"""


class ChatRequest(BaseModel):
    prompt: str

class StatsAnalyzeRequest(BaseModel):
    history: list[dict]


from app.services.gemini_key_manager import get_next_gemini_key

def _get_client():
    key = get_next_gemini_key()
    if not key:
        raise HTTPException(status_code=500, detail="Chưa cài đặt Gemini API Key trong môi trường Backend.")
    return genai.Client(api_key=key)


import os
import requests
import json

def _call_openrouter(prompt: str, system_instruction: str):
    openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
    models = [
        "google/gemini-2.5-flash", 
        "meta-llama/llama-3.3-70b-instruct",
        "google/gemma-3-27b-it:free"
    ]
    
    last_err = None
    for model in models:
        print(f"[OpenRouter] Trying model {model}...")
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_key}",
                "Content-Type": "application/json"
            },
            data=json.dumps({
                "model": model,
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": prompt}
                ]
            }),
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        last_err = response.text
        print(f"[OpenRouter] Model {model} failed: {last_err}")
        
    raise Exception(f"OpenRouter failed all models. Last error: {last_err}")


def _call_gemini(client, contents, system_instruction=None):
    """Try multiple models with retry."""
    last_error = None
    config = types.GenerateContentConfig(
        temperature=0.2,
        system_instruction=system_instruction,
    )
    for model_name in MODELS_TO_TRY:
        for attempt in range(4):
            try:
                print(f"[Gemini] Trying {model_name} (attempt {attempt+1})...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                return response.text
            except Exception as e:
                last_error = e
                print(f"[Gemini] {model_name} failed: {e}")
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str or "403" in err_str or "PERMISSION_DENIED" in err_str:
                    from app.services.gemini_key_manager import get_next_gemini_key
                    new_key = get_next_gemini_key()
                    print(f"[Gemini] Error {err_str[:30]}. Switching API key...")
                    client = genai.Client(api_key=new_key)
                    continue
                else:
                    break
    raise last_error


@router.post("/solve-math")
async def solve_math(req: ChatRequest, current_user=Depends(get_current_user)):
    """
    Nhận prompt của học viên, gọi tới Gemini Cloud API để giải toán
    kèm theo kỹ thuật System Prompt Injection trích xuất tham số 3D.
    """
    try:
        client = _get_client()
        reply = _call_gemini(client, [req.prompt], system_instruction=SYSTEM_INSTRUCTION)
        return {"reply": reply}
    except Exception as e:
        print(f"[Gemini Exception]: {e}. Falling back to OpenRouter...")
        try:
            reply = _call_openrouter(req.prompt, SYSTEM_INSTRUCTION)
            return {"reply": reply}
        except Exception as openrouter_err:
            print(f"[OpenRouter Exception]: {openrouter_err}")
            raise HTTPException(status_code=500, detail=f"Lỗi AI: Tất cả các API đều thất bại.")

@router.post("/analyze-stats")
async def analyze_stats(req: StatsAnalyzeRequest, current_user=Depends(get_current_user)):
    """
    Nhận lịch sử điểm số của học sinh và gọi AI để nhận xét tiến độ
    """
    sys_prompt = "Bạn là một giáo viên tận tâm tại hệ thống MINDA. Dưới đây là lịch sử nộp bài tập của một học sinh (bao gồm tên bài, điểm, và thời gian nộp, điểm tối đa thường là 10). Dựa vào đây, hãy viết một nhận xét ngắn gọn (khoảng 3-4 câu) về sự tiến bộ, phân tích xu hướng học tập (đi lên/xuống) và đưa ra lời khuyên động viên mang tính cá nhân hóa. Tuyệt đối không chào hỏi dài dòng, hãy đi thẳng vào nhận xét."
    prompt = f"Lịch sử làm bài:\n{json.dumps(req.history, ensure_ascii=False, indent=2)}\n\nHãy phân tích."
    try:
        client = _get_client()
        reply = _call_gemini(client, [prompt], system_instruction=sys_prompt)
        return {"reply": reply}
    except Exception as e:
        print(f"[Gemini Exception]: {e}. Falling back to OpenRouter...")
        try:
            reply = _call_openrouter(prompt, sys_prompt)
            return {"reply": reply}
        except Exception as openrouter_err:
            print(f"[OpenRouter Exception]: {openrouter_err}")
            raise HTTPException(status_code=500, detail="Lỗi AI khi phân tích thống kê.")


@router.post("/solve-image")
async def solve_from_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
):
    """
    Học sinh chụp ảnh bài toán → Gemini nhận diện + giải.
    Fallback sang OpenRouter nếu Gemini hết quota.
    """
    content = await file.read()
    mime = file.content_type or "image/jpeg"

    try:
        client = _get_client()
        image_part = types.Part.from_bytes(data=content, mime_type=mime)
        prompt_part = "Hãy đọc bài toán trong ảnh và giải chi tiết từng bước. Dùng LaTeX cho công thức."

        reply = _call_gemini(
            client,
            [image_part, prompt_part],
            system_instruction=SYSTEM_INSTRUCTION,
        )
        return {"reply": reply}
    except Exception as e:
        print(f"[Gemini Image Exception]: {e}. Falling back to OpenRouter Vision...")
        try:
            import base64
            openrouter_key = os.getenv("OPENROUTER_API_KEY", "")
            b64 = base64.b64encode(content).decode("utf-8")
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "meta-llama/llama-4-maverick:free",
                    "messages": [
                        {"role": "system", "content": SYSTEM_INSTRUCTION},
                        {"role": "user", "content": [
                            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}},
                            {"type": "text", "text": "Hãy đọc bài toán trong ảnh và giải chi tiết từng bước. Dùng LaTeX cho công thức."}
                        ]}
                    ]
                },
                timeout=60
            )
            if response.status_code == 200:
                reply = response.json()["choices"][0]["message"]["content"]
                return {"reply": reply}
            else:
                raise Exception(f"OpenRouter Vision failed: {response.status_code}")
        except Exception as openrouter_err:
            print(f"[OpenRouter Vision Exception]: {openrouter_err}")
            raise HTTPException(status_code=500, detail=f"Lỗi phân tích ảnh: Tất cả API đều hết quota.")

