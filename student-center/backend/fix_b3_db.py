import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.code_problem import CodeProblem

def fix_b3():
    db: Session = SessionLocal()
    try:
        problems = db.query(CodeProblem).filter(
            (CodeProblem.slug == "string-cpp-dem-so-luong-ki-tu") |
            (CodeProblem.title.like("%Đếm số lượng kí tự%"))
        ).all()

        if not problems:
            print("Không tìm thấy bài tập Đếm số lượng kí tự.")
            return

        for p in problems:
            print(f"Đang sửa bài ID: {p.id}, Title: {p.title}")
            tc_list = p.test_cases or []
            updated = False
            for tc in tc_list:
                if "C++ is #1" in tc.get("input", ""):
                    tc["output"] = "3 1 5\n"
                    updated = True
            
            if updated:
                p.test_cases = list(tc_list)
                # Đánh dấu đã thay đổi cho SQLAlchemy JSON
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(p, "test_cases")
                print(f"-> Đã sửa thành công Test 5 thành '3 1 5' cho bài ID {p.id}")

        db.commit()
        print("\n=> TẤT CẢ ĐÃ ĐƯỢC LƯU VÀO DATABASE THÀNH CÔNG!")
    finally:
        db.close()

if __name__ == "__main__":
    fix_b3()
