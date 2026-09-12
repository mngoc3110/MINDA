# -*- coding: utf-8 -*-
"""
MINDA Code - Chuyên đề 15 Bài Tập Chuỗi (String) Trong C++
Đồng bộ cả Local DB (minda_local.db) và Server Production (https://minda.io.vn)
Tạo Kỳ Thi Mới chứa trọn bộ 15 bài.
"""

import sys
import os
import time
import requests

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)

from app.db.database import SessionLocal
from app.models.code_problem import CodeProblem, CodingExam

EXAM_TITLE = "Kỳ Thi Luyện Tập: Chuyên Đề Cấu Trúc Dữ Liệu Chuỗi Ký Tự Trong C++ (15 Bài)"
EXAM_SLUG = "chuyen-de-chuoi-ki-tu-cpp-15-bai"
EXAM_DESCRIPTION = (
    "Tuyển tập toàn diện **15 bài tập lập trình xử lý Chuỗi ký tự (String) trong C++** "
    "thuộc chuyên đề ôn luyện Chuyên Tin 10 và HSG Tin học.\n\n"
    "### 📋 Danh sách 15 bài toán trọng tâm:\n"
    "1. **Bài 1: Đếm kí tự** - Đếm số lần xuất hiện của ký tự trong xâu\n"
    "2. **Bài 2: Xóa khoảng trắng** - Loại bỏ toàn bộ khoảng cách trong chuỗi\n"
    "3. **Bài 3: Đếm số lượng kí tự** - Thống kê chữ cái, chữ số và ký tự đặc biệt\n"
    "4. **Bài 4: Xử lý chuỗi** - Chuẩn hóa văn bản, Title Case và khoảng trắng đơn\n"
    "5. **Bài 5: Đảo họ tên** - Đổi chỗ Họ và Tên, giữ nguyên tên đệm\n"
    "6. **Bài 6: Xóa kí tự** - Xóa ký tự chỉ định (không phân biệt hoa thường)\n"
    "7. **Bài 7: Mã hóa và giải mã** - Thuật toán mã hóa dịch vòng Caesar Cipher\n"
    "8. **Bài 8: Nén dữ liệu** - Thuật toán nén Run-Length Encoding (RLE)\n"
    "9. **Bài 9: Thay thế từ** - Tìm và thay thế từ độc lập trong câu\n"
    "10. **Bài 10: Mật khẩu** - Kiểm tra tính hợp lệ và độ an toàn mật khẩu\n"
    "11. **Bài 11: Bình luận** - Bộ lọc kiểm duyệt và ẩn từ cấm / spam\n"
    "12. **Bài 12: Xử lý danh sách** - Tách danh sách phân tách bởi dấu phẩy, lọc trùng và sắp xếp\n"
    "13. **Bài 13: Giải mã tin nhắn** - Đảo ngược từng từ để giải mã mật thư\n"
    "14. **Bài 14: Địa chỉ web sites** - Phân tích Protocol, Domain và Path của URL\n"
    "15. **Bài 15: Tổng dãy số** - Trích xuất các số nguyên xen kẽ và tính tổng\n\n"
    "Tất cả các bài đều có Test Cases tự động, mô tả Markdown chuẩn và starter code C++ / Python."
)

PROBLEMS = [
    # ── BÀI 1 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-dem-ki-tu",
        "title": "Bài 1 - Đếm kí tự",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "easy",
        "rating": 1000,
        "description": (
            "Cho một chuỗi ký tự $S$ và một ký tự $c$.\n\n"
            "Hãy viết chương trình đếm số lần ký tự $c$ xuất hiện trong chuỗi $S$ (có phân biệt chữ hoa và chữ thường).\n\n"
            "### Dữ liệu vào\n"
            "- Dòng 1: Chuỗi ký tự $S$ (độ dài không quá $10^5$, có thể chứa khoảng trắng).\n"
            "- Dòng 2: Ký tự $c$.\n\n"
            "### Dữ liệu ra\n"
            "- In ra một số nguyên duy nhất là số lần ký tự $c$ xuất hiện trong $S$."
        ),
        "constraints": ["1 <= len(S) <= 100000", "c là một ký tự in được trong bảng mã ASCII"],
        "examples": [
            {
                "input": "Lap trinh thi dau C++ chuyen tin\nh",
                "output": "3",
                "explanation": "Ký tự 'h' xuất hiện 3 lần trong 'trinh', 'thi', 'chuyen'."
            },
            {
                "input": "Hello World\no",
                "output": "2",
                "explanation": "Ký tự 'o' xuất hiện 2 lần."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    getline(cin, s);\n    char c;\n    cin >> c;\n    int count = 0;\n    for (char ch : s) {\n        if (ch == c) count++;\n    }\n    cout << count << \"\\n\";\n    return 0;\n}",
            "python": "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    s = lines[0]\n    c = lines[1]\n    print(s.count(c))\n"
        },
        "test_cases": [
            {"input": "Lap trinh thi dau C++ chuyen tin\nh\n", "output": "3\n"},
            {"input": "Hello World\no\n", "output": "2\n"},
            {"input": "AAAAA\nA\n", "output": "5\n"},
            {"input": "AAAAA\na\n", "output": "0\n"},
            {"input": "123 456 123 111\n1\n", "output": "5\n"}
        ]
    },

    # ── BÀI 2 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-xoa-khoang-trang",
        "title": "Bài 2 - Xóa khoảng trắng",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "easy",
        "rating": 1050,
        "description": (
            "Cho một chuỗi ký tự $S$.\n\n"
            "Hãy viết chương trình loại bỏ toàn bộ các ký tự khoảng trắng (dấu cách `' '`) có trong chuỗi $S$ và in ra chuỗi kết quả.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi $S$ sau khi đã loại bỏ toàn bộ dấu cách."
        ),
        "constraints": ["1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "   C ++   P r o g r a m m i n g   ",
                "output": "C++Programming",
                "explanation": "Toàn bộ dấu cách ở đầu, cuối và giữa các ký tự đều bị xóa."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        string res = \"\";\n        for (char c : s) {\n            if (c != ' ') res += c;\n        }\n        cout << res << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().rstrip('\\r\\n')\nprint(s.replace(' ', ''))\n"
        },
        "test_cases": [
            {"input": "   C ++   P r o g r a m m i n g   \n", "output": "C++Programming\n"},
            {"input": "Hello World\n", "output": "HelloWorld\n"},
            {"input": "    \n", "output": "\n"},
            {"input": "M I N D A\n", "output": "MINDA\n"},
            {"input": "1 2 3 4 5 6 7 8 9 0\n", "output": "1234567890\n"}
        ]
    },

    # ── BÀI 3 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-dem-so-luong-ki-tu",
        "title": "Bài 3 - Đếm số lượng kí tự",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "easy",
        "rating": 1100,
        "description": (
            "Cho một chuỗi ký tự $S$.\n\n"
            "Hãy đếm số lượng các loại ký tự trong chuỗi $S$ gồm:\n"
            "1. Số lượng chữ cái (chữ hoa `A`-`Z` và chữ thường `a`-`z`).\n"
            "2. Số lượng chữ số (`0`-`9`).\n"
            "3. Số lượng ký tự đặc biệt (tất cả các ký tự còn lại, bao gồm dấu câu, khoảng trắng, ký hiệu,...).\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra 3 số nguyên cách nhau một khoảng trắng: `[Số chữ cái] [Số chữ số] [Số ký tự đặc biệt]`."
        ),
        "constraints": ["1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "ChuyenTin2026@gmail.com!",
                "output": "17 4 3",
                "explanation": "Chữ cái: 17, Chữ số (2,0,2,6): 4, Ký tự khác (@, ., !): 3."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        int letters = 0, digits = 0, others = 0;\n        for (char c : s) {\n            if (isalpha((unsigned char)c)) letters++;\n            else if (isdigit((unsigned char)c)) digits++;\n            else others++;\n        }\n        cout << letters << \" \" << digits << \" \" << others << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().rstrip('\\r\\n')\nletters = sum(1 for c in s if c.isalpha())\ndigits = sum(1 for c in s if c.isdigit())\nothers = len(s) - letters - digits\nprint(f'{letters} {digits} {others}')\n"
        },
        "test_cases": [
            {"input": "ChuyenTin2026@gmail.com!\n", "output": "17 4 3\n"},
            {"input": "ABCabc123\n", "output": "6 3 0\n"},
            {"input": "!@#$%^&*() \n", "output": "0 0 11\n"},
            {"input": "Code 2026\n", "output": "4 4 1\n"},
            {"input": "C++ is #1\n", "output": "3 1 5\n"}
        ]
    },

    # ── BÀI 4 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-xu-ly-chuoi",
        "title": "Bài 4 - Xử lý chuỗi",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1200,
        "description": (
            "Cho một chuỗi văn bản $S$. Hãy chuẩn hóa chuỗi $S$ theo các quy tắc sau:\n"
            "1. Xóa tất cả các khoảng trắng thừa ở đầu chuỗi và cuối chuỗi.\n"
            "2. Giữa hai từ liên tiếp chỉ để lại đúng một khoảng trắng đơn.\n"
            "3. Viết hoa chữ cái đầu tiên của mỗi từ và viết thường tất cả các chữ cái còn lại trong từ đó (Title Case).\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi $S$ sau khi đã được chuẩn hóa."
        ),
        "constraints": ["1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "   nGUYen   Le   mInh   nGoc   ",
                "output": "Nguyen Le Minh Ngoc",
                "explanation": "Đã xóa khoảng trắng thừa và viết hoa chữ đầu mỗi từ."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <sstream>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        stringstream ss(s);\n        string word;\n        bool first = true;\n        while (ss >> word) {\n            word[0] = toupper((unsigned char)word[0]);\n            for (size_t i = 1; i < word.length(); i++) {\n                word[i] = tolower((unsigned char)word[i]);\n            }\n            if (!first) cout << \" \";\n            cout << word;\n            first = false;\n        }\n        cout << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().strip()\nwords = s.split()\nprint(' '.join(w.capitalize() for w in words))\n"
        },
        "test_cases": [
            {"input": "   nGUYen   Le   mInh   nGoc   \n", "output": "Nguyen Le Minh Ngoc\n"},
            {"input": "hOc   sInH   gIOi   tIN   hOc\n", "output": "Hoc Sinh Gioi Tin Hoc\n"},
            {"input": "MINDA CODE\n", "output": "Minda Code\n"},
            {"input": "   c++   pROGRAMMING   \n", "output": "C++ Programming\n"},
            {"input": "single\n", "output": "Single\n"}
        ]
    },

    # ── BÀI 5 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-dao-ho-ten",
        "title": "Bài 5 - Đảo họ tên",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1250,
        "description": (
            "Cho chuỗi họ và tên đầy đủ của một người gồm ít nhất 2 từ (từ đầu tiên là Họ, từ cuối cùng là Tên, "
            "các từ ở giữa là Tên đệm nếu có).\n\n"
            "Hãy viết chương trình đổi vị trí của **Họ** và **Tên**: đưa Tên lên đầu, Họ về cuối và giữ nguyên "
            "thứ tự của các từ tên đệm ở giữa.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng chứa chuỗi họ và tên (các từ cách nhau bởi một hoặc nhiều khoảng trắng).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi họ tên sau khi đã đảo vị trí Họ và Tên, các từ cách nhau đúng 1 khoảng trắng."
        ),
        "constraints": ["Số từ trong họ tên >= 2", "Độ dài chuỗi <= 10^5"],
        "examples": [
            {
                "input": "Nguyen Van An",
                "output": "An Van Nguyen",
                "explanation": "Họ 'Nguyen' chuyển về cuối, Tên 'An' đưa lên đầu, Tên đệm 'Van' giữ nguyên."
            },
            {
                "input": "Tran Thi Mai Huong",
                "output": "Huong Thi Mai Tran",
                "explanation": "Tên 'Huong' lên đầu, Họ 'Tran' về cuối."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        stringstream ss(s);\n        string w;\n        vector<string> words;\n        while (ss >> w) words.push_back(w);\n        if (words.size() >= 2) {\n            swap(words.front(), words.back());\n        }\n        for (size_t i = 0; i < words.size(); i++) {\n            cout << words[i] << (i + 1 == words.size() ? \"\" : \" \");\n        }\n        cout << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().strip()\nwords = s.split()\nif len(words) >= 2:\n    words[0], words[-1] = words[-1], words[0]\nprint(' '.join(words))\n"
        },
        "test_cases": [
            {"input": "Nguyen Van An\n", "output": "An Van Nguyen\n"},
            {"input": "Tran Thi Mai Huong\n", "output": "Huong Thi Mai Tran\n"},
            {"input": "Le B\n", "output": "B Le\n"},
            {"input": "  Dang   Xuan   Kien  \n", "output": "Kien Xuan Dang\n"},
            {"input": "Vu Thi Kim Anh\n", "output": "Anh Thi Kim Vu\n"}
        ]
    },

    # ── BÀI 6 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-xoa-ki-tu",
        "title": "Bài 6 - Xóa kí tự",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "easy",
        "rating": 1150,
        "description": (
            "Cho một chuỗi ký tự $S$ và một ký tự $c$.\n\n"
            "Hãy viết chương trình xóa tất cả các ký tự $c$ ra khỏi chuỗi $S$ mà **không phân biệt chữ hoa hay chữ thường** "
            "(tức là nếu $c = 'a'$ hoặc $c = 'A'$ thì cả hai ký tự `'a'` và `'A'` đều bị xóa khỏi $S$).\n\n"
            "### Dữ liệu vào\n"
            "- Dòng 1: Chuỗi ký tự $S$ (có thể chứa khoảng trắng).\n"
            "- Dòng 2: Ký tự $c$.\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi $S$ sau khi đã loại bỏ toàn bộ các ký tự $c$."
        ),
        "constraints": ["1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "An apple a day keeps the doctor away!\na",
                "output": "n pple  dy keeps the doctor wy!",
                "explanation": "Tất cả ký tự 'a' và 'A' đều bị xóa."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    getline(cin, s);\n    char c;\n    cin >> c;\n    char target = tolower((unsigned char)c);\n    string res = \"\";\n    for (char ch : s) {\n        if (tolower((unsigned char)ch) != target) {\n            res += ch;\n        }\n    }\n    cout << res << \"\\n\";\n    return 0;\n}",
            "python": "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    s = lines[0]\n    c = lines[1].lower()\n    print(''.join(ch for ch in s if ch.lower() != c))\n"
        },
        "test_cases": [
            {"input": "An apple a day keeps the doctor away!\na\n", "output": "n pple  dy keeps the doctor wy!\n"},
            {"input": "Hello World\nO\n", "output": "Hell Wrld\n"},
            {"input": "ABCabcABC\nb\n", "output": "ACacAC\n"},
            {"input": "xxxxXXXX\nx\n", "output": "\n"},
            {"input": "No matches here\nz\n", "output": "No matches here\n"}
        ]
    },

    # ── BÀI 7 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-ma-hoa-va-giai-ma",
        "title": "Bài 7 - Mã hóa và giải mã",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1300,
        "description": (
            "Thuật toán mã hóa Caesar là phương pháp mật mã cổ điển: mỗi chữ cái trong chuỗi văn bản được dịch chuyển "
            "về sau $K$ vị trí theo vòng tròn trong bảng chữ cái tiếng Anh (từ `'z'` quay lại `'a'`, từ `'Z'` quay lại `'A'`).\n\n"
            "Các ký tự không phải chữ cái (như số, dấu câu, khoảng trắng) được giữ nguyên không thay đổi.\n\n"
            "### Dữ liệu vào\n"
            "- Dòng 1: Một số nguyên $K$ ($0 \\le K \\le 25$) - bước dịch chuyển.\n"
            "- Dòng 2: Chuỗi ký tự $S$ cần mã hóa ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi đã được mã hóa."
        ),
        "constraints": ["0 <= K <= 25", "1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "3\nHello World 2026!",
                "output": "Khoor Zruog 2026!",
                "explanation": "'H' -> 'K', 'e' -> 'h', 'l' -> 'o', 'o' -> 'r'. Các số và dấu giữ nguyên."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int k;\n    if (cin >> k) {\n        string dummy;\n        getline(cin, dummy);\n        string s;\n        getline(cin, s);\n        for (char &c : s) {\n            if (islower((unsigned char)c)) {\n                c = (c - 'a' + k) % 26 + 'a';\n            } else if (isupper((unsigned char)c)) {\n                c = (c - 'A' + k) % 26 + 'A';\n            }\n        }\n        cout << s << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    k = int(lines[0])\n    s = lines[1]\n    res = []\n    for c in s:\n        if c.islower():\n            res.append(chr((ord(c) - ord('a') + k) % 26 + ord('a')))\n        elif c.isupper():\n            res.append(chr((ord(c) - ord('A') + k) % 26 + ord('A')))\n        else:\n            res.append(c)\n    print(''.join(res))\n"
        },
        "test_cases": [
            {"input": "3\nHello World 2026!\n", "output": "Khoor Zruog 2026!\n"},
            {"input": "0\nNo Change\n", "output": "No Change\n"},
            {"input": "1\nxyz XYZ\n", "output": "yza YZA\n"},
            {"input": "13\nROT13 Cipher\n", "output": "EBG13 Pvcure\n"},
            {"input": "25\nB\n", "output": "A\n"}
        ]
    },

    # ── BÀI 8 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-nen-du-lieu",
        "title": "Bài 8 - Nén dữ liệu",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1300,
        "description": (
            "Thuật toán nén Run-Length Encoding (RLE) nén một chuỗi bằng cách đếm số lần lặp lại liên tiếp của từng ký tự "
            "và thay thế dãy đó bằng ký tự kèm theo số lần xuất hiện liên tiếp của nó.\n\n"
            "Ví dụ: Dãy `AAA` gồm 3 chữ `'A'` liên tiếp nên được nén thành `A3`. Dãy `AAABBBCCCCDDA` được nén thành `A3B3C4D2A1`.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi ký tự $S$ ($1 \\le |S| \\le 10^5$, chỉ gồm các chữ cái viết hoa và viết thường, không có khoảng trắng).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi sau khi nén theo định dạng RLE."
        ),
        "constraints": ["1 <= len(S) <= 100000", "S chỉ gồm chữ cái a-z, A-Z"],
        "examples": [
            {
                "input": "AAABBBCCCCDDA",
                "output": "A3B3C4D2A1",
                "explanation": "'AAA' -> 'A3', 'BBB' -> 'B3', 'CCCC' -> 'C4', 'DD' -> 'D2', 'A' -> 'A1'."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (cin >> s && !s.empty()) {\n        string res = \"\";\n        int cnt = 1;\n        for (size_t i = 1; i <= s.length(); i++) {\n            if (i < s.length() && s[i] == s[i - 1]) {\n                cnt++;\n            } else {\n                res += s[i - 1] + to_string(cnt);\n                cnt = 1;\n            }\n        }\n        cout << res << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().strip()\nif s:\n    res = []\n    cnt = 1\n    for i in range(1, len(s) + 1):\n        if i < len(s) and s[i] == s[i - 1]:\n            cnt += 1\n        else:\n            res.append(f'{s[i-1]}{cnt}')\n            cnt = 1\n    print(''.join(res))\n"
        },
        "test_cases": [
            {"input": "AAABBBCCCCDDA\n", "output": "A3B3C4D2A1\n"},
            {"input": "A\n", "output": "A1\n"},
            {"input": "ABCDE\n", "output": "A1B1C1D1E1\n"},
            {"input": "AAAAAAAAAA\n", "output": "A10\n"},
            {"input": "aAaAaA\n", "output": "a1A1a1A1a1A1\n"}
        ]
    },

    # ── BÀI 9 ─────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-thay-the-tu",
        "title": "Bài 9 - Thay thế từ",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1350,
        "description": (
            "Cho một đoạn văn bản $S$, một từ cần tìm $S_1$ và một từ thay thế $S_2$.\n\n"
            "Hãy viết chương trình thay thế tất cả các lần xuất hiện của từ $S_1$ trong chuỗi $S$ bằng từ $S_2$ "
            "(các từ được phân cách bởi khoảng trắng).\n\n"
            "### Dữ liệu vào\n"
            "- Dòng 1: Chuỗi văn bản $S$.\n"
            "- Dòng 2: Từ cần tìm $S_1$.\n"
            "- Dòng 3: Từ thay thế $S_2$.\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi sau khi đã thực hiện thay thế."
        ),
        "constraints": ["1 <= len(S) <= 100000", "S1, S2 không chứa khoảng trắng"],
        "examples": [
            {
                "input": "hoc sinh yeu thich lap trinh pascal va pascal rat hay\npascal\nc++",
                "output": "hoc sinh yeu thich lap trinh c++ va c++ rat hay",
                "explanation": "Từ 'pascal' được thay bằng 'c++'."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <sstream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s, s1, s2;\n    getline(cin, s);\n    cin >> s1 >> s2;\n    stringstream ss(s);\n    string word;\n    bool first = true;\n    while (ss >> word) {\n        if (word == s1) word = s2;\n        if (!first) cout << \" \";\n        cout << word;\n        first = false;\n    }\n    cout << \"\\n\";\n    return 0;\n}",
            "python": "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 3:\n    s = lines[0]\n    s1 = lines[1]\n    s2 = lines[2]\n    words = [s2 if w == s1 else w for w in s.split()]\n    print(' '.join(words))\n"
        },
        "test_cases": [
            {"input": "hoc sinh yeu thich lap trinh pascal va pascal rat hay\npascal\nc++\n", "output": "hoc sinh yeu thich lap trinh c++ va c++ rat hay\n"},
            {"input": "apple orange apple banana\napple\nmango\n", "output": "mango orange mango banana\n"},
            {"input": "hello world\njava\npython\n", "output": "hello world\n"},
            {"input": "test test test\ntest\npassed\n", "output": "passed passed passed\n"},
            {"input": "one\none\ntwo\n", "output": "two\n"}
        ]
    },

    # ── BÀI 10 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-mat-khau",
        "title": "Bài 10 - Mật khẩu",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1250,
        "description": (
            "Một hệ thống yêu cầu người dùng đặt mật khẩu an toàn thỏa mãn các điều kiện sau:\n"
            "1. Độ dài tối thiểu 8 ký tự.\n"
            "2. Chứa ít nhất một chữ cái in hoa (`A`-`Z`).\n"
            "3. Chứa ít nhất một chữ cái in thường (`a`-`z`).\n"
            "4. Chứa ít nhất một chữ số (`0`-`9`).\n"
            "5. Chứa ít nhất một ký tự đặc biệt trong tập: `@, #, $, %, !, ^, &, *`.\n"
            "6. Tuyệt đối không chứa khoảng trắng.\n\n"
            "Hãy kiểm tra xem chuỗi mật khẩu nhập vào có hợp lệ hay không. In `VALID` nếu hợp lệ, ngược lại in `INVALID`.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi mật khẩu $P$.\n\n"
            "### Dữ liệu ra\n"
            "- In `VALID` hoặc `INVALID`."
        ),
        "constraints": ["1 <= len(P) <= 1000"],
        "examples": [
            {
                "input": "Minda@2026",
                "output": "VALID",
                "explanation": "Độ dài 10 >= 8, có chữ hoa 'M', chữ thường, số '2026', ký tự '@'."
            },
            {
                "input": "minda2026",
                "output": "INVALID",
                "explanation": "Thiếu chữ hoa và ký tự đặc biệt."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string p;\n    if (getline(cin, p)) {\n        if (p.length() < 8) {\n            cout << \"INVALID\\n\";\n            return 0;\n        }\n        bool hasUp = false, hasLow = false, hasDig = false, hasSpec = false, hasSpace = false;\n        string special = \"@#$%!^&*\";\n        for (char c : p) {\n            if (c == ' ') hasSpace = true;\n            else if (isupper((unsigned char)c)) hasUp = true;\n            else if (islower((unsigned char)c)) hasLow = true;\n            else if (isdigit((unsigned char)c)) hasDig = true;\n            else if (special.find(c) != string::npos) hasSpec = true;\n        }\n        if (hasUp && hasLow && hasDig && hasSpec && !hasSpace) {\n            cout << \"VALID\\n\";\n        } else {\n            cout << \"INVALID\\n\";\n        }\n    }\n    return 0;\n}",
            "python": "import sys\np = sys.stdin.readline().rstrip('\\r\\n')\nif len(p) >= 8 and not any(c == ' ' for c in p):\n    has_up = any(c.isupper() for c in p)\n    has_low = any(c.islower() for c in p)\n    has_dig = any(c.isdigit() for c in p)\n    has_spec = any(c in '@#$%!^&*' for c in p)\n    print('VALID' if (has_up and has_low and has_dig and has_spec) else 'INVALID')\nelse:\n    print('INVALID')\n"
        },
        "test_cases": [
            {"input": "Minda@2026\n", "output": "VALID\n"},
            {"input": "minda2026\n", "output": "INVALID\n"},
            {"input": "Short1!\n", "output": "INVALID\n"},
            {"input": "Pass with space1@\n", "output": "INVALID\n"},
            {"input": "Strong#Pass99\n", "output": "VALID\n"}
        ]
    },

    # ── BÀI 11 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-binh-luan",
        "title": "Bài 11 - Bình luận",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1400,
        "description": (
            "Để giữ môi trường bình luận văn minh, hệ thống kiểm duyệt cần tự động làm mờ các từ cấm.\n\n"
            "Cho danh sách $N$ từ cấm và một chuỗi bình luận $S$. Với mỗi từ cấm xuất hiện trong $S$ "
            "(không phân biệt chữ hoa hay chữ thường), hãy thay thế từ cấm đó bằng chuỗi ký tự dấu sao `*` "
            "có độ dài bằng đúng độ dài của từ cấm đó.\n\n"
            "### Dữ liệu vào\n"
            "- Dòng 1: Số nguyên $N$ ($1 \\le N \\le 50$) - số từ cấm.\n"
            "- $N$ dòng tiếp theo: Mỗi dòng chứa 1 từ cấm.\n"
            "- Dòng cuối cùng: Chuỗi bình luận $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi bình luận sau khi đã che các từ cấm bằng dấu sao `*`."
        ),
        "constraints": ["1 <= N <= 50", "1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "2\nspam\nlua dao\nTrang web nay khong he lua dao hay co spam dau nha!",
                "output": "Trang web nay khong he ******* hay co **** dau nha!",
                "explanation": "'lua dao' có 7 ký tự -> '*******', 'spam' có 4 ký tự -> '****'."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <vector>\n#include <cctype>\nusing namespace std;\n\nstring toLower(const string &str) {\n    string res = str;\n    for (char &c : res) c = tolower((unsigned char)c);\n    return res;\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    int n;\n    if (cin >> n) {\n        string dummy;\n        getline(cin, dummy);\n        vector<string> banned(n);\n        for (int i = 0; i < n; i++) {\n            getline(cin, banned[i]);\n        }\n        string s;\n        getline(cin, s);\n        string s_lower = toLower(s);\n        for (const string &b : banned) {\n            string b_lower = toLower(b);\n            size_t pos = 0;\n            while ((pos = s_lower.find(b_lower, pos)) != string::npos) {\n                for (size_t i = pos; i < pos + b.length(); i++) {\n                    s[i] = '*';\n                    s_lower[i] = '*';\n                }\n                pos += b.length();\n            }\n        }\n        cout << s << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    n = int(lines[0])\n    banned = lines[1:n+1]\n    s = lines[n+1]\n    s_list = list(s)\n    s_lower = s.lower()\n    for b in banned:\n        b_low = b.lower()\n        start = 0\n        while True:\n            idx = s_lower.find(b_low, start)\n            if idx == -1: break\n            for k in range(idx, idx + len(b)):\n                s_list[k] = '*'\n            s_lower = ''.join(s_list).lower()\n            start = idx + len(b)\n    print(''.join(s_list))\n"
        },
        "test_cases": [
            {"input": "2\nspam\nlua dao\nTrang web nay khong he lua dao hay co spam dau nha!\n", "output": "Trang web nay khong he ******* hay co **** dau nha!\n"},
            {"input": "1\nbad\nThis is a Bad boy\n", "output": "This is a *** boy\n"},
            {"input": "1\ncheat\nClean comment here\n", "output": "Clean comment here\n"},
            {"input": "2\nabc\nxyz\nabc xyz ABC XYZ\n", "output": "*** *** *** ***\n"},
            {"input": "1\nfoo\nfoofoofoo\n", "output": "*********\n"}
        ]
    },

    # ── BÀI 12 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-xu-ly-danh-sach",
        "title": "Bài 12 - Xử lý danh sách",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1350,
        "description": (
            "Cho một chuỗi chứa danh sách các mục (ví dụ: tên tỉnh thành, học sinh) được phân tách bởi dấu phẩy `,`.\n\n"
            "Hãy viết chương trình:\n"
            "1. Tách từng mục trong danh sách.\n"
            "2. Xóa khoảng trắng thừa ở đầu và cuối mỗi mục.\n"
            "3. Loại bỏ các mục bị trùng lặp.\n"
            "4. Sắp xếp danh sách các mục theo thứ tự từ điển (alphabetical order) tăng dần và in mỗi mục trên một dòng.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi danh sách các phần tử cách nhau bởi dấu phẩy.\n\n"
            "### Dữ liệu ra\n"
            "- In ra danh sách các mục không trùng lặp theo thứ tự từ điển, mỗi mục trên một dòng."
        ),
        "constraints": ["1 <= Độ dài chuỗi <= 10^5", "Các mục không rỗng sau khi bỏ khoảng trắng"],
        "examples": [
            {
                "input": "Hanoi, Da Nang ,  Saigon, Hanoi, Hue ,  Da Nang",
                "output": "Da Nang\nHanoi\nHue\nSaigon",
                "explanation": "Đã loại bỏ trùng lặp ('Hanoi', 'Da Nang') và sắp xếp tăng dần."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <sstream>\n#include <set>\nusing namespace std;\n\nstring trim(const string &str) {\n    size_t start = str.find_first_not_of(\" \\t\");\n    if (start == string::npos) return \"\";\n    size_t end = str.find_last_not_of(\" \\t\");\n    return str.substr(start, end - start + 1);\n}\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string line;\n    if (getline(cin, line)) {\n        stringstream ss(line);\n        string token;\n        set<string> unique_items;\n        while (getline(ss, token, ',')) {\n            string clean = trim(token);\n            if (!clean.empty()) unique_items.insert(clean);\n        }\n        for (const string &item : unique_items) {\n            cout << item << \"\\n\";\n        }\n    }\n    return 0;\n}",
            "python": "import sys\nline = sys.stdin.readline().strip()\nif line:\n    items = sorted(list(set(x.strip() for x in line.split(',') if x.strip())))\n    for it in items:\n        print(it)\n"
        },
        "test_cases": [
            {"input": "Hanoi, Da Nang ,  Saigon, Hanoi, Hue ,  Da Nang\n", "output": "Da Nang\nHanoi\nHue\nSaigon\n"},
            {"input": "Apple, Banana, Apple, Orange\n", "output": "Apple\nBanana\nOrange\n"},
            {"input": "Z, Y, X, W\n", "output": "W\nX\nY\nZ\n"},
            {"input": "SingleItem\n", "output": "SingleItem\n"},
            {"input": " Vietnam , Laos , Cambodia , Vietnam \n", "output": "Cambodia\nLaos\nVietnam\n"}
        ]
    },

    # ── BÀI 13 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-giai-ma-tin-nhan",
        "title": "Bài 13 - Giải mã tin nhắn",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "easy",
        "rating": 1200,
        "description": (
            "Một tin nhắn bí mật đã bị mã hóa theo quy luật: mỗi từ trong câu đều bị đảo ngược thứ tự các ký tự của nó, "
            "nhưng vị trí của các từ và các khoảng trắng giữa các từ vẫn giữ nguyên.\n\n"
            "Hãy viết chương trình giải mã bức mật thư này về dạng ban đầu bằng cách đảo ngược lại từng từ trong câu.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi mật thư $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra chuỗi sau khi đã giải mã."
        ),
        "constraints": ["1 <= len(S) <= 100000"],
        "examples": [
            {
                "input": "olleh dlrow gnimmargorp si nuf",
                "output": "hello world programming is fun",
                "explanation": "'olleh' -> 'hello', 'dlrow' -> 'world', 'si' -> 'is', 'nuf' -> 'fun'."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        int n = s.length();\n        int l = 0;\n        for (int r = 0; r <= n; r++) {\n            if (r == n || s[r] == ' ') {\n                reverse(s.begin() + l, s.begin() + r);\n                l = r + 1;\n            }\n        }\n        cout << s << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\ns = sys.stdin.readline().rstrip('\\r\\n')\nwords = s.split(' ')\nprint(' '.join(w[::-1] for w in words))\n"
        },
        "test_cases": [
            {"input": "olleh dlrow gnimmargorp si nuf\n", "output": "hello world programming is fun\n"},
            {"input": "adnIM edoC\n", "output": "MINda Code\n"},
            {"input": "a b c d\n", "output": "a b c d\n"},
            {"input": "racecar radar\n", "output": "racecar radar\n"},
            {"input": "   gnidoc   si   cool   \n", "output": "   coding   is   looc   \n"}
        ]
    },

    # ── BÀI 14 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-dia-chi-web-sites",
        "title": "Bài 14 - Địa chỉ web sites",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1350,
        "description": (
            "Cho một chuỗi chứa địa chỉ URL của một trang web có dạng chuẩn:\n"
            "`[Protocol]://[Domain]/[Path]` hoặc `[Protocol]://[Domain]` (không có phần path phía sau).\n\n"
            "Hãy viết chương trình phân tích và trích xuất các thành phần:\n"
            "- `Protocol`: Giao thức mạng (ví dụ `http`, `https`).\n"
            "- `Domain`: Tên miền của trang web.\n"
            "- `Path`: Đường dẫn tài nguyên (nếu không có thì in ra `None`).\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi địa chỉ URL ($1 \\le |URL| \\le 1000$).\n\n"
            "### Dữ liệu ra\n"
            "- Gồm 3 dòng theo định dạng sau:\n"
            "  - `Protocol: <giao thức>`\n"
            "  - `Domain: <tên miền>`\n"
            "  - `Path: <đường dẫn>`"
        ),
        "constraints": ["1 <= len(URL) <= 1000", "URL luôn chứa '://'"],
        "examples": [
            {
                "input": "https://luyenthichuyentin10.edu.vn/courses/lap-trinh-c",
                "output": "Protocol: https\nDomain: luyenthichuyentin10.edu.vn\nPath: courses/lap-trinh-c",
                "explanation": "Protocol là https, Domain là luyenthichuyentin10.edu.vn, Path là courses/lap-trinh-c."
            },
            {
                "input": "http://minda.io.vn",
                "output": "Protocol: http\nDomain: minda.io.vn\nPath: None",
                "explanation": "URL không có đường dẫn phía sau nên Path là None."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string url;\n    if (cin >> url) {\n        size_t proto_pos = url.find(\"://\");\n        string protocol = url.substr(0, proto_pos);\n        string rest = url.substr(proto_pos + 3);\n        size_t slash_pos = rest.find('/');\n        string domain, path = \"None\";\n        if (slash_pos == string::npos) {\n            domain = rest;\n        } else {\n            domain = rest.substr(0, slash_pos);\n            path = rest.substr(slash_pos + 1);\n            if (path.empty()) path = \"None\";\n        }\n        cout << \"Protocol: \" << protocol << \"\\n\";\n        cout << \"Domain: \" << domain << \"\\n\";\n        cout << \"Path: \" << path << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys\nurl = sys.stdin.readline().strip()\nif url:\n    proto, rest = url.split('://', 1)\n    if '/' in rest:\n        domain, path = rest.split('/', 1)\n        if not path: path = 'None'\n    else:\n        domain = rest\n        path = 'None'\n    print(f'Protocol: {proto}')\n    print(f'Domain: {domain}')\n    print(f'Path: {path}')\n"
        },
        "test_cases": [
            {"input": "https://luyenthichuyentin10.edu.vn/courses/lap-trinh-c\n", "output": "Protocol: https\nDomain: luyenthichuyentin10.edu.vn\nPath: courses/lap-trinh-c\n"},
            {"input": "http://minda.io.vn\n", "output": "Protocol: http\nDomain: minda.io.vn\nPath: None\n"},
            {"input": "ftp://files.server.com/downloads/v1.0.zip\n", "output": "Protocol: ftp\nDomain: files.server.com\nPath: downloads/v1.0.zip\n"},
            {"input": "https://google.com/\n", "output": "Protocol: https\nDomain: google.com\nPath: None\n"},
            {"input": "https://codeforces.com/problemset/problem/1/A\n", "output": "Protocol: https\nDomain: codeforces.com\nPath: problemset/problem/1/A\n"}
        ]
    },

    # ── BÀI 15 ────────────────────────────────────────────────────────────
    {
        "slug": "string-cpp-tong-day-so",
        "title": "Bài 15 - Tổng dãy số",
        "subject": "Bồi dưỡng HSG & Chuyên Tin",
        "chapter": "6. Xử lý xâu",
        "track": "thcs",
        "difficulty": "medium",
        "rating": 1250,
        "description": (
            "Cho một chuỗi ký tự $S$ có độ dài không quá $10^5$, chứa các ký tự chữ cái, ký tự đặc biệt và các chữ số xen kẽ nhau.\n\n"
            "Hãy tìm tất cả các số nguyên liên tiếp xuất hiện trong chuỗi và tính tổng của chúng.\n\n"
            "Ví dụ: Chuỗi `abc12def34gh5` chứa 3 số nguyên là $12, 34, 5$. Tổng của chúng là $12 + 34 + 5 = 51$.\n\n"
            "### Dữ liệu vào\n"
            "- Một dòng duy nhất chứa chuỗi ký tự $S$ ($1 \\le |S| \\le 10^5$).\n\n"
            "### Dữ liệu ra\n"
            "- In ra một số nguyên duy nhất là tổng tất cả các số nguyên xuất hiện trong chuỗi."
        ),
        "constraints": ["1 <= len(S) <= 100000", "Tổng các số không vượt quá 10^18 (dùng kiểu long long)"],
        "examples": [
            {
                "input": "abc12def34gh5",
                "output": "51",
                "explanation": "Các số tìm được: 12, 34, 5. Tổng = 12 + 34 + 5 = 51."
            },
            {
                "input": "A10B20C30D40",
                "output": "100",
                "explanation": "10 + 20 + 30 + 40 = 100."
            }
        ],
        "hints": [],
        "starter_code": {
            "cpp": "#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    string s;\n    if (getline(cin, s)) {\n        long long total = 0;\n        long long curr = 0;\n        for (char c : s) {\n            if (isdigit((unsigned char)c)) {\n                curr = curr * 10 + (c - '0');\n            } else {\n                total += curr;\n                curr = 0;\n            }\n        }\n        total += curr;\n        cout << total << \"\\n\";\n    }\n    return 0;\n}",
            "python": "import sys, re\ns = sys.stdin.readline().strip()\nnums = re.findall(r'\\d+', s)\nprint(sum(int(x) for x in nums))\n"
        },
        "test_cases": [
            {"input": "abc12def34gh5\n", "output": "51\n"},
            {"input": "A10B20C30D40\n", "output": "100\n"},
            {"input": "no numbers here!\n", "output": "0\n"},
            {"input": "1000000000 2000000000\n", "output": "3000000000\n"},
            {"input": "0012abc034\n", "output": "46\n"}
        ]
    }
]

API_URL = "https://minda.io.vn"

def sync_local_db():
    print("\n" + "=" * 60)
    print("🚀 BƯỚC 1: ĐỒNG BỘ VÀO LOCAL DATABASE (minda_local.db)")
    print("=" * 60)
    db = SessionLocal()
    local_problem_ids = []

    try:
        creator_id = 1

        for p_data in PROBLEMS:
            slug = p_data["slug"]
            existing = db.query(CodeProblem).filter(CodeProblem.slug == slug).first()

            data_dict = {
                "slug": slug,
                "title": p_data["title"],
                "description": p_data["description"],
                "difficulty": p_data["difficulty"],
                "rating": p_data["rating"],
                "track": p_data["track"],
                "subject": p_data["subject"],
                "chapter": p_data["chapter"],
                "tags": ["C++", "Chuỗi ký tự", "String", "2627C"],
                "constraints": p_data.get("constraints", []),
                "examples": p_data.get("examples", []),
                "hints": [],
                "starter_code": p_data.get("starter_code", {}),
                "test_cases": p_data.get("test_cases", []),
                "source": "Luyện thi chuyên Tin 10 (2627C)"
            }

            if not existing:
                prob = CodeProblem(**data_dict)
                db.add(prob)
                db.flush()
                local_problem_ids.append(prob.id)
                print(f"  [Tạo mới Local] {p_data['title']} (ID: {prob.id})")
            else:
                for k, v in data_dict.items():
                    setattr(existing, k, v)
                db.flush()
                local_problem_ids.append(existing.id)
                print(f"  [Cập nhật Local] {p_data['title']} (ID: {existing.id})")

        # Tạo hoặc cập nhật CodingExam local
        existing_exam = db.query(CodingExam).filter(CodingExam.slug == EXAM_SLUG).first()
        exam_data = {
            "slug": EXAM_SLUG,
            "title": EXAM_TITLE,
            "description": EXAM_DESCRIPTION,
            "duration_minutes": 180,
            "track": "thcs",
            "difficulty": "medium",
            "total_score": len(local_problem_ids) * 10,
            "is_published": True,
            "problem_ids": local_problem_ids,
            "tags": ["C++", "Chuỗi ký tự", "String", "Chuyên đề", "2627C"],
            "creator_id": creator_id
        }

        if not existing_exam:
            new_exam = CodingExam(**exam_data)
            db.add(new_exam)
            db.commit()
            print(f"✅ Local DB: Đã tạo Kỳ Thi Mới (ID: {new_exam.id}) gồm {len(local_problem_ids)} bài.")
        else:
            for k, v in exam_data.items():
                setattr(existing_exam, k, v)
            db.commit()
            print(f"✅ Local DB: Đã cập nhật Kỳ Thi (ID: {existing_exam.id}) gồm {len(local_problem_ids)} bài.")

    except Exception as e:
        db.rollback()
        print(f"❌ Lỗi khi nạp vào Local DB: {e}")
    finally:
        db.close()


def sync_remote_api():
    print("\n" + "=" * 60)
    print("🚀 BƯỚC 2: ĐỒNG BỘ LÊN PRODUCTION (https://minda.io.vn)")
    print("=" * 60)

    token_file = os.path.join(BACKEND_DIR, ".minda_token")
    if not os.path.exists(token_file):
        print("❌ Không tìm thấy .minda_token")
        return

    with open(token_file, "r") as f:
        token = f.read().strip()

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Test auth
    r_me = requests.get(f"{API_URL}/api/auth/me", headers=headers, timeout=5)
    if r_me.status_code != 200:
        print(f"❌ Token xác thực thất bại ({r_me.status_code}): {r_me.text}")
        return

    user_info = r_me.json()
    print(f"🔑 Giáo viên: {user_info.get('full_name')} ({user_info.get('email')})")

    # Lấy danh sách bài toán hiện có trên server
    r_probs = requests.get(f"{API_URL}/api/problems", headers=headers, timeout=15)
    server_slug_to_id = {}
    if r_probs.status_code == 200:
        for p in r_probs.json():
            server_slug_to_id[p["slug"]] = p["id"]

    remote_problem_ids = []

    for idx, p_data in enumerate(PROBLEMS, start=1):
        slug = p_data["slug"]
        payload = {
            "slug": slug,
            "title": p_data["title"],
            "subject": p_data["subject"],
            "chapter": p_data["chapter"],
            "track": p_data["track"],
            "difficulty": p_data["difficulty"],
            "rating": p_data["rating"],
            "description": p_data["description"],
            "tags": ["C++", "Chuỗi ký tự", "String", "2627C"],
            "constraints": p_data.get("constraints", []),
            "examples": p_data.get("examples", []),
            "hints": [],
            "starter_code": p_data.get("starter_code", {}),
            "test_cases": p_data.get("test_cases", []),
            "source": "Luyện thi chuyên Tin 10 (2627C)"
        }

        if slug in server_slug_to_id:
            pid = server_slug_to_id[slug]
            # Cập nhật lại nội dung nếu cần
            requests.put(f"{API_URL}/api/problems/{pid}", headers=headers, json=payload, timeout=10)
            remote_problem_ids.append(pid)
            print(f"  [Đã tồn tại] Bài {idx:02d}: {p_data['title']} (ID: {pid})")
        else:
            try:
                res = requests.post(f"{API_URL}/api/problems", headers=headers, json=payload, timeout=10)
                if res.status_code in [200, 201]:
                    data = res.json()
                    pid = data.get("id")
                    remote_problem_ids.append(pid)
                    print(f"  [Tạo mới thành công] Bài {idx:02d}: {p_data['title']} -> ID: {pid}")
                else:
                    print(f"  ❌ Lỗi tạo bài {idx:02d}: {res.status_code} - {res.text[:100]}")
            except Exception as ex:
                print(f"  ❌ Ngoại lệ tại bài {idx:02d}: {ex}")

        time.sleep(0.05)

    print(f"\n📊 Đã đồng bộ {len(remote_problem_ids)} bài tập lên MINDA.")

    # Tạo Kỳ Thi Mới (Coding Exam) trên Production
    print(f"\n[*] Đang tạo Kỳ Thi Mới: {EXAM_TITLE}...")
    exam_payload = {
        "slug": EXAM_SLUG,
        "title": EXAM_TITLE,
        "description": EXAM_DESCRIPTION,
        "duration_minutes": 180,
        "track": "thcs",
        "difficulty": "medium",
        "total_score": len(remote_problem_ids) * 10,
        "tags": ["C++", "Chuỗi ký tự", "String", "Chuyên đề", "2627C"],
        "problem_ids": remote_problem_ids
    }

    try:
        r_exam = requests.post(f"{API_URL}/api/coding-exams", headers=headers, json=exam_payload, timeout=15)
        if r_exam.status_code in [200, 201]:
            exam_res = r_exam.json().get("exam", {})
            print(f"\n🎉 THÀNH CÔNG! Kỳ thi mới đã được tạo trực tiếp trên MINDA Production:")
            print(f"   - Tiêu đề: {exam_res.get('title')}")
            print(f"   - Mã kỳ thi (Slug): {exam_res.get('slug')}")
            print(f"   - Exam ID: {exam_res.get('id')}")
            print(f"   - Số lượng bài: {len(remote_problem_ids)} bài")
            print(f"   - Đường dẫn trực tiếp: https://minda.io.vn/code/exam/{exam_res.get('slug')}")
        else:
            print(f"  ❌ Lỗi tạo exam ({r_exam.status_code}): {r_exam.text}")
    except Exception as e:
        print(f"  ❌ Lỗi kết nối khi tạo exam: {e}")

if __name__ == "__main__":
    sync_local_db()
    sync_remote_api()
