from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class CodeProblem(Base):
    __tablename__ = "code_problems"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False) # Markdown / LaTeX statement
    difficulty = Column(String, default="easy") # easy, medium, hard
    rating = Column(Integer, default=800) # Elo rating (800 - 2400+)
    track = Column(String, default="basic") # basic, cs, competitive, advanced, ptit, thcs, thpt
    subject = Column(String, nullable=True) # "Lập trình cơ bản", "Lập trình nâng cao", "OOP", "Giải thuật", "Lý thuyết đồ thị"
    chapter = Column(String, nullable=True) # "Nhập / Xuất", "Vòng lặp", "Mảng", "Quy hoạch động"
    tags = Column(JSON, default=list) # ["Mảng", "Sắp xếp", "C++"]
    constraints = Column(JSON, default=list) # ["-10^9 <= a, b <= 10^9"]
    examples = Column(JSON, default=list) # [{"input": "...", "output": "...", "explanation": "..."}]
    hints = Column(JSON, default=list)
    starter_code = Column(JSON, default=dict) # {"python": "...", "cpp": "..."}
    test_cases = Column(JSON, default=list) # [{"input": "...", "output": "...", "is_hidden": False}]
    source = Column(String, default="MINDA") # PTIT, LeetCode, UpCoder, ucode, etc.
    solved_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class CodeSubmission(Base):
    __tablename__ = "code_submissions"

    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("code_problems.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    language = Column(String, nullable=False) # python, cpp, javascript, java
    code = Column(Text, nullable=False)
    verdict = Column(String, nullable=False) # AC, WA, TLE, MLE, CE
    execution_time = Column(String, nullable=True) # e.g. "12ms"
    memory_used = Column(String, nullable=True) # e.g. "2.4MB"
    error_message = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    problem = relationship("CodeProblem", backref="submissions")
    user = relationship("User", backref="code_submissions")


class CodingExam(Base):
    """Đề thi / Kỳ thi lập trình gồm tập hợp nhiều bài toán code"""
    __tablename__ = "coding_exams"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=120) # Thời gian làm bài (phút)
    track = Column(String, default="thcs") # thcs, thpt, basic, contest
    difficulty = Column(String, default="medium") # easy, medium, hard
    total_score = Column(Integer, default=100)
    is_published = Column(Boolean, default=True)
    problem_ids = Column(JSON, default=list) # Danh sách ID các bài toán thuộc đề thi [1, 2, 3, ...]
    tags = Column(JSON, default=list) # ["HSG Tin 8", "C++", "Level 01"]
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[creator_id])
