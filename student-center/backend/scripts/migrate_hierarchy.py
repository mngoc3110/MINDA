import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "minda_local.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Tạo bảng course_chapters
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS course_chapters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            course_id INTEGER NOT NULL,
            title VARCHAR NOT NULL,
            order_index INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    """)

    print("Created course_chapters table.")

    # 2. Tạo bảng lessons mới, thay thế bảng cũ
    cursor.execute("DROP TABLE IF EXISTS lessons_new")
    cursor.execute("""
        CREATE TABLE lessons_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chapter_id INTEGER NOT NULL,
            title VARCHAR NOT NULL,
            description VARCHAR,
            video_url VARCHAR,
            order_index INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            FOREIGN KEY (chapter_id) REFERENCES course_chapters(id)
        )
    """)
    print("Created lessons_new table.")

    # Drop old lessons and rename
    try:
        cursor.execute("DROP TABLE IF EXISTS lessons")
        cursor.execute("ALTER TABLE lessons_new RENAME TO lessons")
        print("Replaced lessons table.")
    except Exception as e:
        print("Error replacing lessons:", e)

    # 3. Alter Assignments to add lesson_id
    try:
        cursor.execute("ALTER TABLE assignments ADD COLUMN lesson_id INTEGER NULL REFERENCES lessons(id)")
        print("Added lesson_id to assignments.")
    except sqlite3.OperationalError:
        print("lesson_id already exists in assignments or other error.")

    # 4. Alter Exams to add lesson_id
    try:
        cursor.execute("ALTER TABLE exams ADD COLUMN lesson_id INTEGER NULL REFERENCES lessons(id)")
        print("Added lesson_id to exams.")
    except sqlite3.OperationalError:
        print("lesson_id already exists in exams or other error.")

    conn.commit()
    conn.close()
    print("Migration successful.")

if __name__ == "__main__":
    migrate()
