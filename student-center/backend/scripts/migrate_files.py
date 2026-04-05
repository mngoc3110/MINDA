import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "minda_local.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE lessons ADD COLUMN document_url VARCHAR NULL")
        print("Added document_url to lessons.")
    except Exception as e:
        print("Error document_url:", e)

    try:
        cursor.execute("ALTER TABLE assignments ADD COLUMN attachment_url VARCHAR NULL")
        print("Added attachment_url to assignments.")
    except Exception as e:
        print("Error attachment_url:", e)

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
