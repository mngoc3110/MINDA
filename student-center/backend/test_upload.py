from app.core.security import create_access_token
from app.db.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Enrollment, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.file import FileItem
import requests

def test_upload():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No user found")
        return
    token = create_access_token(subject=user.id)
    print("Token:", token)
    
    headers = {"Authorization": f"Bearer {token}"}
    files = {"file": ("test.txt", open("test.txt", "rb"))}
    
    try:
        r = requests.post("http://localhost:8000/api/files/upload", headers=headers, files=files)
        print("Status code:", r.status_code)
        print("Response JSON:", r.json())
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_upload()
