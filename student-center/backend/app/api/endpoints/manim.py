import os
import subprocess
import tempfile
import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

# Schema
class ManimCodeRequest(BaseModel):
    code: str

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
