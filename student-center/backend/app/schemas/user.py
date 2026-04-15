from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime
import re

def validate_password_strength(v: str) -> str:
    if len(v) < 4:
        raise ValueError("Mật khẩu phải có ít nhất 4 ký tự.")
    return v


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "student"  # student / teacher / admin

    @field_validator("password")
    def validate_password(cls, v):
        return validate_password_strength(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class UserResponse(UserBase):
    id: int
    phone: Optional[str] = None
    role: str
    is_active: bool
    exp_points: int
    current_rank: str
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    created_at: Optional[datetime] = None
    
    # Ảo hóa cờ để báo cho FE biết user đã connect Drive hay chưa
    @property
    def is_google_connected(self) -> bool:
        # Nếu sử dụng orm models mà có trường này thì xử lý ở lớp ngoài,
        # nhưng Pydantic không tự map @property nếu không dùng trick.
        # Ta có thể thêm `is_google_connected: bool = False` và set tay ở Endpoint, hoặc dùng model_validator.
        pass
        
    is_google_connected: bool = False

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    cover_url: Optional[str] = None
    requires_phone: bool = False



class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    def validate_new_password(cls, v):
        return validate_password_strength(v)


class ContactUsRequest(BaseModel):
    name: str
    email: EmailStr
    message: str

