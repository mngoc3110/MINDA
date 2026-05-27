import sqlite3

def check_student_exp():
    conn = sqlite3.connect('/Users/macbook/Desktop/coding/projects/MINDA/student-center/backend/minda_local.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, full_name, exp_points FROM users WHERE role = 'student'")
    students = cursor.fetchall()
    
    anomalies = []
    
    for s in students:
        cursor.execute("""
            SELECT s.assignment_id, s.score, a.max_score
            FROM assignment_submissions s
            JOIN assignments a ON s.assignment_id = a.id
            WHERE s.student_id = ?
            ORDER BY s.submitted_at ASC
        """, (s['id'],))
        submissions = cursor.fetchall()
        
        expected_exp = 0
        seen_assignments = set()
        
        for sub in submissions:
            if sub['assignment_id'] in seen_assignments:
                continue
                
            seen_assignments.add(sub['assignment_id'])
            
            if sub['score'] is None:
                continue
                
            max_score = float(sub['max_score']) if sub['max_score'] else 0
            if max_score > 0:
                score_10 = (float(sub['score']) / max_score) * 10
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
            
        actual_exp = s['exp_points'] or 0
        if actual_exp != expected_exp:
            anomalies.append({
                "student_id": s['id'],
                "student_name": s['full_name'],
                "actual_exp": actual_exp,
                "expected_exp": expected_exp,
                "diff": actual_exp - expected_exp
            })
            
    conn.close()
    
    if not anomalies:
        print("Tất cả học sinh đều có điểm EXP chính xác!")
    else:
        print(f"Phát hiện {len(anomalies)} học sinh bị sai điểm EXP:")
        for a in anomalies:
            print(f"- ID: {a['student_id']}, Tên: {a['student_name']} | Hiện tại: {a['actual_exp']} | Lẽ ra phải là: {a['expected_exp']} (Lệch: {a['diff']})")

if __name__ == "__main__":
    check_student_exp()
