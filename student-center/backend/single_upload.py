"""
Single exam upload - compact prompt to avoid JSON truncation.
Usage: python single_upload.py <exam_path> <title> <desc>
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

# Config - chỉnh ở đây
EXAM_PATH = sys.argv[1] if len(sys.argv) > 1 else "/var/www/minda/student-center/backend/exam4.pdf"
TITLE     = sys.argv[2] if len(sys.argv) > 2 else "Đề Thi Thử Toán - Triệu Sơn 3 Thanh Hoá"
DESC      = sys.argv[3] if len(sys.argv) > 3 else "Đề thi thử THPT, nguồn: Triệu Sơn 3 - Thanh Hoá."
TEACHER   = "darber3110@gmail.com"

PROMPT = """Analyze this Vietnamese math exam PDF. Extract and solve ALL questions.

Return ONLY a JSON object. No markdown. No explanation outside JSON.

Format:
{"sections":[{"type":"mcq","instruction":"Phan I","questions":[{"id":"q1","text":"...","options":["A...","B...","C...","D..."],"correctAnswer":0,"explanation":"..."}]},{"type":"true_false","instruction":"Phan II","questions":[{"id":"tf1","text":"...","items":[{"label":"a","text":"...","isTrue":true},{"label":"b","text":"...","isTrue":false},{"label":"c","text":"...","isTrue":true},{"label":"d","text":"...","isTrue":false}]}]},{"type":"short_answer","instruction":"Phan III","questions":[{"id":"sa1","text":"...","correctAnswer":"...","explanation":"..."}]}]}

Rules:
- Escape backslashes in LaTeX: use \\\\frac not \\frac
- correctAnswer for mcq: 0=A,1=B,2=C,3=D
- isTrue: boolean
- Only include types present in exam
- Return valid JSON only
"""

MODELS = ["gemini-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite"]


def clean_json(raw):
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
    if raw.endswith("```"):
        raw = raw.rsplit("```", 1)[0]
    raw = raw.strip()
    # Extract JSON object
    s = raw.find("{"); e = raw.rfind("}") + 1
    if s != -1 and e > s:
        raw = raw[s:e]
    # Fix control chars in strings
    result = []; in_string = False; i = 0
    while i < len(raw):
        c = raw[i]
        if c == '"' and (i == 0 or raw[i-1] != '\\'):
            in_string = not in_string
        if in_string and c in '\n\r\t' and raw[i-1] != '\\':
            result.append({'\\n': '\\n', '\\r': '\\r', '\t': '\\t', '\n': '\\n', '\r': '\\r'}[c])
        else:
            result.append(c)
        i += 1
    raw = ''.join(result)
    # Fix single backslashes before letters (invalid JSON escape)
    raw = re.sub(r'\\(?!["\\/bfnrtu0-9])', r'\\\\', raw)
    return raw


def main():
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        print("ERROR: GEMINI_API_KEY not set!"); return

    client = genai.Client(api_key=key)

    db = SessionLocal()
    teacher = db.query(User).filter(User.email == TEACHER).first()
    if not teacher:
        print(f"Teacher {TEACHER} not found!"); db.close(); return
    teacher_id = teacher.id
    print(f"Teacher: {teacher.full_name} (id={teacher_id})")
    db.close()

    print(f"\nProcessing: {TITLE}")
    print(f"File: {EXAM_PATH}")

    if not os.path.exists(EXAM_PATH):
        print("FILE NOT FOUND!"); return

    # Upload PDF
    print("Uploading to Gemini...")
    with open(EXAM_PATH, "rb") as f:
        uploaded = client.files.upload(file=f, config=types.UploadFileConfig(
            display_name=os.path.basename(EXAM_PATH), mime_type="application/pdf"))
    print(f"Uploaded: {uploaded.name}")

    while uploaded.state.name == "PROCESSING":
        print("Processing..."); time.sleep(3)
        uploaded = client.files.get(name=uploaded.name)

    if uploaded.state.name != "ACTIVE":
        print(f"File failed: {uploaded.state}"); return

    # Solve with retry
    response = None
    for model in MODELS:
        for attempt in range(4):
            try:
                print(f"Trying {model} (attempt {attempt+1})...")
                response = client.models.generate_content(
                    model=model,
                    contents=[types.Part.from_uri(
                        file_uri=uploaded.uri, mime_type=uploaded.mime_type), PROMPT],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                print(f"Got response from {model}!")
                break
            except Exception as e:
                s = str(e)
                if any(x in s for x in ["429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE"]):
                    wait = 60*(attempt+1)
                    print(f"Rate limited, waiting {wait}s...")
                    time.sleep(wait)
                else:
                    print(f"Error: {e}"); break
        if response: break

    if not response:
        print("All models failed!"); return

    # Save raw
    raw = clean_json(response.text)
    debug = EXAM_PATH.replace(".pdf", "_debug.json")
    with open(debug, "w", encoding="utf-8") as f:
        f.write(raw)
    print(f"Saved raw to {debug}")

    try:
        quiz_data = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print("First 200 chars of raw:", raw[:200])
        return

    total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
    print(f"Parsed {total} questions across {len(quiz_data.get('sections', []))} sections")

    db = SessionLocal()
    try:
        a = Assignment(
            title=TITLE, description=DESC,
            teacher_id=teacher_id, is_assigned_to_all=False,
            max_score=10, quiz_data=quiz_data, assignment_type="quiz"
        )
        db.add(a); db.commit()
        print(f"\nSUCCESS! Assignment ID={a.id}, {total} questions")
    except Exception as e:
        print(f"DB Error: {e}"); db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
