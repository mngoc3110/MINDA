# Import tất cả models để SQLAlchemy resolve relationships đúng
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment, CourseChapter, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.emotion import EmotionLog
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.file import FileItem
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord

__all__ = [
    "User", "UserRole",
    "Course", "Enrollment", "CourseChapter", "Lesson", "LessonProgress",
    "Assignment", "AssignmentSubmission",
    "EmotionLog",
    "Exam", "ExamQuestion", "ExamSubmission",
    "FileItem",
    "LiveSession",
    "TuitionRecord",
]
