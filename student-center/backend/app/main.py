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
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.emotion import EmotionLog

# Import routers
from app.api.endpoints import courses, assignments, exams, tuition, admin, auth, files, profile, google_auth, live_sessions, dashboard, emotion, ai_solver
# Tự động tạo bảng DB nếu chưa có
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Đăng ký Limiter cho ứng dụng
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Parse CORS_ORIGINS từ chuỗi ngăn cách bởi dấu phẩy
cors_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(',')] if settings.CORS_ORIGINS else []

# Bổ sung các origin cần thiết cho Capacitor iOS và Local Development
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
app.include_router(ai_solver.router, prefix="/api/ai", tags=["🤖 AI Solver"])

from app.api.endpoints import contact
app.include_router(contact.router, prefix="/api/contact", tags=["📞 Contact"])
