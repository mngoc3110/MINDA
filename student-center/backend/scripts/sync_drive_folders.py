import os
import sys

# Đảm bảo import được các module của app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.course import Course, Enrollment, Lesson, LessonProgress
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.exam import Exam, ExamQuestion, ExamSubmission
from app.models.live_session import LiveSession
from app.models.tuition import TuitionRecord
from app.models.file import FileItem
from app.core.drive_service import drive_service

def sync_folders():
    db = SessionLocal()
    users = db.query(User).all()

    if not drive_service.service or not drive_service.folder_id:
        print("Vui lòng cấu hình drive_credentials.json trước khi chạy.")
        return

    print(f"Bắt đầu đồng bộ thư mục cho {len(users)} tài khoản...")
    for user in users:
        role_label = str(user.role.value).upper()
        folder_name = f"[{role_label}] {user.full_name} - ID_{user.id}"
        
        print(f"Đang kiểm tra/tạo thư mục: {folder_name}...")
        try:
            folder_id = drive_service._find_or_create_sub_folder(folder_name, drive_service.folder_id)
            print(f"✅ Hoàn tất cho {user.email} -> Folder ID: {folder_id}")
        except Exception as e:
            print(f"❌ Lỗi tự động tạo thư mục cho user {user.id}: {e}")

    db.close()
    print("Hoàn tất quá trình đồng bộ!")

if __name__ == "__main__":
    sync_folders()
