import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from app.core.limiter import limiter



from app.core.config import settings
from app.db.database import Base, engine

# Import tất cả models để SQLAlchemy biết tạo bảng
from app.models.user import User, TeacherProfile
from app.models.course import Course, Enrollment, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.assignment_folder import AssignmentFolder
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.emotion import EmotionLog
from app.models.schedule import ScheduleItem
from app.models.honor import HonorBoard
from app.models.testimonial import Testimonial
from app.models.session_report import (
    AttendanceRecord, AttendanceDevice, StudentBiometric,
    ParentLink, SessionReport, WeeklyReport, MonthlyReport
)

# Import routers
from app.api.endpoints import courses, assignments, exams, tuition, admin, auth, files, profile, google_auth, live_sessions, dashboard, emotion, ai_solver, assignment_folders, manim, yearbook, schedules, honors, testimonials
from app.api.endpoints import attendance, reports, parent_access, code_problems

# Tự động tạo bảng DB nếu chưa có
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Đăng ký Limiter cho ứng dụng
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: Nếu không có biến CORS_ORIGINS → cho phép tất cả (dev mode) 
cors_origins_str = settings.CORS_ORIGINS if hasattr(settings, 'CORS_ORIGINS') and settings.CORS_ORIGINS else ""
if cors_origins_str:
    cors_origins = [origin.strip() for origin in cors_origins_str.split(',')]
else:
    cors_origins = ["*"]

# Bổ sung các origin cần thiết
if "*" not in cors_origins:
    cors_origins.extend([
        "capacitor://localhost",
        "http://localhost",
        "http://localhost:3000",
        "https://minda.io.vn",
        "https://www.minda.io.vn"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True if "*" not in cors_origins else False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount tĩnh hệ thống file
import os
os.makedirs("static", exist_ok=True)
os.makedirs("media", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/media", StaticFiles(directory="media"), name="media")

@app.get("/")
def read_root():
    return {"message": "Welcome to MINDA API Backend. The AI Engine is alive!"}

# ═══════════════ REGISTER ROUTERS ═══════════════
app.include_router(auth.router, prefix="/api/auth", tags=["🔐 Auth"])
app.include_router(google_auth.router, prefix="/api/auth/google", tags=["🌐 Google Auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["📚 Courses"])
app.include_router(testimonials.router, prefix="/api/testimonials", tags=["💬 Testimonials"])
app.include_router(assignments.router, prefix="/api", tags=["📝 Assignments"])
app.include_router(exams.router, prefix="/api", tags=["📋 Exams"])
app.include_router(tuition.router, prefix="/api/tuition", tags=["💰 Tuition"])
app.include_router(admin.router, prefix="/api/admin", tags=["👑 Admin"])
app.include_router(files.router, prefix="/api/files", tags=["📁 Files"])
app.include_router(profile.router, prefix="/api/profile", tags=["🖼️ Profile"])
app.include_router(live_sessions.router, prefix="/api/live-sessions", tags=["🎥 Live Sessions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["📊 Dashboard"])
app.include_router(emotion.router, tags=["🧠 Emotion AI"])
app.include_router(ai_solver.router, prefix="/api/ai", tags=["🤖 AI Solver"])
app.include_router(assignment_folders.router, prefix="/api/folders", tags=["📁 Folders"])
app.include_router(manim.router, prefix="/api/manim", tags=["🎬 Manim Studio"])
app.include_router(yearbook.router, prefix="/api/yearbook", tags=["📖 Yearbook"])
app.include_router(schedules.router, prefix="/api/schedules", tags=["📅 Schedules"])
app.include_router(honors.router, prefix="/api/honors", tags=["🏆 Honors"])

from app.api.endpoints import contact
app.include_router(contact.router, prefix="/api/contact", tags=["📞 Contact"])

from app.api.endpoints import attendance, reports, parent_access, code_problems, revision
app.include_router(attendance.router, prefix="/api/attendance", tags=["✅ Attendance"])
app.include_router(reports.router, prefix="/api/reports", tags=["📋 Session Reports"])
app.include_router(parent_access.router, prefix="/api/parent", tags=["👨‍👩‍👧 Parent Access"])
app.include_router(parent_access.router, prefix="/api/parent-links", tags=["👨‍👩‍👧 Parent Links"])
app.include_router(code_problems.router, prefix="/api", tags=["💻 Code Problems"])
app.include_router(revision.router, prefix="/api", tags=["📖 AI Smart Revision Center"])

