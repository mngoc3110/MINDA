from app.db.database import SessionLocal
from app.models.user import TeacherStudentLink

db = SessionLocal()
try:
    print("Testing query...")
    count = db.query(TeacherStudentLink).count()
    print("TeacherStudentLink Count:", count)
except Exception as e:
    import traceback
    traceback.print_exc()

import sys
sys.exit(0)
