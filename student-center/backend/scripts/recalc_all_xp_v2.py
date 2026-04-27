import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.assignment_folder import AssignmentFolder
from app.models.course import Course, Enrollment

def recalculate():
    db = SessionLocal()
    
    users = db.query(User).all()
    admin_emails = {"darber3110@gmail.com", "darbar3110@gmail.com"}
    
    # 1. Reset all users EXP to 0
    for u in users:
        if u.email not in admin_emails:
            u.exp_points = 0

    # 2. Giáo viên: +10 EXP cho mỗi bài tập đã tạo
    assignments = db.query(Assignment).all()
    for a in assignments:
        if a.teacher_id:
            teacher = db.query(User).filter(User.id == a.teacher_id).first()
            if teacher:
                teacher.exp_points = (teacher.exp_points or 0) + 10

    active_subs = 0
    
    # 3. Học sinh: Duyệt tuần tự thời gian nộp bài của từng học sinh để đảm bảo tích lũy Rank đúng lúc
    for student in users:
        if student.role != 'student':
            continue
            
        subs = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student.id
        ).order_by(AssignmentSubmission.submitted_at.asc()).all()
        
        processed_assignments = set()
        
        for sub in subs:
            if sub.assignment_id in processed_assignments:
                continue # Chỉ tính lần nộp bài đầu tiên
                
            processed_assignments.add(sub.assignment_id)
            if sub.score is None:
                continue
                
            a = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
            if not a:
                continue
                
            active_subs += 1
            
            # Tính EXP cho giáo viên vì đã có học sinh làm bài (+5 thẻ hoa hồng)
            if a.teacher_id:
                teacher = db.query(User).filter(User.id == a.teacher_id).first()
                if teacher:
                    teacher.exp_points = (teacher.exp_points or 0) + 5
                    
            # Tính EXP cho học sinh dựa trên hệ số hiện tại (current EXP)
            ms = float(a.max_score) if a.max_score else 10.0
            score_10 = (float(sub.score) / ms) * 10 if ms > 0 else 0
            
            current_exp = student.exp_points or 0
            if score_10 >= 8:
                exp_change = 20
            elif score_10 >= 5:
                exp_change = 10
            else:
                if current_exp < 800:
                    exp_change = 5
                else:
                    exp_change = -int(5 - score_10)
            
            student.exp_points = max(0, current_exp + exp_change)

    db.commit()
    print(f"Đã làm sạch và tính toán lại toàn bộ EXP cho {len(users)} người dùng. Chạy quét qua {active_subs} bài nộp đầu tiên hợp lệ!")

if __name__ == "__main__":
    recalculate()
