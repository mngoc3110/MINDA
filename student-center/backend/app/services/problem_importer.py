"""
Importer Service: Crawls and parses programming problemsets from GitHub repos (PTIT C++),
LeetCode APIs, VNOI/CSES, UpCoder & ucode format into MINDA PostgreSQL database.
Includes specific tracks for THCS & THPT Chuyên Tin.
"""
import re
import json
import requests
from sqlalchemy.orm import Session
from app.models.code_problem import CodeProblem

CURATED_PROBLEMS = [
    # --- TIN HỌC TRẺ / CHUYÊN TIN THCS ---
    {
        "slug": "thcs-tong-chu-so",
        "title": "THCS 01: Tính Tổng Các Chữ Số",
        "description": "Cho một số nguyên dương $N$. Hãy tính tổng các chữ số của $N$.\n\n*Ví dụ*: Với $N = 1234$, tổng là $1 + 2 + 3 + 4 = 10$.",
        "difficulty": "easy",
        "rating": 800,
        "track": "thcs",
        "tags": ["Chuyên Tin THCS", "Vòng lặp", "Xử lý số"],
        "constraints": ["$1 \\leq N \\leq 10^{18}$"],
        "examples": [{"input": "1234", "output": "10", "explanation": "1 + 2 + 3 + 4 = 10"}],
        "hints": ["Dùng vòng lặp chia lấy dư cho 10 (% 10 và // 10) hoặc xử lý chuỗi."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "1234", "output": "10\n", "is_hidden": False},
            {"input": "999999999", "output": "81\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "thcs-dem-uoc",
        "title": "THCS 02: Đếm Số Ước Nguyên Dương",
        "description": "Cho số nguyên dương $N$. Hãy đếm xem $N$ có bao nhiêu ước số nguyên dương.\n\n*Ví dụ*: Với $N = 12$, các ước là $\{1, 2, 3, 4, 6, 12\} \\rightarrow$ có 6 ước.",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "tags": ["Chuyên Tin THCS", "Số học", "Vòng lặp"],
        "constraints": ["$1 \\leq N \\leq 10^9$"],
        "examples": [{"input": "12", "output": "6", "explanation": "Các ước là 1, 2, 3, 4, 6, 12."}],
        "hints": ["Chỉ cần duyệt từ 1 đến sqrt(N) để đạt $O(\\sqrt{N})$."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "12", "output": "6\n", "is_hidden": False},
            {"input": "100", "output": "9\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "thcs-xau-doi-xung",
        "title": "THCS 03: Kiểm Tra Xâu Đối Xúng (Palindrome)",
        "description": "Cho một xâu kí tự $S$ gồm các chữ cái tiếng Anh viết thường.\n\nHãy kiểm tra xem xâu $S$ có phải là xâu đối xứng hay không. In ra `YES` nếu đúng, ngược lại in `NO`.",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "tags": ["Chuyên Tin THCS", "Xâu ký tự"],
        "constraints": ["Độ dài xâu $S \\leq 1000$"],
        "examples": [
            {"input": "radar", "output": "YES", "explanation": "Đọc xuôi hay ngược đều là radar."},
            {"input": "minda", "output": "NO", "explanation": "Đọc ngược là adnim."}
        ],
        "hints": ["So sánh ký tự đầu và cuối tiến dần vào giữa."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "radar", "output": "YES\n", "is_hidden": False},
            {"input": "minda", "output": "NO\n", "is_hidden": False}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },

    # --- CHUYÊN TIN THPT & HỌC SINH GIỎI QUỐC GIA (VOI) ---
    {
        "slug": "thpt-day-con-tang-dai-nhat",
        "title": "THPT 01: Dãy Con Tăng Dài Nhất (LIS)",
        "description": "Cho mảng $A$ gồm $N$ số nguyên.\n\nHãy tìm độ dài của dãy con tăng dài nhất (không nhất thiết liên tiếp).\n\n*Ví dụ*: Mảng $[10, 9, 2, 5, 3, 7, 101, 18]$ có dãy con tăng dài nhất là $[2, 3, 7, 101] \\rightarrow$ độ dài 4.",
        "difficulty": "medium",
        "rating": 1350,
        "track": "thpt",
        "tags": ["Chuyên Tin THPT", "Quy hoạch động", "Binary Search"],
        "constraints": ["$1 \\leq N \\leq 10^5$", "$-10^9 \\leq A_i \\leq 10^9$"],
        "examples": [{"input": "8\n10 9 2 5 3 7 101 18", "output": "4", "explanation": "Dãy con [2, 3, 7, 101] độ dài 4."}],
        "hints": ["Dùng Quy hoạch động kết hợp Tìm kiếm nhị phân $O(N \\log N)$."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "8\n10 9 2 5 3 7 101 18", "output": "4\n", "is_hidden": False}
        ],
        "source": "HSG THPT / VOI"
    },
    {
        "slug": "thpt-do-thi-duong-di-ngan-nhat",
        "title": "THPT 02: Đường Đi Ngắn Nhất (Dijkstra)",
        "description": "Cho đồ thị có hướng gồm $N$ đỉnh và $M$ cạnh có trọng số không âm.\n\nHãy tìm độ dài đường đi ngắn nhất từ đỉnh 1 đến tất cả các đỉnh còn lại từ $1$ đến $N$.\nNếu không thể đến đỉnh $i$, in ra `-1`.",
        "difficulty": "hard",
        "rating": 1500,
        "track": "thpt",
        "tags": ["Chuyên Tin THPT", "Đồ thị", "Dijkstra"],
        "constraints": ["$1 \\leq N, M \\leq 10^5$", "Trọng số $W_i \\geq 0$"],
        "examples": [{"input": "3 3\n1 2 5\n2 3 3\n1 3 10", "output": "0 5 8", "explanation": "Khoảng cách từ 1->1: 0, 1->2: 5, 1->3: 1->2->3 (5+3=8)."}],
        "hints": ["Dùng hàng đợi ưu tiên std::priority_queue (Min Heap)."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "3 3\n1 2 5\n2 3 3\n1 3 10", "output": "0 5 8\n", "is_hidden": False}
        ],
        "source": "Đề Thi Học Sinh Giỏi THPT"
    },

    # --- CLASSIC PRESETS ---
    {
        "slug": "hello-world",
        "title": "Hello, World!",
        "description": "In ra màn hình dòng chữ **Hello, World!** (không có dấu cách thừa, xuống dòng sau khi in).",
        "difficulty": "easy",
        "rating": 800,
        "track": "basic",
        "tags": ["I/O cơ bản", "C++", "Python"],
        "constraints": ["Không có input", "Output: Hello, World!"],
        "examples": [{"input": "(không có)", "output": "Hello, World!", "explanation": "In đúng chuỗi yêu cầu."}],
        "hints": ["Dùng print() trong Python, cout trong C++."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [{"input": "", "output": "Hello, World!\n", "is_hidden": False}],
        "source": "MINDA Classic"
    },
    {
        "slug": "sum-two",
        "title": "Tổng Hai Số Nguyên",
        "description": "Cho hai số nguyên $a$ và $b$ trên cùng một dòng, cách nhau bởi dấu cách.\n\nIn ra giá trị $a + b$.",
        "difficulty": "easy",
        "rating": 850,
        "track": "basic",
        "tags": ["Toán", "I/O", "PTIT"],
        "constraints": ["$-10^9 \\leq a, b \\leq 10^9$", "1 dòng input gồm 2 số nguyên"],
        "examples": [
            {"input": "3 5", "output": "8", "explanation": "3 + 5 = 8"},
            {"input": "-1 7", "output": "6", "explanation": "-1 + 7 = 6"}
        ],
        "hints": ["Nhập 2 số từ stdin.", "Cộng chúng lại và in ra."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "3 5", "output": "8\n", "is_hidden": False},
            {"input": "-1 7", "output": "6\n", "is_hidden": False}
        ],
        "source": "PTIT C++ (CPP0101)"
    },
    {
        "slug": "fibo",
        "title": "Số Fibonacci Thứ N",
        "description": "Cho số nguyên $N$. Hãy tính số Fibonacci thứ $N$.\n\nDãy Fibonacci: $F(1) = 1, F(2) = 1, F(n) = F(n-1) + F(n-2)$ với $n \\geq 3$.\n\nIn ra kết quả theo modulo $10^9 + 7$.",
        "difficulty": "medium",
        "rating": 1100,
        "track": "basic",
        "tags": ["DP", "Đệ quy", "PTIT"],
        "constraints": ["$1 \\leq N \\leq 10^6$"],
        "examples": [{"input": "6", "output": "8", "explanation": "F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8"}],
        "hints": ["Dùng Quy hoạch động 1D hoặc 2 biến lưu vết để đạt độ phức tạp O(N)."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "6", "output": "8\n", "is_hidden": False}
        ],
        "source": "PTIT C++ (CPP0105)"
    },
    {
        "slug": "prime-sieve",
        "title": "Sàng Nguyên Tố Eratosthenes",
        "description": "Cho số nguyên $N$. Hãy liệt kê tất cả các số nguyên tố không vượt quá $N$.\n\nCác số nguyên tố được in trên cùng một dòng, cách nhau bởi một khoảng trắng.",
        "difficulty": "medium",
        "rating": 1200,
        "track": "cs",
        "tags": ["Số học", "Sàng Nguyên Tố", "VNOI"],
        "constraints": ["$2 \\leq N \\leq 10^6$"],
        "examples": [{"input": "10", "output": "2 3 5 7", "explanation": "Các số nguyên tố <= 10 là 2, 3, 5, 7."}],
        "hints": ["Sử dụng thuật toán Sàng Eratosthenes với độ phức tạp O(N log log N)."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "10", "output": "2 3 5 7\n", "is_hidden": False}
        ],
        "source": "VNOI / PTIT"
    },
    {
        "slug": "binary-search",
        "title": "Tìm Kiếm Nhị Phân",
        "description": "Cho mảng $A$ gồm $N$ số nguyên đã được sắp xếp tăng dần và một số nguyên $K$.\n\nHãy tìm vị trí (chỉ số bắt đầu từ 1) của $K$ trong mảng. Nếu không tìm thấy, in ra `-1`.",
        "difficulty": "medium",
        "rating": 1150,
        "track": "cs",
        "tags": ["Tìm kiếm", "Binary Search", "CSES"],
        "constraints": ["$1 \\leq N \\leq 10^5$", "$-10^9 \\leq A_i, K \\leq 10^9$"],
        "examples": [{"input": "5 3\n1 2 3 4 5", "output": "3", "explanation": "Số 3 đứng ở vị trí thứ 3 trong mảng."}],
        "hints": ["Sử dụng Tìm kiếm nhị phân O(log N)."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "5 3\n1 2 3 4 5", "output": "3\n", "is_hidden": False}
        ],
        "source": "CSES / LeetCode"
    },
    {
        "slug": "dp-knapsack",
        "title": "Bài Toán Cái Túi (0/1 Knapsack)",
        "description": "Cho $N$ đồ vật, đồ vật thứ $i$ có khối lượng $W_i$ và giá trị $V_i$.\n\nHãy chọn các đồ vật sao cho tổng khối lượng không vượt quá sức chứa $S$ của cái túi và tổng giá trị thu được là lớn nhất.",
        "difficulty": "hard",
        "rating": 1400,
        "track": "competitive",
        "tags": ["Quy hoạch động", "Knapsack", "VOI"],
        "constraints": ["$1 \\leq N \\leq 1000$", "$1 \\leq S \\leq 1000$"],
        "examples": [{"input": "3 4\n1 15\n3 20\n4 30", "output": "35", "explanation": "Chọn đồ vật 1 (W=1, V=15) và đồ vật 2 (W=3, V=20). Tổng W=4 <= 4, Tổng V=35."}],
        "hints": ["Gọi dp[i][j] là giá trị lớn nhất khi xét i đồ vật đầu tiên với sức chứa j."],
        "starter_code": {
            "python": "# Viết code Python ở đây\n\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "3 4\n1 15\n3 20\n4 30", "output": "35\n", "is_hidden": False}
        ],
        "source": "VNOI / UpCoder / ucode"
    }
]

def seed_code_problems(db: Session):
    """Seed / sync standard curated problemsets into DB."""
    count = 0
    for prob_data in CURATED_PROBLEMS:
        existing = db.query(CodeProblem).filter(CodeProblem.slug == prob_data["slug"]).first()
        if not existing:
            prob = CodeProblem(**prob_data)
            db.add(prob)
            count += 1
    db.commit()
    print(f"[Problem Importer] ✅ Successfully seeded {count} standard coding problems.")
    return count
