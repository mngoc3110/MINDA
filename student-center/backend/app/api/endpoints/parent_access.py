from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from pydantic import BaseModel
import uuid, hashlib, secrets

from app.db.database import get_db
from app.models.user import User
from app.models.session_report import (
    ParentLink, SessionReport, WeeklyReport, MonthlyReport,
    AttendanceRecord, AttendanceStatus
)
from app.core.security import get_current_user, get_password_hash, verify_password

router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class GenerateLinkRequest(BaseModel):
    student_id: int
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    expires_days: Optional[int] = None  # None = không hết hạn

class VerifyPinRequest(BaseModel):
    pin_code: str  # 6 chữ số

class InviteParentRequest(BaseModel):
    student_id: int
    parent_email: str
    parent_name: Optional[str] = None


def _hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def _fmt_link(link: ParentLink) -> dict:
    return {
        "id": link.id,
        "student_id": link.student_id,
        "student_name": link.student.full_name if link.student else "",
        "share_token": link.share_token,
        "parent_name": link.parent_name,
        "parent_phone": link.parent_phone,
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
        "is_active": link.is_active,
        "has_parent_account": link.parent_user_id is not None,
        "created_at": link.created_at.isoformat(),
    }


# ─── Teacher: Tạo & Quản lý Link ──────────────────────────────────────────────

@router.post("/generate")
def generate_parent_link(
    data: GenerateLinkRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giáo viên tạo link chia sẻ + PIN 6 số cho phụ huynh"""
    share_token = str(uuid.uuid4()).replace("-", "")[:16]
    raw_pin = secrets.randbelow(900000) + 100000  # 100000–999999
    pin_str = str(raw_pin)

    expires_at = None
    if data.expires_days:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=data.expires_days)

    link = ParentLink(
        student_id=data.student_id,
        teacher_id=current_user.id,
        share_token=share_token,
        pin_code=_hash_pin(pin_str),
        expires_at=expires_at,
        parent_name=data.parent_name,
        parent_phone=data.parent_phone,
    )
    db.add(link)
    db.commit()
    db.refresh(link)

    return {
        **_fmt_link(link),
        "raw_pin": pin_str,  # ⚠️ Hiển thị PIN 1 lần duy nhất
        "share_url": f"/parent/{share_token}",
        "message": "Chia sẻ link và PIN này cho phụ huynh. PIN sẽ không hiển thị lại.",
    }


@router.get("/my-links")
def get_my_parent_links(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giáo viên xem danh sách tất cả link đã tạo"""
    links = db.query(ParentLink).filter(
        ParentLink.teacher_id == current_user.id
    ).order_by(ParentLink.created_at.desc()).all()
    return [_fmt_link(l) for l in links]


@router.delete("/{link_id}")
def revoke_parent_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Thu hồi quyền truy cập của phụ huynh"""
    link = db.query(ParentLink).filter(
        ParentLink.id == link_id,
        ParentLink.teacher_id == current_user.id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link")
    link.is_active = False
    db.commit()
    return {"message": "Đã thu hồi quyền truy cập"}


@router.post("/{link_id}/regenerate-pin")
def regenerate_pin(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tạo lại PIN mới cho link (khi PIN cũ bị lộ)"""
    link = db.query(ParentLink).filter(
        ParentLink.id == link_id,
        ParentLink.teacher_id == current_user.id,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy link")

    raw_pin = str(secrets.randbelow(900000) + 100000)
    link.pin_code = _hash_pin(raw_pin)
    db.commit()
    return {"raw_pin": raw_pin, "message": "PIN mới đã được tạo. Chia sẻ cho phụ huynh ngay."}


# ─── Public: Phụ huynh xác thực PIN ──────────────────────────────────────────

@router.post("/{token}/verify")
def verify_parent_pin(
    token: str,
    data: VerifyPinRequest,
    db: Session = Depends(get_db),
):
    """
    Phụ huynh nhập PIN để xác thực. Trả về session token tạm thời.
    Không cần JWT — endpoint hoàn toàn công khai.
    """
    link = db.query(ParentLink).filter(
        ParentLink.share_token == token,
        ParentLink.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link không hợp lệ hoặc đã hết hạn")

    # Kiểm tra thời hạn
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Link đã hết hạn. Vui lòng liên hệ giáo viên để nhận link mới.")

    # Xác thực PIN
    if _hash_pin(data.pin_code) != link.pin_code:
        raise HTTPException(status_code=401, detail="Mã PIN không đúng. Vui lòng thử lại.")

    # Tạo session token tạm (đơn giản: base64 của link_id + timestamp)
    import base64, time
    session_payload = f"{link.id}:{int(time.time())}:{token}"
    session_token = base64.b64encode(session_payload.encode()).decode()

    student = link.student
    teacher = link.teacher

    return {
        "session_token": session_token,
        "student_id": link.student_id,
        "student_name": student.full_name if student else "",
        "teacher_name": teacher.full_name if teacher else "",
        "parent_name": link.parent_name,
    }


# ─── Public: Phụ huynh xem báo cáo (sau khi xác thực) ───────────────────────

def _validate_parent_session(token: str, share_token: str, db: Session) -> ParentLink:
    """Xác thực session token của phụ huynh"""
    import base64, time
    try:
        payload = base64.b64decode(token.encode()).decode()
        parts = payload.split(":")
        link_id = int(parts[0])
        ts = int(parts[1])
        orig_token = parts[2]
    except Exception:
        raise HTTPException(status_code=401, detail="Session không hợp lệ")

    # Session hết hạn sau 24 giờ
    if time.time() - ts > 86400:
        raise HTTPException(status_code=401, detail="Phiên đăng nhập đã hết hạn. Vui lòng nhập PIN lại.")

    link = db.query(ParentLink).filter(
        ParentLink.id == link_id,
        ParentLink.share_token == share_token,
        ParentLink.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=401, detail="Link không hợp lệ")
    return link


@router.get("/{token}/info")
def get_parent_link_info(
    token: str,
    db: Session = Depends(get_db),
):
    """Lấy thông tin cơ bản của link (tên học sinh, trạng thái) — để hiển thị trước khi nhập PIN"""
    link = db.query(ParentLink).filter(
        ParentLink.share_token == token,
        ParentLink.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link không hợp lệ hoặc đã bị thu hồi")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Link đã hết hạn")

    return {
        "student_name": link.student.full_name if link.student else "",
        "teacher_name": link.teacher.full_name if link.teacher else "",
        "parent_name": link.parent_name,
        "expires_at": link.expires_at.isoformat() if link.expires_at else None,
    }


@router.get("/{token}/reports")
def get_parent_reports(
    token: str,
    db: Session = Depends(get_db),
):
    """Phụ huynh xem tất cả báo cáo của con (trực tiếp qua link, không cần PIN)"""
    link = db.query(ParentLink).filter(
        ParentLink.share_token == token,
        ParentLink.is_active == True,
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Link không hợp lệ hoặc đã bị thu hồi. Vui lòng liên hệ giáo viên để nhận link mới.")

    if link.expires_at and link.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Link đã hết hạn. Vui lòng liên hệ giáo viên để nhận link mới.")

    student_id = link.student_id

    session_reports = db.query(SessionReport).filter(
        SessionReport.student_id == student_id,
        SessionReport.is_visible_to_parent == True,
    ).order_by(SessionReport.created_at.desc()).limit(30).all()

    weekly_reports = db.query(WeeklyReport).filter(
        WeeklyReport.student_id == student_id,
        WeeklyReport.is_visible_to_parent == True,
    ).order_by(WeeklyReport.week_start.desc()).limit(8).all()

    monthly_reports = db.query(MonthlyReport).filter(
        MonthlyReport.student_id == student_id,
        MonthlyReport.is_visible_to_parent == True,
    ).order_by(MonthlyReport.year.desc(), MonthlyReport.month.desc()).limit(6).all()

    attendance = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == student_id,
    ).order_by(AttendanceRecord.checkin_time.desc()).limit(30).all()

    # Tính thống kê nhanh
    total_att = len(attendance)
    present_count = sum(1 for r in attendance if r.status in [AttendanceStatus.present, AttendanceStatus.late])

    from app.api.endpoints.reports import _fmt_session_report, _fmt_weekly_report, _fmt_monthly_report
    return {
        "student_name": link.student.full_name if link.student else "",
        "teacher_name": link.teacher.full_name if link.teacher else "",
        "stats": {
            "total_sessions": total_att,
            "attended_sessions": present_count,
            "attendance_rate": round(present_count / total_att * 100, 1) if total_att else 0,
        },
        "session_reports": [_fmt_session_report(r) for r in session_reports],
        "weekly_reports": [_fmt_weekly_report(r) for r in weekly_reports],
        "monthly_reports": [_fmt_monthly_report(r) for r in monthly_reports],
    }


@router.get("/{token}/attendance")
def get_parent_attendance(
    token: str,
    session_token: str = Query(...),
    db: Session = Depends(get_db),
):
    """Phụ huynh xem lịch sử điểm danh của con"""
    link = _validate_parent_session(session_token, token, db)

    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.student_id == link.student_id,
    ).order_by(AttendanceRecord.checkin_time.desc()).limit(50).all()

    return [
        {
            "id": r.id,
            "status": r.status.value,
            "method": r.method.value,
            "checkin_time": r.checkin_time.isoformat() if r.checkin_time else None,
            "note": r.note,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]
