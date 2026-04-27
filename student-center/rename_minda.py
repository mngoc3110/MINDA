import sys
import os
import json
import re

sys.path.insert(0, "/var/www/minda/student-center/backend")
os.chdir("/var/www/minda/student-center/backend")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.assignment import Assignment
from app.models.assignment_folder import AssignmentFolder

DATABASE_URL = "postgresql://minda_user:minda123@localhost/minda_db"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

FOLDER_ID = 4 # Tổng ôn

theme_titles = {}
try:
    with open("/var/www/minda/student-center/backend/theme_titles.json", "r", encoding="utf-8") as f:
        theme_titles = json.load(f)
except Exception as e:
    print("Failed to load JSON titles:", e)
    sys.exit(1)

assignments = db.query(Assignment).filter(Assignment.folder_id == FOLDER_ID).all()

for assign in assignments:
    # `assign.title` expects to be like "[Tài liệu buổi học] BON2026-STEP 4-Tổng ôn Theme 3"
    old_title = assign.title
    
    # Try to extract the literal "Theme X" part
    match = re.search(r'(Theme\s*\\d+)', old_title, re.IGNORECASE)
    if not match:
        continue
    theme_identifier = match.group(1).title() # e.g. "Theme 1"
    
    # Lookup in our map
    new_tail = theme_titles.get(old_title, None)
    if not new_tail:
        # fuzzy match
        for key, val in theme_titles.items():
            if theme_identifier.lower() in key.lower():
                new_tail = val
                break
                
    if new_tail:
        # e.g., "Theme 1 - Hai đường thẳng vuông góc"
        new_title = f"{theme_identifier} - {new_tail}"
        print(f"Renaming: '{old_title}' -> '{new_title}'")
        assign.title = new_title

db.commit()
print("Done renaming!")
