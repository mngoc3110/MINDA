from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


class TuitionStatus(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    overdue = "overdue"
    quit = "quit"

class TuitionRecord(Base):
    __tablename__ = "tuition_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True) # Nullable for Offline Class Tuitions
    amount = Column(Integer, nullable=False)       # VNĐ
    paid_amount = Column(Integer, default=0)
    status = Column(SAEnum(TuitionStatus), default=TuitionStatus.pending)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    note = Column(Text, nullable=True)
    billing_cycle = Column(String(7), nullable=False, default="2026-04")
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="tuition_records")
    course = relationship("Course", back_populates="tuition_records")
