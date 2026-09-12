import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.code_problem import CodeProblem

def fix_b6():
    db: Session = SessionLocal()
    try:
        problems = db.query(CodeProblem).filter(
            (CodeProblem.slug == "string-cpp-xoa-ki-tu") |
            (CodeProblem.title.like("%Xóa kí tự%"))
        ).all()

        if not problems:
            print("Không tìm thấy bài tập Xóa kí tự.")
            return

        for p in problems:
            print(f"Đang sửa bài ID: {p.id}, Title: {p.title}")
            
            # Sửa ví dụ mẫu
            ex_list = p.examples or []
            for ex in ex_list:
                if "n pple" in ex.get("output", ""):
                    ex["output"] = "n pple  dy keeps the doctor wy!"
            p.examples = list(ex_list)

            # Sửa test cases
            tc_list = p.test_cases or []
            updated = False
            for tc in tc_list:
                if "n pple" in tc.get("output", ""):
                    tc["output"] = "n pple  dy keeps the doctor wy!\n"
                    updated = True
            
            if updated or ex_list:
                p.test_cases = list(tc_list)
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(p, "test_cases")
                flag_modified(p, "examples")
                print(f"-> Đã sửa thành công Test 1 về 2 khoảng trắng cho bài ID {p.id}")

        db.commit()
        print("\n=> TẤT CẢ ĐÃ ĐƯỢC LƯU VÀO DATABASE THÀNH CÔNG!")
    finally:
        db.close()

if __name__ == "__main__":
    fix_b6()
