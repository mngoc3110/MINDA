from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import uuid, hashlib, asyncio, json
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.session_report import (
    AttendanceRecord, AttendanceDevice, StudentBiometric,
    AttendanceStatus, AttendanceMethod
)
from app.models.schedule import ScheduleItem
from app.core.security import get_current_user, require_role

router = APIRouter()

# ── Active WebSocket connections per schedule_id ──────────────────────────────
attendance_ws_connections: Dict[int, List[WebSocket]] = {}

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ManualCheckinRequest(BaseModel):
    schedule_id: int
    student_id: int
    status: AttendanceStatus = AttendanceStatus.present
    note: Optional[str] = None

class BatchAttendanceRequest(BaseModel):
    schedule_id: int
    records: List[dict]  # [{"student_id": 1, "status": "present", "note": ""}]

class ArduinoCheckinRequest(BaseModel):
    device_token: str
    schedule_id: int
    fingerprint_id: Optional[str] = None
    face_encoding: Optional[str] = None

class DeviceRegisterRequest(BaseModel):
    name: str
    device_type: str  # "fingerprint" | "face"

class BiometricRegisterRequest(BaseModel):
    student_id: int
    device_id: int
    fingerprint_id: Optional[str] = None
    face_encoding: Optional[str] = None

class AttendanceUpdateRequest(BaseModel):
    status: AttendanceStatus
    note: Optional[str] = None
    checkin_time: Optional[datetime] = None


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _format_record(r: AttendanceRecord) -> dict:
    return {
        "id": r.id,
        "schedule_id": r.schedule_id,
        "student_id": r.student_id,
        "student_name": r.student.full_name if r.student else "Học sinh",
        "student_avatar": r.student.avatar_url if r.student else None,
        "status": r.status.value,
        "method": r.method.value,
        "checkin_time": r.checkin_time.isoformat() if r.checkin_time else None,
        "note": r.note,
        "created_at": r.created_at.isoformat(),
    }


# ─── Manual Check-in (Teacher) ─────────────────────────────────────────────────

@router.post("/manual-checkin")
def manual_checkin(
    data: ManualCheckinRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Giáo viên check-in thủ công 1 học sinh khi đến lớp"""
    # Upsert: nếu đã có thì cập nhật
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id == data.schedule_id,
        AttendanceRecord.student_id == data.student_id,
    ).first()

    now = datetime.utcnow()
    if existing:
        existing.status = data.status
        existing.note = data.note
        existing.method = AttendanceMethod.manual
        existing.checkin_time = now
        existing.created_by_id = current_user.id
        existing.updated_at = now
        record = existing
    else:
        record = AttendanceRecord(
            schedule_id=data.schedule_id,
            student_id=data.student_id,
            status=data.status,
            method=AttendanceMethod.manual,
            checkin_time=now,
            note=data.note,
            created_by_id=current_user.id,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    # Push realtime tới các WebSocket đang kết nối
    formatted = _format_record(record)
    asyncio.create_task(_broadcast_checkin(data.schedule_id, formatted))

    return {"message": "Check-in thành công", "record": formatted}


@router.post("/batch")
def batch_attendance(
    data: BatchAttendanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Điểm danh hàng loạt — cuối buổi học (đánh dấu vắng những người chưa check-in)"""
    results = []
    for item in data.records:
        existing = db.query(AttendanceRecord).filter(
            AttendanceRecord.schedule_id == data.schedule_id,
            AttendanceRecord.student_id == item["student_id"],
        ).first()

        status = AttendanceStatus(item.get("status", "absent"))
        note = item.get("note", None)

        if existing:
            existing.status = status
            existing.note = note
            existing.updated_at = datetime.utcnow()
            results.append(existing.id)
        else:
            record = AttendanceRecord(
                schedule_id=data.schedule_id,
                student_id=item["student_id"],
                status=status,
                method=AttendanceMethod.manual,
                note=note,
                created_by_id=current_user.id,
            )
            db.add(record)
            results.append(None)

    db.commit()
    return {"message": f"Đã điểm danh {len(results)} học sinh", "count": len(results)}


@router.delete("/reset")
def reset_attendance(
    schedule_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Hoàn tác điểm danh cho 1 học sinh (xoá bản ghi điểm danh)"""
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id == schedule_id,
        AttendanceRecord.student_id == student_id,
    ).all()

    for r in records:
        db.delete(r)

    db.commit()

    asyncio.create_task(_broadcast_checkin(schedule_id, {
        "type": "attendance_reset",
        "student_id": student_id,
        "schedule_id": schedule_id
    }))

    return {"message": "Đã hoàn tác điểm danh", "student_id": student_id}


@router.put("/{record_id}")
def update_attendance(
    record_id: int,
    data: AttendanceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Sửa trạng thái điểm danh"""
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi điểm danh")
    record.status = data.status
    record.note = data.note
    if data.checkin_time:
        record.checkin_time = data.checkin_time
    record.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(record)
    return {"message": "Đã cập nhật", "record": _format_record(record)}


@router.get("/schedule/{schedule_id}")
def get_schedule_attendance(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Lấy danh sách điểm danh của 1 buổi học"""
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id == schedule_id
    ).all()
    return [_format_record(r) for r in records]


# ─── Arduino Endpoint ──────────────────────────────────────────────────────────

@router.post("/checkin")
async def arduino_checkin(
    data: ArduinoCheckinRequest,
    db: Session = Depends(get_db),
):
    """
    🔌 Arduino endpoint — Không cần JWT, xác thực bằng device_token.
    Gọi khi học sinh quét vân tay hoặc khuôn mặt thành công.
    """
    # Xác thực device_token
    hashed = _hash_token(data.device_token)
    device = db.query(AttendanceDevice).filter(
        AttendanceDevice.device_token == hashed,
        AttendanceDevice.is_active == True,
    ).first()
    if not device:
        raise HTTPException(status_code=401, detail="Thiết bị không hợp lệ hoặc đã bị vô hiệu hoá")

    # Cập nhật last_seen
    device.last_seen = datetime.utcnow()

    # Tìm học sinh theo biometric
    biometric = None
    if data.fingerprint_id:
        biometric = db.query(StudentBiometric).filter(
            StudentBiometric.device_id == device.id,
            StudentBiometric.fingerprint_id == data.fingerprint_id,
        ).first()
    elif data.face_encoding:
        biometric = db.query(StudentBiometric).filter(
            StudentBiometric.device_id == device.id,
            StudentBiometric.face_encoding == data.face_encoding,
        ).first()

    if not biometric:
        db.commit()
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh với thông tin sinh trắc này")

    student_id = biometric.student_id

    # Ghi điểm danh
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id == data.schedule_id,
        AttendanceRecord.student_id == student_id,
    ).first()

    method = AttendanceMethod.fingerprint if data.fingerprint_id else AttendanceMethod.face
    now = datetime.utcnow()

    if existing:
        existing.status = AttendanceStatus.present
        existing.method = method
        existing.checkin_time = now
        existing.device_id = device.id
        existing.updated_at = now
        record = existing
    else:
        record = AttendanceRecord(
            schedule_id=data.schedule_id,
            student_id=student_id,
            status=AttendanceStatus.present,
            method=method,
            checkin_time=now,
            device_id=device.id,
        )
        db.add(record)

    db.commit()
    db.refresh(record)

    # Push realtime
    formatted = _format_record(record)
    await _broadcast_checkin(data.schedule_id, formatted)

    return {"message": "Điểm danh thành công", "student_id": student_id, "record": formatted}


# ─── Device Management ─────────────────────────────────────────────────────────

@router.post("/devices")
def register_device(
    data: DeviceRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Đăng ký thiết bị Arduino mới, trả về raw token (chỉ hiện 1 lần)"""
    raw_token = str(uuid.uuid4())
    hashed = _hash_token(raw_token)

    device = AttendanceDevice(
        name=data.name,
        device_token=hashed,
        device_type=data.device_type,
        teacher_id=current_user.id,
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    return {
        "id": device.id,
        "name": device.name,
        "device_type": device.device_type,
        "device_token": raw_token,  # ⚠️ Chỉ hiển thị 1 lần duy nhất!
        "message": "Lưu token này ngay! Sẽ không hiển thị lại.",
    }


@router.get("/devices")
def list_devices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Danh sách thiết bị Arduino của giáo viên"""
    devices = db.query(AttendanceDevice).filter(
        AttendanceDevice.teacher_id == current_user.id
    ).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "device_type": d.device_type,
            "is_active": d.is_active,
            "last_seen": d.last_seen.isoformat() if d.last_seen else None,
            "created_at": d.created_at.isoformat(),
        }
        for d in devices
    ]


@router.put("/devices/{device_id}/toggle")
def toggle_device(
    device_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    device = db.query(AttendanceDevice).filter(
        AttendanceDevice.id == device_id,
        AttendanceDevice.teacher_id == current_user.id
    ).first()
    if not device:
        raise HTTPException(status_code=404, detail="Không tìm thấy thiết bị")
    device.is_active = not device.is_active
    db.commit()
    return {"is_active": device.is_active}


@router.post("/biometrics")
def register_biometric(
    data: BiometricRegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Đăng ký vân tay / khuôn mặt cho học sinh"""
    # Verify device belongs to teacher
    device = db.query(AttendanceDevice).filter(
        AttendanceDevice.id == data.device_id,
        AttendanceDevice.teacher_id == current_user.id,
    ).first()
    if not device:
        raise HTTPException(status_code=403, detail="Không có quyền truy cập thiết bị này")

    existing = db.query(StudentBiometric).filter(
        StudentBiometric.student_id == data.student_id,
        StudentBiometric.device_id == data.device_id,
    ).first()

    if existing:
        if data.fingerprint_id: existing.fingerprint_id = data.fingerprint_id
        if data.face_encoding: existing.face_encoding = data.face_encoding
    else:
        bio = StudentBiometric(
            student_id=data.student_id,
            device_id=data.device_id,
            fingerprint_id=data.fingerprint_id,
            face_encoding=data.face_encoding,
        )
        db.add(bio)
    db.commit()
    return {"message": "Đã đăng ký thông tin sinh trắc học"}


# ─── WebSocket Real-time ───────────────────────────────────────────────────────

async def _broadcast_checkin(schedule_id: int, data: dict):
    """Broadcast check-in event tới tất cả teacher đang xem phòng điểm danh"""
    connections = attendance_ws_connections.get(schedule_id, [])
    dead = []
    msg = json.dumps({"type": "student_arrived", **data}, ensure_ascii=False)
    for ws in connections:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections.remove(ws)


@router.websocket("/ws/{schedule_id}")
async def attendance_ws(
    websocket: WebSocket,
    schedule_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    WebSocket — Giáo viên kết nối để nhận real-time khi Arduino check-in học sinh.
    ws://host/api/attendance/ws/{schedule_id}?token=JWT_TOKEN
    """
    from jose import jwt, JWTError
    from app.core.config import settings
    from app.core.security import ALGORITHM

    await websocket.accept()

    # Xác thực token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or user.role.value not in ["teacher", "admin"]:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    # Đăng ký kết nối
    if schedule_id not in attendance_ws_connections:
        attendance_ws_connections[schedule_id] = []
    attendance_ws_connections[schedule_id].append(websocket)

    try:
        await websocket.send_text(json.dumps({"type": "connected", "schedule_id": schedule_id}))
        while True:
            await websocket.receive_text()  # Giữ kết nối sống
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        conns = attendance_ws_connections.get(schedule_id, [])
        if websocket in conns:
            conns.remove(websocket)
