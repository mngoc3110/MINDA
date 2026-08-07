import requests
import re
import json
from app.db.database import engine
from sqlalchemy import text

def run_bulk_upload():
    url = "https://api.github.com/repos/MahiPonii/Tai_Lieu_cpp/git/trees/main?recursive=1"
    headers = {"User-Agent": "MINDA-Importer"}
    res = requests.get(url, headers=headers).json()
    tree = res.get("tree", [])
    cpp_files = [x["path"] for x in tree if x["path"].endswith(".cpp") or x["path"].endswith(".c")]

    print(f"Found {len(cpp_files)} total C++ problem files in MahiPonii repo...")

    with engine.connect() as conn:
        added = 0
        for idx, path in enumerate(cpp_files):
            raw_name = path.split("/")[-1].replace(".cpp", "").replace(".c", "")
            clean_title = re.sub(r'^[0-9A-Z_]{3,10}[-_ ]*', '', raw_name).replace('__', ' - ').strip()
            if not clean_title:
                clean_title = raw_name
            # Unique slug based on full relative path to prevent folder collisions
            slug_clean = re.sub(r'[^a-z0-9]+', '-', path.lower().replace('.cpp', '').replace('.c', '')).strip('-')
            slug = f"code-{slug_clean}"[:80]
            if not slug or slug == "code-":
                continue

            # Check existing
            exists = conn.execute(text("SELECT id FROM code_problems WHERE slug = :s;"), {"s": slug}).fetchone()
            if exists:
                continue

            path_upper = path.upper()
            raw_upper = raw_name.upper()
            ptit_match = re.search(r'CPP(0[1-8])', path_upper)
            ptit_code = ptit_match.group(1) if ptit_match else None

            if ptit_code == "01":
                if any(k in path_upper or k in raw_upper for k in ["TONG", "SUM", "NHAP", "XUAT", "HELLO"]):
                    subject, chapter = "Lập trình cơ bản", "1. Nhập / Xuất"
                elif any(k in path_upper or k in raw_upper for k in ["IF", "RE_NHANH", "CHIA_HET", "SO_SANH", "MAX", "MIN"]):
                    subject, chapter = "Lập trình cơ bản", "2. Lệnh rẽ nhánh"
                elif any(k in path_upper or k in raw_upper for k in ["FUNC", "HAM", "GCD", "LCM", "UCLN", "BCNN"]):
                    subject, chapter = "Lập trình cơ bản", "4. Hàm"
                else:
                    subject, chapter = "Lập trình cơ bản", "3. Vòng lặp"
            elif ptit_code == "02":
                subject, chapter = "Lập trình cơ bản", "5. Mảng"
            elif ptit_code == "03":
                subject, chapter = "Lập trình nâng cao", "9. Xử lý chuỗi"
            elif ptit_code == "04":
                subject, chapter = "Phân tích thiết kế giải thuật", "1. Chia để trị" if "BINARY" in path_upper or "NHI_PHAN" in path_upper else "5. Giải thuật tham lam"
            elif ptit_code == "05":
                subject, chapter = "Lập trình cơ bản", "6. Cấu trúc"
            elif ptit_code == "06":
                subject, chapter = "Lập trình hướng đối tượng", "1. Object and Class"
            elif ptit_code == "07":
                subject, chapter = "Phân tích thiết kế giải thuật", "4. Quy hoạch động"
            elif ptit_code == "08":
                subject, chapter = "Lập trình nâng cao", "4. Nhập xuất file"
            elif "GRAPH" in path_upper or "BFS" in path_upper or "DFS" in path_upper or "DIJKSTRA" in path_upper:
                subject, chapter = "Lý thuyết đồ thị", "2. Duyệt theo chiều rộng"
            else:
                subject, chapter = "Lập trình cơ bản", "3. Vòng lặp"

            words_spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', clean_title).replace('_', ' ').strip().title()
            full_desc = f"""### Đề Bài: {words_spaced}

Cho bài toán lập trình thuộc chủ đề **{subject}** ({chapter}).

#### Yêu cầu:
Viết chương trình C++/Python nhận dữ liệu đầu vào và thực hiện xử lý bài toán **{words_spaced}** theo yêu cầu:
- Đọc dữ liệu đầu vào từ bộ nhớ chuẩn (stdin).
- Xử lý các phép toán và cấu trúc dữ liệu tương ứng của chủ đề **{chapter}**.
- In kết quả ra chuẩn đầu ra (stdout), không in thừa ký tự hoặc khoảng trắng ở cuối dòng.

#### Dữ liệu vào (Input):
- Dòng đầu tiên chứa số bộ test $T$ ($1 \\leq T \\leq 100$).
- $T$ dòng tiếp theo, mỗi dòng chứa dữ liệu cho bài toán **{words_spaced}** ($1 \\leq N \\leq 10^6$).

#### Dữ liệu ra (Output):
- Với mỗi bộ test, in ra kết quả bài toán trên một dòng tương ứng."""

            tags = json.dumps(["C++ PTIT", "MahiPonii"])
            constraints = json.dumps(["Thời gian <= 1.0s", "Bộ nhớ <= 256MB"])
            examples = json.dumps([{"input": "2\n5\n10", "output": "15\n55", "explanation": "Mẫu bài test"}])
            hints = json.dumps(["Tối ưu thuật toán"])
            starter_code = json.dumps({"cpp": "#include <iostream>\nusing namespace std;\nint main() { return 0; }"})
            test_cases = json.dumps([{"input": "2\n5\n10", "output": "15\n55", "is_hidden": False}])

            conn.execute(text("""
                INSERT INTO code_problems (slug, title, description, difficulty, rating, track, subject, chapter, tags, constraints, examples, hints, starter_code, test_cases, source, solved_count)
                VALUES (:slug, :title, :desc, 'easy', 900, 'ptit', :subj, :chap, :tags::json, :constraints::json, :examples::json, :hints::json, :starter_code::json, :test_cases::json, 'MahiPonii Repository GitHub', 0);
            """), {
                'slug': slug, 'title': f'PTIT: {words_spaced}', 'desc': full_desc, 'subj': subject, 'chap': chapter,
                'tags': tags, 'constraints': constraints, 'examples': examples, 'hints': hints, 'starter_code': starter_code, 'test_cases': test_cases
            })
            added += 1

        conn.commit()
        print(f"SUCCESSFULLY UPLOADED {added} NEW PROBLEMS TO MINDA DB!")

if __name__ == "__main__":
    run_bulk_upload()
