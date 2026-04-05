from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None
    role: Optional[str] = "student"  # student / teacher / admin


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

