from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.assignment import Assignment

router = APIRouter()

# ═══════════════════════════════════
# Hệ thống rank/XP cho giáo viên
# ═══════════════════════════════════
TEACHER_RANKS = [
    {"name": "Trợ giảng",    "min_xp": 0,    "icon": "📖", "color": "#78716c"},
    {"name": "Giáo viên",    "min_xp": 50,   "icon": "✏️", "color": "#3b82f6"},
    {"name": "Chuyên gia",   "min_xp": 150,  "icon": "🎓", "color": "#8b5cf6"},
    {"name": "Thạc sĩ",     "min_xp": 300,  "icon": "🏆", "color": "#f59e0b"},
    {"name": "Tiến sĩ GS",  "min_xp": 600,  "icon": "⭐", "color": "#ef4444"},
]

def get_teacher_rank(xp: int) -> dict:
    rank = TEACHER_RANKS[0]
    for r in TEACHER_RANKS:
        if xp >= r["min_xp"]:
            rank = r
    next_rank = None
    for r in TEACHER_RANKS:
        if r["min_xp"] > xp:
            next_rank = r
            break
    return {
        "rank_name": rank["name"],
        "rank_icon": rank["icon"],
        "rank_color": rank["color"],
        "xp": xp,
        "next_rank": next_rank["name"] if next_rank else None,
        "xp_to_next": next_rank["min_xp"] - xp if next_rank else 0,
        "next_min_xp": next_rank["min_xp"] if next_rank else xp,
    }


@router.get("/teacher-stats")
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin"))
):
    # Tổng số khoá học
    active_courses = db.query(Course).filter(Course.teacher_id == current_user.id).count()

    # Tổng học sinh đã duyệt (enrolled)
    total_students = db.query(Enrollment).join(Course).filter(
        Course.teacher_id == current_user.id,
        Enrollment.status == "enrolled"
    ).count()

    # Học sinh đang chờ phê duyệt
    pending_students = db.query(Enrollment).join(Course).filter(
        Course.teacher_id == current_user.id,
        Enrollment.status == "pending"
    ).count()

    # Bài tập giáo viên đã tạo → mỗi bài = 10 XP
    assignment_count = db.query(Assignment).filter(Assignment.teacher_id == current_user.id).count()

    # XP từ DB hoặc tính từ số bài tập tạo ra
    teacher_xp = (current_user.exp_points or 0) + (assignment_count * 10)

    rank_info = get_teacher_rank(teacher_xp)

    return {
        "total_students": total_students,
        "pending_students": pending_students,
        "active_courses": active_courses,
        "assignment_count": assignment_count,
        **rank_info,
    }


@router.get("/student-stats")
def get_student_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student", "admin"))
):
    return {
        "exp": current_user.exp_points or 0,
        "student_id": f"#MND-{current_user.id * 1234}"
    }
