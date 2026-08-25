"""
Importer Service: Crawls and parses programming problemsets into MINDA PostgreSQL database.
Chuẩn hóa chi tiết đề bài theo chuẩn VNOI / LeetCode / Codeforces.
"""
import re
import json
from sqlalchemy.orm import Session
from app.models.code_problem import CodeProblem

CURATED_PROBLEMS = [
    # ─── 1. TIN HỌC CƠ BẢN: NHẬP / XUẤT & TOÁN HỌC ──────────────────────────────
    {
        "slug": "hello-world",
        "title": "[Nhập Xuất] Hello, World!",
        "description": """### Mô Tả Bài Toán
Viết chương trình in ra màn hình dòng chữ `Hello, World!` chính xác từng ký tự và dấu cách.

### Định Dạng Đầu Vào (Input)
- Không có dữ liệu đầu vào.

### Định Dạng Đầu Ra (Output)
- In ra một dòng duy nhất chứa chuỗi `Hello, World!` (xuống dòng sau khi in).
""",
        "difficulty": "easy",
        "rating": 800,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["Nhập xuất cơ bản", "C++", "Python"],
        "constraints": ["Thời gian thực thi $\\leq 1.0$ giây", "Bộ nhớ $\\leq 256$ MB"],
        "examples": [
            {
                "input": "",
                "output": "Hello, World!",
                "explanation": "Chương trình in ra đúng chuỗi 'Hello, World!'."
            }
        ],
        "hints": [
            "Trong C++ dùng `cout << \"Hello, World!\" << endl;`",
            "Trong Python dùng `print(\"Hello, World!\")`",
            "Trong JavaScript dùng `console.log(\"Hello, World!\");`"
        ],
        "starter_code": {
            "python": "# In ra Hello, World!\nprint(\"Hello, World!\")\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, World!\" << endl;\n    return 0;\n}",
            "javascript": "console.log(\"Hello, World!\");\n"
        },
        "test_cases": [
            {"input": "", "output": "Hello, World!\n", "is_hidden": False}
        ],
        "source": "MINDA Code"
    },
    {
        "slug": "sum-two",
        "title": "[Nhập Xuất] Tổng Hai Số Nguyên",
        "description": """### Mô Tả Bài Toán
Cho hai số nguyên $a$ và $b$. Hãy tính và in ra tổng $a + b$.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa hai số nguyên $a$ và $b$ cách nhau bởi một khoảng trắng.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là giá trị của $a + b$.
""",
        "difficulty": "easy",
        "rating": 800,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["Nhập xuất", "Phép toán cơ bản"],
        "constraints": [
            "$-10^9 \\leq a, b \\leq 10^9$",
            "Thời gian thực thi $\\leq 1.0$ giây",
            "Bộ nhớ $\\leq 256$ MB"
        ],
        "examples": [
            {
                "input": "3 5",
                "output": "8",
                "explanation": "Tổng của 3 + 5 = 8."
            },
            {
                "input": "-10 25",
                "output": "15",
                "explanation": "Tổng của -10 + 25 = 15."
            }
        ],
        "hints": [
            "Trong C++: `cin >> a >> b; cout << a + b;`",
            "Trong Python: `a, b = map(int, input().split()); print(a + b)`"
        ],
        "starter_code": {
            "python": "a, b = map(int, input().split())\n# Tính và in tổng a + b\nprint(a + b)\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}",
            "javascript": "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    const a = BigInt(input[0]);\n    const b = BigInt(input[1]);\n    console.log((a + b).toString());\n}\n"
        },
        "test_cases": [
            {"input": "3 5", "output": "8\n", "is_hidden": False},
            {"input": "-10 25", "output": "15\n", "is_hidden": False},
            {"input": "1000000000 1000000000", "output": "2000000000\n", "is_hidden": True},
            {"input": "0 0", "output": "0\n", "is_hidden": True}
        ],
        "source": "MINDA Code"
    },
    {
        "slug": "phep-chia-va-du",
        "title": "[Nhập Xuất] Phép Chia Nguyên và Chia Dư",
        "description": """### Mô Tả Bài Toán
Cho hai số nguyên dương $a$ và $b$ ($b \\neq 0$).
Hãy tìm:
1. Thương nguyên của phép chia $a$ cho $b$ ($a \\text{ div } b$).
2. Số dư của phép chia $a$ cho $b$ ($a \\text{ mod } b$).

### Định Dạng Đầu Vào (Input)
- Một dòng gồm 2 số nguyên dương $a$ và $b$ cách nhau bởi dấu cách.

### Định Dạng Đầu Ra (Output)
- In ra trên một dòng 2 số nguyên: thương nguyên và phần dư, cách nhau một khoảng trắng.
""",
        "difficulty": "easy",
        "rating": 820,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["Toán học", "Toán tử chia"],
        "constraints": [
            "$1 \\leq a, b \\leq 10^9$",
            "Thời gian thực thi $\\leq 1.0$ giây"
        ],
        "examples": [
            {
                "input": "17 5",
                "output": "3 2",
                "explanation": "17 chia 5 được thương là 3 và dư 2 (17 = 5 * 3 + 2)."
            }
        ],
        "hints": [
            "Trong C++: `a / b` lấy thương, `a % b` lấy số dư.",
            "Trong Python: `a // b` lấy thương nguyên, `a % b` lấy số dư."
        ],
        "starter_code": {
            "python": "a, b = map(int, input().split())\nprint(a // b, a % b)\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    cout << a / b << \" \" << a % b << endl;\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "17 5", "output": "3 2\n", "is_hidden": False},
            {"input": "100 10", "output": "10 0\n", "is_hidden": True},
            {"input": "7 9", "output": "0 7\n", "is_hidden": True}
        ],
        "source": "MINDA Code"
    },

    # ─── 2. LỆNH RẼ NHÁNH (IF - ELSE) ──────────────────────────────────────────
    {
        "slug": "so-lon-nhat-trong-ba-so",
        "title": "[Rẽ Nhánh] Số Lớn Nhất Trong Ba Số",
        "description": """### Mô Tả Bài Toán
Cho 3 số nguyên $a, b, c$. Hãy tìm giá trị lớn nhất trong 3 số này.

### Định Dạng Đầu Vào (Input)
- Gồm một dòng chứa 3 số nguyên $a, b, c$ cách nhau bởi dấu cách.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là giá trị lớn nhất trong 3 số.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["Rẽ nhánh", "Max / Min"],
        "constraints": ["$-10^9 \\leq a, b, c \\leq 10^9$"],
        "examples": [
            {"input": "3 9 5", "output": "9", "explanation": "Số lớn nhất trong [3, 9, 5] là 9."},
            {"input": "-4 -1 -8", "output": "-1", "explanation": "-1 là số lớn nhất."}
        ],
        "hints": [
            "Dùng hàm `max({a, b, c})` trong C++ hoặc `max(a, b, c)` trong Python."
        ],
        "starter_code": {
            "python": "a, b, c = map(int, input().split())\nprint(max(a, b, c))\n",
            "cpp": "#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    long long a, b, c;\n    cin >> a >> b >> c;\n    cout << max({a, b, c}) << endl;\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "3 9 5", "output": "9\n", "is_hidden": False},
            {"input": "-4 -1 -8", "output": "-1\n", "is_hidden": False},
            {"input": "100 100 100", "output": "100\n", "is_hidden": True}
        ],
        "source": "MINDA Code"
    },
    {
        "slug": "kiem-tra-nam-nhuan",
        "title": "[Rẽ Nhánh] Kiểm Tra Năm Nhuận",
        "description": """### Mô Tả Bài Toán
Năm nhuận là năm thỏa mãn một trong hai điều kiện sau:
- Chia hết cho $400$.
- Chia hết cho $4$ nhưng **không** chia hết cho $100$.

Cho một số nguyên dương $Y$ biểu diễn một năm. Hãy kiểm tra $Y$ có phải là năm nhuận hay không. In ra `YES` nếu đúng, ngược lại in `NO`.

### Định Dạng Đầu Vào (Input)
- Một số nguyên dương $Y$ ($1 \\leq Y \\leq 10^5$).

### Định Dạng Đầu Ra (Output)
- In ra `YES` hoặc `NO`.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["Rẽ nhánh", "Điều kiện logic"],
        "constraints": ["$1 \\leq Y \\leq 10^5$"],
        "examples": [
            {"input": "2024", "output": "YES", "explanation": "2024 chia hết cho 4 và không chia hết cho 100 -> Năm nhuận."},
            {"input": "1900", "output": "NO", "explanation": "1900 chia hết cho 100 nhưng không chia hết cho 400 -> Không nhuận."},
            {"input": "2000", "output": "YES", "explanation": "2000 chia hết cho 400 -> Năm nhuận."}
        ],
        "hints": [
            "Điều kiện: `(Y % 400 == 0) || (Y % 4 == 0 && Y % 100 != 0)`"
        ],
        "starter_code": {
            "python": "y = int(input())\nif (y % 400 == 0) or (y % 4 == 0 and y % 100 != 0):\n    print(\"YES\")\nelse:\n    print(\"NO\")\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int y;\n    cin >> y;\n    if ((y % 400 == 0) || (y % 4 == 0 && y % 100 != 0)) {\n        cout << \"YES\" << endl;\n    } else {\n        cout << \"NO\" << endl;\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "2024", "output": "YES\n", "is_hidden": False},
            {"input": "1900", "output": "NO\n", "is_hidden": False},
            {"input": "2000", "output": "YES\n", "is_hidden": True},
            {"input": "2023", "output": "NO\n", "is_hidden": True}
        ],
        "source": "MINDA Code"
    },

    # ─── 3. VÒNG LẶP & SỐ HỌC / CHUYÊN TIN THCS ───────────────────────────────
    {
        "slug": "thcs-tong-chu-so",
        "title": "[Số Học] Tính Tổng Các Chữ Số",
        "description": """### Mô Tả Bài Toán
Cho một số nguyên dương $N$. Hãy tính tổng tất cả các chữ số cấu thành nên $N$.

### Định Dạng Đầu Vào (Input)
- Dòng đầu tiên chứa số nguyên dương $N$.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là tổng các chữ số của $N$.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["Chuyên Tin THCS", "Vòng lặp", "Xử lý số"],
        "constraints": ["$1 \\leq N \\leq 10^{18}$"],
        "examples": [
            {"input": "1234", "output": "10", "explanation": "Tổng là $1 + 2 + 3 + 4 = 10$."},
            {"input": "905", "output": "14", "explanation": "Tổng là $9 + 0 + 5 = 14$."}
        ],
        "hints": ["Dùng vòng lặp lấy từng chữ số bằng phép `% 10` và giảm số đi `N //= 10`."],
        "starter_code": {
            "python": "s = input().strip()\nprint(sum(int(c) for c in s if c.isdigit()))\n",
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        long long sum = 0;\n        for (char c : s) {\n            if (c >= '0' && c <= '9') sum += (c - '0');\n        }\n        cout << sum << endl;\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "1234", "output": "10\n", "is_hidden": False},
            {"input": "905", "output": "14\n", "is_hidden": False},
            {"input": "999999999999", "output": "108\n", "is_hidden": True},
            {"input": "7", "output": "7\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "thcs-dem-uoc",
        "title": "[Số Học] Đếm Số Ước Nguyên Dương",
        "description": """### Mô Tả Bài Toán
Cho số nguyên dương $N$. Hãy đếm xem $N$ có bao nhiêu ước số nguyên dương.

### Định Dạng Đầu Vào (Input)
- Một dòng chứa duy nhất số nguyên dương $N$.

### Định Dạng Đầu Ra (Output)
- In ra số lượng ước nguyên dương của $N$.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["Chuyên Tin THCS", "Số học", "Thuật toán tối ưu"],
        "constraints": [
            "$1 \\leq N \\leq 10^9$",
            "Thời gian thực thi $\\leq 1.0$ giây"
        ],
        "examples": [
            {"input": "12", "output": "6", "explanation": "Các ước của 12 là {1, 2, 3, 4, 6, 12} -> Có 6 ước."},
            {"input": "9", "output": "3", "explanation": "Các ước của 9 là {1, 3, 9} -> Có 3 ước."}
        ],
        "hints": ["Duyệt $i$ từ $1$ đến $\\sqrt{N}$. Nếu $N \\% i == 0$, cộng thêm 2 ước ($i$ và $N/i$). Nếu $i * i == N$ thì chỉ cộng 1 ước."],
        "starter_code": {
            "python": "import math\nn = int(input())\ncount = 0\nfor i in range(1, int(math.isqrt(n)) + 1):\n    if n % i == 0:\n        count += 1 if i * i == n else 2\nprint(count)\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    cin >> n;\n    long long count = 0;\n    for (long long i = 1; i * i <= n; ++i) {\n        if (n % i == 0) {\n            if (i * i == n) count += 1;\n            else count += 2;\n        }\n    }\n    cout << count << endl;\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "12", "output": "6\n", "is_hidden": False},
            {"input": "9", "output": "3\n", "is_hidden": False},
            {"input": "1000000000", "output": "100\n", "is_hidden": True},
            {"input": "999999937", "output": "2\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "thcs-kiem-tra-so-nguyen-to",
        "title": "[Số Học] Kiểm Tra Số Nguyên Tố",
        "description": """### Mô Tả Bài Toán
Số nguyên tố là số nguyên lớn hơn 1 và chỉ có đúng 2 ước nguyên dương là 1 và chính nó.

Cho số nguyên $N$. Hãy kiểm tra $N$ có phải là số nguyên tố hay không. In ra `YES` nếu đúng, ngược lại in `NO`.

### Định Dạng Đầu Vào (Input)
- Một dòng chứa số nguyên $N$ ($-10^9 \\leq N \\leq 10^9$).

### Định Dạng Đầu Ra (Output)
- In ra `YES` nếu $N$ là số nguyên tố, ngược lại in `NO`.
""",
        "difficulty": "easy",
        "rating": 880,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["Số nguyên tố", "Số học"],
        "constraints": ["$-10^9 \\leq N \\leq 10^9$"],
        "examples": [
            {"input": "7", "output": "YES", "explanation": "7 là số nguyên tố."},
            {"input": "1", "output": "NO", "explanation": "1 không phải số nguyên tố."},
            {"input": "12", "output": "NO", "explanation": "12 chia hết cho 2, 3, 4, 6."}
        ],
        "hints": ["Nếu $N \\leq 1$ -> NO. Duyệt $i$ từ $2$ đến $\\sqrt{N}$. Nếu có ước -> NO."],
        "starter_code": {
            "python": "import math\ndef is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(math.isqrt(n)) + 1):\n        if n % i == 0: return False\n    return True\n\nn = int(input())\nprint(\"YES\" if is_prime(n) else \"NO\")\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nbool isPrime(long long n) {\n    if (n < 2) return false;\n    for (long long i = 2; i * i <= n; ++i) {\n        if (n % i == 0) return false;\n    }\n    return true;\n}\n\nint main() {\n    long long n;\n    cin >> n;\n    cout << (isPrime(n) ? \"YES\" : \"NO\") << endl;\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "7", "output": "YES\n", "is_hidden": False},
            {"input": "1", "output": "NO\n", "is_hidden": False},
            {"input": "12", "output": "NO\n", "is_hidden": False},
            {"input": "999999937", "output": "YES\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "thcs-ucln-bcnn",
        "title": "[Số Học] Tìm UCLN và BCNN",
        "description": """### Mô Tả Bài Toán
Cho hai số nguyên dương $a$ và $b$.
Hãy tìm:
1. Ước chung lớn nhất $\\text{GCD}(a, b)$
2. Bội chung nhỏ nhất $\\text{LCM}(a, b)$

### Định Dạng Đầu Vào (Input)
- Một dòng chứa 2 số nguyên dương $a, b$ cách nhau bởi dấu cách.

### Định Dạng Đầu Ra (Output)
- In ra $\\text{GCD}(a, b)$ và $\\text{LCM}(a, b)$ trên một dòng, cách nhau một khoảng trắng.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "4. Hàm",
        "tags": ["GCD / LCM", "Thuật toán Euclid"],
        "constraints": ["$1 \\leq a, b \\leq 10^9$"],
        "examples": [
            {"input": "12 18", "output": "6 36", "explanation": "GCD(12, 18) = 6, LCM(12, 18) = (12 * 18) / 6 = 36."}
        ],
        "hints": ["Dùng giải thuật Euclid: $\\text{GCD}(a, b) = \\text{GCD}(b, a \\% b)$. $\\text{LCM}(a, b) = \\frac{a \\times b}{\\text{GCD}(a, b)}$."],
        "starter_code": {
            "python": "import math\na, b = map(int, input().split())\ng = math.gcd(a, b)\nl = (a * b) // g\nprint(g, l)\n",
            "cpp": "#include <iostream>\n#include <numeric>\nusing namespace std;\n\nlong long gcd(long long a, long long b) {\n    while (b) {\n        a %= b;\n        swap(a, b);\n    }\n    return a;\n}\n\nint main() {\n    long long a, b;\n    cin >> a >> b;\n    long long g = gcd(a, b);\n    long long l = (a / g) * b;\n    cout << g << \" \" << l << endl;\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "12 18", "output": "6 36\n", "is_hidden": False},
            {"input": "100 25", "output": "25 100\n", "is_hidden": True},
            {"input": "7 13", "output": "1 91\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },

    # ─── 4. XỬ LÝ CHUỖI & MẢNG ────────────────────────────────────────────────
    {
        "slug": "thcs-xau-doi-xung",
        "title": "[Chuỗi] Kiểm Tra Xâu Đối Xứng (Palindrome)",
        "description": """### Mô Tả Bài Toán
Một xâu ký tự được gọi là **xâu đối xứng** (Palindrome) nếu đọc từ trái sang phải hay từ phải sang trái đều thu được cùng một xâu.

Cho một xâu $S$ gồm các chữ cái viết thường (không chứa dấu cách).
Hãy kiểm tra $S$ có phải là xâu đối xứng hay không. In ra `YES` nếu đúng, ngược lại in `NO`.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa xâu $S$.

### Định Dạng Đầu Ra (Output)
- In ra `YES` nếu $S$ là xâu đối xứng, ngược lại in `NO`.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình nâng cao",
        "chapter": "9. Xử lý chuỗi",
        "tags": ["Xâu ký tự", "Two Pointers"],
        "constraints": ["Độ dài xâu $|S| \\leq 10^5$"],
        "examples": [
            {"input": "radar", "output": "YES", "explanation": "Đọc ngược lại vẫn là 'radar'."},
            {"input": "minda", "output": "NO", "explanation": "Đọc ngược lại là 'adnim' -> Không đối xứng."}
        ],
        "hints": ["So sánh $S[i]$ với $S[n - 1 - i]$ bằng 2 con trỏ từ 2 đầu."],
        "starter_code": {
            "python": "s = input().strip()\nprint(\"YES\" if s == s[::-1] else \"NO\")\n",
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        bool ok = true;\n        int n = s.size();\n        for (int i = 0; i < n / 2; ++i) {\n            if (s[i] != s[n - 1 - i]) {\n                ok = false;\n                break;\n            }\n        }\n        cout << (ok ? \"YES\" : \"NO\") << endl;\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "radar", "output": "YES\n", "is_hidden": False},
            {"input": "minda", "output": "NO\n", "is_hidden": False},
            {"input": "a", "output": "YES\n", "is_hidden": True},
            {"input": "abccba", "output": "YES\n", "is_hidden": True}
        ],
        "source": "Đề Thi Chuyên Tin THCS"
    },
    {
        "slug": "binary-search",
        "title": "[Thuật Toán] Tìm Kiếm Nhị Phân (Binary Search)",
        "description": """### Mô Tả Bài Toán
Cho một mảng $A$ gồm $N$ số nguyên đã được **sắp xếp tăng dần** và một giá trị $X$.
Hãy tìm vị trí xuất hiện đầu tiên của $X$ trong mảng $A$ (chỉ số tính từ $1$). Nếu $X$ không xuất hiện trong mảng, in ra `-1`.

### Định Dạng Đầu Vào (Input)
- Dòng 1: Gồm 2 số nguyên $N$ và $X$.
- Dòng 2: Gồm $N$ số nguyên của mảng $A$, cách nhau bởi dấu cách.

### Định Dạng Đầu Ra (Output)
- In ra chỉ số (1-based index) của $X$ trong mảng $A$, hoặc `-1` nếu không tìm thấy.
""",
        "difficulty": "medium",
        "rating": 1100,
        "track": "cs",
        "subject": "Phân tích thiết kế giải thuật",
        "chapter": "1. Chia để trị",
        "tags": ["Tìm kiếm nhị phân", "Chia để trị"],
        "constraints": [
            "$1 \\leq N \\leq 10^5$",
            "$-10^9 \\leq A_i, X \\leq 10^9$",
            "Thời gian thực thi $\\leq 1.0$ giây"
        ],
        "examples": [
            {"input": "5 3\n1 2 3 4 5", "output": "3", "explanation": "Số 3 nằm ở vị trí thứ 3 trong mảng."},
            {"input": "5 8\n1 2 4 6 9", "output": "-1", "explanation": "Số 8 không tồn tại trong mảng."}
        ],
        "hints": ["Dùng thuật toán Tìm kiếm nhị phân chia đôi không gian tìm kiếm với độ phức tạp $O(\\log N)$."],
        "starter_code": {
            "python": "import bisect\n\nn, x = map(int, input().split())\na = list(map(int, input().split()))\n\nidx = bisect.bisect_left(a, x)\nif idx < n and a[idx] == x:\n    print(idx + 1)\nelse:\n    print(-1)\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false); cin.tie(NULL);\n    int n;\n    long long x;\n    if (cin >> n >> x) {\n        vector<long long> a(n);\n        for (int i = 0; i < n; ++i) cin >> a[i];\n        auto it = lower_bound(a.begin(), a.end(), x);\n        if (it != a.end() && *it == x) {\n            cout << (it - a.begin() + 1) << \"\\n\";\n        } else {\n            cout << -1 << \"\\n\";\n        }\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "5 3\n1 2 3 4 5", "output": "3\n", "is_hidden": False},
            {"input": "5 8\n1 2 4 6 9", "output": "-1\n", "is_hidden": False},
            {"input": "1 10\n10", "output": "1\n", "is_hidden": True}
        ],
        "source": "CSES / Codeforces"
    },
    {
        "slug": "fibo",
        "title": "[Quy Hoạch Động] Số Fibonacci Thứ N",
        "description": """### Mô Tả Bài Toán
Dãy số Fibonacci được định nghĩa như sau:
$$F(1) = 1, \\quad F(2) = 1$$
$$F(n) = F(n-1) + F(n-2) \\quad \\text{với } n \\geq 3$$

Cho số nguyên dương $N$. Hãy tính giá trị của số Fibonacci thứ $N$ theo modulo $10^9 + 7$.

### Định Dạng Đầu Vào (Input)
- Một dòng chứa duy nhất số nguyên dương $N$.

### Định Dạng Đầu Ra (Output)
- In ra giá trị $F(N) \\pmod{10^9 + 7}$.
""",
        "difficulty": "medium",
        "rating": 1100,
        "track": "cs",
        "subject": "Phân tích thiết kế giải thuật",
        "chapter": "4. Quy hoạch động",
        "tags": ["Quy hoạch động", "Dãy Fibonacci"],
        "constraints": [
            "$1 \\leq N \\leq 10^6$",
            "Thời gian thực thi $\\leq 1.0$ giây"
        ],
        "examples": [
            {"input": "6", "output": "8", "explanation": "Dãy: F(1)=1, F(2)=1, F(3)=2, F(4)=3, F(5)=5, F(6)=8."},
            {"input": "10", "output": "55", "explanation": "F(10) = 55."}
        ],
        "hints": ["Dùng mảng 1 chiều hoặc 2 biến để tính tuần tự từ 1 đến N trong $O(N)$."],
        "starter_code": {
            "python": "n = int(input())\nMOD = 10**9 + 7\nif n <= 2:\n    print(1)\nelse:\n    a, b = 1, 1\n    for _ in range(3, n + 1):\n        a, b = b, (a + b) % MOD\n    print(b)\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nconst int MOD = 1e9 + 7;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        if (n <= 2) {\n            cout << 1 << endl;\n            return 0;\n        }\n        long long a = 1, b = 1;\n        for (int i = 3; i <= n; ++i) {\n            long long c = (a + b) % MOD;\n            a = b;\n            b = c;\n        }\n        cout << b << endl;\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "6", "output": "8\n", "is_hidden": False},
            {"input": "10", "output": "55\n", "is_hidden": False},
            {"input": "50", "output": "586268941\n", "is_hidden": True}
        ],
        "source": "PTIT C++ / CSES"
    },

    # ─── 5. QUY HOẠCH ĐỘNG & NÂNG CAO / CHUYÊN TIN THPT ──────────────────────
    {
        "slug": "thpt-day-con-tang-dai-nhat",
        "title": "[Quy Hoạch Động] Dãy Con Tăng Dài Nhất (LIS)",
        "description": """### Mô Tả Bài Toán
Cho một mảng $A$ gồm $N$ số nguyên.
Hãy tìm độ dài của **dãy con tăng dài nhất** (các phần tử được chọn theo đúng thứ tự xuất hiện ban đầu nhưng không nhất thiết phải liên tiếp, và phần tử sau lớn hơn phần tử trước).

### Định Dạng Đầu Vào (Input)
- Dòng 1: Chứa số nguyên dương $N$.
- Dòng 2: Chứa $N$ số nguyên $A_1, A_2, \\dots, A_N$ cách nhau bởi dấu cách.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là độ dài của dãy con tăng dài nhất.
""",
        "difficulty": "medium",
        "rating": 1350,
        "track": "thpt",
        "subject": "Phân tích thiết kế giải thuật",
        "chapter": "4. Quy hoạch động",
        "tags": ["Chuyên Tin THPT", "Quy hoạch động", "Binary Search"],
        "constraints": [
            "$1 \\leq N \\leq 10^5$",
            "$-10^9 \\leq A_i \\leq 10^9$",
            "Thời gian thực thi $\\leq 1.0$ giây"
        ],
        "examples": [
            {
                "input": "8\n10 9 2 5 3 7 101 18",
                "output": "4",
                "explanation": "Dãy con tăng dài nhất là [2, 3, 7, 101] hoặc [2, 5, 7, 101] có độ dài 4."
            }
        ],
        "hints": ["Sử dụng mảng `tails` kết hợp tìm kiếm nhị phân `lower_bound` để đạt độ phức tạp $O(N \\log N)$."],
        "starter_code": {
            "python": "import bisect\n\nn = int(input())\na = list(map(int, input().split()))\n\ntails = []\nfor x in a:\n    idx = bisect.bisect_left(tails, x)\n    if idx == len(tails):\n        tails.append(x)\n    else:\n        tails[idx] = x\n\nprint(len(tails))\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false); cin.tie(NULL);\n    int n;\n    if (cin >> n) {\n        vector<long long> tails;\n        for (int i = 0; i < n; ++i) {\n            long long x;\n            cin >> x;\n            auto it = lower_bound(tails.begin(), tails.end(), x);\n            if (it == tails.end()) tails.push_back(x);\n            else *it = x;\n        }\n        cout << tails.size() << \"\\n\";\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "8\n10 9 2 5 3 7 101 18", "output": "4\n", "is_hidden": False},
            {"input": "6\n0 1 0 3 2 3", "output": "4\n", "is_hidden": True},
            {"input": "5\n7 7 7 7 7", "output": "1\n", "is_hidden": True}
        ],
        "source": "HSG Quốc Gia / VOI"
    },
    {
        "slug": "dp-knapsack",
        "title": "[Quy Hoạch Động] Bài Toán Cái Túi (0/1 Knapsack)",
        "description": """### Mô Tả Bài Toán
Có một cái túi chịu được trọng lượng tối đa là $S$ và có $N$ đồ vật.
Đồ vật thứ $i$ có trọng lượng là $W_i$ và giá trị là $V_i$. Mỗi đồ vật chỉ được chọn tối đa một lần (0/1).

Hãy chọn một tập hợp các đồ vật cho vào túi sao cho **tổng trọng lượng không vượt quá $S$** và **tổng giá trị thu được là lớn nhất**.

### Định Dạng Đầu Vào (Input)
- Dòng 1: Gồm 2 số nguyên dương $N$ và $S$.
- $N$ dòng tiếp theo, dòng thứ $i$ chứa 2 số nguyên $W_i$ và $V_i$.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là tổng giá trị lớn nhất có thể đạt được.
""",
        "difficulty": "hard",
        "rating": 1400,
        "track": "thpt",
        "subject": "Phân tích thiết kế giải thuật",
        "chapter": "4. Quy hoạch động",
        "tags": ["Quy hoạch động", "Balo 0/1", "VOI"],
        "constraints": [
            "$1 \\leq N \\leq 1000$",
            "$1 \\leq S \\leq 2000$",
            "$1 \\leq W_i \\leq S, \\quad 1 \\leq V_i \\leq 10^5$"
        ],
        "examples": [
            {
                "input": "3 4\n1 15\n3 20\n4 30",
                "output": "35",
                "explanation": "Chọn đồ vật 1 (W=1, V=15) và đồ vật 2 (W=3, V=20). Tổng W=4 <= 4, Tổng V = 35."
            }
        ],
        "hints": ["Gọi $dp[j]$ là giá trị lớn nhất với sức chứa $j$. Duyệt ngược từ $S$ về $W_i$."],
        "starter_code": {
            "python": "n, s = map(int, input().split())\ndp = [0] * (s + 1)\nfor _ in range(n):\n    w, v = map(int, input().split())\n    for j in range(s, w - 1, -1):\n        dp[j] = max(dp[j], dp[j - w] + v)\nprint(dp[s])\n",
            "cpp": "#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    int n, s;\n    if (cin >> n >> s) {\n        vector<long long> dp(s + 1, 0);\n        for (int i = 0; i < n; ++i) {\n            int w; long long v;\n            cin >> w >> v;\n            for (int j = s; j >= w; --j) {\n                dp[j] = max(dp[j], dp[j - w] + v);\n            }\n        }\n        cout << dp[s] << endl;\n    }\n    return 0;\n}"
        },
        "test_cases": [
            {"input": "3 4\n1 15\n3 20\n4 30", "output": "35\n", "is_hidden": False},
            {"input": "1 10\n5 100", "output": "100\n", "is_hidden": True},
            {"input": "4 10\n4 40\n7 70\n5 50\n3 30", "output": "100\n", "is_hidden": True}
        ],
        "source": "VNOI / Chuyên Tin THPT"
    }
]

def seed_code_problems(db: Session):
    """Seed / Update standard curated problemsets into DB with full rich content."""
    count = 0
    for prob_data in CURATED_PROBLEMS:
        existing = db.query(CodeProblem).filter(CodeProblem.slug == prob_data["slug"]).first()
        if not existing:
            prob = CodeProblem(**prob_data)
            db.add(prob)
            count += 1
        else:
            # Update fields to ensure latest rich descriptions, constraints, and test cases
            for k, v in prob_data.items():
                setattr(existing, k, v)
            count += 1
            
    db.commit()
    print(f"[Problem Importer] ✅ Successfully seeded & updated {count} standard problems.")
    return count
