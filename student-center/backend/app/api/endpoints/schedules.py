from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment, EnrollmentStatus
from app.models.schedule import ScheduleItem, ScheduleType
from app.schemas.schedule import ScheduleItemCreate, ScheduleItemUpdate, ScheduleItemResponse
from app.core.security import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ScheduleItemResponse])
def get_schedules(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Lấy các sự kiện lịch của user
    schedules = []
    
    # 1. Lấy lịch cá nhân của user
    personal_schedules = db.query(ScheduleItem).filter(
        ScheduleItem.user_id == current_user.id,
        ScheduleItem.type == ScheduleType.personal
    ).all()
    schedules.extend(personal_schedules)
    
    # 2. Lấy lịch của các lớp
    if current_user.role == UserRole.teacher:
        # Lịch của các lớp do giáo viên dạy
        taught_courses = db.query(Course.id).filter(Course.teacher_id == current_user.id).all()
        course_ids = [c[0] for c in taught_courses]
        
        if course_ids:
            course_schedules = db.query(ScheduleItem).filter(
                ScheduleItem.course_id.in_(course_ids),
                ScheduleItem.type == ScheduleType.course_session
            ).all()
            schedules.extend(course_schedules)
            
    elif current_user.role == UserRole.student:
        # Lịch của các lớp sinh viên đã đăng ký
        enrolled_courses = db.query(Enrollment.course_id).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.active
        ).all()
        course_ids = [e[0] for e in enrolled_courses]
        
        if course_ids:
            course_schedules = db.query(ScheduleItem).filter(
                ScheduleItem.course_id.in_(course_ids),
                ScheduleItem.type == ScheduleType.course_session
            ).all()
            schedules.extend(course_schedules)
            
    elif current_user.role == UserRole.admin:
        # Admin thấy hết lịch cá nhân của mình và tất cả lịch lớp
        all_course_schedules = db.query(ScheduleItem).filter(ScheduleItem.type == ScheduleType.course_session).all()
        schedules.extend(all_course_schedules)

    # Thêm thông tin tên khoá học vào response
    for s in schedules:
        if s.course_id:
            s.course_title = s.course.title if s.course else None

    return schedules

@router.post("/", response_model=ScheduleItemResponse)
def create_schedule(
    schedule_in: ScheduleItemCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if schedule_in.type == ScheduleType.course_session:
        if current_user.role not in [UserRole.teacher, UserRole.admin]:
            raise HTTPException(status_code=403, detail="Chỉ giáo viên/admin mới được tạo lịch lớp học.")
        
        if not schedule_in.course_id:
            raise HTTPException(status_code=400, detail="Vui lòng chọn lớp học cho sự kiện này.")
            
        if current_user.role == UserRole.teacher:
            # Kiểm tra giáo viên có dạy lớp này không
            course = db.query(Course).filter(Course.id == schedule_in.course_id, Course.teacher_id == current_user.id).first()
            if not course:
                raise HTTPException(status_code=403, detail="Bạn không có quyền tạo lịch cho lớp này.")
    
    new_schedule = ScheduleItem(
        **schedule_in.dict(),
        user_id=current_user.id
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    if new_schedule.course_id:
        new_schedule.course_title = new_schedule.course.title
        
    return new_schedule

@router.put("/{schedule_id}", response_model=ScheduleItemResponse)
def update_schedule(
    schedule_id: int, 
    schedule_in: ScheduleItemUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_schedule = db.query(ScheduleItem).filter(ScheduleItem.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại.")
        
    # Check permission
    if db_schedule.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Không có quyền chỉnh sửa.")

    update_data = schedule_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
        
    db.commit()
    db.refresh(db_schedule)
    
    if db_schedule.course_id:
        db_schedule.course_title = db_schedule.course.title
        
    return db_schedule

@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    db_schedule = db.query(ScheduleItem).filter(ScheduleItem.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại.")
        
    # Check permission
    if db_schedule.user_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Không có quyền xoá.")
        
    db.delete(db_schedule)
    db.commit()
    return {"message": "Đã xoá sự kiện thành công."}
