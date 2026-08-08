from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class RevisionNotebook(Base):
    """Không gian ôn tập theo môn học / đề cương của học sinh."""
    __tablename__ = "revision_notebooks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)           # VD: "Ôn thi Giữa kỳ 1 - Toán 12"
    subject = Column(String, default="Toán học")     # Môn học
    grade = Column(String, default="Lớp 12")         # Khối lớp
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Quan hệ
    user = relationship("User", foreign_keys=[user_id])
    documents = relationship("RevisionDocument", back_populates="notebook", cascade="all, delete-orphan")
    quizzes = relationship("RevisionQuiz", back_populates="notebook", cascade="all, delete-orphan")


class RevisionDocument(Base):
    """Tài liệu / Đề cương đã tải lên vào Notebook (PDF, Word, TXT)."""
    __tablename__ = "revision_documents"

    id = Column(Integer, primary_key=True, index=True)
    notebook_id = Column(Integer, ForeignKey("revision_notebooks.id"), nullable=False)
    filename = Column(String, nullable=False)        # Tên file gốc
    file_type = Column(String, default="pdf")        # pdf, docx, txt, note
    content_text = Column(Text, nullable=False)      # Toàn bộ nội dung văn bản đã trích xuất
    char_count = Column(Integer, default=0)          # Số lượng ký tự
    created_at = Column(DateTime, default=datetime.utcnow)

    notebook = relationship("RevisionNotebook", back_populates="documents")


class RevisionQuiz(Base):
    """Đề ôn tập / Bộ câu hỏi AI sinh ra theo chuẩn GDPT 2018."""
    __tablename__ = "revision_quizzes"

    id = Column(Integer, primary_key=True, index=True)
    notebook_id = Column(Integer, ForeignKey("revision_notebooks.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)           # VD: "Đề ôn tập Ma trận 4 Mức độ - Số học"
    quiz_type = Column(String, default="mcq_4")      # mcq_4 (Trắc nghiệm 4 lựa chọn), true_false (Đúng/Sai 2025), short_answer, flashcard
    total_questions = Column(Integer, default=10)
    
    # Cấu hình tỷ lệ ma trận nhận thức GDPT
    ratio_matrix = Column(JSON, default=lambda: {"recall": 40, "understanding": 30, "application": 20, "high_application": 10})
    
    # Danh sách câu hỏi chi tiết
    # Mỗi câu gồm: id, question, cognitive_level (Nhận biết/Thông hiểu/Vận dụng/Vận dụng cao), options/sub_items, correct_answer, explanation, citation
    questions = Column(JSON, nullable=False)

    duration_minutes = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    notebook = relationship("RevisionNotebook", back_populates="quizzes")
    attempts = relationship("RevisionAttempt", back_populates="quiz", cascade="all, delete-orphan")


class RevisionAttempt(Base):
    """Lịch sử làm bài và phân tích năng lực nhận thức của học sinh."""
    __tablename__ = "revision_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("revision_quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    user_answers = Column(JSON, nullable=False)      # Đáp án học sinh đã chọn {q_id: answer}
    score = Column(Integer, default=0)               # Thang điểm 10 hoặc 100
    correct_count = Column(Integer, default=0)
    total_questions = Column(Integer, default=0)
    
    # Phân tích năng lực theo 4 mức độ nhận thức GDPT
    # { "recall": {"correct": 4, "total": 4, "percent": 100}, "understanding": {...}, ... }
    competency_matrix = Column(JSON, nullable=True)
    
    time_spent_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("RevisionQuiz", back_populates="attempts")
    user = relationship("User", foreign_keys=[user_id])
