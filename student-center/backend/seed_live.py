from app.db.database import SessionLocal
from app.models.live_session import LiveSession, SessionStatus
from app.models.user import User
from app.models.course import Course
from datetime import datetime

db = SessionLocal()

teacher = db.query(User).filter(User.full_name == 'Giáo viên Demo').first()
if not teacher:
    teacher = User(email='teacher_live@test.com', full_name='Giáo viên Demo', hashed_password='pwd', current_rank='admin')
    db.add(teacher)
    db.flush()

course = db.query(Course).filter(Course.title == 'Khóa Mặc định').first()
if not course:
    course = Course(title='Khóa Mặc định', teacher_id=teacher.id)
    db.add(course)
    db.flush()

existing = db.query(LiveSession).filter(LiveSession.room_id == 'minda-live-demo-room').first()
if not existing:
    session = LiveSession(
        course_id=course.id,
        teacher_id=teacher.id,
        title='Lớp Trực Tuyến WebRTC',
        scheduled_at=datetime.utcnow(),
        duration_minutes=120,
        room_id='minda-live-demo-room',
        status=SessionStatus.live
    )
    db.add(session)
    db.commit()
    print('Seeded LIVE session successfully!')
else:
    # force update status to live just in case
    existing.status = SessionStatus.live
    db.commit()
    print('Updated existing session to LIVE status!')
