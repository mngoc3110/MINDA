import os
import re
import subprocess
import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from google import genai
from app.core.config import settings

router = APIRouter()

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]

MANIM_SYSTEM_PROMPT = """Bạn là chuyên gia lập trình Manim (Python) cho giáo dục toán học.
Nhiệm vụ: Viết code Manim Community (v0.18+) hoàn chỉnh, chạy được, để tạo video animation theo mô tả của người dùng.

Quy tắc bắt buộc:
1. Chỉ trả về code Python thuần túy, KHÔNG có markdown, KHÔNG có ```python, KHÔNG có giải thích.
2. Class phải kế thừa Scene và tên class phải là MathAnimation.
3. Dùng tiếng Việt trong comment nếu cần.
4. Code phải ngắn gọn, rõ ràng, chạy được ngay với lệnh: manim file.py MathAnimation -ql
5. Ưu tiên dùng các object: MathTex, Tex, Text, Axes, NumberPlane, Arrow, Line, Dot, Circle, Square, Rectangle, Polygon, VGroup, Brace.
6. Thêm self.wait() ở cuối để video không kết thúc đột ngột.
"""


# Schema
class ManimCodeRequest(BaseModel):
    code: str

class ManimPromptRequest(BaseModel):
    prompt: str

@router.post("/generate")
async def generate_manim_code(request: ManimPromptRequest):
    """Dùng Gemini AI sinh Manim Python code từ mô tả tự nhiên."""
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    last_error = None
    for model_id in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_id,
                contents=request.prompt,
                config={
                    "system_instruction": MANIM_SYSTEM_PROMPT,
                    "temperature": 0.3,
                }
            )
            raw = response.text.strip()
            # Xoá markdown code blocks nếu có
            raw = re.sub(r'^```(?:python)?\n?', '', raw)
            raw = re.sub(r'\n?```$', '', raw)
            return JSONResponse(content={"code": raw.strip()})
        except Exception as e:
            last_error = str(e)
            continue
    
    raise HTTPException(status_code=500, detail=f"AI generate failed: {last_error}")

@router.post("/render")
async def render_manim(request: ManimCodeRequest):
    code = request.code
    
    # 1. Tạo file tạm để chứa code
    temp_dir = os.path.join(os.getcwd(), "media", "temp_manim")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate a unique ID for this render task
    task_id = str(uuid.uuid4())[:8]
    file_path = os.path.join(temp_dir, f"scene_{task_id}.py")
    
    with open(file_path, "w") as f:
        f.write(code)

    # 2. Extract class name (Assuming standard Manim script)
    # Tìm class có kế thừa từ Scene
    class_name = "MathAnimation" # Default fallback
    for line in code.split("\n"):
        if line.startswith("class ") and "(Scene)" in line:
            class_name = line.split("class ")[1].split("(Scene)")[0].strip()
            break
            
    # 3. Chạy lệnh subprocess
    # -ql: Quality Low (480p15), --format=mp4
    # --media_dir: Để xuất thẳng vào thư mục backend/media
    media_dir = os.path.join(os.getcwd(), "media")
    import sys
    command = [
        sys.executable,
        "-m", "manim", 
        file_path, 
        class_name, 
        "-ql", 
        "--media_dir", media_dir,
        "--format=mp4"
    ]
    
    try:
        # Run blocking for POC. For production, use BackgroundTasks or Celery.
        process = subprocess.run(command, capture_output=True, text=True, timeout=60)
        
        if process.returncode != 0:
            print("MANIM ERROR:", process.stderr)
            raise HTTPException(status_code=500, detail=f"Manim render error: {process.stderr}")
            
        # 4. Tìm file video đã render
        # Manim lưu video theo cấu trúc: media/videos/<filename>/480p15/<classname>.mp4
        filename_no_ext = f"scene_{task_id}"
        video_path = os.path.join(media_dir, "videos", filename_no_ext, "480p15", f"{class_name}.mp4")
        
        if not os.path.exists(video_path):
            raise HTTPException(status_code=500, detail="Render completed but video file not found.")
            
        # Trả về URL tương đối (FastAPI static mount)
        video_url = f"/media/videos/{filename_no_ext}/480p15/{class_name}.mp4"
        
        return JSONResponse(content={"status": "success", "video_url": video_url})
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=500, detail="Render timeout (>60s).")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
