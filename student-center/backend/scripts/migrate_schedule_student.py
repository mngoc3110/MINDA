import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'minda_local.db')

def upgrade_db():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Checking if schedule_items needs student_id column...")
    cursor.execute("PRAGMA table_info(schedule_items)")
    columns = cursor.fetchall()
    student_id_col = next((c for c in columns if c[1] == 'student_id'), None)
    
    if not student_id_col:
        print("Altering schedule_items to add student_id column...")
        cursor.execute("ALTER TABLE schedule_items ADD COLUMN student_id INTEGER REFERENCES users(id);")
        print("Alter completed.")
    else:
        print("student_id column already exists in schedule_items.")

    conn.commit()
    conn.close()
    print("Database upgrade finished!")

if __name__ == '__main__':
    upgrade_db()
