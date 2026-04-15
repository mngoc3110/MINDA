"""
Batch solve and upload multiple exam PDFs to MINDA.
"""
import os
import json
import sys
import time
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types
from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

EXAMS = [
    {
        "path": "/Users/minhngoc/Downloads/Chuy\u00ean KHTN - H\u00e0 n\u1ed9i.pdf",
        "title": "Đề Thi Thử Toán - Chuyên KHTN Hà Nội",
        "description": "Đề thi thử THPT đã được AI MINDA giải chi tiết. Nguồn: Trường THPT Chuyên KHTN - Hà Nội."
    },
    {
        "path": "/Users/minhngoc/Downloads/li\u00ean tr\u01b0\u1eddng h\u1ea3i ph\u00f2ng.pdf",
        "title": "Đề Thi Thử Toán - Liên Trường Hải Phòng",
        "description": "Đề thi thử THPT đã được AI MINDA giải chi tiết. Nguồn: Liên trường - Hải Phòng."
    },
    {
        "path": "/Users/minhngoc/Downloads/Nguy\u1ec5n Khuy\u1ebfn - HCM.pdf",
        "title": "Đề Thi Thử Toán - Nguyễn Khuyến HCM",
        "description": "Đề thi thử THPT đã được AI MINDA giải chi tiết. Nguồn: Trường THPT Nguyễn Khuyến - TP.HCM."
    },
    {
        "path": "/Users/minhngoc/Downloads/Tri\u1ec7u S\u01a1n 3 - Thanh Ho\u00e0.pdf",
        "title": "Đề Thi Thử Toán - Triệu Sơn 3 Thanh Hoá",
        "description": "Đề thi thử THPT đã được AI MINDA giải chi tiết. Nguồn: Trường THPT Triệu Sơn 3 - Thanh Hoá."
    },
    {
        "path": "/Users/minhngoc/Downloads/chuy\u00ean l\u00ea th\u00e0nh t\u00f4ng - \u0111\u00e0 n\u1eb5ng.pdf",
        "title": "Đề Thi Thử Toán - Chuyên Lê Thánh Tông Đà Nẵng",
        "description": "Đề thi thử THPT đã được AI MINDA giải chi tiết. Nguồn: Trường THPT Chuyên Lê Thánh Tông - Đà Nẵng."
    },
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
           {
              "id": "q1",
              "text": "Full question text with math in LaTeX like $x^2 + 1$",
              "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
              "correctAnswer": 0,
              "explanation": "Giải thích chi tiết"
           }
        ]
     },
     {
        "type": "true_false",
        "instruction": "Phần II: Đúng/Sai",
        "questions": [
           {
              "id": "tf1",
              "text": "Context of the True/False question block",
              "items": [
                 {"label": "a", "text": "Mệnh đề a", "isTrue": true},
                 {"label": "b", "text": "Mệnh đề b", "isTrue": false},
                 {"label": "c", "text": "Mệnh đề c", "isTrue": true},
                 {"label": "d", "text": "Mệnh đề d", "isTrue": false}
              ]
           }
        ]
     },
     {
         "type": "short_answer",
         "instruction": "Phần III: Trả lời ngắn",
         "questions": [
            {
               "id": "sa1",
               "text": "Question text",
               "correctAnswer": "42",
               "explanation": "Giải thích chi tiết"
            }
         ]
     }
  ]
}
IMPORTANT:
- correctAnswer for MCQ is the INDEX (0=A, 1=B, 2=C, 3=D)
- For true_false, isTrue is a boolean
- For short_answer, correctAnswer is a string
- Use LaTeX notation for math: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$
- If exam only has one type, only include that section
- DO NOT output ANY markdown. Just the raw JSON object.
"""

MODELS = ["gemini-2.5-flash", "gemini-2.0-flash-lite", "gemini-2.0-flash"]


def solve_pdf(client, pdf_path: str) -> dict:
    print(f"  Uploading {os.path.basename(pdf_path)}...")
    with open(pdf_path, "rb") as f:
        uploaded = client.files.upload(
            file=f,
            config=types.UploadFileConfig(
                display_name=os.path.basename(pdf_path),
                mime_type="application/pdf"
            )
        )
    print(f"  Uploaded: {uploaded.name}, state={uploaded.state}")

    while uploaded.state.name == "PROCESSING":
        print("  Waiting for processing...")
        time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name != "ACTIVE":
        raise ValueError(f"File processing failed: {uploaded.state}")

    # Try models with retry
    response = None
    last_error = None
    for model_name in MODELS:
        for attempt in range(3):
            try:
                print(f"  Trying {model_name} (attempt {attempt+1})...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[
                        types.Part.from_uri(file_uri=uploaded.uri, mime_type=uploaded.mime_type),
                        PROMPT
                    ],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                print(f"  ✅ Got response from {model_name}!")
                break
            except Exception as e:
                last_error = e
                err_str = str(e)
                if "429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str or "UNAVAILABLE" in err_str:
                    wait = 45 * (attempt + 1)
                    print(f"  Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"  Non-retryable error: {e}")
                    break
        if response:
            break

    if not response:
        raise ValueError(f"All models failed. Last error: {last_error}")

    raw = response.text.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()

    return json.loads(raw)


def main():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("ERROR: GEMINI_API_KEY not found in .env")
        return

    client = genai.Client(api_key=key)

    db = SessionLocal()
    teacher = db.query(User).filter(User.email == "darber3110@gmail.com").first()
    if not teacher:
        print("ERROR: Teacher darber3110@gmail.com not found!")
        db.close()
        return
    print(f"Teacher: {teacher.full_name} (id={teacher.id})")
    db.close()

    results = []
    for i, exam in enumerate(EXAMS):
        print(f"\n{'='*60}")
        print(f"[{i+1}/{len(EXAMS)}] Processing: {exam['title']}")
        print(f"{'='*60}")

        if not os.path.exists(exam["path"]):
            print(f"  ❌ File not found: {exam['path']}")
            results.append({"title": exam["title"], "status": "FILE_NOT_FOUND"})
            continue

        try:
            quiz_data = solve_pdf(client, exam["path"])
            total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
            print(f"  Parsed {total} questions across {len(quiz_data.get('sections', []))} sections")

            # Save JSON
            json_path = f"/tmp/quiz_{i+1}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(quiz_data, f, ensure_ascii=False, indent=2)
            print(f"  Saved JSON to {json_path}")

            # Upload to DB
            db = SessionLocal()
            try:
                a = Assignment(
                    title=exam["title"],
                    description=exam["description"],
                    teacher_id=teacher.id,
                    is_assigned_to_all=False,
                    max_score=10,
                    quiz_data=quiz_data,
                    assignment_type="quiz"
                )
                db.add(a)
                db.commit()
                print(f"  ✅ Uploaded! Assignment ID={a.id}")
                results.append({"title": exam["title"], "status": "OK", "id": a.id, "questions": total})
            except Exception as db_err:
                print(f"  ❌ DB Error: {db_err}")
                db.rollback()
                results.append({"title": exam["title"], "status": f"DB_ERROR: {db_err}"})
            finally:
                db.close()

        except Exception as e:
            print(f"  ❌ Error: {e}")
            results.append({"title": exam["title"], "status": f"ERROR: {e}"})

        # Cooldown between exams
        if i < len(EXAMS) - 1:
            print(f"\n  [Cooldown 10s before next exam...]")
            time.sleep(10)

    print(f"\n{'='*60}")
    print("FINAL RESULTS:")
    print(f"{'='*60}")
    for r in results:
        status = "✅" if r["status"] == "OK" else "❌"
        print(f"{status} {r['title']}: {r['status']}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
