"""Recalculate ALL submission scores with exact decimal values."""
import sys, os
sys.path.insert(0, "/var/www/minda/student-center/backend")
os.chdir("/var/www/minda/student-center/backend")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Get all assignments with submissions
rows = db.execute(text("""
    SELECT a.id, a.title, a.exam_format, a.max_score, a.quiz_data
    FROM assignments a 
    WHERE a.quiz_data IS NOT NULL 
    AND EXISTS (SELECT 1 FROM assignment_submissions s WHERE s.assignment_id = a.id)
    ORDER BY a.id
""")).fetchall()

print(f"Found {len(rows)} assignments with submissions\n")

def norm_tf(val):
    if isinstance(val, bool): return val
    if isinstance(val, int): return val != 0
    s = str(val).strip().lower()
    return s in ("true", "1", "yes")

total_updated = 0

for row in rows:
    aid, title, fmt, max_score, quiz_data = row
    is_standard = fmt == "standard"
    sections = quiz_data.get("sections", [])
    
    subs = db.execute(text("SELECT id, student_id, quiz_answers, score FROM assignment_submissions WHERE assignment_id = :id"), {"id": aid}).fetchall()
    
    print(f"📝 {title} (ID={aid}, {fmt}, {len(subs)} subs)")
    
    for sub in subs:
        sub_id, student_id, answers, old_score = sub
        if not answers:
            continue
        
        earned = 0.0
        total_possible = 0.0
        
        for s_idx, section in enumerate(sections):
            stype = section.get("type")
            for q in section.get("questions", []):
                raw_id = q.get("id", "")
                qid = f"s{s_idx}_{raw_id}"
                ans = answers.get(qid)
                correct = q.get("correctAnswer")
                
                if stype == "mcq":
                    ok = ans is not None and str(ans).strip() == str(correct).strip()
                    if is_standard:
                        if ok: earned += 0.25
                    else:
                        total_possible += 1.0
                        if ok: earned += 1.0
                
                elif stype == "true_false":
                    if not is_standard: total_possible += 1.0
                    if ans and isinstance(ans, dict):
                        n = sum(1 for item in q.get("items", [])
                                if norm_tf(ans.get(item.get("label", ""), "")) == norm_tf(item.get("isTrue")))
                        if n == 4: earned += 1.0
                        elif n == 3: earned += 0.5
                        elif n == 2: earned += 0.25
                        elif not is_standard and n == 1: earned += 0.1
                
                elif stype == "short_answer":
                    s_ans = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                    c_ans = str(correct).strip().lower().replace(",", ".")
                    if is_standard:
                        if s_ans and s_ans == c_ans: earned += 0.5
                    else:
                        total_possible += 1.0
                        if s_ans and s_ans == c_ans: earned += 1.0
        
        if is_standard:
            new_score = round(earned, 2)
        elif total_possible > 0:
            new_score = round((earned / total_possible) * float(max_score or 10), 2)
        else:
            new_score = 0
        
        changed = float(old_score or 0) != new_score
        if changed:
            print(f"  Student {student_id}: {old_score} → {new_score} ⚡")
            total_updated += 1
        else:
            print(f"  Student {student_id}: {old_score} (same)")
        
        db.execute(text("UPDATE assignment_submissions SET score = :score WHERE id = :id"), {"score": new_score, "id": sub_id})

db.commit()
db.close()
print(f"\n✅ Done! Updated {total_updated} submissions.")
