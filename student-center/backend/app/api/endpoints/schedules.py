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
    
    # 1. Lấy lịch cá nhân / học sinh được phân công
    if current_user.role == UserRole.student:
        # Lịch cá nhân của student
        personal_schedules = db.query(ScheduleItem).filter(
            ScheduleItem.user_id == current_user.id,
            ScheduleItem.type == ScheduleType.personal
        ).all()
        schedules.extend(personal_schedules)
        
        # Lịch học sinh cụ thể được gán riêng cho học sinh này
        student_assigned_schedules = db.query(ScheduleItem).filter(
            ScheduleItem.student_id == current_user.id,
            ScheduleItem.type == ScheduleType.student
        ).all()
        schedules.extend(student_assigned_schedules)
        
    elif current_user.role == UserRole.teacher:
        # Lấy lịch cá nhân và lịch học sinh cụ thể do giáo viên này tạo
        teacher_schedules = db.query(ScheduleItem).filter(
            ScheduleItem.user_id == current_user.id,
            ScheduleItem.type.in_([ScheduleType.personal, ScheduleType.student])
        ).all()
        schedules.extend(teacher_schedules)
        
    elif current_user.role == UserRole.admin:
        # Admin thấy hết lịch cá nhân của mình
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
        # Admin thấy hết tất cả lịch lớp và lịch học sinh cụ thể
        all_other_schedules = db.query(ScheduleItem).filter(
            ScheduleItem.type.in_([ScheduleType.course_session, ScheduleType.student])
        ).all()
        schedules.extend(all_other_schedules)

    # Thêm thông tin tên khoá học và tên học sinh vào response
    for s in schedules:
        if s.course_id:
            s.course_title = s.course.title if s.course else None
        if s.student_id:
            s.student_name = s.student.full_name if s.student else None

    return schedules

@router.post("/")
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
                
    elif schedule_in.type == ScheduleType.student:
        if current_user.role not in [UserRole.teacher, UserRole.admin]:
            raise HTTPException(status_code=403, detail="Chỉ giáo viên/admin mới được tạo lịch cho từng học sinh.")
        
        # Nếu chọn nhiều học sinh
        if schedule_in.student_ids and len(schedule_in.student_ids) > 0:
            pass # Xử lý bên dưới
        elif schedule_in.student_id:
            student_user = db.query(User).filter(User.id == schedule_in.student_id, User.role == UserRole.student).first()
            if not student_user:
                raise HTTPException(status_code=404, detail="Học sinh được chọn không tồn tại.")
        else:
            raise HTTPException(status_code=400, detail="Vui lòng chọn học sinh cho sự kiện này.")
    
    # Xử lý nhiều học sinh cùng lúc (student_ids)
    if schedule_in.type == ScheduleType.student and schedule_in.student_ids and len(schedule_in.student_ids) > 0:
        base_data = schedule_in.dict(exclude={"is_recurring", "repeat_weeks", "student_ids"})
        created_items = []
        for sid in schedule_in.student_ids:
            item_data = {**base_data, "student_id": sid, "user_id": current_user.id}
            if schedule_in.is_recurring and schedule_in.repeat_weeks and schedule_in.repeat_weeks > 1:
                from datetime import timedelta
                for i in range(schedule_in.repeat_weeks):
                    new_start = schedule_in.start_time + timedelta(weeks=i)
                    new_end = schedule_in.end_time + timedelta(weeks=i)
                    s = ScheduleItem(**item_data)
                    s.start_time = new_start
                    s.end_time = new_end
                    created_items.append(s)
            else:
                s = ScheduleItem(**item_data)
                created_items.append(s)

        db.add_all(created_items)
        db.commit()
        return {"message": f"Đã tạo lịch cho {len(schedule_in.student_ids)} học sinh thành công", "count": len(created_items)}

    base_data = schedule_in.dict(exclude={"is_recurring", "repeat_weeks", "student_ids"})
    
    if schedule_in.is_recurring and schedule_in.repeat_weeks and schedule_in.repeat_weeks > 1:
        from datetime import timedelta
        new_schedules = []
        for i in range(schedule_in.repeat_weeks):
            new_start = schedule_in.start_time + timedelta(weeks=i)
            new_end = schedule_in.end_time + timedelta(weeks=i)
            
            s = ScheduleItem(
                **base_data,
                user_id=current_user.id
            )
            s.start_time = new_start
            s.end_time = new_end
            new_schedules.append(s)
            
        db.add_all(new_schedules)
        db.commit()
        for s in new_schedules:
            db.refresh(s)
            if s.course_id:
                s.course_title = s.course.title
            if s.student_id:
                s.student_name = s.student.full_name
        return {"message": "Đã tạo sự kiện lặp lại thành công", "count": len(new_schedules)}
    else:
        new_schedule = ScheduleItem(
            **base_data,
            user_id=current_user.id
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)
        
        if new_schedule.course_id:
            new_schedule.course_title = new_schedule.course.title
        if new_schedule.student_id:
            new_schedule.student_name = new_schedule.student.full_name
            
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
    
    # Validation of course_session / student type on update
    new_type = update_data.get("type", db_schedule.type)
    if new_type == ScheduleType.course_session:
        course_id = update_data.get("course_id", db_schedule.course_id)
        if not course_id:
            raise HTTPException(status_code=400, detail="Vui lòng chọn lớp học cho sự kiện này.")
        if current_user.role == UserRole.teacher:
            course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == current_user.id).first()
            if not course:
                raise HTTPException(status_code=403, detail="Bạn không có quyền tạo/sửa lịch cho lớp này.")
    elif new_type == ScheduleType.student:
        student_id = update_data.get("student_id", db_schedule.student_id)
        if not student_id:
            raise HTTPException(status_code=400, detail="Vui lòng chọn học sinh cho sự kiện này.")
        student_user = db.query(User).filter(User.id == student_id, User.role == UserRole.student).first()
        if not student_user:
            raise HTTPException(status_code=404, detail="Học sinh được chọn không tồn tại.")
            
    # Handle recurring logic on update
    is_recurring = update_data.pop("is_recurring", False)
    repeat_weeks = update_data.pop("repeat_weeks", 1)

    for field, value in update_data.items():
        setattr(db_schedule, field, value)
        
    db.commit()
    db.refresh(db_schedule)
    
    if db_schedule.course_id:
        db_schedule.course_title = db_schedule.course.title
    if db_schedule.student_id:
        db_schedule.student_name = db_schedule.student.full_name

    # If user wants to make this event recurring now
    if is_recurring and repeat_weeks and repeat_weeks > 1:
        from datetime import timedelta
        new_schedules = []
        base_data = {
            "title": db_schedule.title,
            "description": db_schedule.description,
            "type": db_schedule.type,
            "course_id": db_schedule.course_id,
            "student_id": db_schedule.student_id,
            "location": db_schedule.location,
            "color": db_schedule.color,
            "user_id": current_user.id
        }
        for i in range(1, repeat_weeks):
            new_start = db_schedule.start_time + timedelta(weeks=i)
            new_end = db_schedule.end_time + timedelta(weeks=i)
            
            s = ScheduleItem(**base_data)
            s.start_time = new_start
            s.end_time = new_end
            new_schedules.append(s)
            
        if new_schedules:
            db.add_all(new_schedules)
            db.commit()
        
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


@router.get("/{schedule_id}/students")
def get_schedule_students(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách học sinh thuộc lớp học / buổi học cụ thể này"""
    schedule = db.query(ScheduleItem).filter(ScheduleItem.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch học")

    # 1. Nếu là lịch học 1-1 (student_id cụ thể)
    if schedule.student_id:
        student = db.query(User).filter(User.id == schedule.student_id).first()
        if student:
            return [{
                "id": student.id,
                "full_name": student.full_name,
                "avatar_url": student.avatar_url,
                "email": student.email,
            }]

    # 2. Nếu là lịch học theo lớp (course_id cụ thể)
    if schedule.course_id:
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == schedule.course_id,
            Enrollment.status == EnrollmentStatus.active,
        ).all()
        student_ids = [e.student_id for e in enrollments]
        if student_ids:
            students = db.query(User).filter(User.id.in_(student_ids)).all()
            return [{
                "id": s.id,
                "full_name": s.full_name,
                "avatar_url": s.avatar_url,
                "email": s.email,
            } for s in students]

    # 3. Fallback: Lấy tất cả học sinh đã ghi danh vào các lớp của GV này
    taught_courses = db.query(Course.id).filter(Course.teacher_id == current_user.id).all()
    course_ids = [c[0] for c in taught_courses]
    if course_ids:
        enrollments = db.query(Enrollment).filter(
            Enrollment.course_id.in_(course_ids),
            Enrollment.status == EnrollmentStatus.active,
        ).all()
        student_ids = list(set(e.student_id for e in enrollments))
        if student_ids:
            students = db.query(User).filter(User.id.in_(student_ids)).all()
            return [{
                "id": s.id,
                "full_name": s.full_name,
                "avatar_url": s.avatar_url,
                "email": s.email,
            } for s in students]

    # 4. Fallback cuối: tất cả học sinh
    students = db.query(User).filter(User.role == UserRole.student).all()
    return [{
        "id": s.id,
        "full_name": s.full_name,
        "avatar_url": s.avatar_url,
        "email": s.email,
    } for s in students]

