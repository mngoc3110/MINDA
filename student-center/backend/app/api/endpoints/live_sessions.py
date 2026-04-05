from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.live_session import LiveSession, SessionStatus
from app.core.security import get_current_user, require_role

router = APIRouter()

# Schema definitions inline for simplicity
class LiveSessionBase(BaseModel):
    course_id: int
    title: str
    scheduled_at: datetime
    duration_minutes: int = 60
    room_id: str

class LiveSessionCreate(LiveSessionBase):
    pass

class LiveSessionResponse(LiveSessionBase):
    id: int
    teacher_id: int
    status: SessionStatus
    created_at: datetime
    teacher_name: Optional[str] = None
    course_thumbnail_url: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[LiveSessionResponse])
def list_live_sessions(db: Session = Depends(get_db)):
    """Lấy danh sách các lớp học trực tuyến sắp tới (Sắp xếp theo thời gian)"""
    sessions = db.query(LiveSession).order_by(LiveSession.scheduled_at.asc()).all()
    
    # Pack additional informative metrics (Teacher Name, Thumbnail)
    results = []
    for s in sessions:
        data = {
            "id": s.id,
            "course_id": s.course_id,
            "teacher_id": s.teacher_id,
            "title": s.title,
            "scheduled_at": s.scheduled_at,
            "duration_minutes": s.duration_minutes,
            "room_id": s.room_id,
            "status": s.status,
            "created_at": s.created_at,
            "teacher_name": s.course.teacher.full_name if s.course and s.course.teacher else "Giáo Viên",
            "course_thumbnail_url": s.course.thumbnail_url if s.course else None
        }
        results.append(data)
    
    return results

@router.post("/", response_model=LiveSessionResponse)
def create_live_session(
    data: LiveSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Giáo viên hoặc Admin lên lịch tạo lớp học mới"""
    session = LiveSession(
        course_id=data.course_id,
        teacher_id=current_user.id,
        title=data.title,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        room_id=data.room_id,
        status=SessionStatus.scheduled
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "course_id": session.course_id,
        "teacher_id": session.teacher_id,
        "title": session.title,
        "scheduled_at": session.scheduled_at,
        "duration_minutes": session.duration_minutes,
        "room_id": session.room_id,
        "status": session.status,
        "created_at": session.created_at,
        "teacher_name": current_user.full_name
    }

@router.put("/{session_id}/status")
def update_session_status(
    session_id: int,
    status: str, # "live" | "ended"
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin"))
):
    """Đổi trạng thái lớp học (Cập nhật thành 'live' khi lớp bắt đầu)"""
    session = db.query(LiveSession).filter(LiveSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Lớp học không tồn tại")
    if session.teacher_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Chỉ giáo viên của lớp học mới được cấp quyền xử lý!")
        
    try:
        session.status = SessionStatus(status)
        db.commit()
        return {"message": f"Trạng thái lớp chuyển thành '{status}' thành công."}
    except ValueError:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
