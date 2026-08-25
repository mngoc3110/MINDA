from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum

class ScheduleType(str, enum.Enum):
    course_session = "course_session"
    personal = "personal"
    student = "student"

class ScheduleItem(Base):
    __tablename__ = "schedule_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    
    type = Column(SAEnum(ScheduleType), default=ScheduleType.personal)
    
    # Nullable, only used if type is 'course_session'
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    
    # User who owns this schedule (the student for 'personal', the teacher for 'course_session')
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Nullable, only used if type is 'student'
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    location = Column(String, nullable=True)
    color = Column(String, nullable=True) # Optional hex color for custom styling
    
    lesson_content = Column(String, nullable=True)     # Nội dung bài học của ca học
    next_lesson_plan = Column(String, nullable=True)   # Nội dung buổi học kế tiếp
    
    created_at = Column(DateTime, default=datetime.utcnow)

    course = relationship("Course")
    user = relationship("User", foreign_keys=[user_id])
    student = relationship("User", foreign_keys=[student_id])
