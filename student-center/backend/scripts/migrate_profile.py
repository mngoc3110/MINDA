import sqlite3
import os

DB_PATH = 'minda_local.db'

def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        print("Migrating User table (avatar_url, cover_url)...")
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR")
        cursor.execute("ALTER TABLE users ADD COLUMN cover_url VARCHAR")
    except sqlite3.OperationalError as e:
        print(f"User table already updated or error: {e}")

    try:
        print("Migrating files table (file_category)...")
        cursor.execute("ALTER TABLE files ADD COLUMN file_category VARCHAR DEFAULT 'general'")
    except sqlite3.OperationalError as e:
        print(f"Files table already updated or error: {e}")

    conn.commit()
    conn.close()
    print("Migration finished securely!")

if __name__ == "__main__":
    run_migration()
