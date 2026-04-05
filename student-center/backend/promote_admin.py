import sqlite3
import psycopg2
import sys
import os
from urllib.parse import urlparse

def promote_to_admin(email: str):
    # Try to read DB URI from .env
    db_uri = None
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if line.startswith("SQLALCHEMY_DATABASE_URI"):
                    db_uri = line.split("=")[1].strip().strip('"').strip("'")
                    break

    if db_uri and db_uri.startswith("postgres"):
        # VPS Environment
        print(f"📡 Đang kết nối tới PostgreSQL...")
        # handle postgres:// vs postgresql://
        if db_uri.startswith("postgres://"):
            db_uri = db_uri.replace("postgres://", "postgresql://", 1)
        
        parsed = urlparse(db_uri)
        try:
            conn = psycopg2.connect(
                dbname=parsed.path[1:],
                user=parsed.username,
                password=parsed.password,
                host=parsed.hostname,
                port=parsed.port or 5432
            )
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET role = 'admin' WHERE email = %s", (email,))
            if cursor.rowcount > 0:
                print(f"✅ Đã thăng cấp thành công tài khoản {email} lên làm Admin!")
            else:
                print(f"❌ Không tìm thấy người dùng có email: {email}")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"❌ Lỗi kết nối PostgreSQL: {e}")
    else:
        # Local Environment
        print(f"💻 Đang kết nối tới SQLite (minda_local.db)...")
        if not os.path.exists("minda_local.db"):
            print("❌ Không tìm thấy CSDL minda_local.db")
            return
            
        conn = sqlite3.connect("minda_local.db")
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
        if cursor.rowcount > 0:
            print(f"✅ Đã thăng cấp thành công tài khoản {email} lên làm Admin!")
        else:
            print(f"❌ Không tìm thấy người dùng có email: {email}")
        conn.commit()
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Sử dụng: python promote_admin.py <email_cua_ban>")
        sys.exit(1)
        
    target_email = sys.argv[1]
    promote_to_admin(target_email)
