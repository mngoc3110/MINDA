from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

db = SessionLocal()
teacher = db.query(User).filter(User.full_name == "Nguyễn Văn B").first()
if teacher:
    print(f"Teacher {teacher.full_name} EXP: {teacher.exp_points}")
    count = db.query(Assignment).filter(Assignment.teacher_id == teacher.id).count()
    print(f"Assignment count: {count}")
    
    # Fix double-counting if necessary by resetting to 0
    teacher.exp_points = 0
    db.commit()
