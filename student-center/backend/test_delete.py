import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.db.database import SessionLocal
from app.models.live_session import LiveSession
from app.models.user import User
from app.models.emotion import EmotionLog

db = SessionLocal()
session = db.query(LiveSession).first()

if not session:
    print("No sessions to delete")
else:
    print(f"Deleting session {session.id} (teacher_id: {session.teacher_id})")
    try:
        db.query(EmotionLog).filter(EmotionLog.session_id == session.id).delete()
        db.delete(session)
        db.commit()
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()

