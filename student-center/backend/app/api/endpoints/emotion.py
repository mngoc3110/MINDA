"""
emotion.py — Proxy endpoint: nhận frame từ frontend, gọi RAPT-CLIP microservice,
lưu kết quả vào emotion_logs, trả về label về browser.
"""
import json
import httpx
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.emotion import EmotionLog

router = APIRouter(prefix="/api/emotion", tags=["emotion"])

# URL của RAPT-CLIP microservice (chạy local port 8001)
INFERENCE_URL = "http://localhost:8001/analyze"
INFERENCE_TIMEOUT = 10.0  # giây


# ─── Schemas ────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    frame_b64: str           # base64 từ webcam
    session_id: Optional[int] = None  # live session ID để lưu log


class EmotionResult(BaseModel):
    label: str
    emoji: str
    confidence: float
    probabilities: dict


# ─── Endpoints ──────────────────────────────────────────────
@router.post("/analyze", response_model=EmotionResult)
async def analyze_emotion(
    req: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Nhận 1 frame webcam (base64) → gọi RAPT-CLIP → trả về emotion.
    Nếu có session_id thì lưu vào emotion_logs.
    """
    # Gọi RAPT-CLIP inference microservice
    try:
        async with httpx.AsyncClient(timeout=INFERENCE_TIMEOUT) as client:
            resp = await client.post(INFERENCE_URL, json={"frame_b64": req.frame_b64})
            resp.raise_for_status()
            result = resp.json()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="RAPT-CLIP inference service chưa chạy. Hãy khởi động: python inference_server.py"
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Inference service timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi inference: {str(e)}")

    # Lưu vào DB nếu có session_id
    if req.session_id:
        try:
            log = EmotionLog(
                session_id=req.session_id,
                student_id=current_user.id,
                emotion=result["label"],
                confidence=result["confidence"],
                probabilities=json.dumps(result["probabilities"]),
                captured_at=datetime.utcnow(),
            )
            db.add(log)
            db.commit()
        except Exception:
            db.rollback()  # Không làm hỏng response nếu lỗi DB

    return EmotionResult(
        label=result["label"],
        emoji=result["emoji"],
        confidence=result["confidence"],
        probabilities=result["probabilities"],
    )


@router.get("/session/{session_id}/summary")
def get_session_emotion_summary(
    session_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Giáo viên xem tổng hợp emotion của cả lớp trong 1 session.
    Trả về % từng trạng thái và breakdown theo từng học sinh.
    """
    logs = db.query(EmotionLog).filter(EmotionLog.session_id == session_id).all()

    if not logs:
        return {"total": 0, "summary": {}, "students": {}}

    # Tổng hợp toàn session
    emotion_counts: dict[str, int] = {}
    student_latest: dict[int, dict] = {}  # student_id → latest emotion

    for log in logs:
        emotion_counts[log.emotion] = emotion_counts.get(log.emotion, 0) + 1
        # Giữ lại log mới nhất của mỗi học sinh
        prev = student_latest.get(log.student_id)
        if prev is None or log.captured_at > prev["captured_at"]:
            student_latest[log.student_id] = {
                "student_id": log.student_id,
                "emotion": log.emotion,
                "confidence": log.confidence,
                "captured_at": log.captured_at.isoformat(),
            }

    total = len(logs)
    summary = {k: round(v / total * 100, 1) for k, v in emotion_counts.items()}

    return {
        "total": total,
        "summary": summary,           # {"Neutral": 45.0, "Confusion": 22.5, ...}
        "students": list(student_latest.values()),  # Latest emotion per student
    }


@router.get("/health")
async def check_inference_service():
    """Kiểm tra RAPT-CLIP microservice có đang chạy không."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:8001/health")
            return {"inference_service": "online", "detail": resp.json()}
    except Exception:
        return {"inference_service": "offline", "detail": "Microservice chưa khởi động"}
