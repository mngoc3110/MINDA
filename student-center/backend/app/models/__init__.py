# Import tất cả models để SQLAlchemy resolve relationships đúng
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment, CourseChapter, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.assignment_folder import AssignmentFolder
from app.models.honor import HonorBoard
from app.models.testimonial import Testimonial
from app.models.emotion import EmotionLog
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.file import FileItem
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.yearbook import YearbookMessage
from app.models.schedule import ScheduleItem, ScheduleType
from app.models.session_report import (
    AttendanceRecord, AttendanceDevice, StudentBiometric, AttendanceStatus, AttendanceMethod,
    ParentLink, SessionReport, WeeklyReport, MonthlyReport, HomeworkStatus
)
from app.models.code_problem import CodeProblem, CodeSubmission, CodingExam
from app.models.revision import RevisionNotebook, RevisionDocument, RevisionQuiz, RevisionAttempt

__all__ = [
    "User", "UserRole",
    "Course", "Enrollment", "CourseChapter", "Lesson", "LessonProgress",
    "Assignment", "AssignmentSubmission",
    "CodeProblem", "CodeSubmission", "CodingExam",
    "RevisionNotebook", "RevisionDocument", "RevisionQuiz", "RevisionAttempt",
    "EmotionLog",
    "Exam", "ExamQuestion", "ExamSubmission",
    "FileItem",
    "LiveSession",
    "TuitionRecord",
    "YearbookMessage",
    "ScheduleItem", "ScheduleType",
    "AttendanceRecord", "AttendanceDevice", "StudentBiometric",
    "AttendanceStatus", "AttendanceMethod", "HomeworkStatus",
    "ParentLink",
    "SessionReport", "WeeklyReport", "MonthlyReport",
]
