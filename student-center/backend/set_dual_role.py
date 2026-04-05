"""
Script: Gán dual-role cho darbar3110@gmail.com
Chạy: python set_dual_role.py

Kết quả: email này có role=admin (primary) và secondary_role=teacher
→ Hiển thị trong danh sách giáo viên trên trang chủ
→ Được phép dùng tất cả teacher endpoint (CV, assignments, tuition...)
→ Đăng nhập qua /login → Teacher dashboard  
→ Đăng nhập qua /admin/login → Admin dashboard
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.database import SessionLocal
from app.models.user import User
from sqlalchemy import text

def main():
    db = SessionLocal()
    try:
        # Thêm cột nếu chưa có (chạy an toàn nhiều lần)
        try:
            db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_role VARCHAR"))
            db.commit()
            print("✓ Cột secondary_role đã sẵn sàng")
        except Exception:
            db.rollback()

        # Set dual-role cho các email đặc biệt
        DUAL_ROLE_EMAILS = ["darbar3110@gmail.com", "darber3110@gmail.com"]
        updated = 0
        for email in DUAL_ROLE_EMAILS:
            user = db.query(User).filter(User.email == email).first()
            if user:
                old_secondary = user.secondary_role
                user.secondary_role = "teacher"
                user.is_active = True  # Đảm bảo account active
                db.commit()
                print(f"✓ {email}: role={user.role.value}, secondary_role: {old_secondary or 'None'} → teacher")
                updated += 1
            else:
                print(f"⚠ Không tìm thấy user với email: {email}")

        if updated == 0:
            print("⚠ Không có user nào được cập nhật.")
        else:
            print(f"\n✅ Hoàn thành! {updated} user đã được gán dual-role.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
