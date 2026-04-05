from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from app.db.database import Base
from datetime import datetime


class EmotionLog(Base):
    """Lưu kết quả emotion detection trong buổi học live."""
    __tablename__ = "emotion_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("live_sessions.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    emotion = Column(String, nullable=False)          # "Neutral" | "Enjoyment" | ...
    confidence = Column(Float, nullable=False)
    # JSON string: {"Neutral": 0.8, "Confusion": 0.1, ...}
    probabilities = Column(String, nullable=True)
    captured_at = Column(DateTime, default=datetime.utcnow, index=True)
