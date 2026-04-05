# Import tất cả models để SQLAlchemy có thể resolve relationships
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.assignment import Assignment
from app.models.emotion import Emotion
from app.models.exam import Exam
from app.models.file import File
from app.models.live_session import LiveSession
from app.models.tuition import Tuition

__all__ = [
    "User", "UserRole",
    "Course",
    "Assignment",
    "Emotion",
    "Exam",
    "File",
    "LiveSession",
    "Tuition",
]
