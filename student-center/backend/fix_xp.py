import sys
import os

# Ensure backend directory is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

def fix_xp():
    db = SessionLocal()
    # For every teacher, calculate their assignments and give them 10 XP per assignment.
    # We will just ensure their exp_points is at LEAST (assignment_count * 10).
    teachers = db.query(User).filter(User.role == "teacher").all()
    for t in teachers:
        count = db.query(Assignment).filter(Assignment.teacher_id == t.id).count()
        if count > 0:
            current_xp = t.exp_points or 0
            expected_xp = count * 10
            if current_xp < expected_xp:
                t.exp_points = expected_xp
                print(f"Updated teacher {t.id} ({t.full_name}): {current_xp} -> {expected_xp} XP")
    
    db.commit()
    print("XP Sync Complete.")
    db.close()

if __name__ == "__main__":
    fix_xp()
