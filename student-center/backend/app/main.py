from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.db.database import engine, Base

# Import tất cả models để SQLAlchemy biết tạo bảng
from app.models.user import User, TeacherProfile
from app.models.course import Course, Enrollment, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.emotion import EmotionLog

# Import routers
from app.api.endpoints import courses, assignments, exams, tuition, admin, auth, files, profile, google_auth, live_sessions, dashboard, emotion
# Tự động tạo bảng DB nếu chưa có
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Parse CORS_ORIGINS từ chuỗi ngăn cách bởi dấu phẩy
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(',')] if settings.CORS_ORIGINS else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount tĩnh hệ thống file
import os
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "Welcome to MINDA API Backend. The AI Engine is alive!"}

# ═══════════════ REGISTER ROUTERS ═══════════════
app.include_router(auth.router, prefix="/api/auth", tags=["🔐 Auth"])
app.include_router(google_auth.router, prefix="/api/auth/google", tags=["🌐 Google Auth"])
app.include_router(courses.router, prefix="/api/courses", tags=["📚 Courses"])
app.include_router(assignments.router, prefix="/api", tags=["📝 Assignments"])
app.include_router(exams.router, prefix="/api", tags=["📋 Exams"])
app.include_router(tuition.router, prefix="/api/tuition", tags=["💰 Tuition"])
app.include_router(admin.router, prefix="/api/admin", tags=["👑 Admin"])
app.include_router(files.router, prefix="/api/files", tags=["📁 Files"])
app.include_router(profile.router, prefix="/api/profile", tags=["🖼️ Profile"])
app.include_router(live_sessions.router, prefix="/api/live-sessions", tags=["🎥 Live Sessions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["📊 Dashboard"])
app.include_router(emotion.router, tags=["🧠 Emotion AI"])
