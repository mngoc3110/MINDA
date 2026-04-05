import sqlite3
from app.core.config import settings

db_path = settings.SQLALCHEMY_DATABASE_URI.replace("sqlite:///", "")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN cv_theme_color VARCHAR DEFAULT '#1a365d'")
    cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN cv_layout VARCHAR DEFAULT 'modern'")
    cursor.execute("ALTER TABLE teacher_profiles ADD COLUMN cv_custom_sections VARCHAR DEFAULT '[]'")
    conn.commit()
    print("Added columns successfully.")
except Exception as e:
    print(f"Error (maybe columns exist): {e}")
finally:
    conn.close()
