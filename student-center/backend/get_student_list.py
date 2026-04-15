import sqlite3
import random

conn = sqlite3.connect('minda_local.db')
cursor = conn.cursor()

cursor.execute("SELECT id, title FROM courses")
courses = cursor.fetchall()

result_str = ""

for c_id, c_title in courses:
    result_str += f"### Lớp: {c_title}\n"
    
    cursor.execute("""
        SELECT u.full_name 
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        WHERE e.course_id = ? AND u.role = 'student'
    """, (c_id,))
    students = cursor.fetchall()
    
    if not students:
        result_str += "- (Chưa có học sinh nào)\n"
    else:
        for idx, (s_name,) in enumerate(students, 1):
            score = round(random.uniform(9.0, 10.0), 1)
            # Ensure it ends with .0, .5 for realistic grading in VN, or keep it random like 9.2
            # Let's just do random 9.0 to 10.0, rounded to 1 decimal point e.g., 9.2, 9.8, 10.0
            
            result_str += f"{idx}. {s_name} - **{score}** điểm\n"
    result_str += "\n"

print(result_str)
