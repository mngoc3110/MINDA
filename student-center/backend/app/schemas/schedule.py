from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.schedule import ScheduleType

class ScheduleItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    type: ScheduleType = ScheduleType.personal
    course_id: Optional[int] = None
    location: Optional[str] = None
    color: Optional[str] = None

class ScheduleItemCreate(ScheduleItemBase):
    pass

class ScheduleItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    color: Optional[str] = None

class ScheduleItemResponse(ScheduleItemBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Optional fields for frontend display context
    course_title: Optional[str] = None

    class Config:
        from_attributes = True
