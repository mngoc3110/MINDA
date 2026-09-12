import sys
import os

# Đảm bảo đường dẫn import cho app hoạt động
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.code_problem import CodeProblem, CodingExam
from app.models.user import User
import time

def seed_array_exam():
    db: Session = SessionLocal()
    
    try:
        # Lấy hoặc tạo user giáo viên
        teacher = db.query(User).filter(User.email == "admin@minda.edu.vn").first()
        if not teacher:
            teacher = db.query(User).first()
            if not teacher:
                print("Chưa có User nào trong DB để gán là người tạo. Vui lòng tạo User trước.")
                return

        problems_data = [
            "Tính TBC và TBN",
            "Tìm max min",
            "Tìm số nguyên tố",
            "Sắp xếp mảng",
            "Tìm phần tử",
            "Xóa mảng",
            "Chèn mảng",
            "Chèn mảng cố định",
            "Tìm vị trí khoảng cách",
            "Đẳng thức mảng",
            "Tính chất mảng",
            "Tách mảng",
            "Gộp mảng",
            "Sắp xếp mảng lẻ tăng chẵn giảm",
            "Kiểm tra mảng con",
            "Đếm mảng con tăng giảm",
            "Đếm số lượng phần tử",
            "Tổng mảng con"
        ]
        
        problem_ids = []
        for index, title in enumerate(problems_data, start=1):
            slug = f"mang-1-chieu-{index}-{int(time.time())}"
            problem = CodeProblem(
                slug=slug,
                title=f"Bài {index}: {title}",
                description=f"Yêu cầu: Giải quyết bài toán {title} trên mảng 1 chiều.\n\nĐầu vào: N và các phần tử của mảng.\n\nĐầu ra: Kết quả tương ứng.",
                difficulty="medium" if index > 10 else "easy",
                rating=800 + index * 10,
                track="thcs",
                subject="Mảng 1 chiều",
                chapter="Cấu trúc dữ liệu mảng",
                tags=["Mảng 1 chiều", "Luyện tập"],
                constraints=["Thời gian <= 1.0s", "Bộ nhớ <= 256MB"],
                examples=[{"input": "5\n1 2 3 4 5", "output": "Kết quả mẫu", "explanation": "Ví dụ mẫu"}],
                hints=["Đọc kỹ yêu cầu bài toán", "Duyệt qua mảng bằng vòng lặp"],
                starter_code={
                    "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Code của bạn\n    return 0;\n}",
                    "python": "n = int(input())\narr = list(map(int, input().split()))\n# Viết code Python ở đây\n\n"
                },
                test_cases=[],
                source=f"Giáo viên {teacher.full_name or 'MINDA'}"
            )
            db.add(problem)
            db.commit()
            db.refresh(problem)
            problem_ids.append(problem.id)
            print(f"Đã tạo bài: {problem.title}")

        # Tạo Kì thi
        exam_slug = f"ki-thi-mang-1-chieu-{int(time.time())}"
        exam = CodingExam(
            slug=exam_slug,
            title="Kỳ thi Đánh giá năng lực: Mảng 1 chiều",
            description="Kỳ thi gồm 18 bài tập luyện tập chuyên sâu về Mảng 1 chiều.",
            duration_minutes=180,
            track="thcs",
            difficulty="medium",
            total_score=1800,
            tags=["Mảng 1 chiều", "MINDA Contest"],
            problem_ids=problem_ids,
            creator_id=teacher.id,
            is_published=True
        )
        db.add(exam)
        db.commit()
        db.refresh(exam)
        
        print(f"\n=> TẠO KỲ THI THÀNH CÔNG!")
        print(f"Kỳ thi ID: {exam.id}, Title: {exam.title}")

    finally:
        db.close()

if __name__ == "__main__":
    seed_array_exam()
