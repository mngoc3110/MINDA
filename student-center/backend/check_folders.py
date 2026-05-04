import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import get_db
# Import all models to resolve SQLAlchemy relationships
from app.models import *
from app.models.assignment_folder import AssignmentFolder

def do_task():
    db = next(get_db())
    
    # Print all teachers
    teachers = db.query(User).filter(User.role == "teacher").all()
    for t in teachers:
        print(f"Teacher: {t.full_name} (ID: {t.id}) - Email: {t.email}")
        
    print("-" * 20)
    
    # Print all folders
    folders = db.query(AssignmentFolder).all()
    for f in folders:
        print(f"Folder: {f.name} (ID: {f.id}) - Teacher ID: {f.teacher_id}")

if __name__ == "__main__":
    do_task()
