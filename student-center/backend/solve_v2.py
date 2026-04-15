"""
Solve PDF exam with Gemini 2.5 Flash (new google-genai SDK) and upload to DB.
"""
import os
import json
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from google import genai
from google.genai import types

from app.db.database import SessionLocal
from app.models.user import User
from app.models.assignment import Assignment

PDF_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "phan_boi_chau.pdf")

PROMPT = """
You are an expert Math Teacher in Vietnam. I am giving you an exam paper (PDF).
1. Parse the structure of the exam (Trắc nghiệm, Đúng/Sai, Trả lời ngắn).
2. SOLVE ALL THE QUESTIONS correctly. Show your work in explanations.
3. Output raw JSON ONLY with no markdown formatting. The format MUST BE:
{
  "sections": [
     {
        "type": "mcq",
        "instruction": "Phần I: Trắc nghiệm (12 câu)",
        "questions": [
           {
              "id": "q1",
              "text": "Full question text with math in LaTeX like $x^2 + 1$",
              "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
              "correctAnswer": 0,
              "explanation": "Giải thích chi tiết tại sao chọn đáp án này"
           }
        ]
     },
     {
        "type": "true_false",
        "instruction": "Phần II: Đúng/Sai (4 câu)",
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
         "instruction": "Phần III: Trả lời ngắn (6 câu)",
         "questions": [
            {
               "id": "sa1",
               "text": "Question text",
               "correctAnswer": "42",
               "explanation": "Giải thích chi tiết cách giải"
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
- DO NOT output ANY markdown. Just the raw JSON object.
"""

def main():
    print("=== Solve PDF with Gemini 2.5 Flash ===")

    # Init client
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    # Upload PDF
    print("Uploading PDF to Gemini...")
    with open(PDF_PATH, "rb") as f:
        uploaded = client.files.upload(file=f, config=types.UploadFileConfig(display_name="Phan Boi Chau Exam", mime_type="application/pdf"))
    print(f"Uploaded: {uploaded.name}, state={uploaded.state}")

    # Wait for file to be processed
    import time
    while uploaded.state.name == "PROCESSING":
        print("  Waiting for processing...")
        time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name != "ACTIVE":
        print(f"File processing failed: {uploaded.state}")
        return

    print("File ready! Sending to Gemini 2.5 Flash...")

    # Generate with retry across models
    import time as _time
    models_to_try = ["gemini-2.0-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"]
    response = None
    for model_name in models_to_try:
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
                err_str = str(e)
                if "429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str or "UNAVAILABLE" in err_str:
                    wait = 45 * (attempt + 1)
                    print(f"  Rate limited. Waiting {wait}s...")
                    _time.sleep(wait)
                else:
                    print(f"  Error: {e}")
                    break
        if response:
            break

    if not response:
        print("All models failed! Please try again later.")
        return

    raw_text = response.text.strip()

    # Clean markdown fences if present
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
    if raw_text.endswith("```"):
        raw_text = raw_text.rsplit("```", 1)[0]
    raw_text = raw_text.strip()

    # Save raw response for debug
    with open("quiz_solved.json", "w", encoding="utf-8") as f:
        f.write(raw_text)
    print("Saved raw response to quiz_solved.json")

    # Parse JSON
    try:
        quiz_data = json.loads(raw_text)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print("Raw text (first 500 chars):", raw_text[:500])
        return

    # Count questions
    total = 0
    for sec in quiz_data.get("sections", []):
        total += len(sec.get("questions", []))
    print(f"Parsed {total} questions across {len(quiz_data.get('sections', []))} sections")

    # Upload to database
    db = SessionLocal()
    try:
        teacher = db.query(User).filter(User.email == "darber3110@gmail.com").first()
        if not teacher:
            print("ERROR: Teacher darber3110@gmail.com not found!")
            return

        new_assignment = Assignment(
            title="Đề Thi Thử Toán - Chuyên Phan Bội Châu",
            description="Đề thi THPT đã được AI MINDA (Gemini 2.5 Flash) giải chi tiết và nhập liệu tự động. Bao gồm 3 phần: Trắc nghiệm, Đúng/Sai, Trả lời ngắn.",
            teacher_id=teacher.id,
            is_assigned_to_all=False,
            max_score=10,
            quiz_data=quiz_data,
            assignment_type="quiz",
            duration_minutes=90
        )
        db.add(new_assignment)
        db.commit()
        print(f"✅ SUCCESS! Uploaded as Assignment ID: {new_assignment.id}")
        print(f"   Title: {new_assignment.title}")
        print(f"   Teacher: {teacher.full_name} ({teacher.email})")
    except Exception as e:
        print(f"DB Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
