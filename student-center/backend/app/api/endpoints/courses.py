from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.course import Course, Enrollment, Lesson, LessonProgress, CourseChapter
from app.models.assignment import Assignment
from app.models.exam import Exam
from app.schemas.course import CourseCreate, CourseResponse, LessonCreate, LessonResponse, CourseChapterCreate, CourseChapterResponse, CourseCurriculumResponse
from app.schemas.course import CourseCreate, CourseResponse, LessonCreate, LessonResponse, CourseChapterCreate, CourseChapterResponse, CourseCurriculumResponse, EnrollRequest, ApproveStudentRequest
from app.models.course import Course, Enrollment, Lesson, LessonProgress, CourseChapter, EnrollmentStatus

from app.core.security import get_current_user, require_role

router = APIRouter()


# ═══════════════ KHOÁ HỌC ═══════════════

@router.get("/", response_model=List[CourseResponse])
def list_courses(db: Session = Depends(get_db)):
    """Danh sách tất cả khoá học (Public)."""
    courses = db.query(Course).filter(Course.is_active == True).all()
    results = []
    for c in courses:
        data = {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "teacher_id": c.teacher_id,
            "teacher_name": c.teacher.full_name if c.teacher else f"Giáo viên {c.teacher_id}",
            "thumbnail_url": c.thumbnail_url,
            "price": c.price,
            "is_active": c.is_active,
            "is_offline": c.is_offline,
            "enrollment_code": c.enrollment_code,
            "created_at": c.created_at
        }
        results.append(data)
    return results


@router.post("/", response_model=CourseResponse)
def create_course(
    course_in: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo khoá học mới (Teacher/Admin only)."""
    db_course = Course(**course_in.model_dump(), teacher_id=current_user.id)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


@router.get("/my-enrollments")
def my_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lấy danh sách khoá học đã ghi danh (Phải đặt ưu tiên trước {course_id})."""
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    # Join with Course to return course details
    results = []
    for e in enrollments:
        if e.course:
            results.append({
                "course_id": e.course_id, 
                "title": e.course.title,
                "thumbnail_url": e.course.thumbnail_url,
                "status": e.status.value, 
                "enrolled_at": e.enrolled_at
            })
    return results


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Khoá học không tồn tại")
    
    # Pack result to include teacher_name
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "teacher_id": course.teacher_id,
        "teacher_name": course.teacher.full_name if course.teacher else f"Giáo viên {course.teacher_id}",
        "thumbnail_url": course.thumbnail_url,
        "price": course.price,
        "is_active": course.is_active,
        "is_offline": course.is_offline,
        "enrollment_code": course.enrollment_code,
        "created_at": course.created_at
    }


# ═══════════════ GHI DANH ═══════════════

@router.post("/{course_id}/enroll")
def enroll_course(
    course_id: int,
    data: EnrollRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    """Học sinh ghi danh vào khoá học."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Khoá học không tồn tại")
    
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.course_id == course_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bạn đã ghi danh khoá học này rồi")
    
    enrollment = Enrollment(student_id=current_user.id, course_id=course_id)
    
    if course.is_offline:
        if data.enrollment_code and course.enrollment_code and data.enrollment_code.strip() == course.enrollment_code.strip():
            enrollment.status = EnrollmentStatus.active
        else:
            enrollment.status = EnrollmentStatus.pending
            
    db.add(enrollment)
    db.commit()
    return {
        "message": "Ghi danh thành công!" if not course.is_offline or enrollment.status == EnrollmentStatus.active else "Đã gửi yêu cầu, vui lòng chờ giáo viên duyệt!", 
        "course_id": course_id,
        "status": enrollment.status
    }


# (The my-enrollments route was hoisted above to prevent path variable conflicts)


# ═══════════════ CHƯƠNG (CHAPTER) ═══════════════

@router.post("/{course_id}/chapters", response_model=CourseChapterResponse)
def create_chapter(
    course_id: int,
    chapter_in: CourseChapterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Khoá học không tồn tại")
    
    chapter = CourseChapter(**chapter_in.model_dump(), course_id=course_id)
    db.add(chapter)
    db.commit()
    db.refresh(chapter)
    return chapter

# ═══════════════ BÀI GIẢNG (LESSON) ═══════════════

@router.post("/chapters/{chapter_id}/lessons", response_model=LessonResponse)
def create_lesson(
    chapter_id: int,
    lesson_in: LessonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    chapter = db.query(CourseChapter).filter(CourseChapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chương học không tồn tại")
    
    # We do model_dump() and potentially remove course_id if it's there
    data = lesson_in.model_dump()
    lesson = Lesson(**data, chapter_id=chapter_id)
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson

@router.get("/{course_id}/curriculum", response_model=CourseCurriculumResponse)
def get_curriculum(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Trả về kiến trúc lồng nhau của Khóa học (Chapter -> Lesson -> Assignment/Exam)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Khoá học không tồn tại")
        
    if current_user.role == "student":
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == current_user.id, Enrollment.course_id == course_id).first()
        if not enrollment:
            raise HTTPException(status_code=403, detail="Vui lòng ghi danh khoá học trước khi xem bài giảng")
        if enrollment.status == EnrollmentStatus.pending:
            raise HTTPException(status_code=403, detail="Vui lòng chờ giáo viên duyệt để vào học lớp Offline này")
        
    chapters = db.query(CourseChapter).filter(CourseChapter.course_id == course_id).order_by(CourseChapter.order_index).all()
    
    curriculum = []
    for chap in chapters:
       lessons_data = []
       for less in chap.lessons:
           # Get assignments and exams for this lesson
           assignments = db.query(Assignment).filter(Assignment.lesson_id == less.id).all()
           exams = db.query(Exam).filter(Exam.lesson_id == less.id).all()
           
           filtered_assignments = []
           for a in assignments:
               is_allowed = True
               if current_user.role == "student" and not getattr(a, "is_assigned_to_all", True):
                   if not any(u.id == current_user.id for u in getattr(a, "assignees", [])):
                        is_allowed = False
               if is_allowed:
                   filtered_assignments.append(a)
           
           lessons_data.append({
               "id": less.id,
               "chapter_id": less.chapter_id,
               "title": less.title,
               "description": less.description,
               "video_url": less.video_url,
               "document_url": less.document_url,
               "order_index": less.order_index,
               "duration_seconds": less.duration_seconds,
               "assignments": [{"id": a.id, "course_id": a.course_id, "lesson_id": a.lesson_id, "teacher_id": a.teacher_id, "title": a.title, "description": a.description, "due_date": a.due_date, "max_score": a.max_score, "created_at": a.created_at} for a in filtered_assignments],
               "exams": [{"id": e.id, "course_id": e.course_id, "lesson_id": e.lesson_id, "teacher_id": e.teacher_id, "title": e.title, "description": e.description, "duration_minutes": e.duration_minutes, "max_score": e.max_score, "start_time": e.start_time, "end_time": e.end_time, "created_at": e.created_at} for e in exams]
           })
       curriculum.append({
           "id": chap.id,
           "course_id": chap.course_id,
           "title": chap.title,
           "order_index": chap.order_index,
           "created_at": chap.created_at,
           "lessons": lessons_data
       })
       
    return {
        "course_id": course_id,
        "chapters": curriculum
    }


@router.post("/lessons/{lesson_id}/progress")
def update_lesson_progress(
    lesson_id: int,
    watched_seconds: int = 0,
    completed: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    """Lưu tiến độ học tập hoặc đánh dấu hoàn thành bài giảng."""
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Bài giảng không tồn tại")
        
    progress = db.query(LessonProgress).filter(
        LessonProgress.lesson_id == lesson_id,
        LessonProgress.student_id == current_user.id
    ).first()
    
    from datetime import datetime
    if not progress:
        progress = LessonProgress(
            student_id=current_user.id,
            lesson_id=lesson_id,
            watched_seconds=watched_seconds,
            completed=completed,
            completed_at=datetime.utcnow() if completed else None
        )
        db.add(progress)
    else:
        # Cập nhật state
        progress.watched_seconds = max(progress.watched_seconds, watched_seconds)
        if completed and not progress.completed:
            progress.completed = True
            progress.completed_at = datetime.utcnow()
            
    db.commit()
    return {"message": "Tiến độ đã được ghi nhận", "completed": progress.completed}

# ═══════════════ QUẢN LÝ HỌC SINH LỚP OFFLINE ═══════════════

@router.get("/{course_id}/students")
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or (course.teacher_id != current_user.id and current_user.role != "admin"):
        raise HTTPException(status_code=403, detail="Không có quyền truy cập")
        
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    results = []
    for e in enrollments:
        if e.student:
            results.append({
                "enrollment_id": e.id,
                "student_id": e.student.id,
                "full_name": e.student.full_name,
                "email": e.student.email,
                "status": e.status.value,
                "enrolled_at": e.enrolled_at
            })
    return results

@router.put("/enrollments/{enrollment_id}/approve")
def approve_enrollment(
    enrollment_id: int,
    data: ApproveStudentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")
        
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if course.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền thực hiện")
        
    if data.status not in ["active", "cancelled"]:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
        
    enrollment.status = EnrollmentStatus.active if data.status == "active" else EnrollmentStatus.cancelled
    db.commit()
    db.refresh(enrollment)
    return {"message": "Đã cập nhật trạng thái học sinh", "status": enrollment.status.value}
