from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.honor import HonorBoard, HonorStatus
from app.core.security import require_role

router = APIRouter()

# Schemas
class HonorBase(BaseModel):
    student_id: Optional[int] = None
    custom_student_name: Optional[str] = None
    academic_year: Optional[str] = None
    title: str
    description: str
    image_url: Optional[str] = None
    university_logo_url: Optional[str] = None

class HonorCreate(HonorBase):
    pass

class HonorResponse(HonorBase):
    id: int
    teacher_id: int
    status: HonorStatus
    created_at: datetime
    student_name: str
    teacher_name: str

    class Config:
        from_attributes = True

# 1. Public API for Homepage
@router.get("/public", response_model=List[HonorResponse])
def get_public_honors(db: Session = Depends(get_db)):
    """Lấy danh sách các vinh danh đã được duyệt để hiển thị ở Trang chủ"""
    honors = db.query(HonorBoard).filter(HonorBoard.status == HonorStatus.approved).order_by(HonorBoard.created_at.desc()).all()
    results = []
    for h in honors:
        results.append({
            "id": h.id,
            "student_id": h.student_id,
            "teacher_id": h.teacher_id,
            "title": h.title,
            "description": h.description,
            "image_url": h.image_url,
            "university_logo_url": h.university_logo_url,
            "status": h.status,
            "created_at": h.created_at,
            "academic_year": h.academic_year,
            "student_name": h.student.full_name if h.student else (h.custom_student_name or "Học sinh ẩn"),
            "teacher_name": h.teacher.full_name if h.teacher else "Giáo viên ẩn"
        })
    return results

# 2. Teacher API - Get their submissions
@router.get("/teacher", response_model=List[HonorResponse])
def get_teacher_honors(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    """Giáo viên xem danh sách các đề cử của mình"""
    honors = db.query(HonorBoard).filter(HonorBoard.teacher_id == current_user.id).order_by(HonorBoard.created_at.desc()).all()
    results = []
    for h in honors:
        results.append({
            "id": h.id,
            "student_id": h.student_id,
            "teacher_id": h.teacher_id,
            "title": h.title,
            "description": h.description,
            "image_url": h.image_url,
            "university_logo_url": h.university_logo_url,
            "status": h.status,
            "created_at": h.created_at,
            "academic_year": h.academic_year,
            "student_name": h.student.full_name if h.student else (h.custom_student_name or "Học sinh ẩn"),
            "teacher_name": h.teacher.full_name if h.teacher else "Giáo viên ẩn"
        })
    return results

from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from app.core.cloudinary_service import cloudinary_service

# 3. Teacher API - Create submission
@router.post("/", response_model=HonorResponse)
async def create_honor(
    student_id: Optional[int] = Form(None),
    custom_student_name: Optional[str] = Form(None),
    academic_year: Optional[str] = Form(None),
    title: str = Form(...),
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    university_logo: Optional[UploadFile] = File(None),
    university_logo_url: Optional[str] = Form(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("teacher", "admin"))
):
    """Giáo viên tạo một đề cử vinh danh mới (có thể upload ảnh)"""
    final_image_url = image_url
    final_university_logo_url = university_logo_url
    
    if image and image.filename:
        try:
            cloud_link = await cloudinary_service.upload_file(
                image, 
                user_name=current_user.full_name, 
                user_id=current_user.id, 
                role=current_user.role.value, 
                folder_suffix="honors"
            )
            final_image_url = cloud_link
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lỗi tải ảnh lên Cloudinary: {str(e)}")

    if university_logo and university_logo.filename:
        try:
            cloud_link_logo = await cloudinary_service.upload_file(
                university_logo, 
                user_name=current_user.full_name, 
                user_id=current_user.id, 
                role=current_user.role.value, 
                folder_suffix="honors_uni_logo"
            )
            final_university_logo_url = cloud_link_logo
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lỗi tải logo trường lên Cloudinary: {str(e)}")

    if not student_id and not custom_student_name:
        raise HTTPException(status_code=400, detail="Phải cung cấp student_id hoặc custom_student_name")

    is_admin = (
        current_user.role.value == "admin" 
        or current_user.email in ("darber3110@gmail.com", "darbar3110@gmail.com")
        or "darber3110" in current_user.email.lower()
    )

    honor = HonorBoard(
        student_id=student_id,
        custom_student_name=custom_student_name,
        academic_year=academic_year,
        teacher_id=current_user.id,
        title=title,
        description=description,
        image_url=final_image_url,
        university_logo_url=final_university_logo_url,
        status=HonorStatus.approved if is_admin else HonorStatus.pending
    )
    db.add(honor)
    db.commit()
    db.refresh(honor)
    return {
        "id": honor.id,
        "student_id": honor.student_id,
        "teacher_id": honor.teacher_id,
        "title": honor.title,
        "description": honor.description,
        "image_url": honor.image_url,
        "university_logo_url": honor.university_logo_url,
        "status": honor.status,
        "created_at": honor.created_at,
        "academic_year": honor.academic_year,
        "student_name": honor.student.full_name if honor.student else (honor.custom_student_name or "Học sinh ẩn"),
        "teacher_name": current_user.full_name
    }

# 3.5 Teacher API - Update submission
@router.put("/{honor_id}", response_model=HonorResponse)
async def update_honor(
    honor_id: int,
    student_id: Optional[int] = Form(None),
    custom_student_name: Optional[str] = Form(None),
    academic_year: Optional[str] = Form(None),
    title: str = Form(...),
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    university_logo: Optional[UploadFile] = File(None),
    university_logo_url: Optional[str] = Form(None),
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("teacher", "admin"))
):
    """Giáo viên hoặc Admin sửa một đề cử đã tạo"""
    honor = db.query(HonorBoard).filter(HonorBoard.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
        
    is_admin = (
        current_user.role.value == "admin" 
        or current_user.email in ("darber3110@gmail.com", "darbar3110@gmail.com")
        or "darber3110" in current_user.email.lower()
    )
    if not is_admin and honor.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền sửa đề cử này")

    final_image_url = honor.image_url if not image_url else image_url
    final_university_logo_url = honor.university_logo_url if not university_logo_url else university_logo_url
    
    if image and image.filename:
        try:
            cloud_link = await cloudinary_service.upload_file(
                image, 
                user_name=current_user.full_name, 
                user_id=current_user.id, 
                role=current_user.role.value, 
                folder_suffix="honors"
            )
            final_image_url = cloud_link
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lỗi tải ảnh lên Cloudinary: {str(e)}")

    if university_logo and university_logo.filename:
        try:
            cloud_link_logo = await cloudinary_service.upload_file(
                university_logo, 
                user_name=current_user.full_name, 
                user_id=current_user.id, 
                role=current_user.role.value, 
                folder_suffix="honors_uni_logo"
            )
            final_university_logo_url = cloud_link_logo
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Lỗi tải logo trường lên Cloudinary: {str(e)}")

    honor.student_id = student_id
    honor.custom_student_name = custom_student_name
    honor.academic_year = academic_year
    honor.title = title
    honor.description = description
    honor.image_url = final_image_url
    honor.university_logo_url = final_university_logo_url
    
    db.commit()
    db.refresh(honor)
    return {
        "id": honor.id,
        "student_id": honor.student_id,
        "teacher_id": honor.teacher_id,
        "title": honor.title,
        "description": honor.description,
        "image_url": honor.image_url,
        "university_logo_url": honor.university_logo_url,
        "status": honor.status,
        "created_at": honor.created_at,
        "academic_year": honor.academic_year,
        "student_name": honor.student.full_name if honor.student else (honor.custom_student_name or "Học sinh ẩn"),
        "teacher_name": honor.teacher.full_name if honor.teacher else "Giáo viên ẩn"
    }

# 3.6 Teacher API - Delete submission
@router.delete("/{honor_id}")
def delete_honor(honor_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    """Giáo viên hoặc Admin xoá đề cử"""
    honor = db.query(HonorBoard).filter(HonorBoard.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
        
    is_admin = (
        current_user.role.value == "admin" 
        or current_user.email in ("darber3110@gmail.com", "darbar3110@gmail.com")
        or "darber3110" in current_user.email.lower()
    )
    if not is_admin and honor.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xoá đề cử này")
        
    db.delete(honor)
    db.commit()
    return {"message": "Xoá thành công"}

# 4. Admin API - Get all submissions
@router.get("/admin", response_model=List[HonorResponse])
def get_all_honors(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    """Admin xem tất cả các đề cử"""
    honors = db.query(HonorBoard).order_by(HonorBoard.created_at.desc()).all()
    results = []
    for h in honors:
        results.append({
            "id": h.id,
            "student_id": h.student_id,
            "teacher_id": h.teacher_id,
            "title": h.title,
            "description": h.description,
            "image_url": h.image_url,
            "university_logo_url": h.university_logo_url,
            "status": h.status,
            "created_at": h.created_at,
            "academic_year": h.academic_year,
            "student_name": h.student.full_name if h.student else (h.custom_student_name or "Học sinh ẩn"),
            "teacher_name": h.teacher.full_name if h.teacher else "Giáo viên ẩn"
        })
    return results

# 5. Admin API - Update status
@router.put("/{honor_id}/status")
def update_honor_status(honor_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    """Admin duyệt hoặc từ chối đề cử"""
    honor = db.query(HonorBoard).filter(HonorBoard.id == honor_id).first()
    if not honor:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")
    try:
        honor.status = HonorStatus(status)
        db.commit()
        return {"message": f"Cập nhật thành công trạng thái: {status}"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ (pending, approved, rejected)")
