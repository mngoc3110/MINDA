"""
Batch solve and upload multiple exam PDFs to MINDA (runs on VPS).
"""
import os, json, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types
from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

BASE = "/var/www/minda/student-center/backend/"

EXAMS = [
    {"path": BASE+"exam1.pdf", "title": "Đề Thi Thử Toán - Chuyên KHTN Hà Nội",
     "desc": "Đề thi thử THPT, nguồn: Chuyên KHTN - Hà Nội."},
    {"path": BASE+"exam2.pdf", "title": "Đề Thi Thử Toán - Liên Trường Hải Phòng",
     "desc": "Đề thi thử THPT, nguồn: Liên trường - Hải Phòng."},
    {"path": BASE+"exam3.pdf", "title": "Đề Thi Thử Toán - Nguyễn Khuyến HCM",
     "desc": "Đề thi thử THPT, nguồn: Trường Nguyễn Khuyến - TP.HCM."},
    {"path": BASE+"exam4.pdf", "title": "Đề Thi Thử Toán - Triệu Sơn 3 Thanh Hoá",
     "desc": "Đề thi thử THPT, nguồn: Triệu Sơn 3 - Thanh Hoá."},
    {"path": BASE+"exam5.pdf", "title": "Đề Thi Thử Toán - Chuyên Lê Thánh Tông Đà Nẵng",
     "desc": "Đề thi thử THPT, nguồn: Chuyên Lê Thánh Tông - Đà Nẵng."},
]

PROMPT = """
You are an expert Math Teacher in Vietnam. I am giving you an exam paper (PDF).
1. Parse the structure of the exam (Trắc nghiệm, Đúng/Sai, Trả lời ngắn).
2. SOLVE ALL THE QUESTIONS correctly. Show your work in explanations.
3. Output raw JSON ONLY with no markdown formatting. The format MUST BE:
{
  "sections": [
     {
        "type": "mcq",
        "instruction": "Phần I: Trắc nghiệm",
        "questions": [
           {"id": "q1", "text": "Full question text with math $x^2+1$", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "Detail"}
        ]
     },
     {
        "type": "true_false",
        "instruction": "Phần II: Đúng/Sai",
        "questions": [
           {"id": "tf1", "text": "Context", "items": [
              {"label": "a", "text": "Mệnh đề a", "isTrue": true},
              {"label": "b", "text": "Mệnh đề b", "isTrue": false},
              {"label": "c", "text": "Mệnh đề c", "isTrue": true},
              {"label": "d", "text": "Mệnh đề d", "isTrue": false}
           ]}
        ]
     },
     {
         "type": "short_answer",
         "instruction": "Phần III: Trả lời ngắn",
         "questions": [{"id": "sa1", "text": "Question", "correctAnswer": "42", "explanation": "Detail"}]
     }
  ]
}
IMPORTANT:
- correctAnswer for MCQ is the INDEX (0=A, 1=B, 2=C, 3=D)
- For true_false, isTrue is a boolean
- For short_answer, correctAnswer is a string
- Use LaTeX: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$
- Only include sections that exist in the exam
- DO NOT output ANY markdown. Just the raw JSON object.
"""

MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]


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
                    contents=[types.Part.from_uri(file_uri=uploaded.uri, mime_type=uploaded.mime_type), PROMPT],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                print(f"  ✅ Response from {model}!"); break
            except Exception as e:
                last_err = e
                s = str(e)
                if any(x in s for x in ["429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE"]):
                    wait = 50*(attempt+1); print(f"  Rate limited, waiting {wait}s..."); time.sleep(wait)
                else:
                    print(f"  Error: {e}"); break
        if response: break

    if not response:
        raise ValueError(f"All models failed: {last_err}")

    raw = response.text.strip()
    if raw.startswith("```"): raw = raw.split("\n",1)[1]
    if raw.endswith("```"): raw = raw.rsplit("```",1)[0]
    return json.loads(raw.strip())


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
            print(f"  ❌ File not found: {exam['path']}")
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
                print(f"  ✅ Uploaded! Assignment ID={a.id}")
                results.append({"title": exam["title"], "status": "OK", "id": a.id, "q": total})
            except Exception as e:
                print(f"  ❌ DB Error: {e}"); db.rollback()
                results.append({"title": exam["title"], "status": f"DB_ERROR: {e}"})
            finally:
                db.close()

        except Exception as e:
            print(f"  ❌ Error: {e}")
            results.append({"title": exam["title"], "status": f"ERROR: {e}"})

        if i < len(EXAMS)-1:
            print("  [Cooldown 15s...]"); time.sleep(15)

    print(f"\n{'='*60}\nFINAL RESULTS:\n{'='*60}")
    for r in results:
        ok = "✅" if r["status"] == "OK" else "❌"
        info = f"ID={r.get('id','?')}, {r.get('q','?')} câu" if r["status"] == "OK" else r["status"]
        print(f"{ok} {r['title']}: {info}")

if __name__ == "__main__":
    main()
