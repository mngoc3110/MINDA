import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db
from app.models.user import User

def check_teachers():
    db = next(get_db())
    teachers = db.query(User).filter(User.role == "teacher").all()
    for t in teachers:
        print(f"Teacher: {t.full_name} (ID: {t.id}) - Username: {t.username}")

if __name__ == "__main__":
    check_teachers()
