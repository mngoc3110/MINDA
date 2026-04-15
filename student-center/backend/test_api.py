from app.db.database import SessionLocal
from app.api.endpoints.dashboard import get_teacher_stats
from app.models.user import User

db = SessionLocal()
try:
    print("Testing get_teacher_stats endpoint for Admin...")
    current_user = db.query(User).filter_by(email="darber3110@gmail.com").first()
    print("User ID:", current_user.id)
    res = get_teacher_stats(db=db, current_user=current_user)
    print("Success! Response:", res)
except Exception as e:
    import traceback
    traceback.print_exc()

import sys
sys.exit(0)
