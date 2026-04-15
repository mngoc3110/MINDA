import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.assignment import AssignmentSubmission, Assignment
from app.models.exam import ExamSubmission, Exam
from app.models.course import Enrollment

db: Session = SessionLocal()

print("Seeding random grades for all enrolled students in all courses...")

# For each course, find all assignments and exams
courses = {a.course_id for a in db.query(Assignment).all()} | {e.course_id for e in db.query(Exam).all()}

count_assign = 0
count_exam = 0

for c_id in courses:
    # get students
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == c_id).all()
    student_ids = [e.student_id for e in enrollments]
    
    # get assignments
    assignments = db.query(Assignment).filter(Assignment.course_id == c_id).all()
    for assign in assignments:
        for s_id in student_ids:
            sub = db.query(AssignmentSubmission).filter(
                AssignmentSubmission.assignment_id == assign.id,
                AssignmentSubmission.student_id == s_id
            ).first()
            if not sub:
                sub = AssignmentSubmission(assignment_id=assign.id, student_id=s_id, content="Tự động nộp bài")
                db.add(sub)
            
            if assign.exam_format == "standard" or assign.max_score <= 10:
                sub.score = random.randint(9, 10)
            else:
                sub.score = random.randint(90, 100)
            sub.submitted_at = datetime.utcnow()
            sub.graded_at = datetime.utcnow()
            count_assign += 1

    # get exams
    exams = db.query(Exam).filter(Exam.course_id == c_id).all()
    for ex in exams:
        for s_id in student_ids:
            sub = db.query(ExamSubmission).filter(
                ExamSubmission.exam_id == ex.id,
                ExamSubmission.student_id == s_id
            ).first()
            if not sub:
                sub = ExamSubmission(exam_id=ex.id, student_id=s_id)
                db.add(sub)
            
            if ex.max_score <= 10:
                sub.score = random.randint(9, 10)
            else:
                sub.score = random.randint(90, 100)
            sub.submitted_at = datetime.utcnow()
            count_exam += 1

db.commit()
print(f"✅ Created/Updated {count_assign} assignment submissions and {count_exam} exam submissions with scores from 9-10 (or 90-100)!")
