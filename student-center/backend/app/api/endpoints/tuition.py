from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.user import User
from app.models.tuition import TuitionRecord, TuitionStatus
from app.schemas.course import TuitionCreate, TuitionResponse, TuitionPayment
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.post("/", response_model=TuitionResponse)
def create_tuition_record(
    data: TuitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo phiếu học phí cho học sinh (Teacher/Admin)."""
    record = TuitionRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/student/{student_id}", response_model=List[TuitionResponse])
def get_student_tuition(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xem lịch sử học phí của học sinh."""
    # Học sinh chỉ xem được của chính mình
    if current_user.role.value == "student" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Bạn chỉ có thể xem học phí của mình")
    return db.query(TuitionRecord).filter(TuitionRecord.student_id == student_id).all()


@router.put("/{record_id}/pay", response_model=TuitionResponse)
def pay_tuition(
    record_id: int,
    data: TuitionPayment,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Ghi nhận thanh toán học phí hoặc đổi trạng thái (Teacher/Admin)."""
    record = db.query(TuitionRecord).filter(TuitionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Bản ghi học phí không tồn tại")
    
    if hasattr(data, "status") and data.status:
        record.status = TuitionStatus(data.status)
        if data.status == "paid":
            record.paid_amount = record.amount
            record.paid_at = datetime.utcnow()
    else:
        record.paid_amount += data.paid_amount
        if record.paid_amount >= record.amount:
            record.status = TuitionStatus.paid
            record.paid_at = datetime.utcnow()

    if data.note:
        record.note = data.note
    
    db.commit()
    db.refresh(record)
    return record


@router.get("/teacher/dashboard")
def teacher_dashboard_tuition(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    """Dashboard: Lấy toàn bộ giao dịch học phí liên quan đến giáo viên này (bao gồm cả offline class)."""
    from app.models.course import Course
    from app.models.user import TeacherStudentLink

    # 1. Tuitions linked to Courses this teacher teaches
    course_records = db.query(TuitionRecord)\
        .join(Course, TuitionRecord.course_id == Course.id)\
        .filter(Course.teacher_id == current_user.id)\
        .all()
        
    # 2. Tuitions for offline students (where course_id is None, but student is linked to teacher)
    offline_student_ids = [link.student_id for link in db.query(TeacherStudentLink).filter(TeacherStudentLink.teacher_id == current_user.id).all()]
    offline_records = []
    if offline_student_ids:
        offline_records = db.query(TuitionRecord)\
            .filter(TuitionRecord.course_id.is_(None), TuitionRecord.student_id.in_(offline_student_ids))\
            .all()

    # Combine and sort
    records = course_records + offline_records
    records.sort(key=lambda r: r.created_at, reverse=True)
    
    return [
        {
            "id": r.id,
            "student_name": r.student.full_name or f"Học sinh #{r.student_id}",
            "course_title": r.course.title if r.course else "Lớp Offline (Tổng hợp)",
            "amount": r.amount,
            "paid_amount": r.paid_amount,
            "status": r.status.value,
            "note": r.note or f"Học phí khoá {r.course.title}" if r.course else "Học phí",
            "billing_cycle": r.billing_cycle,
            "due_date": r.due_date.isoformat() if r.due_date else None,
            "paid_at": r.paid_at.isoformat() if r.paid_at else None
        }
        for r in records
    ]
