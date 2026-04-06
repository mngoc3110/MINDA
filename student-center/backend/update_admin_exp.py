from app.db.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "darber3110@gmail.com").first()
if user:
    user.exp_points = 99999999
    db.commit()
    print("Successfully updated darber3110@gmail.com EXP to 99999999!")
else:
    print("User darber3110@gmail.com not found!")
db.close()
