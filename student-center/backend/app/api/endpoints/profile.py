from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.file import FileItem
from app.core.cloudinary_service import cloudinary_service

router = APIRouter()

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.avatar_url:
            cloudinary_service.delete_file(current_user.avatar_url)

        drive_link = await cloudinary_service.upload_file(file, current_user.full_name, current_user.id, current_user.role, "avatar")

        current_user.avatar_url = drive_link
        db.commit()
        return {"message": "Avatar uploaded successfully", "url": drive_link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cover")
async def upload_cover(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        if current_user.cover_url:
            cloudinary_service.delete_file(current_user.cover_url)

        drive_link = await cloudinary_service.upload_file(file, current_user.full_name, current_user.id, current_user.role, "cover")

        current_user.cover_url = drive_link
        db.commit()
        return {"message": "Cover uploaded successfully", "url": drive_link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/featured")
def get_featured_images(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = db.query(FileItem).filter(
        FileItem.owner_id == current_user.id,
        FileItem.file_category == "featured"
    ).order_by(FileItem.id.desc()).all()
    return [{"id": f.id, "url": f.file_url} for f in files]


@router.post("/featured")
async def upload_featured_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kiểm tra giới hạn 10 tấm
    count = db.query(FileItem).filter(
        FileItem.owner_id == current_user.id,
        FileItem.file_category == "featured"
    ).count()

    if count >= 10:
        raise HTTPException(status_code=400, detail="Qượt quá giới hạn 10 ảnh nổi bật. Vui lòng xoá bớt để thêm mới.")

    try:
        drive_link = await cloudinary_service.upload_file(file, current_user.full_name, current_user.id, current_user.role, "featured")

        size_mb = f"{file.size / (1024 * 1024):.2f} MB" if file.size else "Unknown"
        db_file = FileItem(
            filename=file.filename,
            file_url=drive_link,
            file_type=file.content_type or "image/jpeg",
            file_size=size_mb,
            file_category="featured",
            owner_id=current_user.id
        )
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return {"message": "Featured image uploaded", "file": {"id": db_file.id, "url": db_file.file_url}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/featured/{file_id}")
def delete_featured_image(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_file = db.query(FileItem).filter(
        FileItem.id == file_id,
        FileItem.owner_id == current_user.id,
        FileItem.file_category == "featured"
    ).first()

    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        cloudinary_service.delete_file(db_file.file_url)
        db.delete(db_file)
        db.commit()
        return {"message": "Image deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.api.endpoints.dashboard import get_student_rank, get_teacher_rank

def get_rank_tier(exp_points: int) -> str:
    # Fallback legacy function if used anywhere without User object
    from app.models.user import User
    dummy_user = User(email="dummy", role="student")
    return get_student_rank(dummy_user, exp_points)["rank_name"]

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    limit = 20
    admin_emails = ("darber3110@gmail.com", "darbar3110@gmail.com")

    # Fetch top students
    students = db.query(User).filter(User.role == 'student').order_by(User.exp_points.desc()).limit(limit).all()
    # Fetch top teachers  
    teachers = db.query(User).filter(User.role == 'teacher').order_by(User.exp_points.desc()).limit(limit).all()

    admin_user = db.query(User).filter(User.email.in_(admin_emails)).first()
    
    def to_dict(u):
        if isinstance(u, dict):
            return u
        is_mystic = u.email in admin_emails
        exp = 99999999 if is_mystic else (u.exp_points or 0)
        if getattr(u, "role", "student") == "teacher":
            rank_name = get_teacher_rank(u, exp)["rank_name"]
        else:
            rank_name = get_student_rank(u, exp)["rank_name"]
            
        return {
            "id": u.id,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "exp_points": exp,
            "current_rank": "Mystic" if is_mystic else rank_name
        }

    student_dicts = [to_dict(u) for u in students if u.email not in admin_emails]
    teacher_dicts = [to_dict(u) for u in teachers if (u.full_name != "Nguyễn Văn B" and u.email not in admin_emails)]

    def sort_key(d):
        return d["exp_points"]

    student_dicts = sorted(student_dicts, key=sort_key, reverse=True)
    teacher_dicts = sorted(teacher_dicts, key=sort_key, reverse=True)

    return {
        "students": student_dicts,
        "teachers": teacher_dicts
    }

@router.get("/teachers")
def list_teachers(db: Session = Depends(get_db)):
    """API lấy danh sách Giáo viên đã được phê duyệt (cả primary và secondary_role=teacher)"""
    from sqlalchemy import or_
    teachers = db.query(User).filter(
        User.is_active == True,  # noqa: E712
        or_(
            User.role == "teacher",
            User.secondary_role == "teacher"
        )
    ).all()
    return [
        {
            "id": t.id,
            "full_name": t.full_name,
            "avatar_url": t.avatar_url,
            "email": t.email
        }
        for t in teachers
    ]

@router.get("/students")
def list_students(db: Session = Depends(get_db)):
    """API lấy danh sách học sinh để dùng cho chọn dropdown người gán bài tập"""
    students = db.query(User).filter(
        User.is_active == True,
        User.role == "student"
    ).all()
    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "avatar_url": s.avatar_url,
            "email": s.email,
            "current_rank": get_student_rank(s, s.exp_points or 0)["rank_name"]
        }
        for s in students
    ]

from app.core.security import require_role

@router.post("/connect-teacher/{teacher_id}")
def connect_teacher(teacher_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("student"))):
    from app.models.user import TeacherStudentLink
    from sqlalchemy import or_
    teacher = db.query(User).filter(
        User.id == teacher_id,
        or_(User.role == "teacher", User.secondary_role == "teacher")
    ).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Giáo viên không tồn tại")
    
    existing = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == current_user.id,
        TeacherStudentLink.teacher_id == teacher_id
    ).first()
    
    if existing:
        return {"message": "Đã kết nối"}
        
    link = TeacherStudentLink(student_id=current_user.id, teacher_id=teacher_id)
    db.add(link)
    db.commit()
    return {"message": "Đã ghi danh lớp Offline thành công!"}

@router.get("/my-offline-teachers")
def my_offline_teachers(db: Session = Depends(get_db), current_user: User = Depends(require_role("student"))):
    from app.models.user import TeacherStudentLink
    links = db.query(TeacherStudentLink).filter(TeacherStudentLink.student_id == current_user.id).all()
    teachers = [link.teacher for link in links if link.teacher]
    
    return [
        {
            "id": t.id,
            "full_name": t.full_name,
            "avatar_url": t.avatar_url,
            "email": t.email
        }
        for t in teachers
    ]

@router.get("/my-offline-students")
def my_offline_students(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    from app.models.user import TeacherStudentLink
    links = db.query(TeacherStudentLink).filter(TeacherStudentLink.teacher_id == current_user.id).all()
    students = [link.student for link in links if link.student]
    
    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "avatar_url": s.avatar_url,
            "email": s.email,
            "phone": s.phone
        }
        for s in students
    ]

# --- CV ENDPOINTS ---
import json
from pydantic import BaseModel
from typing import List, Optional

class CVProfileUpdate(BaseModel):
    cv_title: str
    cv_competencies: str
    cv_soft_skills: str
    cv_languages: str
    cv_formats: str
    cv_education: str
    cv_teaching_experience: str
    cv_programming_experience: str
    cv_additional_info: str
    cv_theme_color: Optional[str] = "#1a365d"
    cv_layout: Optional[str] = "modern"
    cv_custom_sections: Optional[str] = "[]"
    social_linkedin: Optional[str] = None
    social_facebook: Optional[str] = None
    social_website: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None

@router.get("/teachers/{teacher_id}/cv")
def get_teacher_cv(teacher_id: int, db: Session = Depends(get_db)):
    from app.models.user import TeacherProfile, User
    teacher = db.query(User).filter(User.id == teacher_id).first()
    if not teacher or (teacher.role.value != "teacher" and teacher.secondary_role != "teacher"):
        raise HTTPException(status_code=404, detail="Giáo viên không tồn tại")
        
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == teacher_id).first()
    
    # Nếu chưa có profile trong DB, tạo một profile rỗng mặc định
    if not profile:
        profile = TeacherProfile(user_id=teacher_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return {
        "id": teacher.id,
        "full_name": teacher.full_name,
        "avatar_url": teacher.avatar_url,
        "email": teacher.email,
        "phone": teacher.phone,
        "cv_title": profile.cv_title,
        "cv_competencies": profile.cv_competencies,
        "cv_soft_skills": profile.cv_soft_skills,
        "cv_languages": profile.cv_languages,
        "cv_formats": profile.cv_formats,
        "cv_education": profile.cv_education,
        "cv_teaching_experience": profile.cv_teaching_experience,
        "cv_programming_experience": profile.cv_programming_experience,
        "cv_additional_info": profile.cv_additional_info,
        "cv_theme_color": profile.cv_theme_color,
        "cv_layout": profile.cv_layout,
        "cv_custom_sections": profile.cv_custom_sections,
        "social_linkedin": profile.social_linkedin,
        "social_facebook": profile.social_facebook,
        "social_website": profile.social_website
    }

@router.put("/teachers/cv")
def update_my_cv(data: CVProfileUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher"))):
    from app.models.user import TeacherProfile
    profile = db.query(TeacherProfile).filter(TeacherProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = TeacherProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.cv_title = data.cv_title
    profile.cv_competencies = data.cv_competencies
    profile.cv_soft_skills = data.cv_soft_skills
    profile.cv_languages = data.cv_languages
    profile.cv_formats = data.cv_formats
    profile.cv_education = data.cv_education
    profile.cv_teaching_experience = data.cv_teaching_experience
    profile.cv_programming_experience = data.cv_programming_experience
    profile.cv_additional_info = data.cv_additional_info
    
    if data.cv_theme_color: profile.cv_theme_color = data.cv_theme_color
    if data.cv_layout: profile.cv_layout = data.cv_layout
    if data.cv_custom_sections is not None: profile.cv_custom_sections = data.cv_custom_sections
    
    profile.social_linkedin = data.social_linkedin
    profile.social_facebook = data.social_facebook
    profile.social_website = data.social_website
    
    if data.phone:
        current_user.phone = data.phone
    if data.email:
        current_user.email = data.email
    if data.full_name:
        current_user.full_name = data.full_name
        
    db.commit()
    return {"message": "CV updated successfully"}
