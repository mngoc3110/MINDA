import sys
sys.path.append('.')
from sqlalchemy import func
from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission

def run():
    db = SessionLocal()
    
    # Giáo viên: 1 bài tập đã tạo = 10 EXP
    assignments = db.query(Assignment).all()
    teacher_exp_map = {}
    for a in assignments:
        if a.teacher_id:
            teacher_exp_map[a.teacher_id] = teacher_exp_map.get(a.teacher_id, 0) + 10

    # Học sinh: 1 bài tập đã làm = 20 EXP
    submissions = db.query(AssignmentSubmission).all()
    student_exp_map = {}
    for s in submissions:
        if s.student_id:
            student_exp_map[s.student_id] = student_exp_map.get(s.student_id, 0) + 20

    # Cập nhật vào DB
    users = db.query(User).all()
    count = 0
    for u in users:
        new_exp = (u.exp_points or 0)
        
        calc_exp = teacher_exp_map.get(u.id, 0) + student_exp_map.get(u.id, 0)
        
        if calc_exp > 0:
            # We add historical points on top (assuming users want EXP accumulated)
            u.exp_points = new_exp + calc_exp
            count += 1
            
    db.commit()
    print(f"Đã cập nhật bù EXP lịch sử cho {count} người dùng từ dữ liệu cũ!")

if __name__ == "__main__":
    run()
