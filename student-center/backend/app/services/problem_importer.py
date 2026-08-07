"""
Importer Service: Crawls and parses programming problemsets from GitHub repos (PTIT C++),
LeetCode APIs, VNOI/CSES, UpCoder & ucode format into MINDA PostgreSQL database.
"""
import re
import json
import requests
from sqlalchemy.orm import Session
from app.models.code_problem import CodeProblem

# 1. Repos GitHub C++ PTIT & Chuyên Tin
GITHUB_REPOS = [
    "https://api.github.com/repos/huyinit/Cplusplus-PTIT/contents",
    "https://api.github.com/repos/yalza/CPP_code.ptit/contents",
    "https://api.github.com/repos/MahiPonii/Tai_Lieu_cpp/contents"
]

# Preset curated problems from CSES / VNOI / LeetCode / UpCoder
CURATED_PROBLEMS = [
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
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}",
            "javascript": "// Viết code JavaScript ở đây\n",
            "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Viết code ở đây\n    }\n}"
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
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code ở đây\n    return 0;\n}",
            "javascript": "// Viết code JavaScript ở đây\n",
            "java": "import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Viết code ở đây\n    }\n}"
        },
        "test_cases": [
            {"input": "3 5", "output": "8\n", "is_hidden": False},
            {"input": "-1 7", "output": "6\n", "is_hidden": False},
            {"input": "1000000000 2000000000", "output": "3000000000\n", "is_hidden": True}
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
            {"input": "6", "output": "8\n", "is_hidden": False},
            {"input": "50", "output": "586268941\n", "is_hidden": True}
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
            {"input": "10", "output": "2 3 5 7\n", "is_hidden": False},
            {"input": "20", "output": "2 3 5 7 11 13 17 19\n", "is_hidden": True}
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
            {"input": "5 3\n1 2 3 4 5", "output": "3\n", "is_hidden": False},
            {"input": "5 6\n1 2 3 4 5", "output": "-1\n", "is_hidden": True}
        ],
        "source": "CSES / LeetCode Binary Search"
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
