import sys
import os
import json
import glob
from datetime import datetime

sys.path.insert(0, "/var/www/minda/student-center/backend")
os.chdir("/var/www/minda/student-center/backend")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.assignment import Assignment
from app.models.assignment_folder import AssignmentFolder
from app.models.user import User

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

# folder chứa JSON
json_dir = "/var/www/minda/student-center/backend/temp_json_toan12"
json_files = glob.glob(os.path.join(json_dir, "*.json"))

TEACHER_ID = 1 # darber3110@gmail.com

print(f"Found {len(json_files)} json files in toan12.")

# Find or create Folder "Toán 12"
folder = db.query(AssignmentFolder).filter(AssignmentFolder.name.ilike("%Toán 12%"), AssignmentFolder.teacher_id == TEACHER_ID).first()
if not folder:
    print("Tao folder Toán 12...")
    folder = AssignmentFolder(name="Toán 12", teacher_id=TEACHER_ID)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    
FOLDER_ID = folder.id

for fpath in json_files:
    fname = os.path.basename(fpath)
    title = fname.replace(".json", "")
    
    with open(fpath, "r", encoding="utf-8") as f:
        try:
            quiz_data = json.load(f)
        except Exception as e:
            print(f"Failed to load {fname}: {e}")
            continue
            
    old = db.query(Assignment).filter(Assignment.title == title, Assignment.folder_id == FOLDER_ID).first()
    if old:
        print(f"Updating existing assignment: {title}")
        old.quiz_data = quiz_data
        old.created_at = datetime.utcnow()
    else:
        print(f"Creating new assignment in Toán 12: {title}")
        new_assign = Assignment(
            teacher_id=TEACHER_ID,
            folder_id=FOLDER_ID,
            title=title,
            assignment_type="quiz",
            exam_format="practice",
            quiz_data=quiz_data,
            max_score=10.0,
            is_assigned_to_all=False
        )
        db.add(new_assign)

db.commit()
print("Thành công! Đã đưa dữ liệu Toán 12 vào DB.")
