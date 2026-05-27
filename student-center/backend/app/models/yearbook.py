from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from datetime import datetime
from app.db.database import Base

class YearbookMessage(Base):
    __tablename__ = "yearbook_messages"

    id = Column(String, primary_key=True, index=True)
    yearbook_id = Column(String, index=True, nullable=False) # e.g. "teacher_template_01" or "class_yb_..."
    author_name = Column(String, nullable=False)
    emoji = Column(String, nullable=True)
    bg_color = Column(String, nullable=True)
    message = Column(Text, nullable=False)
    image_data = Column(Text, nullable=True) # Base64 string
    is_public = Column(Boolean, default=True)
    hearts = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
