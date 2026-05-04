import os
import sys

sys.path.append("/var/www/minda/student-center/backend")
from app.db.database import SessionLocal
from app.models import *
from app.models.assignment_folder import AssignmentFolder

def do_task():
    db = SessionLocal()
    
    teachers = db.query(User).filter(User.role == "teacher").all()
    teacher = None
    for t in teachers:
        if "ngọc" in t.full_name.lower() and "lê minh" in t.full_name.lower():
            teacher = t
            break
            
    if not teacher:
        print("Teacher 'Nguyễn Lê Minh Ngọc' not found")
        return
        
    print(f"Teacher: {teacher.full_name} (ID: {teacher.id})")
    
    folders = db.query(AssignmentFolder).filter(
        AssignmentFolder.teacher_id == teacher.id
    ).all()
    
    target_folder = None
    for f in folders:
        if "tổng ôn" in f.name.lower() or "ôn tập" in f.name.lower():
            target_folder = f
            break
            
    if not target_folder:
        print("Folder not found.")
        return
        
    print(f"Folder: {target_folder.name} (ID: {target_folder.id})")
    
    assignments = db.query(Assignment).filter(Assignment.folder_id == target_folder.id).order_by(Assignment.id).all()
    
    print(f"Found {len(assignments)} assignments in the folder.")
    for a in assignments:
        print(f"ID: {a.id} - Current Title: {a.title}")
        
    # The new names from the user
    new_names = [
        "Hai đường thẳng vuông góc – Góc giữa hai đường thẳng",
        "Phép chiếu vuông góc – Góc giữa đường thẳng và mặt phẳng",
        "Góc giữa hai mặt phẳng – Chứng minh hai mặt phẳng vuông góc",
        "Góc giữa hai mặt bên – Góc nhị diện",
        "Khoảng cách (phần 1)",
        "Khoảng cách (phần 2)",
        "Thể tích",
        "Cấp số cộng",
        "Cấp số nhân",
        "Phương trình mũ – logarit",
        "Bất phương trình mũ – logarit",
        "Tính xác suất bằng định nghĩa",
        "Các quy tắc tính xác suất",
        "Hàm số lượng giác – Phương trình lượng giác"
    ]
    
    if len(assignments) != len(new_names):
        print(f"WARNING: The number of assignments ({len(assignments)}) does not match the number of new names ({len(new_names)}).")
    
    # We rename them in order
    for idx, a in enumerate(assignments):
        if idx < len(new_names):
            print(f"Renaming [{a.title}] -> [{new_names[idx]}]")
            a.title = new_names[idx]
            
    db.commit()
    print("DONE! Renamed assignments.")

if __name__ == "__main__":
    do_task()
