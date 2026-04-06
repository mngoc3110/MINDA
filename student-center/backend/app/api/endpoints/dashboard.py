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

def get_teacher_rank(user: User, xp: int) -> dict:
    if user.email == "darber3110@gmail.com":
        return {
            "rank_name": "Tối Thượng (Mystic)",
            "rank_icon": "👑",
            "rank_color": "from-yellow-400 via-red-500 to-fuchsia-500",
            "xp": 99999999,
            "next_rank": None,
            "xp_to_next": 0,
            "next_min_xp": 99999999,
            "is_mystic": True
        }
        
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


# ═══════════════════════════════════
# Hệ thống rank/XP cho học sinh
# ═══════════════════════════════════
STUDENT_RANKS = [
    {"name": "Sơ cấp",    "min_xp": 0,    "abbr": "S1", "progress_color": "from-slate-400 to-slate-600"},
    {"name": "Tân binh",  "min_xp": 100,  "abbr": "T2", "progress_color": "from-green-400 to-emerald-600"},
    {"name": "Học bá",    "min_xp": 300,  "abbr": "H3", "progress_color": "from-blue-400 to-indigo-600"},
    {"name": "Học thần",  "min_xp": 800,  "abbr": "H4", "progress_color": "from-purple-400 to-pink-600"},
    {"name": "Thủ khoa",  "min_xp": 2000, "abbr": "T5", "progress_color": "from-amber-400 to-orange-600"},
]

def get_student_rank(user: User, xp: int) -> dict:
    if user.email == "darber3110@gmail.com":
        return {
            "rank_name": "Thần Thoại (Mystic)",
            "rank_abbr": "👑",
            "rank_color": "from-yellow-400 via-red-500 to-fuchsia-500",
            "xp": 99999999,
            "next_rank_name": None,
            "next_min_xp": 99999999,
            "xp_to_next": 0,
            "progress_percent": 100,
            "is_mystic": True
        }
        
    rank = STUDENT_RANKS[0]
    for r in STUDENT_RANKS:
        if xp >= r["min_xp"]:
            rank = r
            
    next_rank = None
    for r in STUDENT_RANKS:
        if r["min_xp"] > xp:
            next_rank = r
            break
            
    # Calculate progress % (từ mốc rank hiện tại tới mốc kế tiếp)
    current_min_xp = rank["min_xp"]
    if next_rank:
        range_xp = next_rank["min_xp"] - current_min_xp
        earned_in_range = xp - current_min_xp
        progress_percent = int((earned_in_range / range_xp) * 100)
    else:
        progress_percent = 100

    return {
        "rank_name": rank["name"],
        "rank_abbr": rank["abbr"],
        "rank_color": rank["progress_color"],
        "xp": xp,
        "next_rank_name": next_rank["name"] if next_rank else None,
        "next_min_xp": next_rank["min_xp"] if next_rank else xp,
        "xp_to_next": next_rank["min_xp"] - xp if next_rank else 0,
        "progress_percent": max(0, min(100, progress_percent))
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

    # XP từ DB (lưu ý create_assignment đã cộng sẵn 10 XP vào exp_points nên không cộng dồn nữa)
    teacher_xp = current_user.exp_points or 0

    rank_info = get_teacher_rank(current_user, teacher_xp)

    return {
        "exp": rank_info.get("xp", teacher_xp),
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
    current_xp = current_user.exp_points or 0
    rank_info = get_student_rank(current_user, current_xp)
    return {
        "exp": rank_info.get("xp", current_xp),
        "student_id": f"#MND-{current_user.id * 1234}",
        **rank_info
    }
