from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class AttendanceStatus(str, enum.Enum):
    present = "present"     # Có mặt đúng giờ
    absent = "absent"       # Vắng mặt
    late = "late"           # Đi muộn
    excused = "excused"     # Vắng có phép


class AttendanceMethod(str, enum.Enum):
    manual = "manual"           # Giáo viên tick tay
    fingerprint = "fingerprint"  # Arduino vân tay
    face = "face"               # Arduino khuôn mặt


class HomeworkStatus(str, enum.Enum):
    done = "done"           # Hoàn thành
    partial = "partial"     # Làm dở
    missing = "missing"     # Không làm


# ─── Thiết bị Arduino ─────────────────────────────────────────────────────────

class AttendanceDevice(Base):
    """Thiết bị Arduino điểm danh (vân tay / khuôn mặt)"""
    __tablename__ = "attendance_devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)               # VD: "Arduino Phòng A"
    device_token = Column(String, unique=True, nullable=False)  # Token xác thực (hashed)
    device_type = Column(String, nullable=False)        # "fingerprint" | "face"
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", foreign_keys=[teacher_id])
    biometrics = relationship("StudentBiometric", back_populates="device", cascade="all, delete-orphan")


# ─── Sinh trắc học học sinh ───────────────────────────────────────────────────

class StudentBiometric(Base):
    """Lưu fingerprint_id / face_id của học sinh trên từng thiết bị"""
    __tablename__ = "student_biometrics"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id = Column(Integer, ForeignKey("attendance_devices.id"), nullable=False)
    fingerprint_id = Column(String, nullable=True)  # ID trên thiết bị vân tay
    face_encoding = Column(String, nullable=True)   # Face hash / ID
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    device = relationship("AttendanceDevice", back_populates="biometrics")


# ─── Điểm danh ────────────────────────────────────────────────────────────────

class AttendanceRecord(Base):
    """Ghi nhận điểm danh từng học sinh / buổi học"""
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedule_items.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.absent)
    method = Column(SAEnum(AttendanceMethod), default=AttendanceMethod.manual)
    checkin_time = Column(DateTime, nullable=True)      # Timestamp chính xác khi đến
    note = Column(String, nullable=True)                # Ghi chú (VD: "Vắng do ốm")

    # Ai điểm danh
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)   # Teacher nếu manual
    device_id = Column(Integer, ForeignKey("attendance_devices.id"), nullable=True)  # Arduino nếu auto

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    schedule = relationship("ScheduleItem", foreign_keys=[schedule_id])
    student = relationship("User", foreign_keys=[student_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    device = relationship("AttendanceDevice", foreign_keys=[device_id])


# ─── Liên kết phụ huynh ───────────────────────────────────────────────────────

class ParentLink(Base):
    """Liên kết phụ huynh với học sinh — hỗ trợ 2 chế độ: Link PIN + Tài khoản"""
    __tablename__ = "parent_links"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Chế độ 1: Link PIN (không cần tài khoản)
    share_token = Column(String, unique=True, nullable=False)   # UUID token trong URL
    pin_code = Column(String, nullable=False)                    # Hashed PIN 6 số
    expires_at = Column(DateTime, nullable=True)                 # Null = không hết hạn

    # Chế độ 2: Tài khoản parent
    parent_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    parent_name = Column(String, nullable=True)    # VD: "Mẹ của An"
    parent_phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
    parent_user = relationship("User", foreign_keys=[parent_user_id])


# ─── 3 Loại Báo Cáo ───────────────────────────────────────────────────────────

class SessionReport(Base):
    """Báo cáo sau từng buổi học — nhận xét cá nhân từng học sinh"""
    __tablename__ = "session_reports"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedule_items.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    content = Column(String, nullable=True)             # Nhận xét tự do
    behavior_score = Column(Integer, nullable=True)     # 1–5: Thái độ học tập
    progress_score = Column(Integer, nullable=True)     # 1–5: Tiến bộ
    homework_status = Column(SAEnum(HomeworkStatus), nullable=True)
    strengths = Column(String, nullable=True)           # Điểm mạnh buổi này
    weaknesses = Column(String, nullable=True)          # Cần cải thiện

    is_visible_to_parent = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    schedule = relationship("ScheduleItem", foreign_keys=[schedule_id])
    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])


class WeeklyReport(Base):
    """Báo cáo tổng hợp theo tuần — auto-generate từ SessionReport"""
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    week_start = Column(Date, nullable=False)           # Thứ 2
    week_end = Column(Date, nullable=False)             # Chủ nhật
    total_sessions = Column(Integer, default=0)
    attended_sessions = Column(Integer, default=0)
    late_sessions = Column(Integer, default=0)
    avg_behavior_score = Column(Float, nullable=True)
    avg_progress_score = Column(Float, nullable=True)
    homework_completion_rate = Column(Float, nullable=True)  # 0.0–1.0

    summary = Column(String, nullable=True)             # Nhận xét tuần
    goals_next_week = Column(String, nullable=True)     # Mục tiêu tuần sau

    is_visible_to_parent = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])


class MonthlyReport(Base):
    """Báo cáo tổng hợp theo tháng — nhận xét tổng thể, thành tích"""
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    month = Column(Integer, nullable=False)     # 1–12
    year = Column(Integer, nullable=False)

    total_sessions = Column(Integer, default=0)
    attended_sessions = Column(Integer, default=0)
    attendance_rate = Column(Float, nullable=True)       # 0.0–1.0 (tỷ lệ chuyên cần)
    avg_behavior_score = Column(Float, nullable=True)
    avg_progress_score = Column(Float, nullable=True)

    overall_assessment = Column(String, nullable=True)       # Nhận xét tổng quan tháng
    achievements = Column(String, nullable=True)             # Thành tích nổi bật
    areas_for_improvement = Column(String, nullable=True)    # Cần cải thiện
    goals_next_month = Column(String, nullable=True)         # Mục tiêu tháng sau

    is_visible_to_parent = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])
