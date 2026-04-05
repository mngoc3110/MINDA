import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'minda_local.db')

def upgrade_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Creating teacher_student_links...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS teacher_student_links (
        id INTEGER NOT NULL PRIMARY KEY,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        status VARCHAR DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(student_id) REFERENCES users (id),
        FOREIGN KEY(teacher_id) REFERENCES users (id)
    )
    """)
    
    print("Checking if tuition_records needs alter...")
    # Check if course_id is nullable
    cursor.execute("PRAGMA table_info(tuition_records)")
    columns = cursor.fetchall()
    course_id_col = next((c for c in columns if c[1] == 'course_id'), None)
    
    if course_id_col and course_id_col[3] != 0: # 3 is notnull flag
        print("Altering tuition_records to make course_id NULLABLE...")
        cursor.execute("ALTER TABLE tuition_records RENAME TO tuition_records_old;")
        cursor.execute("""
        CREATE TABLE tuition_records (
            id INTEGER NOT NULL PRIMARY KEY,
            student_id INTEGER NOT NULL,
            course_id INTEGER,
            amount INTEGER NOT NULL,
            paid_amount INTEGER,
            status VARCHAR DEFAULT 'pending',
            due_date DATETIME,
            paid_at DATETIME,
            note TEXT,
            created_at DATETIME,
            FOREIGN KEY(student_id) REFERENCES users (id),
            FOREIGN KEY(course_id) REFERENCES courses (id)
        )
        """)
        cursor.execute("INSERT INTO tuition_records SELECT * FROM tuition_records_old;")
        cursor.execute("DROP TABLE tuition_records_old;")
        print("Alter completed.")
    else:
        print("course_id is already nullable or table not found.")

    conn.commit()
    conn.close()
    print("Database upgrade finished!")

if __name__ == '__main__':
    upgrade_db()
