import os
import sys

# Setup paths and environment
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission

def check_student_exp():
    db = SessionLocal()
    students = db.query(User).filter(User.role == "student").all()
    
    anomalies = []
    
    for s in students:
        # Fetch all submissions for the student, sorted by submission time
        submissions = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == s.id
        ).order_by(AssignmentSubmission.submitted_at.asc()).all()
        
        # Calculate expected EXP
        expected_exp = 0
        seen_assignments = set()
        
        for sub in submissions:
            # We only give EXP for the FIRST submission of each assignment
            if sub.assignment_id in seen_assignments:
                continue
            
            seen_assignments.add(sub.assignment_id)
            
            if sub.score is None:
                continue
                
            # Get assignment max score
            assignment = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
            if not assignment:
                continue
                
            max_score = float(assignment.max_score) if assignment.max_score else 0
            if max_score > 0:
                score_10 = (float(sub.score) / max_score) * 10
            else:
                score_10 = 0
                
            exp_change = 0
            if score_10 >= 8:
                exp_change = 20
            elif score_10 >= 5:
                exp_change = 10
            else:
                if expected_exp < 800:
                    exp_change = 5
                else:
                    exp_change = -int(5 - score_10)
                    
            expected_exp = max(0, expected_exp + exp_change)
            
        actual_exp = s.exp_points or 0
        if actual_exp != expected_exp:
            anomalies.append({
                "student_id": s.id,
                "student_name": s.full_name,
                "actual_exp": actual_exp,
                "expected_exp": expected_exp,
                "diff": actual_exp - expected_exp
            })
            
    db.close()
    
    if not anomalies:
        print("Tất cả học sinh đều có điểm EXP chính xác!")
    else:
        print(f"Phát hiện {len(anomalies)} học sinh bị sai điểm EXP:")
        for a in anomalies:
            print(f"- ID: {a['student_id']}, Tên: {a['student_name']} | Hiện tại: {a['actual_exp']} | Lẽ ra phải là: {a['expected_exp']} (Lệch: {a['diff']})")

if __name__ == "__main__":
    check_student_exp()
