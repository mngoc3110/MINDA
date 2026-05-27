from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class YearbookMessageCreate(BaseModel):
    id: str
    yearbook_id: str
    author_name: str
    emoji: Optional[str] = None
    bg_color: Optional[str] = None
    message: str
    image_data: Optional[str] = None
    is_public: bool = True

class YearbookMessageResponse(BaseModel):
    id: str
    yearbook_id: str
    author_name: str
    emoji: Optional[str] = None
    bg_color: Optional[str] = None
    message: str
    image_data: Optional[str] = None
    is_public: bool
    hearts: int
    created_at: datetime

    class Config:
        from_attributes = True

class YearbookHeartUpdate(BaseModel):
    hearts: int
