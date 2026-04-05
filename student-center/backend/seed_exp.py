import sys
sys.path.append('.')
import random
from app.db.database import SessionLocal
from app.models.user import User
from app.models.course import Course
from app.models.enrollment import Enrollment

db = SessionLocal()
students = db.query(User).filter(User.role == "student").all()

# Give existing students random EXPs
for student in students:
    if student.exp_points == 0:
        student.exp_points = random.randint(1000, 90000)

# If less than 15 students, inject dummy students for visual testing
if len(students) < 15:
    names = ["Nguyễn Văn A", "Trần Thị B", "Lê Hoàng C", "Phạm Quỳnh D", "Hoàng Văn E", "Vũ Thị F", "Đỗ Hữu G", "Ngô Phương H", "Bùi Tấn I", "Dương Yến K", "Lý Công L", "Mai Diễm M"]
    for i, name in enumerate(names):
        u = User(
            email=f"mock_student_{i}_{random.randint(0, 9999)}@example.com",
            full_name=name,
            role="student",
            current_rank="Tân binh",
            exp_points=random.randint(5000, 50000),
            hashed_password="mock"
        )
        db.add(u)

db.commit()
print("Leaderboard EXP seeded successfully.")
