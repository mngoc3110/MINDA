import sys
import os
sys.path.insert(0, "/var/www/minda/student-center/backend")
os.chdir("/var/www/minda/student-center/backend")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# 1. Tìm user Nguyễn Lê Minh Ngọc
res_user = db.execute(text("SELECT id, email, role FROM users WHERE full_name ILIKE :name"), {"name": "%Nguyễn Lê Minh Ngọc%"}).fetchall()
print("USERS:", res_user)

if res_user:
    u_id = res_user[0][0]
    # 2. Tìm folder "Tổng ôn"
    res_folder = db.execute(text("SELECT id, name FROM assignment_folders WHERE name ILIKE :fname AND teacher_id = :tid"), {"fname": "%Tổng ôn%", "tid": u_id}).fetchall()
    print("FOLDERS:", res_folder)
