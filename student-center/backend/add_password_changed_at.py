from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP"
    ))
    conn.commit()
    print("Column password_changed_at added OK")
