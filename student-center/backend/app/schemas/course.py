from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# ═══════════════════ COURSE ═══════════════════
class EnrollRequest(BaseModel):
    enrollment_code: Optional[str] = None

class ApproveStudentRequest(BaseModel):
    status: str  # "active" or "cancelled"

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    price: Optional[int] = 0
    is_offline: Optional[bool] = False
    enrollment_code: Optional[str] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    price: Optional[int] = None
    is_offline: Optional[bool] = None
    enrollment_code: Optional[str] = None

class CourseResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    teacher_id: int
    teacher_name: Optional[str] = None
    thumbnail_url: Optional[str]
    price: int
    is_active: bool
    is_offline: bool
    enrollment_code: Optional[str] = None
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

# ═══════════════════ COURSE CHAPTER ═══════════════════
class CourseChapterCreate(BaseModel):
    title: str
    order_index: Optional[int] = 0

class CourseChapterResponse(BaseModel):
    id: int
    course_id: int
    title: str
    order_index: int
    created_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# ═══════════════════ LESSON ═══════════════════
class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    document_url: Optional[str] = None
    order_index: Optional[int] = 0
    duration_seconds: Optional[int] = 0

class LessonResponse(BaseModel):
    id: int
    chapter_id: int
    title: str
    description: Optional[str]
    video_url: Optional[str]
    document_url: Optional[str] = None
    order_index: int
    duration_seconds: int
    class Config:
        from_attributes = True


# ═══════════════════ ASSIGNMENT ═══════════════════
class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assignment_type: Optional[str] = "file_upload"
    quiz_data: Optional[Any] = None
    attachment_url: Optional[str] = None
    course_id: Optional[int] = None
    folder_id: Optional[int] = None
    lesson_id: Optional[int] = None
    due_date: Optional[datetime] = None
    max_score: Optional[int] = 100
    exam_format: Optional[str] = "practice"
    is_assigned_to_all: Optional[bool] = True
    assignee_ids: Optional[List[int]] = None

class AssignmentResponse(BaseModel):
    id: int
    course_id: Optional[int] = None
    folder_id: Optional[int] = None
    lesson_id: Optional[int] = None
    teacher_id: int
    title: str
    description: Optional[str]
    assignment_type: Optional[str] = "file_upload"
    quiz_data: Optional[Any] = None
    attachment_url: Optional[str] = None
    due_date: Optional[datetime]
    max_score: int
    exam_format: Optional[str] = "practice"
    is_assigned_to_all: Optional[bool] = True
    assignee_ids: Optional[List[int]] = None
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    content: Optional[str] = None
    file_url: Optional[str] = None
    quiz_answers: Optional[Any] = None

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    content: Optional[str]
    file_url: Optional[str]
    quiz_answers: Optional[Any]
    score: Optional[float]  # float to support standard exam decimals (e.g. 8.75)
    feedback: Optional[str]
    submitted_at: Optional[datetime]
    graded_at: Optional[datetime]
    class Config:
        from_attributes = True

class GradeSubmission(BaseModel):
    score: int
    feedback: Optional[str] = None


# ═══════════════════ EXAM ═══════════════════
class ExamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    lesson_id: Optional[int] = None
    duration_minutes: Optional[int] = 60
    max_score: Optional[int] = 100
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

class ExamResponse(BaseModel):
    id: int
    course_id: int
    lesson_id: Optional[int] = None
    teacher_id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    max_score: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class QuestionCreate(BaseModel):
    question_text: str
    question_type: Optional[str] = "mc"
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    points: Optional[int] = 10

class QuestionResponse(BaseModel):
    id: int
    exam_id: int
    question_text: str
    question_type: str
    options: Optional[Any]
    correct_answer: Optional[str]
    points: int
    class Config:
        from_attributes = True

class ExamSubmit(BaseModel):
    answers: dict  # {"question_id": "answer_value"}

class ExamSubmissionResponse(BaseModel):
    id: int
    exam_id: int
    student_id: int
    answers: Optional[Any]
    score: Optional[int]
    submitted_at: Optional[datetime]
    class Config:
        from_attributes = True


# ═══════════════════ TUITION ═══════════════════
class TuitionCreate(BaseModel):
    student_id: int
    course_id: Optional[int] = None
    amount: int
    due_date: Optional[datetime] = None
    note: Optional[str] = None
    billing_cycle: Optional[str] = "2026-04"

class TuitionResponse(BaseModel):
    id: int
    student_id: int
    course_id: Optional[int] = None
    amount: int
    paid_amount: int
    status: str
    due_date: Optional[datetime]
    paid_at: Optional[datetime]
    note: Optional[str]
    billing_cycle: str
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class TuitionPayment(BaseModel):
    paid_amount: int = 0
    note: Optional[str] = None
    status: Optional[str] = None


# ═══════════════════ LIVE SESSION ═══════════════════
class LiveSessionCreate(BaseModel):
    title: str
    scheduled_at: datetime
    duration_minutes: Optional[int] = 60

class LiveSessionResponse(BaseModel):
    id: int
    course_id: int
    teacher_id: int
    title: str
    scheduled_at: datetime
    duration_minutes: int
    status: str
    room_id: Optional[str]
    created_at: Optional[datetime]
    class Config:
        from_attributes = True


# ═══════════════════ NESTED CURRICULUM ═══════════════════
class CurriculumLessonResponse(LessonResponse):
    assignments: List[AssignmentResponse] = []
    exams: List[ExamResponse] = []
    class Config:
        from_attributes = True

class CurriculumChapterResponse(CourseChapterResponse):
    lessons: List[CurriculumLessonResponse] = []
    class Config:
        from_attributes = True

class CourseCurriculumResponse(BaseModel):
    course_id: int
    chapters: List[CurriculumChapterResponse] = []
    class Config:
        from_attributes = True


# ═══════════════════ ASSIGNMENT FOLDER ═══════════════════
class FolderCreate(BaseModel):
    name: str
    is_assigned_to_all: Optional[bool] = True
    assignee_ids: Optional[List[int]] = None
    assigned_classes: Optional[List[str]] = None  # ["Lớp 12-2k8", "Lớp 11-2k9"]

class FolderResponse(BaseModel):
    id: int
    name: str
    teacher_id: int
    is_assigned_to_all: bool
    assignee_ids: Optional[List[int]] = None
    assigned_classes: Optional[List[str]] = None
    assignment_count: Optional[int] = 0
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class FolderMoveRequest(BaseModel):
    folder_id: Optional[int] = None  # None = gỡ khỏi folder
