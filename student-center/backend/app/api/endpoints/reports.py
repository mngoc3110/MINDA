from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.session_report import (
    SessionReport, WeeklyReport, MonthlyReport,
    AttendanceRecord, AttendanceStatus, HomeworkStatus
)
from app.models.schedule import ScheduleItem
from app.core.security import get_current_user, require_role

router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class SessionReportCreate(BaseModel):
    schedule_id: int
    student_id: int
    content: Optional[str] = None
    behavior_score: Optional[int] = None
    progress_score: Optional[int] = None
    homework_status: Optional[HomeworkStatus] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    is_visible_to_parent: bool = True

class WeeklyReportCreate(BaseModel):
    student_id: int
    week_start: date
    summary: Optional[str] = None
    goals_next_week: Optional[str] = None
    is_visible_to_parent: bool = True

class MonthlyReportCreate(BaseModel):
    student_id: int
    month: int
    year: int
    overall_assessment: Optional[str] = None
    achievements: Optional[str] = None
    areas_for_improvement: Optional[str] = None
    goals_next_month: Optional[str] = None
    is_visible_to_parent: bool = True


def _fmt_session_report(r: SessionReport) -> dict:
    return {
        "id": r.id,
        "schedule_id": r.schedule_id,
        "student_id": r.student_id,
        "student_name": r.student.full_name if r.student else "",
        "teacher_id": r.teacher_id,
        "teacher_name": r.teacher.full_name if r.teacher else "",
        "content": r.content,
        "behavior_score": r.behavior_score,
        "progress_score": r.progress_score,
        "homework_status": r.homework_status.value if r.homework_status else None,
        "strengths": r.strengths,
        "weaknesses": r.weaknesses,
        "is_visible_to_parent": r.is_visible_to_parent,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
    }


def _fmt_weekly_report(r: WeeklyReport) -> dict:
    return {
        "id": r.id,
        "student_id": r.student_id,
        "student_name": r.student.full_name if r.student else "",
        "teacher_id": r.teacher_id,
        "teacher_name": r.teacher.full_name if r.teacher else "",
        "week_start": r.week_start.isoformat(),
        "week_end": r.week_end.isoformat(),
        "total_sessions": r.total_sessions,
        "attended_sessions": r.attended_sessions,
        "late_sessions": r.late_sessions,
        "attendance_rate": round(r.attended_sessions / r.total_sessions, 2) if r.total_sessions else 0,
        "avg_behavior_score": r.avg_behavior_score,
        "avg_progress_score": r.avg_progress_score,
        "homework_completion_rate": r.homework_completion_rate,
        "summary": r.summary,
        "goals_next_week": r.goals_next_week,
        "is_visible_to_parent": r.is_visible_to_parent,
        "created_at": r.created_at.isoformat(),
    }


def _fmt_monthly_report(r: MonthlyReport) -> dict:
    return {
        "id": r.id,
        "student_id": r.student_id,
        "student_name": r.student.full_name if r.student else "",
        "teacher_id": r.teacher_id,
        "teacher_name": r.teacher.full_name if r.teacher else "",
        "month": r.month,
        "year": r.year,
        "total_sessions": r.total_sessions,
        "attended_sessions": r.attended_sessions,
        "attendance_rate": r.attendance_rate,
        "avg_behavior_score": r.avg_behavior_score,
        "avg_progress_score": r.avg_progress_score,
        "overall_assessment": r.overall_assessment,
        "achievements": r.achievements,
        "areas_for_improvement": r.areas_for_improvement,
        "goals_next_month": r.goals_next_month,
        "is_visible_to_parent": r.is_visible_to_parent,
        "created_at": r.created_at.isoformat(),
    }


# ─── Session Reports (Per-Lesson) ─────────────────────────────────────────────

@router.post("/session")
def upsert_session_report(
    data: SessionReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo hoặc cập nhật báo cáo sau buổi học cho 1 học sinh"""
    existing = db.query(SessionReport).filter(
        SessionReport.schedule_id == data.schedule_id,
        SessionReport.student_id == data.student_id,
        SessionReport.teacher_id == current_user.id,
    ).first()

    if existing:
        for k, v in data.dict(exclude={"schedule_id", "student_id"}).items():
            setattr(existing, k, v)
        existing.updated_at = datetime.utcnow()
        report = existing
    else:
        report = SessionReport(
            schedule_id=data.schedule_id,
            student_id=data.student_id,
            teacher_id=current_user.id,
            **data.dict(exclude={"schedule_id", "student_id"})
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return _fmt_session_report(report)


@router.get("/session/schedule/{schedule_id}")
def get_session_reports_by_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tất cả báo cáo của 1 buổi học (tất cả học sinh)"""
    reports = db.query(SessionReport).filter(
        SessionReport.schedule_id == schedule_id,
        SessionReport.teacher_id == current_user.id,
    ).all()
    return [_fmt_session_report(r) for r in reports]


@router.get("/session/{schedule_id}/student/{student_id}")
def get_session_report_for_student(
    schedule_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Báo cáo buổi cụ thể của 1 học sinh — giáo viên hoặc chính học sinh xem"""
    query = db.query(SessionReport).filter(
        SessionReport.schedule_id == schedule_id,
        SessionReport.student_id == student_id,
    )
    if current_user.role.value == "student":
        if current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Không có quyền xem")
        query = query.filter(SessionReport.is_visible_to_parent == True)
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Chưa có báo cáo cho buổi này")
    return _fmt_session_report(report)


@router.get("/my-session-reports")
def get_my_session_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 20,
):
    """Học sinh xem tất cả báo cáo buổi học của mình"""
    reports = db.query(SessionReport).filter(
        SessionReport.student_id == current_user.id,
        SessionReport.is_visible_to_parent == True,
    ).order_by(SessionReport.created_at.desc()).offset(skip).limit(limit).all()
    return [_fmt_session_report(r) for r in reports]


def _get_student_schedules(db: Session, student_id: int, start_dt: datetime, end_dt: datetime):
    """
    Lấy danh sách các buổi học CỤ THỂ của học sinh này trong khoảng thời gian [start_dt, end_dt].
    Lọc bỏ các buổi học của học sinh khác và gom nhóm các buổi trùng slot.
    """
    student = db.query(User).filter(User.id == student_id).first()
    student_course_ids = [c.id for c in student.courses] if student and hasattr(student, 'courses') and student.courses else []

    all_period_schedules = db.query(ScheduleItem).filter(
        ScheduleItem.start_time >= start_dt,
        ScheduleItem.start_time <= end_dt,
    ).all()

    matching_schedules = []
    for sch in all_period_schedules:
        if sch.student_id == student_id:
            matching_schedules.append(sch)
        elif sch.course_id and sch.course_id in student_course_ids:
            matching_schedules.append(sch)
        else:
            has_record = db.query(AttendanceRecord).filter(
                AttendanceRecord.schedule_id == sch.id,
                AttendanceRecord.student_id == student_id
            ).first()
            if has_record:
                matching_schedules.append(sch)
            else:
                has_report = db.query(SessionReport).filter(
                    SessionReport.schedule_id == sch.id,
                    SessionReport.student_id == student_id
                ).first()
                if has_report:
                    matching_schedules.append(sch)

    # Gom nhóm theo (title, start_time ± 2 phút) để các lịch nhóm được đếm là 1 buổi
    unique_schedules = []
    seen_keys = set()
    for sch in matching_schedules:
        time_key = sch.start_time.strftime("%Y-%m-%d %H:%M")
        key = f"{sch.title}_{time_key}"
        if key not in seen_keys:
            seen_keys.add(key)
            unique_schedules.append(sch)

    return unique_schedules


# ─── Weekly Reports ────────────────────────────────────────────────────────────

@router.post("/weekly/auto-generate")
def auto_generate_weekly(
    student_id: int,
    week_start_str: str = Query(..., description="YYYY-MM-DD (Thứ 2)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """
    Tự động tổng hợp báo cáo tuần từ dữ liệu điểm danh + báo cáo buổi.
    Giáo viên có thể chỉnh sửa sau khi generate.
    """
    week_start = datetime.strptime(week_start_str, "%Y-%m-%d").date()
    week_end = week_start + timedelta(days=6)
    week_start_dt = datetime.combine(week_start, datetime.min.time())
    week_end_dt = datetime.combine(week_end, datetime.max.time())

    # Lấy các buổi học CỤ THỂ của học sinh này trong tuần
    schedules = _get_student_schedules(db, student_id, week_start_dt, week_end_dt)
    schedule_ids = [s.id for s in schedules]

    # Tính thống kê điểm danh
    all_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id.in_(schedule_ids),
        AttendanceRecord.student_id == student_id,
    ).all() if schedule_ids else []

    total = len(schedules)
    attended = sum(1 for r in all_records if r.status == AttendanceStatus.present)
    late = sum(1 for r in all_records if r.status == AttendanceStatus.late)

    # Tính điểm TB từ SessionReport
    session_reports = db.query(SessionReport).filter(
        SessionReport.schedule_id.in_(schedule_ids),
        SessionReport.student_id == student_id,
    ).all() if schedule_ids else []

    behavior_scores = [r.behavior_score for r in session_reports if r.behavior_score]
    progress_scores = [r.progress_score for r in session_reports if r.progress_score]
    hw_done = sum(1 for r in session_reports if r.homework_status and r.homework_status.value == "done")
    hw_total = len([r for r in session_reports if r.homework_status])

    avg_behavior = round(sum(behavior_scores) / len(behavior_scores), 2) if behavior_scores else None
    avg_progress = round(sum(progress_scores) / len(progress_scores), 2) if progress_scores else None
    hw_rate = round(hw_done / hw_total, 2) if hw_total else None

    # Upsert weekly report
    existing = db.query(WeeklyReport).filter(
        WeeklyReport.student_id == student_id,
        WeeklyReport.teacher_id == current_user.id,
        WeeklyReport.week_start == week_start,
    ).first()

    if existing:
        existing.total_sessions = total
        existing.attended_sessions = attended
        existing.late_sessions = late
        existing.avg_behavior_score = avg_behavior
        existing.avg_progress_score = avg_progress
        existing.homework_completion_rate = hw_rate
        existing.updated_at = datetime.utcnow()
        report = existing
    else:
        report = WeeklyReport(
            student_id=student_id,
            teacher_id=current_user.id,
            week_start=week_start,
            week_end=week_end,
            total_sessions=total,
            attended_sessions=attended,
            late_sessions=late,
            avg_behavior_score=avg_behavior,
            avg_progress_score=avg_progress,
            homework_completion_rate=hw_rate,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return _fmt_weekly_report(report)


@router.post("/weekly")
def upsert_weekly_report(
    data: WeeklyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo/cập nhật nhận xét tuần (nội dung giáo viên thêm thủ công)"""
    week_end = data.week_start + timedelta(days=6)
    existing = db.query(WeeklyReport).filter(
        WeeklyReport.student_id == data.student_id,
        WeeklyReport.teacher_id == current_user.id,
        WeeklyReport.week_start == data.week_start,
    ).first()

    if existing:
        existing.summary = data.summary
        existing.goals_next_week = data.goals_next_week
        existing.is_visible_to_parent = data.is_visible_to_parent
        existing.updated_at = datetime.utcnow()
        report = existing
    else:
        report = WeeklyReport(
            student_id=data.student_id,
            teacher_id=current_user.id,
            week_start=data.week_start,
            week_end=week_end,
            summary=data.summary,
            goals_next_week=data.goals_next_week,
            is_visible_to_parent=data.is_visible_to_parent,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return _fmt_weekly_report(report)


@router.get("/weekly/{student_id}")
def get_weekly_reports(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Danh sách báo cáo tuần của học sinh"""
    query = db.query(WeeklyReport).filter(WeeklyReport.student_id == student_id)
    if current_user.role.value == "student":
        if current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Không có quyền xem")
        query = query.filter(WeeklyReport.is_visible_to_parent == True)
    return [_fmt_weekly_report(r) for r in query.order_by(WeeklyReport.week_start.desc()).all()]


# ─── Monthly Reports ───────────────────────────────────────────────────────────

@router.post("/monthly/auto-generate")
def auto_generate_monthly(
    student_id: int,
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tự động tổng hợp báo cáo tháng từ điểm danh + báo cáo buổi"""
    from calendar import monthrange
    _, last_day = monthrange(year, month)
    month_start = datetime(year, month, 1)
    month_end = datetime(year, month, last_day, 23, 59, 59)

    schedules = _get_student_schedules(db, student_id, month_start, month_end)
    schedule_ids = [s.id for s in schedules]

    all_records = db.query(AttendanceRecord).filter(
        AttendanceRecord.schedule_id.in_(schedule_ids),
        AttendanceRecord.student_id == student_id,
    ).all() if schedule_ids else []

    total = len(schedules)
    attended = sum(1 for r in all_records if r.status in [AttendanceStatus.present, AttendanceStatus.late])
    attendance_rate = round(attended / total, 2) if total else 0

    session_reports = db.query(SessionReport).filter(
        SessionReport.schedule_id.in_(schedule_ids),
        SessionReport.student_id == student_id,
    ).all() if schedule_ids else []

    behavior_scores = [r.behavior_score for r in session_reports if r.behavior_score]
    progress_scores = [r.progress_score for r in session_reports if r.progress_score]
    avg_behavior = round(sum(behavior_scores) / len(behavior_scores), 2) if behavior_scores else None
    avg_progress = round(sum(progress_scores) / len(progress_scores), 2) if progress_scores else None

    existing = db.query(MonthlyReport).filter(
        MonthlyReport.student_id == student_id,
        MonthlyReport.teacher_id == current_user.id,
        MonthlyReport.month == month,
        MonthlyReport.year == year,
    ).first()

    if existing:
        existing.total_sessions = total
        existing.attended_sessions = attended
        existing.attendance_rate = attendance_rate
        existing.avg_behavior_score = avg_behavior
        existing.avg_progress_score = avg_progress
        existing.updated_at = datetime.utcnow()
        report = existing
    else:
        report = MonthlyReport(
            student_id=student_id,
            teacher_id=current_user.id,
            month=month,
            year=year,
            total_sessions=total,
            attended_sessions=attended,
            attendance_rate=attendance_rate,
            avg_behavior_score=avg_behavior,
            avg_progress_score=avg_progress,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return _fmt_monthly_report(report)


@router.post("/monthly")
def upsert_monthly_report(
    data: MonthlyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    existing = db.query(MonthlyReport).filter(
        MonthlyReport.student_id == data.student_id,
        MonthlyReport.teacher_id == current_user.id,
        MonthlyReport.month == data.month,
        MonthlyReport.year == data.year,
    ).first()

    if existing:
        existing.overall_assessment = data.overall_assessment
        existing.achievements = data.achievements
        existing.areas_for_improvement = data.areas_for_improvement
        existing.goals_next_month = data.goals_next_month
        existing.is_visible_to_parent = data.is_visible_to_parent
        existing.updated_at = datetime.utcnow()
        report = existing
    else:
        report = MonthlyReport(
            student_id=data.student_id,
            teacher_id=current_user.id,
            month=data.month,
            year=data.year,
            overall_assessment=data.overall_assessment,
            achievements=data.achievements,
            areas_for_improvement=data.areas_for_improvement,
            goals_next_month=data.goals_next_month,
            is_visible_to_parent=data.is_visible_to_parent,
        )
        db.add(report)

    db.commit()
    db.refresh(report)
    return _fmt_monthly_report(report)


@router.get("/monthly/{student_id}")
def get_monthly_reports(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MonthlyReport).filter(MonthlyReport.student_id == student_id)
    if current_user.role.value == "student":
        if current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Không có quyền xem")
        query = query.filter(MonthlyReport.is_visible_to_parent == True)
    return [_fmt_monthly_report(r) for r in query.order_by(MonthlyReport.year.desc(), MonthlyReport.month.desc()).all()]


@router.get("/monthly/{student_id}/{year}/{month}")
def get_monthly_report_detail(
    student_id: int,
    year: int,
    month: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MonthlyReport).filter(
        MonthlyReport.student_id == student_id,
        MonthlyReport.year == year,
        MonthlyReport.month == month,
    )
    if current_user.role.value == "student":
        if current_user.id != student_id:
            raise HTTPException(status_code=403, detail="Không có quyền xem")
        query = query.filter(MonthlyReport.is_visible_to_parent == True)
    report = query.first()
    if not report:
        raise HTTPException(status_code=404, detail="Chưa có báo cáo tháng này")
    return _fmt_monthly_report(report)


@router.get("/student/{student_id}/all")
def get_all_reports(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Tất cả loại báo cáo của 1 học sinh (dùng cho dashboard)"""
    is_student = current_user.role.value == "student"
    if is_student and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Không có quyền xem")

    vis_filter = True if not is_student else SessionReport.is_visible_to_parent == True

    session_reports = db.query(SessionReport).filter(
        SessionReport.student_id == student_id,
    ).filter(vis_filter if not is_student else SessionReport.is_visible_to_parent == True
    ).order_by(SessionReport.created_at.desc()).limit(10).all()

    weekly_reports = db.query(WeeklyReport).filter(
        WeeklyReport.student_id == student_id,
    ).filter(vis_filter if not is_student else WeeklyReport.is_visible_to_parent == True
    ).order_by(WeeklyReport.week_start.desc()).limit(4).all()

    monthly_reports = db.query(MonthlyReport).filter(
        MonthlyReport.student_id == student_id,
    ).filter(vis_filter if not is_student else MonthlyReport.is_visible_to_parent == True
    ).order_by(MonthlyReport.year.desc(), MonthlyReport.month.desc()).limit(3).all()

    return {
        "session_reports": [_fmt_session_report(r) for r in session_reports],
        "weekly_reports": [_fmt_weekly_report(r) for r in weekly_reports],
        "monthly_reports": [_fmt_monthly_report(r) for r in monthly_reports],
    }
