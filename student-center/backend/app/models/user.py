from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.student, nullable=False)
    secondary_role = Column(String, nullable=True)  # "teacher", "admin", etc. — vai trò phụ thứ hai
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Profile Images
    avatar_url = Column(String, nullable=True)
    cover_url = Column(String, nullable=True)

    # Google OAuth Drive integration
    google_access_token = Column(String, nullable=True)
    google_refresh_token = Column(String, nullable=True)
    google_folder_id = Column(String, nullable=True)

    # Gamification
    exp_points = Column(Integer, default=0)
    current_rank = Column(String, default="Đồng")

    # Relationships
    taught_courses = relationship("Course", back_populates="teacher", foreign_keys="Course.teacher_id")
    enrollments = relationship("Enrollment", back_populates="student")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student")
    exam_submissions = relationship("ExamSubmission", back_populates="student")
    tuition_records = relationship("TuitionRecord", back_populates="student")
    
    teacher_profile = relationship("TeacherProfile", uselist=False, back_populates="user")

class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    cv_title = Column(String, default="GIA SƯ MINDA")
    cv_competencies = Column(String, default="[]")  # JSON string array/list
    cv_soft_skills = Column(String, default="[]") # JSON string
    cv_languages = Column(String, default="[]")  # JSON string
    cv_formats = Column(String, default="[]")     # JSON string
    cv_education = Column(String, default="[]")   # JSON string
    cv_teaching_experience = Column(String, default="[]") # JSON string
    cv_programming_experience = Column(String, default="[]") # JSON string
    cv_additional_info = Column(String, default="[]") # JSON string
    
    cv_theme_color = Column(String, default="#1a365d") # Default is navy blue
    cv_layout = Column(String, default="modern") # 'modern' (2-col) or 'classic' (1-col)
    cv_custom_sections = Column(String, default="[]") # JSON string array for custom blocks
    
    social_linkedin = Column(String, nullable=True)
    social_facebook = Column(String, nullable=True)
    social_website = Column(String, nullable=True)

    user = relationship("User", back_populates="teacher_profile")


class TeacherStudentLink(Base):
    __tablename__ = "teacher_student_links"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
