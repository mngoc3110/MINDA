"""Recalculate EXP for all students based on their submission scores."""
import sys, os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Get all students with submissions
students = db.execute(text("""
    SELECT DISTINCT s.student_id, u.full_name, u.exp_points
    FROM assignment_submissions s 
    JOIN users u ON u.id = s.student_id
    ORDER BY s.student_id
""")).fetchall()

print(f"Found {len(students)} students with submissions\n")

for student_id, name, old_exp in students:
    # Get first submission per assignment (EXP only counts for first submission)
    first_subs = db.execute(text("""
        SELECT DISTINCT ON (s.assignment_id) 
            s.score, a.max_score, a.exam_format
        FROM assignment_submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.student_id = :sid AND a.quiz_data IS NOT NULL
        ORDER BY s.assignment_id, s.submitted_at ASC
    """), {"sid": student_id}).fetchall()
    
    total_exp = 0
    details = []
    
    for score, max_score, fmt in first_subs:
        if score is None:
            continue
        
        ms = float(max_score) if max_score else 10
        if ms > 0:
            score_10 = (float(score) / ms) * 10
        else:
            score_10 = 0
        
        if score_10 >= 8:
            exp_change = 20
        elif score_10 >= 5:
            exp_change = 10
        else:
            if total_exp < 800:
                exp_change = 5
            else:
                exp_change = -int(5 - score_10)
        
        total_exp += exp_change
        details.append(f"  {fmt}: {score}/{ms} -> thang10={score_10:.1f} -> EXP {'+' if exp_change >= 0 else ''}{exp_change}")
    
    total_exp = max(total_exp, 0)
    changed = int(old_exp or 0) != total_exp
    
    print(f"👤 {name} (ID={student_id}): EXP {old_exp} → {total_exp} {'⚡ CHANGED' if changed else '(same)'}")
    if changed:
        for d in details:
            print(d)
        db.execute(text("UPDATE users SET exp_points = :exp WHERE id = :id"), {"exp": total_exp, "id": student_id})

db.commit()
db.close()
print("\n✅ Done!")
