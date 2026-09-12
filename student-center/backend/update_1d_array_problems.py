import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.code_problem import CodeProblem, CodingExam
from app.models.user import User

def update_problems():
    db: Session = SessionLocal()
    try:
        # Lấy kỳ thi vừa tạo (Kỳ thi Đánh giá năng lực: Mảng 1 chiều) có ID = 9 (hoặc lấy kì thi mới nhất)
        exam = db.query(CodingExam).filter(CodingExam.title == "Kỳ thi Đánh giá năng lực: Mảng 1 chiều").order_by(CodingExam.id.desc()).first()
        if not exam or not exam.problem_ids:
            print("Không tìm thấy kỳ thi hoặc kỳ thi không có bài tập.")
            return

        problem_ids = exam.problem_ids
        problems = db.query(CodeProblem).filter(CodeProblem.id.in_(problem_ids)).all()

        details = {
            "Tính TBC và TBN": {
                "desc": "Cho mảng 1 chiều gồm $N$ phần tử nguyên dương. Hãy tính Trung bình cộng (TBC) và Trung bình nhân (TBN) của các phần tử trong mảng.\n\n**Đầu vào:**\n- Dòng 1: Số nguyên dương $N$ ($1 \le N \le 10^3$).\n- Dòng 2: $N$ số nguyên dương $A_i$ ($1 \le A_i \le 10^5$).\n\n**Đầu ra:**\n- In ra hai số thực (làm tròn đến 2 chữ số thập phân) là TBC và TBN, cách nhau một khoảng trắng.",
                "example_in": "4\n1 2 3 4",
                "example_out": "2.50 2.21"
            },
            "Tìm max min": {
                "desc": "Cho mảng 1 chiều gồm $N$ phần tử số nguyên. Hãy tìm giá trị lớn nhất (MAX) và nhỏ nhất (MIN) trong mảng, đồng thời in ra vị trí (chỉ số) xuất hiện đầu tiên của chúng (chỉ số bắt đầu từ 0).\n\n**Đầu vào:**\n- Dòng 1: Số nguyên $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$ ($-10^9 \le A_i \le 10^9$).\n\n**Đầu ra:**\n- Dòng 1: Giá trị MAX và vị trí của nó.\n- Dòng 2: Giá trị MIN và vị trí của nó.",
                "example_in": "5\n4 2 9 1 5",
                "example_out": "9 2\n1 3"
            },
            "Tìm số nguyên tố": {
                "desc": "Cho mảng 1 chiều gồm $N$ số nguyên dương. Hãy đếm xem có bao nhiêu số nguyên tố trong mảng và liệt kê chúng theo thứ tự xuất hiện.\n\n**Đầu vào:**\n- Dòng 1: Số nguyên dương $N$ ($1 \le N \le 10^4$).\n- Dòng 2: $N$ số nguyên dương $A_i$ ($1 \le A_i \le 10^6$).\n\n**Đầu ra:**\n- Dòng 1: Số lượng số nguyên tố tìm được.\n- Dòng 2: Các số nguyên tố, cách nhau một khoảng trắng. Nếu không có số nguyên tố nào, in ra -1.",
                "example_in": "6\n4 2 7 9 11 15",
                "example_out": "3\n2 7 11"
            },
            "Sắp xếp mảng": {
                "desc": "Cho một mảng $A$ gồm $N$ số nguyên. Hãy sắp xếp mảng theo thứ tự tăng dần.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- Mảng $A$ sau khi được sắp xếp tăng dần.",
                "example_in": "5\n5 3 2 4 1",
                "example_out": "1 2 3 4 5"
            },
            "Tìm phần tử": {
                "desc": "Cho mảng $A$ gồm $N$ phần tử và một số nguyên $X$. Hãy kiểm tra xem $X$ có xuất hiện trong mảng hay không. Nếu có, hãy in ra vị trí xuất hiện đầu tiên và cuối cùng của $X$ (chỉ số từ 0). Nếu không, in ra `-1`.\n\n**Đầu vào:**\n- Dòng 1: Hai số $N$ và $X$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- Vị trí đầu tiên và cuối cùng của $X$. Nếu không tìm thấy thì in `-1`.",
                "example_in": "6 3\n1 3 2 3 4 3",
                "example_out": "1 5"
            },
            "Xóa mảng": {
                "desc": "Cho mảng $A$ gồm $N$ phần tử. Cần xóa phần tử tại vị trí chỉ số $K$ (0-indexed) khỏi mảng.\n\n**Đầu vào:**\n- Dòng 1: Hai số $N$ và $K$ ($0 \le K < N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- In ra mảng sau khi xóa phần tử tại vị trí $K$.",
                "example_in": "5 2\n10 20 30 40 50",
                "example_out": "10 20 40 50"
            },
            "Chèn mảng": {
                "desc": "Cho một mảng $A$ gồm $N$ số nguyên đã được **sắp xếp tăng dần**. Bạn được cho thêm một giá trị $X$. Hãy chèn $X$ vào mảng sao cho mảng vẫn giữ nguyên thứ tự tăng dần mà không cần phải gọi hàm sắp xếp lại toàn bộ mảng.\n\n**Đầu vào:**\n- Dòng 1: Hai số $N$ và $X$.\n- Dòng 2: $N$ số nguyên $A_i$ (đã sắp xếp tăng dần).\n\n**Đầu ra:**\n- Mảng sau khi chèn $X$.",
                "example_in": "4 5\n1 3 6 8",
                "example_out": "1 3 5 6 8"
            },
            "Chèn mảng cố định": {
                "desc": "Cho mảng $A$ gồm $N$ phần tử. Bạn cần chèn số $X$ vào vị trí chỉ số $K$ ($0 \le K \le N$) trong mảng.\n\n**Đầu vào:**\n- Dòng 1: $N, X, K$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- In ra mảng $A$ sau khi đã chèn $X$ vào vị trí $K$.",
                "example_in": "4 99 2\n10 20 30 40",
                "example_out": "10 20 99 30 40"
            },
            "Tìm vị trí khoảng cách": {
                "desc": "Cho mảng $A$ gồm $N$ số nguyên. Hãy tìm độ chênh lệch (khoảng cách giá trị tuyệt đối) lớn nhất giữa hai phần tử liền kề trong mảng, và in ra vị trí của hai phần tử đó.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($2 \le N \le 10^5$).\n- Dòng 2: $N$ phần tử của mảng.\n\n**Đầu ra:**\n- Giá trị chênh lệch lớn nhất và 2 chỉ số liền kề $i, i+1$ tạo ra chênh lệch đó.",
                "example_in": "5\n1 5 3 9 2",
                "example_out": "7 3 4"
            },
            "Đẳng thức mảng": {
                "desc": "Cho hai mảng $A$ và $B$ có cùng kích thước $N$. Hãy kiểm tra xem hai mảng này có hoàn toàn giống nhau hay không (các phần tử tại cùng vị trí phải bằng nhau).\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n- Dòng 3: $N$ phần tử mảng $B$.\n\n**Đầu ra:**\n- In ra `YES` nếu hai mảng giống nhau, ngược lại in ra `NO`.",
                "example_in": "3\n1 2 3\n1 2 3",
                "example_out": "YES"
            },
            "Tính chất mảng": {
                "desc": "Kiểm tra xem mảng $A$ độ dài $N$ có tính chất **đối xứng** hay không (đọc từ trái sang phải giống hệt từ phải sang trái).\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- In ra `YES` nếu mảng đối xứng, ngược lại in ra `NO`.",
                "example_in": "5\n1 2 3 2 1",
                "example_out": "YES"
            },
            "Tách mảng": {
                "desc": "Cho mảng $A$ gồm $N$ số nguyên. Hãy tách mảng $A$ thành hai mảng: mảng $B$ chỉ chứa các số chẵn, và mảng $C$ chỉ chứa các số lẻ. Hãy giữ nguyên thứ tự xuất hiện ban đầu.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- Dòng 1: Các phần tử của mảng $B$ (số chẵn).\n- Dòng 2: Các phần tử của mảng $C$ (số lẻ).",
                "example_in": "6\n1 2 3 4 5 6",
                "example_out": "2 4 6\n1 3 5"
            },
            "Gộp mảng": {
                "desc": "Cho hai mảng $A$ (kích thước $N$) và $B$ (kích thước $M$) đều đã được sắp xếp tăng dần. Hãy gộp hai mảng này thành mảng $C$ sao cho $C$ vẫn giữ nguyên tính chất tăng dần.\n\n**Đầu vào:**\n- Dòng 1: $N, M$ ($1 \le N, M \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n- Dòng 3: $M$ phần tử mảng $B$.\n\n**Đầu ra:**\n- In ra mảng $C$ sau khi gộp.",
                "example_in": "3 4\n1 3 5\n2 4 6 8",
                "example_out": "1 2 3 4 5 6 8"
            },
            "Sắp xếp mảng lẻ tăng chẵn giảm": {
                "desc": "Cho mảng $A$ gồm $N$ phần tử. Hãy sắp xếp các số **lẻ** trong mảng theo thứ tự **tăng dần** và các số **chẵn** trong mảng theo thứ tự **giảm dần**. Vị trí của số chẵn và số lẻ không thay đổi.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ số nguyên $A_i$.\n\n**Đầu ra:**\n- In ra mảng sau khi sắp xếp thỏa mãn điều kiện.",
                "example_in": "5\n4 1 2 5 3",
                "example_out": "4 1 2 3 5"
            },
            "Kiểm tra mảng con": {
                "desc": "Cho mảng $A$ (kích thước $N$) và mảng $B$ (kích thước $M$). Hãy kiểm tra xem mảng $A$ có phải là mảng con liên tiếp của mảng $B$ hay không.\n\n**Đầu vào:**\n- Dòng 1: $N$ và $M$ ($1 \le N \le M \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n- Dòng 3: $M$ phần tử mảng $B$.\n\n**Đầu ra:**\n- In ra `YES` nếu $A$ là mảng con của $B$, ngược lại in `NO`.",
                "example_in": "3 6\n2 3 4\n1 2 3 4 5 6",
                "example_out": "YES"
            },
            "Đếm mảng con tăng giảm": {
                "desc": "Cho mảng $A$ kích thước $N$. Một mảng con liên tiếp được gọi là \"mảng con tăng\" nếu độ dài $\ge 2$ và các phần tử trong đó xếp theo thứ tự tăng dần ngặt. Hãy đếm số lượng các mảng con liên tiếp tăng có độ dài dài nhất.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n\n**Đầu ra:**\n- Dòng 1: Độ dài mảng con tăng dài nhất.\n- Dòng 2: Số lượng mảng con đạt độ dài đó.",
                "example_in": "7\n1 2 3 1 2 3 1",
                "example_out": "3\n2"
            },
            "Đếm số lượng phần tử": {
                "desc": "Cho mảng $A$ kích thước $N$. Hãy đếm tần suất xuất hiện của từng phần tử trong mảng và in ra theo thứ tự tăng dần của giá trị phần tử.\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n\n**Đầu ra:**\n- Liệt kê mỗi phần tử và số lần xuất hiện của nó (mỗi phần tử trên 1 dòng).",
                "example_in": "6\n4 2 2 4 4 1",
                "example_out": "1 1\n2 2\n4 3"
            },
            "Tổng mảng con": {
                "desc": "Cho mảng $A$ kích thước $N$ gồm các số nguyên (có thể có số âm). Hãy tìm mảng con liên tiếp có tổng các phần tử lớn nhất (Thuật toán Kadane).\n\n**Đầu vào:**\n- Dòng 1: $N$ ($1 \le N \le 10^5$).\n- Dòng 2: $N$ phần tử mảng $A$.\n\n**Đầu ra:**\n- In ra tổng lớn nhất tìm được.",
                "example_in": "5\n-2 3 4 -1 2",
                "example_out": "8"
            }
        }

        updated_count = 0
        for p in problems:
            # Lấy tên bài bỏ đi phần tiền tố "Bài X: "
            title_core = p.title.split(": ", 1)[-1].strip()
            
            if title_core in details:
                p.description = details[title_core]["desc"]
                p.examples = [
                    {
                        "input": details[title_core]["example_in"],
                        "output": details[title_core]["example_out"],
                        "explanation": "Ví dụ mẫu của bài toán."
                    }
                ]
                updated_count += 1
                print(f"Đã cập nhật chi tiết cho bài: {title_core}")
            else:
                print(f"Không tìm thấy định nghĩa cho: {title_core}")
                
        db.commit()
        print(f"\n=> ĐÃ CẬP NHẬT CHI TIẾT THÀNH CÔNG CHO {updated_count} BÀI TẬP!")

    finally:
        db.close()

if __name__ == "__main__":
    update_problems()
