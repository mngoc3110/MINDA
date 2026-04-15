from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import get_db, SessionLocal
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam, ExamSubmission
import json

db = SessionLocal()

students = db.query(User).filter(User.role == "student").all()
for student in students:
    passed_assignments = 0
    subs = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == student.id).all()
    unique_assignments = {}
    for sub in subs:
        if sub.assignment_id not in unique_assignments:
            assignment = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
            if assignment:
                max_score = assignment.max_score or (10 if assignment.exam_format == "standard" else 100)
                if sub.score is not None and sub.score >= max_score * 0.8:
                    unique_assignments[sub.assignment_id] = True
    passed_assignments = len(unique_assignments)
    
    passed_exams = 0
    esubs = db.query(ExamSubmission).filter(ExamSubmission.student_id == student.id).all()
    unique_exams = {}
    for sub in esubs:
        if sub.exam_id not in unique_exams:
            exam = db.query(Exam).filter(Exam.id == sub.exam_id).first()
            if exam:
                try:
                     max_score = sum(int(q.get("points", 1)) for q in exam.questions)
                except Exception:
                     max_score = 100
                if sub.score is not None and sub.score >= max_score * 0.8:
                    unique_exams[sub.exam_id] = True
    passed_exams = len(unique_exams)
    
    total_xp = (passed_assignments * 20) + (passed_exams * 20)
    print(f"Student {student.full_name} XP before: {student.exp_points}, now: {total_xp}")
    student.exp_points = total_xp

db.commit()
print("Recalculation complete.")
