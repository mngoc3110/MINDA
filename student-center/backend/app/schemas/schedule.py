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
    student_id: Optional[int] = None
    location: Optional[str] = None
    color: Optional[str] = None

class ScheduleItemCreate(ScheduleItemBase):
    student_ids: Optional[List[int]] = None
    is_recurring: Optional[bool] = False
    repeat_weeks: Optional[int] = 12

class ScheduleItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    type: Optional[ScheduleType] = None
    course_id: Optional[int] = None
    student_id: Optional[int] = None
    student_ids: Optional[List[int]] = None
    location: Optional[str] = None
    color: Optional[str] = None
    is_recurring: Optional[bool] = False
    repeat_weeks: Optional[int] = 12

class ScheduleItemResponse(ScheduleItemBase):
    id: int
    user_id: int
    created_at: datetime
    
    # Optional fields for frontend display context
    course_title: Optional[str] = None
    student_name: Optional[str] = None

    class Config:
        from_attributes = True
