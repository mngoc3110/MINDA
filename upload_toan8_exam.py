# -*- coding: utf-8 -*-
"""
MINDA - Master Upload Script cho ĐỀ KIỂM TRA GIỮA KÌ I MÔN TOÁN 8 (NĂM HỌC 2025 - 2026)
Trường THCS Phước Thạnh - UBND Xã Đất Đỏ.
Hỗ trợ đầy đủ:
- Trắc nghiệm 4 lựa chọn (12 câu)
- Trắc nghiệm Đúng/Sai (2 câu x 4 ý)
- Trắc nghiệm trả lời ngắn (4 câu)
- Tự luận (3 bài) kèm khung upload hình ảnh bài làm & AI Agent chấm tự động theo Bareme.
Đồng bộ cả Production API (https://minda.io.vn) và Local SQLite (minda_local.db).
"""

import sys
import os
import json
import sqlite3
import requests
from datetime import datetime

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "student-center/backend"))
sys.path.insert(0, BACKEND_DIR)

# Tải danh sách URLs CDN từ Cloudinary
URL_MAP_PATH = os.path.join(BACKEND_DIR, "cloudinary_toan8_urls.json")
with open(URL_MAP_PATH, "r", encoding="utf-8") as f:
    URL_MAP = json.load(f)

# Helper lấy URL CDN hoặc fallback sang static local
def get_url(filename: str) -> str:
    return URL_MAP.get(filename, f"/static/docs/{filename}")

# Dữ liệu đề thi chi tiết
QUIZ_DATA = {
    "title": "ĐỀ KIỂM TRA GIỮA KÌ I - NĂM HỌC 2025 - 2026 - MÔN: TOÁN 8",
    "school": "Trường THCS Phước Thạnh (UBND Xã Đất Đỏ)",
    "duration_minutes": 90,
    "max_score": 10.0,
    "originalDocUrl": get_url("de_giua_hoc_ky_1_toan_8.pdf"),
    "answerKeyDocUrl": get_url("dap_an_de_giua_hoc_ky_1_toan_8.pdf"),
    "pageImages": [
        get_url("toan8_page_1.jpg"),
        get_url("toan8_page_2.jpg"),
        get_url("toan8_page_3.jpg"),
        get_url("toan8_page_4.jpg")
    ],
    "answerKeyImages": [
        get_url("dapan_toan8_page_1.jpg"),
        get_url("dapan_toan8_page_2.jpg")
    ],
    "sections": [
        {
            "id": "sec1",
            "title": "A. TRẮC NGHIỆM - PHẦN 1",
            "instruction": "PHẦN 1: CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (3,0 điểm). Thí sinh chọn một phương án đúng nhất từ Câu 1 đến Câu 12 (mỗi câu 0,25 điểm):",
            "type": "mcq",
            "score_per_question": 0.25,
            "questions": [
                {
                    "id": "q1",
                    "text": "Biểu thức nào là đơn thức?",
                    "options": [
                        "A. $-5x^2y^3$",
                        "B. $\\sqrt{x}$",
                        "C. $x^2 + x + 1$",
                        "D. $\\frac{x}{y}$"
                    ],
                    "correctAnswer": 0,
                    "score": 0.25,
                    "explanation": "Đơn thức là biểu thức đại số chỉ gồm một số, hoặc một biến, hoặc một tích giữa các số và các biến.\n\n- **A. $-5x^2y^3$** là tích giữa số $-5$ và các luỹ thừa của biến $x, y$ nên là đơn thức.\n- **B. $\\sqrt{x}$** chứa phép khai căn của biến.\n- **C. $x^2 + x + 1$** là tổng của các đơn thức (đa thức có 3 hạng tử).\n- **D. $\\frac{x}{y}$** có biến $y$ ở mẫu số.\n\n$\\Rightarrow$ **Đáp án đúng là A**."
                },
                {
                    "id": "q2",
                    "text": "Kết quả của phép chia $3x^2y^5 : xy^2$ là:",
                    "options": [
                        "A. $2xy^3$",
                        "B. $3xy^3$",
                        "C. $3x^2y^3$",
                        "D. $3x^3y^7$"
                    ],
                    "correctAnswer": 1,
                    "score": 0.25,
                    "explanation": "Thực hiện phép chia đơn thức cho đơn thức:\n$$3x^2y^5 : xy^2 = (3 : 1) \\cdot (x^2 : x) \\cdot (y^5 : y^2) = 3xy^3$$\n\n$\\Rightarrow$ **Đáp án đúng là B**."
                },
                {
                    "id": "q3",
                    "text": "Biểu thức nào sau đây đồng dạng với đơn thức $7x^2y$?",
                    "options": [
                        "A. $xy$",
                        "B. $-2x^2y$",
                        "C. $xy^2$",
                        "D. $7x^2y^2$"
                    ],
                    "correctAnswer": 1,
                    "score": 0.25,
                    "explanation": "Hai đơn thức đồng dạng là hai đơn thức có hệ số khác 0 và có cùng phần biến.\n- Đơn thức $7x^2y$ có phần biến là $x^2y$.\n- Trong các lựa chọn, đơn thức $-2x^2y$ có cùng phần biến $x^2y$.\n\n$\\Rightarrow$ **Đáp án đúng là B**."
                },
                {
                    "id": "q4",
                    "text": "Bậc của đa thức $x^2y - 3xy - xy^3 + 5$ là:",
                    "options": [
                        "A. 2",
                        "B. 3",
                        "C. 4",
                        "D. 5"
                    ],
                    "correctAnswer": 2,
                    "score": 0.25,
                    "explanation": "Xác định bậc của từng hạng tử trong đa thức đã thu gọn:\n- Hạng tử $x^2y$ có bậc là $2 + 1 = 3$.\n- Hạng tử $-3xy$ có bậc là $1 + 1 = 2$.\n- Hạng tử $-xy^3$ có bậc là $1 + 3 = 4$.\n- Hạng tử $5$ có bậc là 0.\nHạng tử có bậc cao nhất là $-xy^3$ với bậc 4. Do đó bậc của đa thức là 4.\n\n$\\Rightarrow$ **Đáp án đúng là C**."
                },
                {
                    "id": "q5",
                    "text": "Kết quả phân tích đa thức $x^2 - xy$ thành nhân tử là:",
                    "options": [
                        "A. $x(x - y)$",
                        "B. $x(2 - y)$",
                        "C. $x^2(1 - y)$",
                        "D. $xy(x - 1)$"
                    ],
                    "correctAnswer": 0,
                    "score": 0.25,
                    "explanation": "Đặt nhân tử chung là $x$ ra ngoài:\n$$x^2 - xy = x(x - y)$$\n\n$\\Rightarrow$ **Đáp án đúng là A**."
                },
                {
                    "id": "q6",
                    "text": "Điền vào chỗ trống để được khẳng định đúng: $(x + 2)^2 = x^2 + \\dots + 4$ là:",
                    "options": [
                        "A. $2x$",
                        "B. $4x$",
                        "C. $-2x$",
                        "D. $-4x$"
                    ],
                    "correctAnswer": 1,
                    "score": 0.25,
                    "explanation": "Áp dụng hằng đẳng thức bình phương của một tổng:\n$$(x + 2)^2 = x^2 + 2 \\cdot x \\cdot 2 + 2^2 = x^2 + 4x + 4$$\nSố hạng còn thiếu ở vị trí dấu chấm là $4x$.\n\n$\\Rightarrow$ **Đáp án đúng là B**."
                },
                {
                    "id": "q7",
                    "text": "Tổng số đo các góc của một tứ giác là:",
                    "options": [
                        "A. $90^\\circ$",
                        "B. $180^\\circ$",
                        "C. $360^\\circ$",
                        "D. $720^\\circ$"
                    ],
                    "correctAnswer": 2,
                    "score": 0.25,
                    "explanation": "Theo định lí về tổng các góc của một tứ giác: Tổng các góc trong một tứ giác bằng $360^\\circ$.\n\n$\\Rightarrow$ **Đáp án đúng là C**."
                },
                {
                    "id": "q8",
                    "text": f"Cho các hình thang sau, hình nào là **hình thang cân**?\n\n| Hình a | Hình b |\n| :---: | :---: |\n| ![{get_url('cau8_a.png')}]({get_url('cau8_a.png')}) | ![{get_url('cau8_b.jpeg')}]({get_url('cau8_b.jpeg')}) |\n\n| Hình c | Hình d |\n| :---: | :---: |\n| ![{get_url('cau8_c.png')}]({get_url('cau8_c.png')}) | ![{get_url('cau8_d.png')}]({get_url('cau8_d.png')}) |",
                    "options": [
                        "A. Hình a",
                        "B. Hình b",
                        "C. Hình c",
                        "D. Hình d"
                    ],
                    "correctAnswer": 3,
                    "score": 0.25,
                    "explanation": "Hình thang cân là hình thang có hai góc kề một đáy bằng nhau (hoặc hai đường chéo bằng nhau).\n- Hình d là hình thang $PQMN$ ($PQ \\parallel MN$) có hai góc kề đáy bằng nhau: $\\hat{M} = \\hat{N} = 62^\\circ$.\nDo đó, Hình d là hình thang cân.\n\n$\\Rightarrow$ **Đáp án đúng là D**."
                },
                {
                    "id": "q9",
                    "text": f"Cho hình vẽ bên (tam giác $ABC$ vuông tại $A$):\n\n<div align=\"center\"><img src=\"{get_url('cau9.png')}\" alt=\"Tam giác vuông ABC\" width=\"150\" /></div>\n\nKhẳng định nào sau đây là đúng?",
                    "options": [
                        "A. $BC^2 = AB^2 + AC^2$",
                        "B. $AC^2 = AB^2 + BC^2$",
                        "C. $AB^2 = AC^2 + BC^2$",
                        "D. $BC^2 = AB^2 - AC^2$"
                    ],
                    "correctAnswer": 0,
                    "score": 0.25,
                    "explanation": "Theo định lí Pythagore trong tam giác $ABC$ vuông tại $A$:\n\"Bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông\"\n$$BC^2 = AB^2 + AC^2$$\n\n$\\Rightarrow$ **Đáp án đúng là A**."
                },
                {
                    "id": "q10",
                    "text": f"Trong các hình vẽ sau, hình nào là **hình chóp tam giác đều**?\n\n<div align=\"center\"><img src=\"{get_url('cau10.jpeg')}\" alt=\"Các hình chóp\" style=\"max-width:100%\" /></div>",
                    "options": [
                        "A. Hình a",
                        "B. Hình b",
                        "C. Hình c",
                        "D. Hình d"
                    ],
                    "correctAnswer": 1,
                    "score": 0.25,
                    "explanation": "Hình chóp tam giác đều là hình chóp có đáy là tam giác đều và các mặt bên là các tam giác cân bằng nhau có chung đỉnh.\nQuan sát các hình vẽ, Hình b chính là hình chóp tam giác đều chuẩn.\n\n$\\Rightarrow$ **Đáp án đúng là B**."
                },
                {
                    "id": "q11",
                    "text": f"Hình vẽ bên có dạng hình gì?\n\n<div align=\"center\"><img src=\"{get_url('cau11.jpeg')}\" alt=\"Hình chóp\" width=\"200\" /></div>",
                    "options": [
                        "A. Hình chóp tứ giác đều",
                        "B. Hình chóp tam giác đều",
                        "C. Hình tam giác",
                        "D. Hình lăng trụ đứng tam giác"
                    ],
                    "correctAnswer": 0,
                    "score": 0.25,
                    "explanation": "Hình vẽ có đỉnh $A$, đáy $BCDE$ là hình vuông (tứ giác) và các mặt bên là các tam giác cân có chung đỉnh $A$, đường cao từ đỉnh $A$ đi qua tâm $O$ của đáy. Do đó đây là hình chóp tứ giác đều.\n\n$\\Rightarrow$ **Đáp án đúng là A**."
                },
                {
                    "id": "q12",
                    "text": f"Cho hình vẽ bên, các **mặt bên** của hình chóp tam giác đều là:\n\n<div align=\"center\"><img src=\"{get_url('cau12.jpeg')}\" alt=\"Hình chóp tam giác đều S.ABC\" width=\"180\" /></div>",
                    "options": [
                        "A. $ABC, SAB, SBC, SAC$",
                        "B. $ABC, SAB, SBC$",
                        "C. $SAC, SBC, ABC$",
                        "D. $SAB, SAC, SBC$"
                    ],
                    "correctAnswer": 3,
                    "score": 0.25,
                    "explanation": "Hình chóp tam giác đều $S.ABC$ có:\n- Mặt đáy là tam giác $ABC$.\n- Các mặt bên là các tam giác $SAB, SAC, SBC$.\n\n$\\Rightarrow$ **Đáp án đúng là D**."
                }
            ]
        },
        {
            "id": "sec2",
            "title": "A. TRẮC NGHIỆM - PHẦN 2",
            "instruction": "PHẦN 2: CÂU TRẮC NGHIỆM ĐÚNG/SAI (2,0 điểm). Ở mỗi câu, thí sinh chọn 'ĐÚNG' hoặc 'SAI' cho mỗi ý a), b), c), d) (mỗi ý đúng đạt 0,25 điểm):",
            "type": "true_false",
            "score_per_question": 1.0,
            "questions": [
                {
                    "id": "q13",
                    "text": "Xét tính đúng/sai của các khẳng định sau về đa thức và phép biến đổi đại số:",
                    "isTrue": True,
                    "score": 1.0,
                    "items": [
                        {
                            "label": "a",
                            "text": "Đa thức $x^2y - 3x + 2$ có bậc 3.",
                            "isTrue": True,
                            "explanation": "Hạng tử $x^2y$ có bậc là $2 + 1 = 3$, các hạng tử khác có bậc 1 và 0. Vậy đa thức có bậc 3 (ĐÚNG)."
                        },
                        {
                            "label": "b",
                            "text": "Phân tích đa thức $x^2 - 9$ thành nhân tử là $(x - 3)^2$.",
                            "isTrue": False,
                            "explanation": "Theo hằng đẳng thức hiệu hai bình phương: $x^2 - 9 = x^2 - 3^2 = (x - 3)(x + 3)$. Do đó khẳng định $(x - 3)^2$ là SAI."
                        },
                        {
                            "label": "c",
                            "text": "Kết quả của phép nhân: $2y(x - 5)$ là $2xy - 5$.",
                            "isTrue": False,
                            "explanation": "Nhân đơn thức với đa thức: $2y(x - 5) = 2y \\cdot x - 2y \\cdot 5 = 2xy - 10y$. Khẳng định $2xy - 5$ là SAI."
                        },
                        {
                            "label": "d",
                            "text": "Kết quả của $(x + 1)(x - 1) = x^2 - 1$.",
                            "isTrue": True,
                            "explanation": "Theo hằng đẳng thức hiệu hai bình phương: $(x + 1)(x - 1) = x^2 - 1^2 = x^2 - 1$ (ĐÚNG)."
                        }
                    ],
                    "explanation": "a) ĐÚNG; b) SAI; c) SAI; d) ĐÚNG."
                },
                {
                    "id": "q14",
                    "text": "Xét tính đúng/sai của các khẳng định sau về hình học (hình thang, hình chóp):",
                    "isTrue": True,
                    "score": 1.0,
                    "items": [
                        {
                            "label": "a",
                            "text": "Thể tích của hình chóp tam giác đều là: $V = S_{\\text{đáy}} \\cdot h$.",
                            "isTrue": False,
                            "explanation": "Công thức tính thể tích hình chóp tam giác đều là $V = \\frac{1}{3} S_{\\text{đáy}} \\cdot h$. Khẳng định thiếu hệ số 1/3 nên là SAI."
                        },
                        {
                            "label": "b",
                            "text": "Hình thang $ABCD$ có hai đường chéo là $AC$ và $BD$.",
                            "isTrue": True,
                            "explanation": "Trong tứ giác/hình thang $ABCD$, hai đoạn thẳng nối các đỉnh đối diện là $AC$ và $BD$ chính là hai đường chéo (ĐÚNG)."
                        },
                        {
                            "label": "c",
                            "text": "Tứ giác có hai cạnh đối song song là hình thang.",
                            "isTrue": True,
                            "explanation": "Định nghĩa hình thang: Hình thang là tứ giác có hai cạnh đối song song (ĐÚNG)."
                        },
                        {
                            "label": "d",
                            "text": "Hình thang có hai đường chéo bằng nhau là hình thang cân.",
                            "isTrue": True,
                            "explanation": "Dấu hiệu nhận biết hình thang cân: Hình thang có hai đường chéo bằng nhau là hình thang cân (ĐÚNG)."
                        }
                    ],
                    "explanation": "a) SAI; b) ĐÚNG; c) ĐÚNG; d) ĐÚNG."
                }
            ]
        },
        {
            "id": "sec3",
            "title": "A. TRẮC NGHIỆM - PHẦN 3",
            "instruction": "PHẦN 3: CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (2,0 điểm). Trong mỗi câu, hãy viết câu trả lời/kết quả gọn nhất mà không cần trình bày lời giải chi tiết (0,5 điểm/câu):",
            "type": "short_answer",
            "score_per_question": 0.5,
            "questions": [
                {
                    "id": "q15",
                    "text": "Kết quả phép chia $(2x^3y^2 - 6x^2y + 4xy) : 2xy$ là:",
                    "correctAnswer": "x^2y - 3x + 2",
                    "acceptedAnswers": [
                        "x^2y - 3x + 2",
                        "x^2y-3x+2",
                        "x^2*y - 3*x + 2",
                        "x^2y - 3x + 2.",
                        "x^2 y - 3x + 2"
                    ],
                    "score": 0.5,
                    "explanation": "Chia từng hạng tử của đa thức cho $2xy$:\n$$\\frac{2x^3y^2 - 6x^2y + 4xy}{2xy} = \\frac{2x^3y^2}{2xy} - \\frac{6x^2y}{2xy} + \\frac{4xy}{2xy} = x^2y - 3x + 2$$"
                },
                {
                    "id": "q16",
                    "text": "Phân tích đa thức $x^2 - 2x + xy - 2y$ thành nhân tử là:",
                    "correctAnswer": "(x - 2)(x + y)",
                    "acceptedAnswers": [
                        "(x - 2)(x + y)",
                        "(x-2)(x+y)",
                        "(x + y)(x - 2)",
                        "(x+y)(x-2)",
                        "(x - 2) * (x + y)"
                    ],
                    "score": 0.5,
                    "explanation": "Nhóm hạng tử:\n$$x^2 - 2x + xy - 2y = (x^2 - 2x) + (xy - 2y) = x(x - 2) + y(x - 2) = (x - 2)(x + y)$$"
                },
                {
                    "id": "q17",
                    "text": "Khai triển tính $(x - 5)^2$ là:",
                    "correctAnswer": "x^2 - 10x + 25",
                    "acceptedAnswers": [
                        "x^2 - 10x + 25",
                        "x^2-10x+25",
                        "x^2 - 10*x + 25"
                    ],
                    "score": 0.5,
                    "explanation": "Áp dụng hằng đẳng thức bình phương của một hiệu:\n$$(x - 5)^2 = x^2 - 2 \\cdot x \\cdot 5 + 5^2 = x^2 - 10x + 25$$"
                },
                {
                    "id": "q18",
                    "text": f"Cho hình thang cân $ABCD$ như hình vẽ bên, biết $\\hat{{A}} = 100^\\circ$. Khi đó số đo góc $\\hat{{B}}$ bằng bao nhiêu độ?\n\n<div align=\"center\"><img src=\"{get_url('cau18.png')}\" alt=\"Hình thang cân ABCD\" width=\"160\" /></div>",
                    "correctAnswer": "100",
                    "acceptedAnswers": [
                        "100",
                        "100°",
                        "100 độ",
                        "100^o",
                        "B = 100",
                        "B = 100°"
                    ],
                    "score": 0.5,
                    "explanation": "Vì $ABCD$ là hình thang cân với đáy $AB$ và $CD$ nên hai góc kề đáy $AB$ bằng nhau:\n$$\\hat{B} = \\hat{A} = 100^\\circ$$\nVậy $\\hat{B} = 100^\\circ$."
                }
            ]
        },
        {
            "id": "sec4",
            "title": "B. TỰ LUẬN (3,0 ĐIỂM)",
            "instruction": "PHẦN B: TỰ LUẬN (3,0 điểm). Thí sinh giải chi tiết từng bài ra giấy kiểm tra, sau đó chụp ảnh bài làm và bấm 'Tải ảnh bài làm' vào từng ô tương ứng. Hệ thống AI Grader Agent sẽ tự động đối chiếu từng bước với Bareme điểm chuẩn để chấm điểm và đưa ra nhận xét chi tiết.",
            "type": "essay",
            "questions": [
                {
                    "id": "essay_1",
                    "text": "### Bài 1: (1,0 điểm)\n\na) Tính giá trị của đa thức $A = 5x^3 + 2xy - 5x^3 + xy - 1$ tại $x = 1, y = 2$.\n\nb) Phân tích đa thức $x^3 - 4x$ thành nhân tử.",
                    "score": 1.0,
                    "rubric": [
                        {
                            "step": "a) Thu gọn đa thức: A = (5x^3 - 5x^3) + (2xy + xy) - 1 = 3xy - 1",
                            "points": 0.25
                        },
                        {
                            "step": "a) Thay x = 1, y = 2 vào A: A = 3*1*2 - 1 = 5. Kết luận giá trị của đa thức tại x = 1, y = 2 là 5",
                            "points": 0.25
                        },
                        {
                            "step": "b) Đặt nhân tử chung x: x^3 - 4x = x(x^2 - 4)",
                            "points": 0.25
                        },
                        {
                            "step": "b) Dùng hằng đẳng thức hiệu hai bình phương: x(x^2 - 2^2) = x(x - 2)(x + 2)",
                            "points": 0.25
                        }
                    ],
                    "solution": "**a) Tính giá trị của đa thức $A$:**\n$$A = 5x^3 + 2xy - 5x^3 + xy - 1$$\n$$A = (5x^3 - 5x^3) + (2xy + xy) - 1$$\n$$A = 3xy - 1$$\nThay $x = 1, y = 2$ vào biểu thức $A$ thu gọn:\n$$A = 3 \\cdot 1 \\cdot 2 - 1 = 6 - 1 = 5$$\nVậy giá trị của đa thức tại $x = 1, y = 2$ là **$5$**.\n\n---\n**b) Phân tích đa thức thành nhân tử:**\n$$x^3 - 4x = x(x^2 - 4) = x(x - 2)(x + 2)$$"
                },
                {
                    "id": "essay_2",
                    "text": "### Bài 2: (1,0 điểm)\n\nĐể hưởng ứng cuộc thi *“Làm đồ dùng học tập”*, bạn An đã làm một khối hình chóp tứ giác đều bằng gỗ có cạnh đáy dài $6\\text{ dm}$, chiều cao mặt bên là $4\\text{ dm}$.\n\na) Tính diện tích xung quanh của khối gỗ?\n\nb) Bạn An muốn sơn các mặt bên của khối gỗ. Cứ mỗi mét vuông sơn cần trả $100\\,000$ đồng (tiền sơn và tiền công). Em hãy giúp bạn An tính chi phí phải trả?",
                    "score": 1.0,
                    "rubric": [
                        {
                            "step": "a) Áp dụng đúng công thức và tính diện tích xung quanh: S_xq = 4 * (1/2 * 6 * 4) = 48 dm^2 (hoặc nửa chu vi đáy x trung đoạn: p * d = 12 * 4 = 48 dm^2)",
                            "points": 0.5
                        },
                        {
                            "step": "b) Đổi đơn vị diện tích đúng: 48 dm^2 = 0,48 m^2",
                            "points": 0.25
                        },
                        {
                            "step": "b) Tính chi phí phải trả: 0,48 * 100 000 = 48 000 (đồng). Đáp số 48 000 đồng",
                            "points": 0.25
                        }
                    ],
                    "solution": "**a) Tính diện tích xung quanh của khối gỗ:**\nKhối gỗ hình chóp tứ giác đều có 4 mặt bên là các tam giác cân bằng nhau với cạnh đáy $a = 6\\text{ dm}$ và chiều cao $h_{\\text{mặt bên}} = 4\\text{ dm}$.\nDiện tích xung quanh của khối gỗ là:\n$$S_{xq} = 4 \\cdot \\left(\\frac{1}{2} \\cdot 6 \\cdot 4\\right) = 4 \\cdot 12 = 48\\text{ (dm}^2)$$\n*(Hoặc dùng công thức $S_{xq} = p \\cdot d = \\frac{4 \\cdot 6}{2} \\cdot 4 = 12 \\cdot 4 = 48\\text{ dm}^2$)*.\n\n---\n**b) Tính chi phí sơn các mặt bên:**\nĐổi đơn vị diện tích:\n$$48\\text{ dm}^2 = 0{,}48\\text{ m}^2$$\nChi phí bạn An phải trả để sơn các mặt bên là:\n$$0{,}48 \\times 100\\,000 = 48\\,000\\text{ (đồng)}$$\n**Đáp số:** a) $48\\text{ dm}^2$; b) $48\\,000$ đồng."
                },
                {
                    "id": "essay_3",
                    "text": f"### Bài 3: (1,0 điểm)\n\na) Cho tứ giác $ABCD$ có $\\hat{{A}} = 120^\\circ, \\hat{{B}} = 100^\\circ, \\hat{{C}} = 75^\\circ$. Tính số đo góc $\\hat{{D}}$.\n\nb) Một cây cao $12\\text{{ m}}$ mọc cạnh bờ sông. Trên đỉnh cây có một con chim đang đậu và chuẩn bị sà xuống bắt con cá trên mặt nước (như Hình 1 và được mô phỏng như Hình 2). Hỏi con chim sẽ bay một đoạn ngắn nhất là bao nhiêu mét để bắt được con cá biết rằng con cá cách gốc cây $5\\text{{ m}}$ và nước mấp mé bờ sông?\n\n<div align=\"center\"><img src=\"{get_url('bai3b.png')}\" alt=\"Mô phỏng con chim bắt cá\" width=\"240\" /></div>",
                    "score": 1.0,
                    "rubric": [
                        {
                            "step": "a) Nêu định lí tổng 4 góc trong tứ giác bằng 360 độ: A + B + C + D = 360 độ (0.25đ); Tính đúng D = 360 - (120 + 100 + 75) = 65 độ (0.25đ)",
                            "points": 0.5
                        },
                        {
                            "step": "b) Nhận xét tam giác vuông tại A, áp dụng định lí Pythagore: BC^2 = AB^2 + AC^2 = 5^2 + 12^2 = 169 (0.25đ)",
                            "points": 0.25
                        },
                        {
                            "step": "b) Tính BC = căn(169) = 13 (m) và kết luận đoạn đường ngắn nhất là 13m (0.25đ)",
                            "points": 0.25
                        }
                    ],
                    "solution": "**a) Xét tứ giác $ABCD$ có:**\n$$\\hat{A} + \\hat{B} + \\hat{C} + \\hat{D} = 360^\\circ \\quad (\\text{định lí tổng các góc trong một tứ giác})$$\n$$\\Rightarrow \\hat{D} = 360^\\circ - (\\hat{A} + \\hat{B} + \\hat{C})$$\n$$\\Rightarrow \\hat{D} = 360^\\circ - (120^\\circ + 100^\\circ + 75^\\circ) = 360^\\circ - 295^\\circ = 65^\\circ$$\nVậy $\\hat{D} = 65^\\circ$.\n\n---\n**b) Tính quãng đường bay ngắn nhất của con chim:**\nMô hình hóa bài toán bằng tam giác $ABC$ vuông tại $A$ như Hình 2:\n- $AC = 12\\text{ m}$ là chiều cao của cây.\n- $AB = 5\\text{ m}$ là khoảng cách từ con cá đến gốc cây.\n- Đoạn thẳng $BC$ ngắn nhất chính là cạnh huyền của tam giác vuông $ABC$.\n\nÁp dụng định lí Pythagore trong tam giác vuông $ABC$ tại $A$:\n$$BC^2 = AB^2 + AC^2$$\n$$BC^2 = 5^2 + 12^2 = 25 + 144 = 169$$\n$$\\Rightarrow BC = \\sqrt{169} = 13\\text{ (m)} \\quad (\\text{do } BC > 0)$$\n\nVậy con chim phải bay một đoạn ngắn nhất là **$13\\text{ m}$** để bắt được con cá."
                }
            ]
        }
    ]
}

TITLE = "ĐỀ KIỂM TRA GIỮA KÌ I - NĂM HỌC 2025 - 2026 - MÔN: TOÁN 8"
DESC = "Đề thi chính thức Trường THCS Phước Thạnh (UBND Xã Đất Đỏ). Thời gian: 90 phút. Cấu trúc chuẩn 4 phần: Trắc nghiệm 4 lựa chọn, Trắc nghiệm Đúng/Sai, Trả lời ngắn và Tự luận (chụp ảnh tải lên để AI Agent chấm theo Bareme chuẩn)."

def sync_local_sqlite():
    print("\n" + "=" * 60)
    print("🚀 BƯỚC 1: ĐỒNG BỘ VÀO LOCAL DATABASE (minda_local.db)")
    print("=" * 60)
    db_path = os.path.join(BACKEND_DIR, "minda_local.db")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Tìm hoặc tạo folder
    cur.execute("SELECT id FROM assignment_folders WHERE name = ? LIMIT 1", ("Toán 8 / Ôn thi giữa học kỳ 1",))
    f_row = cur.fetchone()
    if f_row:
        folder_id = f_row[0]
    else:
        cur.execute("INSERT INTO assignment_folders (name, teacher_id, is_assigned_to_all) VALUES (?, 1, 1)", ("Toán 8 / Ôn thi giữa học kỳ 1",))
        folder_id = cur.lastrowid
        conn.commit()

    # Kiểm tra assignment
    cur.execute("SELECT id FROM assignments WHERE title = ? AND folder_id = ?", (TITLE, folder_id))
    a_row = cur.fetchone()
    if a_row:
        assign_id = a_row[0]
        cur.execute("""
            UPDATE assignments
            SET quiz_data = ?, description = ?, attachment_url = ?, max_score = 10.0,
                exam_format = 'practice', is_assigned_to_all = 1, assignment_type = 'quiz'
            WHERE id = ?
        """, (json.dumps(QUIZ_DATA, ensure_ascii=False), DESC, get_url("de_giua_hoc_ky_1_toan_8.pdf"), assign_id))
        print(f"🔄 Đã cập nhật Assignment Local (ID: {assign_id})")
    else:
        cur.execute("""
            INSERT INTO assignments (
                teacher_id, folder_id, title, description,
                assignment_type, exam_format, quiz_data,
                max_score, is_assigned_to_all, attachment_url, created_at
            ) VALUES (1, ?, ?, ?, 'quiz', 'practice', ?, 10.0, 1, ?, datetime('now'))
        """, (folder_id, TITLE, DESC, json.dumps(QUIZ_DATA, ensure_ascii=False), get_url("de_giua_hoc_ky_1_toan_8.pdf")))
        assign_id = cur.lastrowid
        print(f"🎉 Đã tạo mới Assignment Local (ID: {assign_id})")

    conn.commit()
    conn.close()
    return assign_id


def sync_production_api():
    print("\n" + "=" * 60)
    print("🚀 BƯỚC 2: ĐỒNG BỘ VÀO HỆ THỐNG MINDA PRODUCTION (https://minda.io.vn)")
    print("=" * 60)
    token_file = os.path.join(BACKEND_DIR, ".minda_token")
    if not os.path.isfile(token_file):
        print("❌ Không tìm thấy .minda_token")
        return None

    token = open(token_file).read().strip()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 1. Tìm hoặc tạo Folder trên VPS
    r_folders = requests.get("https://minda.io.vn/api/folders/", headers=headers, timeout=10)
    folder_id = 16  # Folder vừa tạo
    if r_folders.status_code == 200:
        for f in r_folders.json():
            if "Toán 8" in f.get("name", ""):
                folder_id = f["id"]
                break
    print(f"📁 Folder Toán 8 trên VPS ID: {folder_id}")

    # 2. Tìm hoặc tạo Assignment
    r_assigns = requests.get("https://minda.io.vn/api/assignments/teacher/dashboard/assignments", headers=headers, timeout=10)
    existing_id = None
    if r_assigns.status_code == 200:
        for a in r_assigns.json():
            if a.get("title") == TITLE:
                existing_id = a.get("id")
                break

    payload = {
        "title": TITLE,
        "description": DESC,
        "assignment_type": "quiz",
        "exam_format": "practice",
        "folder_id": folder_id,
        "max_score": 10,
        "is_assigned_to_all": True,
        "attachment_url": get_url("de_giua_hoc_ky_1_toan_8.pdf"),
        "quiz_data": QUIZ_DATA
    }

    if existing_id:
        print(f"🔄 Đang cập nhật đề thi trên VPS (ID: {existing_id})...")
        r_update = requests.put(f"https://minda.io.vn/api/assignments/{existing_id}", headers=headers, json=payload, timeout=15)
        if r_update.status_code in [200, 201]:
            print(f"✅ Đã cập nhật thành công đề thi VPS ID: {existing_id}")
            return existing_id
        else:
            print(f"❌ Lỗi cập nhật ({r_update.status_code}): {r_update.text}")
            return existing_id
    else:
        print("✨ Đang tạo mới đề thi trên VPS...")
        r_create = requests.post("https://minda.io.vn/api/assignments", headers=headers, json=payload, timeout=15)
        if r_create.status_code in [200, 201]:
            created = r_create.json()
            new_id = created.get("id")
            print(f"🎉 Đã tạo mới thành công đề thi VPS ID: {new_id}")
            return new_id
        else:
            print(f"❌ Lỗi tạo mới ({r_create.status_code}): {r_create.text}")
            return None


if __name__ == "__main__":
    local_id = sync_local_sqlite()
    prod_id = sync_production_api()

    print("\n" + "=" * 60)
    print("🌟 HOÀN THÀNH TẢI ĐỀ THI TOÁN 8 LÊN HỆ THỐNG MINDA!")
    print("=" * 60)
    if local_id:
        print(f"💻 Link làm bài trên Local Dev: http://localhost:3000/practice/{local_id}")
    if prod_id:
        print(f"🌐 Link làm bài trên Minda Cloud: https://minda.io.vn/practice/{prod_id}")
    print("=" * 60)
