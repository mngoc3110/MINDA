from app.db.database import engine, Base
from app.models.user import User, TeacherProfile
from app.models.course import Course, Enrollment, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.emotion import EmotionLog

print("📡 Đang cố gắng tạo các bảng trong PostgreSQL...")
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Đã tạo bảng thành công!")
except Exception as e:
    print(f"❌ Lỗi: {e}")
