"""
Importer Service: Crawls and parses programming problemsets into MINDA PostgreSQL database.
Chuẩn hóa chi tiết đề bài theo chuẩn VNOI / LeetCode / Codeforces.
Tích hợp Đề thi HSG Tin 8 từ thư mục coding-problem/.
"""
import re
import json
from sqlalchemy.orm import Session
from app.models.code_problem import CodeProblem, CodingExam

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
- In ra một số nguyên duy nhất là kết quả của $a + b$.
""",
        "difficulty": "easy",
        "rating": 800,
        "track": "basic",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["Cơ bản", "Toán học", "C++"],
        "constraints": [
            "$-10^9 \\leq a, b \\leq 10^9$"
        ],
        "examples": [
            {
                "input": "3 5",
                "output": "8",
                "explanation": "3 + 5 = 8."
            },
            {
                "input": "-10 25",
                "output": "15",
                "explanation": "-10 + 25 = 15."
            }
        ],
        "hints": [
            "Đọc vào hai biến $a$ và $b$ kiểu `long long` trong C++ để tránh tràn số.",
            "In ra `a + b`."
        ],
        "starter_code": {
            "python": "a, b = map(int, input().split())\nprint(a + b)\n",
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b;\n    if (cin >> a >> b) {\n        cout << a + b << endl;\n    }\n    return 0;\n}",
            "javascript": "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    console.log(BigInt(input[0]) + BigInt(input[1]));\n}\n"
        },
        "test_cases": [
            {"input": "3 5", "output": "8\n", "is_hidden": False},
            {"input": "-10 25", "output": "15\n", "is_hidden": False},
            {"input": "1000000000 1000000000", "output": "2000000000\n", "is_hidden": True},
            {"input": "0 0", "output": "0\n", "is_hidden": True}
        ],
        "source": "MINDA Code"
    },

    # ─── ĐỀ LUYỆN THI HSG TIN 8 - LEVEL 01 (CẤU TRÚC TUẦN TỰ & RẼ NHÁNH) ─────────
    {
        "slug": "htron",
        "title": "[HSG8 - Bài 1] HTRON Chu vi và diện tích hình tròn",
        "description": """### Mô Tả Bài Toán
Cho bán kính $r$ của hình tròn. Hãy tính chu vi và diện tích của hình tròn đó.

**Lưu ý:** Lấy giá trị hằng số $\\pi = 3.14$. Kết quả làm tròn đúng $2$ chữ số thập phân sau dấu phẩy.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số thực $r$ ($0 < r \\leq 10^4$) là bán kính hình tròn.

### Định Dạng Đầu Ra (Output)
- Dòng 1: Ghi `Chu vi la: C` (trong đó $C$ là chu vi làm tròn 2 chữ số thập phân).
- Dòng 2: Ghi `Dien tich la: S` (trong đó $S$ là diện tích làm tròn 2 chữ số thập phân).
""",
        "difficulty": "easy",
        "rating": 800,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["HSG Tin 8", "Level 01", "Toán học", "Hình học"],
        "constraints": ["$0 < r \\leq 10000$"],
        "examples": [
            {
                "input": "10",
                "output": "Chu vi la: 62.80\nDien tich la: 314.00",
                "explanation": "Chu vi = 2 * 3.14 * 10 = 62.80. Dien tich = 3.14 * 10 * 10 = 314.00."
            }
        ],
        "hints": ["Sử dụng công thức `C = 2 * 3.14 * r` và `S = 3.14 * r * r`. Trong C++ dùng `fixed << setprecision(2)`."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    double r;\n    if (cin >> r) {\n        double c = 2 * 3.14 * r;\n        double s = 3.14 * r * r;\n        cout << \"Chu vi la: \" << fixed << setprecision(2) << c << endl;\n        cout << \"Dien tich la: \" << fixed << setprecision(2) << s << endl;\n    }\n    return 0;\n}",
            "python": "r = float(input())\nc = 2 * 3.14 * r\ns = 3.14 * r * r\nprint(f\"Chu vi la: {c:.2f}\")\nprint(f\"Dien tich la: {s:.2f}\")\n"
        },
        "test_cases": [
            {"input": "10", "output": "Chu vi la: 62.80\nDien tich la: 314.00\n", "is_hidden": False},
            {"input": "5.5", "output": "Chu vi la: 34.54\nDien tich la: 94.99\n", "is_hidden": True},
            {"input": "1", "output": "Chu vi la: 6.28\nDien tich la: 3.14\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "tongcs564",
        "title": "[HSG8 - Bài 2] TONGCS564 Tính tổng chữ số",
        "description": """### Mô Tả Bài Toán
Nhập vào một số nguyên dương $N$ có đúng $4$ chữ số. Hãy tính tổng các chữ số của $N$.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số nguyên dương $N$ ($1000 \\leq N \\leq 9999$).

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là tổng các chữ số của $N$.
""",
        "difficulty": "easy",
        "rating": 800,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["HSG Tin 8", "Level 01", "Số học", "Tách chữ số"],
        "constraints": ["$1000 \\leq N \\leq 9999$"],
        "examples": [
            {
                "input": "2314",
                "output": "10",
                "explanation": "2 + 3 + 1 + 4 = 10."
            }
        ],
        "hints": ["Dùng phép chia lấy dư `% 10` và chia nguyên `/ 10` để tách từng chữ số hàng nghìn, trăm, chục, đơn vị."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        int sum = (n / 1000) + (n / 100 % 10) + (n / 10 % 10) + (n % 10);\n        cout << sum << endl;\n    }\n    return 0;\n}",
            "python": "n = int(input())\nprint(sum(int(c) for c in str(n)))\n"
        },
        "test_cases": [
            {"input": "2314", "output": "10\n", "is_hidden": False},
            {"input": "1111", "output": "4\n", "is_hidden": True},
            {"input": "9999", "output": "36\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "dtg",
        "title": "[HSG8 - Bài 3] DTG Đổi thời gian",
        "description": """### Mô Tả Bài Toán
Cho một mốc thời gian được đo bằng tổng số giây $s$. Hãy đổi mốc thời gian đó sang dạng **giờ, phút, giây**.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số nguyên không âm $s$ ($0 \\leq s \\leq 10^9$) là số giây.

### Định Dạng Đầu Ra (Output)
- In ra theo định dạng: `X gio Y phut Z giay`.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["HSG Tin 8", "Level 01", "Thời gian"],
        "constraints": ["$0 \\leq s \\leq 10^9$"],
        "examples": [
            {
                "input": "3311",
                "output": "0 gio 55 phut 11 giay",
                "explanation": "3311 giây = 0 giờ 55 phút 11 giây."
            },
            {
                "input": "4000",
                "output": "1 gio 6 phut 40 giay",
                "explanation": "4000 giây = 1 giờ (3600s) + 6 phút (360s) + 40 giây."
            }
        ],
        "hints": ["Giờ = `s / 3600`, Phút = `(s % 3600) / 60`, Giây = `s % 60`."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long s;\n    if (cin >> s) {\n        long long h = s / 3600;\n        long long m = (s % 3600) / 60;\n        long long sec = s % 60;\n        cout << h << \" gio \" << m << \" phut \" << sec << \" giay\" << endl;\n    }\n    return 0;\n}",
            "python": "s = int(input())\nh = s // 3600\nm = (s % 3600) // 60\nsec = s % 60\nprint(f\"{h} gio {m} phut {sec} giay\")\n"
        },
        "test_cases": [
            {"input": "3311", "output": "0 gio 55 phut 11 giay\n", "is_hidden": False},
            {"input": "4000", "output": "1 gio 6 phut 40 giay\n", "is_hidden": False},
            {"input": "86400", "output": "24 gio 0 phut 0 giay\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "canhhuyen",
        "title": "[HSG8 - Bài 4] CANHHUYEN Tính cạnh huyền",
        "description": """### Mô Tả Bài Toán
Tam giác vuông là tam giác có một góc vuông ($90^\\circ$). Cạnh đối diện góc vuông là **cạnh huyền**, hai cạnh tạo thành góc vuông là hai **cạnh góc vuông (cạnh kề)**.

Theo định lý Pythagoras: trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông:
$$a^2 = b^2 + c^2 \\implies a = \\sqrt{b^2 + c^2}$$

**Yêu cầu:** Nhập vào $2$ cạnh góc vuông $b$ và $c$ của tam giác vuông. Hãy tính độ dài cạnh huyền $a$. Kết quả làm tròn đúng $2$ chữ số thập phân.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa hai số thực dương $b$ và $c$ ($0 < b, c \\leq 10^5$).

### Định Dạng Đầu Ra (Output)
- In ra theo mẫu: `Do dai canh huyen la X` (trong đó $X$ làm tròn 2 chữ số thập phân).
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["HSG Tin 8", "Level 01", "Hình học", "Pythagoras"],
        "constraints": ["$0 < b, c \\leq 100000$"],
        "examples": [
            {
                "input": "3 4",
                "output": "Do dai canh huyen la 5.00",
                "explanation": "sqrt(3^2 + 4^2) = sqrt(9 + 16) = 5.00."
            }
        ],
        "hints": ["Sử dụng thư viện `<cmath>` với hàm `sqrt(b*b + c*c)`."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <cmath>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    double b, c;\n    if (cin >> b >> c) {\n        double a = sqrt(b * b + c * c);\n        cout << \"Do dai canh huyen la \" << fixed << setprecision(2) << a << endl;\n    }\n    return 0;\n}",
            "python": "import math\nb, c = map(float, input().split())\na = math.sqrt(b*b + c*c)\nprint(f\"Do dai canh huyen la {a:.2f}\")\n"
        },
        "test_cases": [
            {"input": "3 4", "output": "Do dai canh huyen la 5.00\n", "is_hidden": False},
            {"input": "6 8", "output": "Do dai canh huyen la 10.00\n", "is_hidden": True},
            {"input": "5 12", "output": "Do dai canh huyen la 13.00\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "tg-heron",
        "title": "[HSG8 - Bài 5] TG Chu vi và diện tích tam giác",
        "description": """### Mô Tả Bài Toán
Nhập vào độ dài $3$ cạnh $a, b, c$ của một tam giác hợp lệ. Hãy tính chu vi và diện tích tam giác đó.

Sử dụng **công thức Heron** để tính diện tích:
$$p = \\frac{a + b + c}{2}$$
$$S = \\sqrt{p(p - a)(p - b)(p - c)}$$

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa $3$ số thực dương $a, b, c$ ($a, b, c < 10^9$) thỏa mãn bất đẳng thức tam giác.

### Định Dạng Đầu Ra (Output)
- Dòng 1: Ghi `Chu vi la: C` (làm tròn 2 chữ số thập phân).
- Dòng 2: Ghi `Dien tich la: S` (làm tròn 2 chữ số thập phân).
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "1. Nhập / Xuất",
        "tags": ["HSG Tin 8", "Level 01", "Hình học", "Công thức Heron"],
        "constraints": ["$0 < a, b, c \\leq 10^6$"],
        "examples": [
            {
                "input": "3 4 5",
                "output": "Chu vi la: 12.00\nDien tich la: 6.00",
                "explanation": "p = 6, S = sqrt(6 * 3 * 2 * 1) = 6.00."
            }
        ],
        "hints": ["Tính nửa chu vi $p = (a + b + c) / 2$, sau đó tính $S = \\sqrt{p(p-a)(p-b)(p-c)}$."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <cmath>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    double a, b, c;\n    if (cin >> a >> b >> c) {\n        double p = (a + b + c) / 2.0;\n        double s = sqrt(p * (p - a) * (p - b) * (p - c));\n        cout << \"Chu vi la: \" << fixed << setprecision(2) << (a + b + c) << endl;\n        cout << \"Dien tich la: \" << fixed << setprecision(2) << s << endl;\n    }\n    return 0;\n}",
            "python": "import math\na, b, c = map(float, input().split())\np = (a + b + c) / 2\ns = math.sqrt(p * (p - a) * (p - b) * (p - c))\nprint(f\"Chu vi la: {(a+b+c):.2f}\")\nprint(f\"Dien tich la: {s:.2f}\")\n"
        },
        "test_cases": [
            {"input": "3 4 5", "output": "Chu vi la: 12.00\nDien tich la: 6.00\n", "is_hidden": False},
            {"input": "6 8 10", "output": "Chu vi la: 24.00\nDien tich la: 24.00\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "bangdx648",
        "title": "[HSG8 - Bài 6] BANGDX648 Bảng đối xứng",
        "description": """### Mô Tả Bài Toán
Cho một ma trận kích thước $5 \\times 5$ gồm 24 ô số 0 và duy nhất 1 ô số 1 tại tọa độ $(x, y)$ (hàng $x$, cột $y$, với $1 \\leq x, y \\leq 5$).

Một ma trận được gọi là đối xứng chuẩn nếu số 1 nằm ở chính giữa bảng, tức là tại tọa độ $(3, 3)$. Mỗi thao tác bạn được phép đổi chỗ 2 hàng kề nhau hoặc 2 cột kề nhau.

**Yêu cầu:** Hãy tìm số lượng tối thiểu các thao tác cần thiết để đưa số 1 về ô chính giữa $(3, 3)$.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa hai số nguyên $x$ và $y$ ($1 \\leq x, y \\leq 5$) là tọa độ ô chứa số 1.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là số thao tác tối thiểu cần thực hiện: $|x - 3| + |y - 3|$.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["HSG Tin 8", "Level 01", "Ma trận", "Khoảng cách Manhattan"],
        "constraints": ["$1 \\leq x, y \\leq 5$"],
        "examples": [
            {
                "input": "2 5",
                "output": "3",
                "explanation": "|2 - 3| + |5 - 3| = 1 + 2 = 3 bước."
            }
        ],
        "hints": ["Khoảng cách Manhattan từ $(x, y)$ đến $(3, 3)$ là `abs(x - 3) + abs(y - 3)`."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main() {\n    int x, y;\n    if (cin >> x >> y) {\n        cout << abs(x - 3) + abs(y - 3) << endl;\n    }\n    return 0;\n}",
            "python": "x, y = map(int, input().split())\nprint(abs(x - 3) + abs(y - 3))\n"
        },
        "test_cases": [
            {"input": "2 5", "output": "3\n", "is_hidden": False},
            {"input": "3 3", "output": "0\n", "is_hidden": True},
            {"input": "1 1", "output": "4\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "kttg",
        "title": "[HSG8 - Bài 7] KTTG Kiểm tra tam giác",
        "description": """### Mô Tả Bài Toán
Bé Bi có $3$ que gỗ với độ dài là $a, b, c$. Bi muốn biết $3$ que gỗ này có thể ghép lại thành một hình tam giác hay không.

Theo định lý hình học: Ba đoạn thẳng có độ dài $a, b, c$ tạo thành một tam giác khi và chỉ khi:
$$a + b > c \\quad \\text{và} \\quad b + c > a \\quad \\text{và} \\quad c + a > b$$

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa ba số nguyên dương $a, b, c$ ($1 \\leq a, b, c \\leq 10^9$).

### Định Dạng Đầu Ra (Output)
- In ra `duoc` nếu $3$ que gỗ ghép được thành tam giác, ngược lại in ra `khong`.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["HSG Tin 8", "Level 01", "Điều kiện rẽ nhánh"],
        "constraints": ["$1 \\leq a, b, c \\leq 10^9$"],
        "examples": [
            {
                "input": "3 4 5",
                "output": "duoc",
                "explanation": "3+4>5, 3+5>4, 4+5>3 -> Tao thanh tam giac."
            },
            {
                "input": "2 2 5",
                "output": "khong",
                "explanation": "2 + 2 = 4 < 5 -> Khong tao thanh tam giac."
            }
        ],
        "hints": ["Sử dụng câu lệnh `if (a + b > c && a + c > b && b + c > a)`."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long a, b, c;\n    if (cin >> a >> b >> c) {\n        if (a + b > c && a + c > b && b + c > a) cout << \"duoc\" << endl;\n        else cout << \"khong\" << endl;\n    }\n    return 0;\n}",
            "python": "a, b, c = map(int, input().split())\nif a + b > c and a + c > b and b + c > a:\n    print(\"duoc\")\nelse:\n    print(\"khong\")\n"
        },
        "test_cases": [
            {"input": "3 4 5", "output": "duoc\n", "is_hidden": False},
            {"input": "2 2 5", "output": "khong\n", "is_hidden": False},
            {"input": "10 10 10", "output": "duoc\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "tmau",
        "title": "[HSG8 - Bài 8] TMAU Ô trùng màu",
        "description": """### Mô Tả Bài Toán
Trên bàn cờ vua kích thước $8 \\times 8$, các ô được đánh số hàng từ $1$ đến $8$ và cột từ $1$ đến $8$. Hai ô $(r_1, c_1)$ và $(r_2, c_2)$ cùng màu khi và chỉ khi tổng tọa độ hàng và cột của chúng có cùng tính chẵn lẻ:
$$(r_1 + c_1) \\pmod 2 = (r_2 + c_2) \\pmod 2$$

**Yêu cầu:** Cho tọa độ của $2$ ô trên bàn cờ, hãy kiểm tra xem $2$ ô đó có cùng màu hay không.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa bốn số nguyên $r_1, c_1, r_2, c_2$ ($1 \\leq r_1, c_1, r_2, c_2 \\leq 8$).

### Định Dạng Đầu Ra (Output)
- In ra `Trung mau` nếu $2$ ô có cùng màu, ngược lại in ra `Khong trung mau`.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["HSG Tin 8", "Level 01", "Bàn cờ vua", "Số học chẵn lẻ"],
        "constraints": ["$1 \\leq r_1, c_1, r_2, c_2 \\leq 8$"],
        "examples": [
            {
                "input": "1 1 3 3",
                "output": "Trung mau",
                "explanation": "(1+1)%2 = 0, (3+3)%2 = 0 -> Cung mau."
            },
            {
                "input": "3 5 4 1",
                "output": "Khong trung mau",
                "explanation": "(3+5)%2 = 0, (4+1)%2 = 1 -> Khac mau."
            }
        ],
        "hints": ["So sánh `(r1 + c1) % 2 == (r2 + c2) % 2`."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int r1, c1, r2, c2;\n    if (cin >> r1 >> c1 >> r2 >> c2) {\n        if ((r1 + c1) % 2 == (r2 + c2) % 2) cout << \"Trung mau\" << endl;\n        else cout << \"Khong trung mau\" << endl;\n    }\n    return 0;\n}",
            "python": "r1, c1, r2, c2 = map(int, input().split())\nif (r1 + c1) % 2 == (r2 + c2) % 2:\n    print(\"Trung mau\")\nelse:\n    print(\"Khong trung mau\")\n"
        },
        "test_cases": [
            {"input": "1 1 3 3", "output": "Trung mau\n", "is_hidden": False},
            {"input": "3 5 4 1", "output": "Khong trung mau\n", "is_hidden": False}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },
    {
        "slug": "tdien",
        "title": "[HSG8 - Bài 9] TDIEN Tính tiền điện",
        "description": """### Mô Tả Bài Toán
Tính tiền điện của một hộ gia đình khi biết chỉ số điện kế tháng này $tn$ và chỉ số điện kế tháng trước $tt$.

Số kW tiêu thụ trong tháng: $kw = tn - tt$.
Tiền điện được tính theo biểu giá lũy tiến bậc thang:
- Từ $0$ đến $60$ kW: giá **$1000$ đ/kW**
- Từ $61$ đến $120$ kW (tối đa 60 kW tiếp theo): giá **$1200$ đ/kW**
- Từ $121$ đến $300$ kW (tối đa 180 kW tiếp theo): giá **$2000$ đ/kW**
- Từ trên $300$ kW trở đi: giá **$4000$ đ/kW**

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa $2$ số nguyên dương $tn$ và $tt$ ($0 < tt < tn < 50000$).

### Định Dạng Đầu Ra (Output)
- Dòng 1: Ghi số kW điện tiêu thụ trong tháng ($kw$).
- Dòng 2: Ghi tổng số tiền điện phải trả (đồng).
""",
        "difficulty": "medium",
        "rating": 1000,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "2. Lệnh rẽ nhánh",
        "tags": ["HSG Tin 8", "Level 01", "Bậc thang", "Rẽ nhánh"],
        "constraints": ["$0 < tt < tn < 50000$"],
        "examples": [
            {
                "input": "750 300",
                "output": "450\n1092000",
                "explanation": "kw = 450. Tien = 60*1000 + 60*1200 + 180*2000 + 150*4000 = 1,092,000 đ."
            },
            {
                "input": "600 500",
                "output": "100\n108000",
                "explanation": "kw = 100. Tien = 60*1000 + 40*1200 = 108,000 đ."
            }
        ],
        "hints": ["Tính lần lượt từng bậc: min(kw, 60), min(max(0, kw-60), 60), ..."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long tn, tt;\n    if (cin >> tn >> tt) {\n        long long kw = tn - tt;\n        long long cost = 0;\n        if (kw <= 60) cost = kw * 1000;\n        else if (kw <= 120) cost = 60 * 1000 + (kw - 60) * 1200;\n        else if (kw <= 300) cost = 60 * 1000 + 60 * 1200 + (kw - 120) * 2000;\n        else cost = 60 * 1000 + 60 * 1200 + 180 * 2000 + (kw - 300) * 4000;\n        cout << kw << endl << cost << endl;\n    }\n    return 0;\n}",
            "python": "tn, tt = map(int, input().split())\nkw = tn - tt\nif kw <= 60:\n    cost = kw * 1000\nelif kw <= 120:\n    cost = 60*1000 + (kw - 60)*1200\nelif kw <= 300:\n    cost = 60*1000 + 60*1200 + (kw - 120)*2000\nelse:\n    cost = 60*1000 + 60*1200 + 180*2000 + (kw - 300)*4000\nprint(kw)\nprint(cost)\n"
        },
        "test_cases": [
            {"input": "750 300", "output": "450\n1092000\n", "is_hidden": False},
            {"input": "600 500", "output": "100\n108000\n", "is_hidden": False},
            {"input": "1200 1150", "output": "50\n50000\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 01"
    },

    # ─── ĐỀ LUYỆN THI HSG TIN 8 - LEVEL 02 (CẤU TRÚC LẶP & HÀM CON) ───────────────
    {
        "slug": "tuoi",
        "title": "[HSG8 - Bài 10] TUOI Tính tuổi",
        "description": """### Mô Tả Bài Toán
Cho biết tuổi cha $T_{cha}$ và tuổi con $T_{con}$ hiện nay (biết rằng tuổi cha hiện tại gấp hơn 3 lần tuổi con: $T_{cha} > 3 T_{con}$).

Hỏi sau bao nhiêu năm nữa thì tuổi cha sẽ **gấp đôi** tuổi con?

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa hai số nguyên dương $T_{cha}$ và $T_{con}$ ($T_{cha} > 3 T_{con}$).

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là số năm cần tìm.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Số học"],
        "constraints": ["$1 \\leq T_{con} < T_{cha} \\leq 200$"],
        "examples": [
            {
                "input": "40 4",
                "output": "32",
                "explanation": "Sau 32 năm: Cha 72 tuổi, con 36 tuổi (72 = 2 * 36)."
            }
        ],
        "hints": ["Đặt phương trình $T_{cha} + x = 2(T_{con} + x) \\implies x = T_{cha} - 2 T_{con}$ hoặc dùng vòng lặp."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int cha, con;\n    if (cin >> cha >> con) {\n        cout << cha - 2 * con << endl;\n    }\n    return 0;\n}",
            "python": "cha, con = map(int, input().split())\nprint(cha - 2 * con)\n"
        },
        "test_cases": [
            {"input": "40 4", "output": "32\n", "is_hidden": False},
            {"input": "35 5", "output": "25\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "gapgiay",
        "title": "[HSG8 - Bài 11] GAPGIAY Gấp giấy",
        "description": """### Mô Tả Bài Toán
Một tờ giấy ban đầu có độ dày là $x$ mm. Mỗi lần gấp đôi tờ giấy, độ dày của nó sẽ tăng gấp đôi.

**Yêu cầu:** Hỏi phải gấp đôi ít nhất bao nhiêu lần để độ dày của tờ giấy vượt quá $y$ mét? ($1$ mét = $1000$ mm).

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa hai số thực dương $x$ (mm) và $y$ (mét).

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là số lần gấp tối thiểu.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Vòng lặp"],
        "constraints": ["$0 < x, y \\leq 10^6$"],
        "examples": [
            {
                "input": "0.1 1",
                "output": "14",
                "explanation": "Độ dày cần đạt > 1000 mm. Sau 14 lần gấp: 0.1 * 2^14 = 1638.4 mm > 1000 mm."
            }
        ],
        "hints": ["Đổi $y$ ra mm: `target = y * 1000`. Dùng vòng lặp `while (x <= target)` nhân đôi $x$ và tăng biến đếm."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    double x, y;\n    if (cin >> x >> y) {\n        double target = y * 1000.0;\n        int count = 0;\n        while (x <= target) {\n            x *= 2.0;\n            count++;\n        }\n        cout << count << endl;\n    }\n    return 0;\n}",
            "python": "x, y = map(float, input().split())\ntarget = y * 1000\ncount = 0\nwhile x <= target:\n    x *= 2\n    count += 1\nprint(count)\n"
        },
        "test_cases": [
            {"input": "0.1 1", "output": "14\n", "is_hidden": False},
            {"input": "1 1", "output": "10\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "lt2",
        "title": "[HSG8 - Bài 12] LT2 Số lũy thừa 2",
        "description": """### Mô Tả Bài Toán
Số tự nhiên $N$ được gọi là **số lũy thừa của 2** nếu $N$ bằng tích của các số 2 nhân với nhau (tức là $N = 2^k$ với $k \\geq 0$ nguyên).
Ví dụ: $1, 2, 4, 8, 16, 32, 64, 128, \\dots$ là các số lũy thừa của 2. Các số $5, 10, 14, 20$ không phải.

**Yêu cầu:** Cho số tự nhiên $N$. Hãy kiểm tra xem $N$ có phải là số lũy thừa của 2 hay không.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số nguyên dương $N$ ($1 \\leq N < 10^9$).

### Định Dạng Đầu Ra (Output)
- In ra `true` nếu $N$ là số lũy thừa của 2, ngược lại in ra `false`.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Bit Manipulation", "Số học"],
        "constraints": ["$1 \\leq N < 10^9$"],
        "examples": [
            {
                "input": "128",
                "output": "true",
                "explanation": "128 = 2^7."
            },
            {
                "input": "1000",
                "output": "false",
                "explanation": "1000 không có dạng 2^k."
            }
        ],
        "hints": ["Kiểm tra `(N > 0) && ((N & (N - 1)) == 0)` hoặc chia liên tục cho 2."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long n;\n    if (cin >> n) {\n        if (n > 0 && (n & (n - 1)) == 0) cout << \"true\" << endl;\n        else cout << \"false\" << endl;\n    }\n    return 0;\n}",
            "python": "n = int(input())\nif n > 0 and (n & (n - 1)) == 0:\n    print(\"true\")\nelse:\n    print(\"false\")\n"
        },
        "test_cases": [
            {"input": "128", "output": "true\n", "is_hidden": False},
            {"input": "1000", "output": "false\n", "is_hidden": False},
            {"input": "1", "output": "true\n", "is_hidden": True},
            {"input": "1048576", "output": "true\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "dao507",
        "title": "[HSG8 - Bài 13] DAO507 Đào hầm robot",
        "description": """### Mô Tả Bài Toán
Một robot đào hầm được điều khiển bởi $2$ lệnh:
- **Lệnh C1:** Đào thêm đúng $1$ đơn vị độ dài và tiêu tốn **$2$ đơn vị năng lượng**.
- **Lệnh N2:** Đào gấp đôi đơn vị độ dài đã đào được trước đó và tiêu tốn **$4$ đơn vị năng lượng**.

Biết ban đầu luôn có sẵn $1$ đơn vị độ dài. Với $K$ đơn vị độ dài hầm cần đào, hãy tìm số lượng đơn vị năng lượng tối thiểu đã sử dụng sao cho số lệnh ít nhất và năng lượng tiêu hao ít nhất.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số nguyên dương $K$ ($1 \\leq K \\leq 10^9$) là độ dài hầm cần đào.

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là số đơn vị năng lượng tối thiểu đã sử dụng.
""",
        "difficulty": "medium",
        "rating": 1100,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Tham lam", "Quy hoạch động"],
        "constraints": ["$1 \\leq K \\leq 10^9$"],
        "examples": [
            {
                "input": "10",
                "output": "12",
                "explanation": "Dãy lệnh: 1 -> +1(2) -> 2 -> x2(4) -> 4 -> +1(2) -> 5 -> x2(4) -> 10. Tổng năng lượng: 2 + 4 + 2 + 4 = 12."
            }
        ],
        "hints": ["Đi ngược từ $K$ về 1: Nếu $K$ chẵn và $K > 1$, chia đôi tốn 4 NL. Nếu $K$ lẻ, trừ 1 tốn 2 NL."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    long long k;\n    if (cin >> k) {\n        long long energy = 0;\n        while (k > 1) {\n            if (k % 2 == 0) {\n                k /= 2;\n                energy += 4;\n            } else {\n                k -= 1;\n                energy += 2;\n            }\n        }\n        cout << energy << endl;\n    }\n    return 0;\n}",
            "python": "k = int(input())\nenergy = 0\nwhile k > 1:\n    if k % 2 == 0:\n        k //= 2\n        energy += 4\n    else:\n        k -= 1\n        energy += 2\nprint(energy)\n"
        },
        "test_cases": [
            {"input": "10", "output": "12\n", "is_hidden": False},
            {"input": "1", "output": "0\n", "is_hidden": True},
            {"input": "16", "output": "16\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "symmetry",
        "title": "[HSG8 - Bài 14] SYMMETRY Số đối xứng",
        "description": """### Mô Tả Bài Toán
Một số nguyên dương $N$ được gọi là **số đối xứng (Palindrome number)** nếu khi đọc từ trái sang phải hay từ phải sang trái ta đều thu được cùng một giá trị.
Ví dụ: $1234321$ là số đối xứng, còn $2345321$ không phải.

**Yêu cầu:** Cho số nguyên dương $N$. Hãy kiểm tra xem $N$ có phải số đối xứng hay không.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số nguyên dương $N$ ($1 \\leq N \\leq 10^{18}$).

### Định Dạng Đầu Ra (Output)
- In ra `1` nếu $N$ là số đối xứng, ngược lại in ra `0`.
""",
        "difficulty": "easy",
        "rating": 850,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Palindrome", "Xử lý xâu / Số"],
        "constraints": ["$1 \\leq N \\leq 10^{18}$"],
        "examples": [
            {
                "input": "1234321",
                "output": "1",
                "explanation": "Đảo ngược của 1234321 là 1234321 -> Đối xứng."
            },
            {
                "input": "2345321",
                "output": "0",
                "explanation": "2345321 != 1235432 -> Không đối xứng."
            }
        ],
        "hints": ["Đọc $N$ dưới dạng xâu ký tự và kiểm tra xâu đảo ngược."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    if (cin >> s) {\n        string rev = s;\n        reverse(rev.begin(), rev.end());\n        cout << (s == rev ? 1 : 0) << endl;\n    }\n    return 0;\n}",
            "python": "s = input().strip()\nprint(1 if s == s[::-1] else 0)\n"
        },
        "test_cases": [
            {"input": "1234321", "output": "1\n", "is_hidden": False},
            {"input": "2345321", "output": "0\n", "is_hidden": False},
            {"input": "7", "output": "1\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "long1",
        "title": "[HSG8 - Bài 15] LONG1 Tổng lồng nhau",
        "description": """### Mô Tả Bài Toán
Cho số tự nhiên $n$ ($1 \\leq n \\leq 10$). Hãy tính và in ra giá trị của $3$ biểu thức sau:
1. $S_1 = 1! + 2! + 3! + \\dots + n!$ (với $x! = 1 \\times 2 \\times \\dots \\times x$).
2. $S_2 = 1^1 + 2^2 + 3^3 + \\dots + n^n$.
3. $S_3 = 1 + \\frac{1}{1+2} + \\frac{1}{1+2+3} + \\dots + \\frac{1}{1+2+3+\\dots+n}$.

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số tự nhiên $n$ ($1 \\leq n \\leq 10$).

### Định Dạng Đầu Ra (Output)
- Dòng 1: Ghi `S1 = <kết quả>`
- Dòng 2: Ghi `S2 = <kết quả>`
- Dòng 3: Ghi `S3 = <kết quả>` (làm tròn 2 chữ số thập phân).
""",
        "difficulty": "medium",
        "rating": 950,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Giai thừa", "Lũy thừa", "Tổng chuỗi"],
        "constraints": ["$1 \\leq n \\leq 10$"],
        "examples": [
            {
                "input": "4",
                "output": "S1 = 33\nS2 = 288\nS3 = 1.60",
                "explanation": "S1 = 1!+2!+3!+4! = 1+2+6+24 = 33. S2 = 1+4+27+256 = 288. S3 = 1 + 1/3 + 1/6 + 1/10 = 1.60."
            }
        ],
        "hints": ["Tính lũy tích giai thừa và lũy thừa $i^i$ trong vòng lặp."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <cmath>\n#include <iomanip>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        long long s1 = 0, fact = 1;\n        long long s2 = 0;\n        double s3 = 0.0;\n        long long sum_i = 0;\n        for (int i = 1; i <= n; ++i) {\n            fact *= i;\n            s1 += fact;\n            long long p = 1;\n            for (int j = 1; j <= i; ++j) p *= i;\n            s2 += p;\n            sum_i += i;\n            s3 += 1.0 / sum_i;\n        }\n        cout << \"S1 = \" << s1 << endl;\n        cout << \"S2 = \" << s2 << endl;\n        cout << \"S3 = \" << fixed << setprecision(2) << s3 << endl;\n    }\n    return 0;\n}",
            "python": "n = int(input())\ns1 = 0\nfact = 1\ns2 = 0\ns3 = 0.0\nsum_i = 0\nfor i in range(1, n + 1):\n    fact *= i\n    s1 += fact\n    s2 += i ** i\n    sum_i += i\n    s3 += 1.0 / sum_i\nprint(f\"S1 = {s1}\")\nprint(f\"S2 = {s2}\")\nprint(f\"S3 = {s3:.2f}\")\n"
        },
        "test_cases": [
            {"input": "4", "output": "S1 = 33\nS2 = 288\nS3 = 1.60\n", "is_hidden": False},
            {"input": "1", "output": "S1 = 1\nS2 = 1\nS3 = 1.00\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "vuongso2",
        "title": "[HSG8 - Bài 16] VUONGSO2 Vẽ hình vuông số",
        "description": """### Mô Tả Bài Toán
Cho số tự nhiên $n$. Hãy vẽ một hình vuông số kích thước $n \\times n$ theo định dạng xoay vòng từ hàng $1$ đến hàng $n$.

Ví dụ với $n = 4$:
```
1 2 3 4
2 3 4 1
3 4 1 2
4 1 2 3
```

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa số tự nhiên $n$ ($1 \\leq n < 100$).

### Định Dạng Đầu Ra (Output)
- In ra $n$ dòng, mỗi dòng chứa $n$ số nguyên cách nhau bởi một khoảng trắng.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "3. Vòng lặp",
        "tags": ["HSG Tin 8", "Level 02", "Vẽ hình", "Ma trận xoay"],
        "constraints": ["$1 \\leq n < 100$"],
        "examples": [
            {
                "input": "4",
                "output": "1 2 3 4\n2 3 4 1\n3 4 1 2\n4 1 2 3",
                "explanation": "Ma trận 4x4 xoay vòng."
            }
        ],
        "hints": ["Phần tử tại hàng $i$, cột $j$ là `(i - 1 + j - 1) % n + 1`."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    if (cin >> n) {\n        for (int i = 1; i <= n; ++i) {\n            for (int j = 1; j <= n; ++j) {\n                int val = (i - 1 + j - 1) % n + 1;\n                cout << val << (j == n ? \"\" : \" \");\n            }\n            cout << endl;\n        }\n    }\n    return 0;\n}",
            "python": "n = int(input())\nfor i in range(1, n + 1):\n    row = [(i - 1 + j - 1) % n + 1 for j in range(1, n + 1)]\n    print(\" \".join(map(str, row)))\n"
        },
        "test_cases": [
            {"input": "4", "output": "1 2 3 4\n2 3 4 1\n3 4 1 2\n4 1 2 3\n", "is_hidden": False},
            {"input": "2", "output": "1 2\n2 1\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "hlt3",
        "title": "[HSG8 - Bài 17] HLT3 Tính lũy thừa 3",
        "description": """### Mô Tả Bài Toán
Cho 3 số nguyên $a, b, c$. Hãy tính giá trị biểu thức:
$$S = (a^b)^c + (b^a)^c - (c^a)^b$$
hay tương đương:
$$S = a^{b \\times c} + b^{a \\times c} - c^{a \\times b}$$

### Định Dạng Đầu Vào (Input)
- Một dòng duy nhất chứa $3$ số nguyên $a, b, c$ ($0 \\leq a, b, c \\leq 10$).

### Định Dạng Đầu Ra (Output)
- In ra một số nguyên duy nhất là kết quả của biểu thức $S$.
""",
        "difficulty": "easy",
        "rating": 900,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "4. Hàm",
        "tags": ["HSG Tin 8", "Level 02", "Lũy thừa", "Hàm con"],
        "constraints": ["$0 \\leq a, b, c \\leq 10$"],
        "examples": [
            {
                "input": "2 3 4",
                "output": "6561",
                "explanation": "2^(3*4) + 3^(2*4) - 4^(2*3) = 2^12 + 3^8 - 4^6 = 4096 + 6561 - 4096 = 6561."
            }
        ],
        "hints": ["Viết hàm lũy thừa `power(base, exp)`."],
        "starter_code": {
            "cpp": "#include <iostream>\nusing namespace std;\n\nlong long power(long long base, long long exp) {\n    long long res = 1;\n    for (int i = 0; i < exp; ++i) res *= base;\n    return res;\n}\n\nint main() {\n    long long a, b, c;\n    if (cin >> a >> b >> c) {\n        long long s = power(a, b * c) + power(b, a * c) - power(c, a * b);\n        cout << s << endl;\n    }\n    return 0;\n}",
            "python": "a, b, c = map(int, input().split())\ns = (a ** (b * c)) + (b ** (a * c)) - (c ** (a * b))\nprint(s)\n"
        },
        "test_cases": [
            {"input": "2 3 4", "output": "6561\n", "is_hidden": False},
            {"input": "1 1 1", "output": "1\n", "is_hidden": True}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    },
    {
        "slug": "vehinhtg",
        "title": "[HSG8 - Bài 18] VEHINHTG Vẽ hình tam giác",
        "description": """### Mô Tả Bài Toán
Cho dãy $n$ số tự nhiên $a_1, a_2, \\dots, a_n$. Hãy vẽ $n$ hình tam giác cân rỗng có đường cao lần lượt từ $a_1$ đến $a_n$.

Quy tắc vẽ tam giác cân rỗng chiều cao $h$:
- Hàng $1$: Có $h - 1$ khoảng trắng và $1$ dấu `*`.
- Hàng $i$ ($2 \\leq i < h$): Có $h - i$ khoảng trắng, $1$ dấu `*`, $2i - 3$ khoảng trắng và $1$ dấu `*`.
- Hàng $h$: Có $2h - 1$ dấu `*` liên tiếp.
- Giữa các tam giác cách nhau một dòng trống.

### Định Dạng Đầu Vào (Input)
- Dòng 1: Số tự nhiên $n$ ($1 \\leq n \\leq 20$).
- Dòng 2: $n$ số nguyên dương $a_1, a_2, \\dots, a_n$ ($1 \\leq a_i \\leq 20$).

### Định Dạng Đầu Ra (Output)
- Xuất các hình tam giác theo quy tắc trên.
""",
        "difficulty": "medium",
        "rating": 1050,
        "track": "thcs",
        "subject": "Lập trình cơ bản",
        "chapter": "4. Hàm",
        "tags": ["HSG Tin 8", "Level 02", "Vẽ hình", "Hàm con"],
        "constraints": ["$1 \\leq n \\leq 20$", "$1 \\leq a_i \\leq 20$"],
        "examples": [
            {
                "input": "4\n3 2 1 4",
                "output": "  *\n * *\n*****\n\n *\n***\n\n*\n\n   *\n  * *\n *   *\n*******",
                "explanation": "Vẽ lần lượt 4 tam giác có chiều cao 3, 2, 1, 4."
            }
        ],
        "hints": ["Viết một hàm `draw_triangle(int h)`."],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <vector>\nusing namespace std;\n\nvoid draw(int h) {\n    if (h == 1) { cout << \"*\\n\"; return; }\n    for (int j = 0; j < h - 1; ++j) cout << \" \";\n    cout << \"*\\n\";\n    for (int i = 2; i < h; ++i) {\n        for (int j = 0; j < h - i; ++j) cout << \" \";\n        cout << \"*\";\n        for (int j = 0; j < 2 * i - 3; ++j) cout << \" \";\n        cout << \"*\\n\";\n    }\n    for (int j = 0; j < 2 * h - 1; ++j) cout << \"*\";\n    cout << \"\\n\";\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        for (int i = 0; i < n; ++i) {\n            int h; cin >> h;\n            draw(h);\n            if (i < n - 1) cout << \"\\n\";\n        }\n    }\n    return 0;\n}",
            "python": "def draw(h):\n    if h == 1:\n        print(\"*\")\n        return\n    print(\" \" * (h - 1) + \"*\")\n    for i in range(2, h):\n        print(\" \" * (h - i) + \"*\" + \" \" * (2 * i - 3) + \"*\")\n    print(\"*\" * (2 * h - 1))\n\nn = int(input())\narr = list(map(int, input().split()))\nfor idx, h in enumerate(arr):\n    draw(h)\n    if idx < n - 1:\n        print()\n"
        },
        "test_cases": [
            {"input": "4\n3 2 1 4", "output": "  *\n * *\n*****\n\n *\n***\n\n*\n\n   *\n  * *\n *   *\n*******\n", "is_hidden": False}
        ],
        "source": "Đề Luyện Thi HSG Tin 8 - Level 02"
    }
]

CURATED_EXAMS = [
    {
        "slug": "hsg8-level-01",
        "title": "Đề Thi Lập Trình HSG Tin 8 - Level 01: Cấu Trúc Tuần Tự & Rẽ Nhánh",
        "description": "Bộ đề thi chuẩn hóa bồi dưỡng Học sinh giỏi Tin học 8 gồm 9 bài toán rèn luyện kỹ năng Nhập/Xuất, Tính toán số học, Công thức hình học, Khoảng cách Manhattan và Phân nhánh điều kiện.",
        "duration_minutes": 120,
        "track": "thcs",
        "difficulty": "easy",
        "total_score": 100,
        "tags": ["HSG Tin 8", "THCS", "C++", "Level 01"],
        "problem_slugs": ["htron", "tongcs564", "dtg", "canhhuyen", "tg-heron", "bangdx648", "kttg", "tmau", "tdien"]
    },
    {
        "slug": "hsg8-level-02",
        "title": "Đề Thi Lập Trình HSG Tin 8 - Level 02: Cấu Trúc Lặp & Hàm Con",
        "description": "Bộ đề thi chuẩn hóa bồi dưỡng Học sinh giỏi Tin học 8 gồm 9 bài toán rèn luyện Vòng lặp For/While, Số học nâng cao, Palindrome, Đào hầm tối ưu, Tổng lồng nhau và Vẽ hình.",
        "duration_minutes": 120,
        "track": "thcs",
        "difficulty": "medium",
        "total_score": 100,
        "tags": ["HSG Tin 8", "THCS", "C++", "Level 02"],
        "problem_slugs": ["tuoi", "gapgiay", "lt2", "dao507", "symmetry", "long1", "vuongso2", "hlt3", "vehinhtg"]
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
            for k, v in prob_data.items():
                setattr(existing, k, v)
            count += 1
            
    db.commit()

    # Seed coding exams
    seed_coding_exams(db)

    print(f"[Problem Importer] ✅ Successfully seeded & updated {count} standard problems.")
    return count

def seed_coding_exams(db: Session):
    """Seed curated Coding Exams linking problems together."""
    exam_count = 0
    for ex_data in CURATED_EXAMS:
        slug = ex_data["slug"]
        slugs = ex_data.get("problem_slugs", [])
        problems = db.query(CodeProblem).filter(CodeProblem.slug.in_(slugs)).all()
        # Preserve order of problem_slugs
        slug_to_id = {p.slug: p.id for p in problems}
        prob_ids = [slug_to_id[s] for s in slugs if s in slug_to_id]

        existing = db.query(CodingExam).filter(CodingExam.slug == slug).first()
        data_to_save = {
            "slug": ex_data["slug"],
            "title": ex_data["title"],
            "description": ex_data["description"],
            "duration_minutes": ex_data["duration_minutes"],
            "track": ex_data["track"],
            "difficulty": ex_data["difficulty"],
            "total_score": ex_data["total_score"],
            "tags": ex_data["tags"],
            "problem_ids": prob_ids,
            "is_published": True
        }
        if not existing:
            ex = CodingExam(**data_to_save)
            db.add(ex)
            exam_count += 1
        else:
            for k, v in data_to_save.items():
                setattr(existing, k, v)
            exam_count += 1

    db.commit()
    print(f"[Problem Importer] ✅ Successfully seeded {exam_count} coding exams.")
    return exam_count
