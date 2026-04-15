import sqlite3
import random
from datetime import datetime

# Connect to database
conn = sqlite3.connect('minda_local.db')
cursor = conn.cursor()

print("Seeding random grades for all enrolled students in all courses using direct SQLite...")

# Get all course IDs
cursor.execute("SELECT id FROM courses")
courses = [row[0] for row in cursor.fetchall()]

count_assign = 0
count_exam = 0

now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

for c_id in courses:
    # get students
    cursor.execute("SELECT student_id FROM enrollments WHERE course_id = ?", (c_id,))
    student_ids = [row[0] for row in cursor.fetchall()]

    # get assignments
    cursor.execute("SELECT id, exam_format, max_score FROM assignments WHERE course_id = ?", (c_id,))
    assignments = cursor.fetchall()
    
    for assign_id, exam_format, max_score in assignments:
        for s_id in student_ids:
            # Check if submission exists
            cursor.execute("SELECT id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?", (assign_id, s_id))
            sub = cursor.fetchone()
            
            # Determine score
            m_score = int(max_score) if max_score else 100
            if exam_format == "standard" or m_score <= 10:
                score = random.randint(9, 10)
            else:
                score = random.randint(90, 100)
                score = random.randint(90, 100)
                
            if not sub:
                cursor.execute("""
                    INSERT INTO assignment_submissions (assignment_id, student_id, content, score, submitted_at, graded_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (assign_id, s_id, "Tự động nộp bài", score, now_str, now_str))
            else:
                cursor.execute("""
                    UPDATE assignment_submissions SET score = ?, graded_at = ? WHERE id = ?
                """, (score, now_str, sub[0]))
            count_assign += 1

    # get exams
    cursor.execute("SELECT id, max_score FROM exams WHERE course_id = ?", (c_id,))
    exams = cursor.fetchall()
    
    for ex_id, max_score in exams:
        for s_id in student_ids:
            cursor.execute("SELECT id FROM exam_submissions WHERE exam_id = ? AND student_id = ?", (ex_id, s_id))
            sub = cursor.fetchone()
            
            m_score = int(max_score) if max_score else 100
            if m_score <= 10:
                score = random.randint(9, 10)
            else:
                score = random.randint(90, 100)
                
            if not sub:
                cursor.execute("""
                    INSERT INTO exam_submissions (exam_id, student_id, score, started_at, submitted_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (ex_id, s_id, score, now_str, now_str))
            else:
                cursor.execute("""
                    UPDATE exam_submissions SET score = ?, submitted_at = ? WHERE id = ?
                """, (score, now_str, sub[0]))
            count_exam += 1

conn.commit()
conn.close()
print(f"✅ Created/Updated {count_assign} assignment submissions and {count_exam} exam submissions with scores from 9-10 (or 90-100)!")
