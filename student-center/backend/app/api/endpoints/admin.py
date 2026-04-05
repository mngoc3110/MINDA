from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.schemas.user import UserResponse
from app.core.security import require_role

router = APIRouter()


@router.get("/users", response_model=List[UserResponse])
def list_all_users(
    role: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Liệt kê tất cả người dùng. Có thể lọc theo vai trò."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()


@router.put("/users/{user_id}/role")
def change_user_role(
    user_id: int,
    new_role: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Thay đổi vai trò người dùng (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    try:
        user.role = UserRole(new_role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Vai trò không hợp lệ")
    db.commit()
    return {"message": f"Đã đổi vai trò của {user.full_name} thành {new_role}"}


@router.delete("/users/{user_id}")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Vô hiệu hoá tài khoản người dùng."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    user.is_active = False
    db.commit()
    return {"message": f"Đã khoá tài khoản {user.email}"}


@router.get("/stats")
def get_system_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Thống kê tổng quan hệ thống."""
    return {
        "total_users": db.query(User).count(),
        "total_students": db.query(User).filter(User.role == UserRole.student).count(),
        "total_teachers": db.query(User).filter(User.role == UserRole.teacher).count(),
        "total_courses": db.query(Course).count(),
        "total_enrollments": db.query(Enrollment).count(),
    }


@router.get("/pending-teachers", response_model=List[UserResponse])
def list_pending_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Liệt kê các đơn đăng ký Giáo viên chưa được duyệt."""
    return db.query(User).filter(
        User.role == UserRole.teacher,
        User.is_active == False  # noqa: E712
    ).all()


@router.post("/users/{user_id}/approve")
def approve_teacher(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Phê duyệt đơn đăng ký Giáo viên."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    user.is_active = True
    db.commit()
    return {"message": f"Đã phê duyệt tài khoản giáo viên: {user.full_name}"}


@router.post("/users/{user_id}/reject")
def reject_teacher(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Từ chối đơn đăng ký Giáo viên (xóa tài khoản pending)."""
    user = db.query(User).filter(User.id == user_id, User.is_active == False).first()  # noqa: E712
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn đăng ký chờ duyệt")
    db.delete(user)
    db.commit()
    return {"message": f"Đã từ chối và xóa tài khoản: {user.email}"}
