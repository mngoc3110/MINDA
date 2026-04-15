"""Recalculate EXP for all students based on new formula."""
import sys; sys.path.insert(0, ".")
from app.db.database import get_db
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission

db = next(get_db())
students = db.query(User).filter(User.role == "student").all()

for student in students:
    subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student.id).all()
    total_exp = 0
    for sub in subs:
        a = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
        if not a or sub.score is None:
            continue
        if a.max_score and a.max_score > 0:
            score_10 = round((sub.score / a.max_score) * 10)
        else:
            score_10 = 0
        
        if score_10 >= 8:
            exp_change = 20
        elif score_10 >= 5:
            exp_change = 10
        else:
            exp_change = -(5 - score_10)
        
        total_exp += exp_change
    
    total_exp = max(total_exp, 0)
    old = student.exp_points or 0
    if total_exp != old:
        student.exp_points = total_exp
        print(f"UPD {student.full_name}: {old} -> {total_exp}")

db.commit()
print("Done!")
