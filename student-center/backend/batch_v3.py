"""
Batch solve and upload - v3: robust JSON cleaning + only failed exams.
"""
import os, json, sys, time, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

BASE = "/var/www/minda/student-center/backend/"

# Only re-run the ones that FAILED
EXAMS = [
    {"path": BASE+"exam1.pdf", "title": "Đề Thi Thử Toán - Chuyên KHTN Hà Nội",
     "desc": "Đề thi thử THPT, nguồn: Chuyên KHTN - Hà Nội."},
    {"path": BASE+"exam3.pdf", "title": "Đề Thi Thử Toán - Nguyễn Khuyến HCM",
     "desc": "Đề thi thử THPT, nguồn: Trường Nguyễn Khuyến - TP.HCM."},
    {"path": BASE+"exam4.pdf", "title": "Đề Thi Thử Toán - Triệu Sơn 3 Thanh Hoá",
     "desc": "Đề thi thử THPT, nguồn: Triệu Sơn 3 - Thanh Hoá."},
    {"path": BASE+"exam5.pdf", "title": "Đề Thi Thử Toán - Chuyên Lê Thánh Tông Đà Nẵng",
     "desc": "Đề thi thử THPT, nguồn: Chuyên Lê Thánh Tông - Đà Nẵng."},
]

PROMPT = """You are an expert Math Teacher in Vietnam. Analyze this exam PDF and solve all questions.

Output ONLY a raw JSON object (no markdown, no code fences). Structure:
{
  "sections": [
    {
      "type": "mcq",
      "instruction": "Phan I: Trac nghiem",
      "questions": [
        {
          "id": "q1",
          "text": "question text, use \\\\( x^2 \\\\) for inline math",
          "options": ["A option", "B option", "C option", "D option"],
          "correctAnswer": 0,
          "explanation": "explanation text"
        }
      ]
    },
    {
      "type": "true_false",
      "instruction": "Phan II: Dung/Sai",
      "questions": [
        {
          "id": "tf1",
          "text": "context text",
          "items": [
            {"label": "a", "text": "statement a", "isTrue": true},
            {"label": "b", "text": "statement b", "isTrue": false},
            {"label": "c", "text": "statement c", "isTrue": true},
            {"label": "d", "text": "statement d", "isTrue": false}
          ]
        }
      ]
    },
    {
      "type": "short_answer",
      "instruction": "Phan III: Tra loi ngan",
      "questions": [
        {
          "id": "sa1",
          "text": "question text",
          "correctAnswer": "answer",
          "explanation": "explanation"
        }
      ]
    }
  ]
}

RULES:
- correctAnswer for mcq: index 0=A,1=B,2=C,3=D
- isTrue: boolean true/false
- short_answer correctAnswer: string
- For math: use \\\\( ... \\\\) for inline, \\\\[ ... \\\\] for display
- Do NOT use single backslash in strings (always double: \\\\frac, \\\\sqrt, etc.)
- Only include sections that exist in the exam
- Output ONLY the JSON object, nothing else
"""

MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]


def clean_json(raw: str) -> str:
    """Clean common JSON issues from Gemini output."""
    # Remove markdown fences
    raw = raw.strip()
    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:])
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    # Find the JSON object boundaries
    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        raw = raw[start:end]

    # Fix control characters (newlines inside strings)
    # Replace literal newlines inside JSON strings with \\n
    def fix_control_chars(s):
        result = []
        in_string = False
        i = 0
        while i < len(s):
            c = s[i]
            if c == '"' and (i == 0 or s[i-1] != '\\'):
                in_string = not in_string
                result.append(c)
            elif in_string and c == '\n':
                result.append('\\n')
            elif in_string and c == '\r':
                result.append('\\r')
            elif in_string and c == '\t':
                result.append('\\t')
            else:
                result.append(c)
            i += 1
        return ''.join(result)

    raw = fix_control_chars(raw)
    return raw


def solve_pdf(client, path):
    print(f"  Uploading {os.path.basename(path)}...")
    with open(path, "rb") as f:
        uploaded = client.files.upload(file=f, config=types.UploadFileConfig(
            display_name=os.path.basename(path), mime_type="application/pdf"))
    print(f"  Uploaded: {uploaded.name}")

    while uploaded.state.name == "PROCESSING":
        print("  Processing..."); time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name != "ACTIVE":
        raise ValueError(f"File failed: {uploaded.state}")

    response = None
    last_err = None
    for model in MODELS:
        for attempt in range(3):
            try:
                print(f"  Trying {model} (attempt {attempt+1})...")
                response = client.models.generate_content(
                    model=model,
                    contents=[types.Part.from_uri(
                        file_uri=uploaded.uri, mime_type=uploaded.mime_type), PROMPT],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                print(f"  Got response from {model}!")
                break
            except Exception as e:
                last_err = e
                s = str(e)
                if any(x in s for x in ["429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE"]):
                    wait = 60*(attempt+1)
                    print(f"  Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"  Error: {e}"); break
        if response: break

    if not response:
        raise ValueError(f"All models failed: {last_err}")

    raw = clean_json(response.text)

    # Save raw for debug
    debug_path = path.replace(".pdf", "_raw.json")
    with open(debug_path, "w", encoding="utf-8") as f:
        f.write(raw)

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        # Try a more aggressive fix
        print(f"  JSON parse error: {e}, trying aggressive fix...")
        # Remove any remaining invalid escapes
        raw2 = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', raw)
        try:
            return json.loads(raw2)
        except:
            raise ValueError(f"JSON parse failed even after fix: {e}")


def main():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("ERROR: GEMINI_API_KEY not set!"); return

    client = genai.Client(api_key=key)

    db = SessionLocal()
    teacher = db.query(User).filter(User.email == "darber3110@gmail.com").first()
    if not teacher:
        print("ERROR: Teacher not found!"); db.close(); return
    print(f"Teacher: {teacher.full_name} (id={teacher.id})")
    teacher_id = teacher.id
    db.close()

    results = []
    for i, exam in enumerate(EXAMS):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(EXAMS)}] {exam['title']}")
        print(f"{'='*60}")

        if not os.path.exists(exam["path"]):
            print(f"  FILE NOT FOUND: {exam['path']}")
            results.append({"title": exam["title"], "status": "FILE_NOT_FOUND"}); continue

        try:
            quiz_data = solve_pdf(client, exam["path"])
            total = sum(len(s.get("questions",[])) for s in quiz_data.get("sections",[]))
            print(f"  Parsed {total} questions across {len(quiz_data.get('sections',[]))} sections")

            db = SessionLocal()
            try:
                a = Assignment(
                    title=exam["title"], description=exam["desc"],
                    teacher_id=teacher_id, is_assigned_to_all=False,
                    max_score=10, quiz_data=quiz_data, assignment_type="quiz"
                )
                db.add(a); db.commit()
                print(f"  SUCCESS! Assignment ID={a.id}")
                results.append({"title": exam["title"], "status": "OK", "id": a.id, "q": total})
            except Exception as e:
                print(f"  DB Error: {e}"); db.rollback()
                results.append({"title": exam["title"], "status": f"DB_ERROR: {e}"})
            finally:
                db.close()

        except Exception as e:
            print(f"  Error: {e}")
            results.append({"title": exam["title"], "status": f"ERROR: {e}"})

        if i < len(EXAMS)-1:
            print("  [Cooldown 20s...]"); time.sleep(20)

    print(f"\n{'='*60}\nFINAL RESULTS:\n{'='*60}")
    for r in results:
        ok = "OK" if r["status"] == "OK" else "FAIL"
        info = f"ID={r.get('id','?')}, {r.get('q','?')} cau" if r["status"] == "OK" else r["status"]
        print(f"[{ok}] {r['title']}: {info}")

if __name__ == "__main__":
    main()
