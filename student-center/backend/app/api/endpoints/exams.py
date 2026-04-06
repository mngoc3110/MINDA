from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.user import User
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.schemas.course import ExamCreate, ExamResponse, QuestionCreate, QuestionResponse, ExamSubmit, ExamSubmissionResponse
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.post("/courses/{course_id}/exams", response_model=ExamResponse)
def create_exam(
    course_id: int,
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo đề kiểm tra (Teacher/Admin)."""
    exam = Exam(**data.model_dump(), course_id=course_id, teacher_id=current_user.id)
    db.add(exam)
    
    # Cộng 10 EXP cho giáo viên
    current_user.exp_points = (current_user.exp_points or 0) + 10
    
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/courses/{course_id}/exams", response_model=List[ExamResponse])
def list_exams(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Exam).filter(Exam.course_id == course_id).all()


# ═══════════════ CÂU HỎI ═══════════════

@router.post("/exams/{exam_id}/questions", response_model=QuestionResponse)
def add_question(
    exam_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Thêm câu hỏi vào đề thi (Teacher/Admin)."""
    question = ExamQuestion(**data.model_dump(), exam_id=exam_id)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@router.get("/exams/{exam_id}/questions", response_model=List[QuestionResponse])
def list_questions(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách câu hỏi. Học sinh không thấy đáp án đúng."""
    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    if current_user.role.value == "student":
        # Ẩn đáp án đúng khi trả về cho học sinh
        for q in questions:
            q.correct_answer = None
    return questions


# ═══════════════ LÀM BÀI THI ═══════════════

@router.post("/exams/{exam_id}/submit", response_model=ExamSubmissionResponse)
def submit_exam(
    exam_id: int,
    data: ExamSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    """Học sinh nộp bài kiểm tra. Tự động chấm điểm trắc nghiệm."""
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Đề thi không tồn tại")
    
    # Tự động chấm điểm trắc nghiệm
    questions = db.query(ExamQuestion).filter(ExamQuestion.exam_id == exam_id).all()
    total_score = 0
    for q in questions:
        student_answer = data.answers.get(str(q.id))
        if student_answer and q.correct_answer and student_answer.strip().lower() == q.correct_answer.strip().lower():
            total_score += q.points
    
    submission = ExamSubmission(
        exam_id=exam_id,
        student_id=current_user.id,
        answers=data.answers,
        score=total_score,
        submitted_at=datetime.utcnow(),
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/exams/{exam_id}/submissions", response_model=List[ExamSubmissionResponse])
def list_exam_submissions(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Xem danh sách bài làm (Teacher/Admin)."""
    return db.query(ExamSubmission).filter(ExamSubmission.exam_id == exam_id).all()
