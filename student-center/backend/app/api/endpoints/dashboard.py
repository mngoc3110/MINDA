from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.course import Course, Enrollment

router = APIRouter()

@router.get("/teacher-stats")
def get_teacher_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    # Dem so khoa hoc
    active_courses = db.query(Course).filter(Course.teacher_id == current_user.id).count()
    
    # Dem so hoc sinh tham gia
    total_students = db.query(Enrollment).join(Course).filter(Course.teacher_id == current_user.id).count()
    
    return {
        "total_students": total_students,
        "active_courses": active_courses,
        "pending_assignments": None, # Sẽ được parse thành 0 ở frontend
        "teaching_hours": None
    }

@router.get("/student-stats")
def get_student_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role("student", "admin"))):
    
    return {
        "exp": current_user.exp_points,
        "student_id": f"#MND-{current_user.id * 1234}"
    }
