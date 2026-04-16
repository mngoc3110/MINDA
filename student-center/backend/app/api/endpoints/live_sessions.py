from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
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

class LiveSessionCreate(BaseModel):
    course_id: Optional[int] = None
    title: str
    scheduled_at: datetime
    duration_minutes: int = 60
    room_id: str

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
    from app.models.course import Course
    
    actual_course_id = data.course_id
    
    # Verify course exists
    if actual_course_id:
        course = db.query(Course).filter(Course.id == actual_course_id).first()
        if not course:
            actual_course_id = None
            
    # If no valid course_id provided, find one belonging to teacher or create a dummy one
    if not actual_course_id:
        course = db.query(Course).filter(Course.teacher_id == current_user.id).first()
        if course:
            actual_course_id = course.id
        else:
            # Create a fallback dummy course for Quick Live
            new_course = Course(
                title=f"Lớp học chung của {current_user.full_name}",
                description="Khoá học mặc định cho các phiên Quick Live.",
                price=0,
                teacher_id=current_user.id,
                thumbnail_url="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
            )
            db.add(new_course)
            db.commit()
            db.refresh(new_course)
            actual_course_id = new_course.id

    session = LiveSession(
        course_id=actual_course_id,
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

from jose import jwt
import os
import asyncio
from app.core.security import ALGORITHM
from app.core.config import settings
from app.core.drive_service import upload_local_file_to_drive

@router.websocket("/{session_id}/record")
async def record_session(websocket: WebSocket, session_id: str, token: str, db: Session = Depends(get_db)):
    await websocket.accept()
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or user.role.value not in ["teacher", "admin"]:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = f"{temp_dir}/recording_{session_id}_{user.id}.webm"
    
    try:
        with open(file_path, "wb") as f:
            while True:
                data = await websocket.receive()
                if "bytes" in data:
                    f.write(data["bytes"])
                elif "text" in data:
                    if data["text"] == '{"type":"EOF"}':
                        break
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Record error: {e}")
        
    try:
        await websocket.close()
    except:
        pass
    
    def background_upload():
        try:
            filename = f"Lop_Hoc_Recording_{session_id}.webm"
            print(f"Bắt đầu upload {filename} lên Drive của {user.username}...")
            url = upload_local_file_to_drive(file_path, filename, "video/webm", user)
            print(f"✅ Đã tải Recording {session_id} lên mạng: {url}")
        except Exception as e:
            print(f"❌ Upload Recording Error: {e}")
            if os.path.exists(file_path):
                os.remove(file_path)

    asyncio.get_event_loop().run_in_executor(None, background_upload)

# ── Screen Share relay (ReplayKit → Students) ──────────────────────────────────
# Dict lưu danh sách viewer WebSocket theo room_id
screen_viewers: dict[str, list[WebSocket]] = {}
screen_sources: dict[str, WebSocket] = {}

@router.websocket("/{room_id}/screen-share")
async def screen_share_ws(websocket: WebSocket, room_id: str, token: str = "", role: str = "viewer"):
    """
    WebSocket endpoint for screen sharing.
    - role=source (from iOS Broadcast Extension): sends JPEG frames
    - role=viewer (from student browser): receives JPEG frames
    """
    await websocket.accept()

    # Authenticate
    if token:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
        except Exception:
            await websocket.close(code=1008)
            return
    else:
        await websocket.close(code=1008)
        return

    if role == "source":
        # Teacher/Extension is the screen source
        screen_sources[room_id] = websocket
        if room_id not in screen_viewers:
            screen_viewers[room_id] = []

        try:
            while True:
                data = await websocket.receive()
                # Broadcast to all viewers
                viewers = screen_viewers.get(room_id, [])
                dead = []
                for v in viewers:
                    try:
                        if "bytes" in data:
                            await v.send_bytes(data["bytes"])
                        elif "text" in data:
                            await v.send_text(data["text"])
                    except Exception:
                        dead.append(v)
                # Clean up disconnected viewers
                for d in dead:
                    viewers.remove(d)
        except WebSocketDisconnect:
            pass
        except Exception as e:
            print(f"Screen source error: {e}")
        finally:
            screen_sources.pop(room_id, None)
            # Notify viewers that sharing stopped
            for v in screen_viewers.get(room_id, []):
                try:
                    await v.send_text('{"type":"screen_stop"}')
                except:
                    pass

    else:
        # Student viewer
        if room_id not in screen_viewers:
            screen_viewers[room_id] = []
        screen_viewers[room_id].append(websocket)

        try:
            while True:
                # Keep connection alive, viewer only receives
                await websocket.receive_text()
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
        finally:
            if room_id in screen_viewers and websocket in screen_viewers[room_id]:
                screen_viewers[room_id].remove(websocket)
