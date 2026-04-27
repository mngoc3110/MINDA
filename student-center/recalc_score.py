"""Recalculate scores for all submissions of a given assignment."""
import sys, os, json
sys.path.insert(0, "/var/www/minda/student-center/backend")
os.chdir("/var/www/minda/student-center/backend")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# Assignment ID to recalculate
ASSIGNMENT_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 16

# Get assignment quiz_data
from sqlalchemy import text
row = db.execute(text("SELECT quiz_data, exam_format, title FROM assignments WHERE id = :id"), {"id": ASSIGNMENT_ID}).fetchone()
if not row:
    print(f"Assignment {ASSIGNMENT_ID} not found!")
    sys.exit(1)

quiz_data = row[0]
exam_format = row[1]
title = row[2]
is_standard = exam_format == "standard"

print(f"📝 Recalculating: {title} (ID={ASSIGNMENT_ID}, format={exam_format})")

sections = quiz_data.get("sections", [])

# Get all submissions
subs = db.execute(text("SELECT id, student_id, quiz_answers, score FROM assignment_submissions WHERE assignment_id = :id"), {"id": ASSIGNMENT_ID}).fetchall()
print(f"📊 Found {len(subs)} submissions\n")

for sub in subs:
    sub_id, student_id, answers, old_score = sub
    if not answers:
        continue
    
    earned = 0.0
    total_possible = 0.0
    details = []
    
    for s_idx, section in enumerate(sections):
        stype = section.get("type")
        for q in section.get("questions", []):
            raw_id = q.get("id", "")
            qid = f"s{s_idx}_{raw_id}"
            ans = answers.get(qid)
            correct = q.get("correctAnswer")
            
            if stype == "mcq":
                if is_standard:
                    ok = ans is not None and str(ans).strip() == str(correct).strip()
                    if ok: earned += 0.25
                    details.append(f"  MCQ {qid}: HS={ans} ĐA={correct} {'✓' if ok else '✗'}")
                else:
                    total_possible += 1.0
                    ok = ans is not None and str(ans).strip() == str(correct).strip()
                    if ok: earned += 1.0
                    
            elif stype == "true_false":
                items = q.get("items", [])
                if ans and isinstance(ans, dict):
                    n = sum(1 for item in items if (str(ans.get(item["label"], "")).lower() == "true") == bool(item.get("isTrue")))
                    if is_standard:
                        if n == 4: earned += 1.0
                        elif n == 3: earned += 0.5
                        elif n == 2: earned += 0.25
                    else:
                        total_possible += 1.0
                        if n == 4: earned += 1.0
                        elif n == 3: earned += 0.5
                        elif n == 2: earned += 0.25
                        elif n == 1: earned += 0.1
                    details.append(f"  TF {qid}: {n}/4 đúng")
                else:
                    if not is_standard: total_possible += 1.0
                    details.append(f"  TF {qid}: no answer")
                    
            elif stype == "short_answer":
                s_ans = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                c_ans = str(correct).strip().lower().replace(",", ".")
                if is_standard:
                    ok = s_ans and s_ans == c_ans
                    if ok: earned += 0.5
                    details.append(f"  SA {qid}: HS=\"{ans}\" ĐA=\"{correct}\" {'✓' if ok else '✗'}")
                else:
                    total_possible += 1.0
                    ok = s_ans and s_ans == c_ans
                    if ok: earned += 1.0
    
    if is_standard:
        new_score = round(earned, 2)
    else:
        new_score = int(round((earned / total_possible) * 10)) if total_possible > 0 else 0
    
    changed = old_score != new_score
    print(f"Student {student_id} (sub {sub_id}): {old_score} → {new_score} {'⚡ CHANGED' if changed else '(same)'}")
    if changed:
        for d in details:
            print(d)
    
    # Update
    db.execute(text("UPDATE assignment_submissions SET score = :score WHERE id = :id"), {"score": new_score, "id": sub_id})

db.commit()
db.close()
print(f"\n✅ Done! Recalculated {len(subs)} submissions.")
