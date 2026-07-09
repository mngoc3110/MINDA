from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from datetime import datetime
import uuid
from app.db.database import get_db
from app.core.security import get_current_user_optional, require_role
from app.models.testimonial import Testimonial
from app.models.user import User
from app.core.cloudinary_service import cloudinary_service

router = APIRouter()

class TestimonialCreate(BaseModel):
    student_name: str
    avatar_url: str = None
    content: str
    rating: int = 5

class TestimonialUpdateStatus(BaseModel):
    status: str

class TestimonialResponse(BaseModel):
    id: int
    user_id: int | None
    student_name: str
    avatar_url: str | None
    content: str
    rating: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

@router.post("/upload-avatar")
async def upload_testimonial_avatar(
    file: UploadFile = File(...)
):
    """
    Upload an avatar for a testimonial. Publicly accessible.
    """
    try:
        unique_id = str(uuid.uuid4())[:8]
        drive_link = await cloudinary_service.upload_file(file, f"guest_{unique_id}", "guest", "student", "avatar")
        return {"avatar_url": drive_link}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh: {str(e)}")

@router.post("/", response_model=TestimonialResponse)
def create_testimonial(
    testimonial_in: TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Create a new testimonial. Public can create, but if logged in, associates with user.
    """
    new_testimonial = Testimonial(
        user_id=current_user.id if current_user else None,
        student_name=testimonial_in.student_name,
        avatar_url=testimonial_in.avatar_url,
        content=testimonial_in.content,
        rating=testimonial_in.rating,
        status="pending"
    )
    db.add(new_testimonial)
    db.commit()
    db.refresh(new_testimonial)
    return new_testimonial

@router.get("/", response_model=List[TestimonialResponse])
def read_approved_testimonials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve approved testimonials (for homepage).
    """
    testimonials = db.query(Testimonial).filter(Testimonial.status == "approved").order_by(Testimonial.created_at.desc()).offset(skip).limit(limit).all()
    return testimonials

@router.get("/admin", response_model=List[TestimonialResponse])
def read_all_testimonials(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Retrieve all testimonials (for admin dashboard).
    """
    testimonials = db.query(Testimonial).order_by(Testimonial.created_at.desc()).offset(skip).limit(limit).all()
    return testimonials

@router.put("/{testimonial_id}/status", response_model=TestimonialResponse)
def update_testimonial_status(
    testimonial_id: int,
    status_update: TestimonialUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Update status of a testimonial (approve/reject).
    """
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    
    if status_update.status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    testimonial.status = status_update.status
    db.commit()
    db.refresh(testimonial)
    return testimonial

@router.delete("/{testimonial_id}")
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """
    Delete a testimonial.
    """
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
        
    db.delete(testimonial)
    db.commit()
    return {"message": "Testimonial deleted successfully"}
