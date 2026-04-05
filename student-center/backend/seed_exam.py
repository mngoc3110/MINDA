from app.db.database import SessionLocal
from app.models.exam import Exam, ExamQuestion
from app.models.course import Course
from app.models.user import User
from app.models.assignment import Assignment
from app.models.assignment import Assignment
from app.models.live_session import LiveSession

db = SessionLocal()

# Find dummy teacher and course
teacher = db.query(User).filter(User.full_name == 'Giáo viên Demo').first()
if not teacher:
    teacher = db.query(User).first()

course = db.query(Course).first()

if course and teacher:
    # Check if exam exists
    existing_exam = db.query(Exam).filter(Exam.title == 'KLTN - Bài Thi Đánh Giá Tổng Hợp').first()
    if not existing_exam:
        exam = Exam(
            course_id=course.id,
            teacher_id=teacher.id,
            title='KLTN - Bài Thi Đánh Giá Tổng Hợp',
            description='Bài trắc nghiệm tích hợp kiểm thử WebRTC và LMS (Tính giờ 15 phút).',
            duration_minutes=15
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)

        questions = [
            ExamQuestion(
                exam_id=exam.id,
                question_text='Nền tảng MINDA EduCenter sử dụng Engine nào để vận hành Back-end?',
                options=['Express', 'FastAPI', 'NestJS', 'SpringBoot'],
                correct_answer='FastAPI', points=10
            ),
            ExamQuestion(
                exam_id=exam.id,
                question_text='Tính năng Phòng học đa điểm ảo sử dụng công nghệ mã nguồn mở nào?',
                options=['Skype SDK', 'Twilio', 'Jitsi Meet WebRTC', 'Discord'],
                correct_answer='Jitsi Meet WebRTC', points=10
            ),
            ExamQuestion(
                exam_id=exam.id,
                question_text='Khóa học này được thiết kế để theo dõi thông số gì ở người học?',
                options=['Mức độ tập trung (Engagement)', 'Tần số âm thanh', 'Lộ trình chuột (Mouse map)', 'Thời tiết'],
                correct_answer='Mức độ tập trung (Engagement)', points=10
            )
        ]
        db.add_all(questions)
        db.commit()
        print("Quiz seed executed successfully!")
    else:
        print("Quiz already exists.")
else:
    print("Could not find course or teacher baseline.")
