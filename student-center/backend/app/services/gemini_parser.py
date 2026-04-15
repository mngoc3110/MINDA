"""
Gemini PDF Parser - Dung Gemini 2.5 Flash de giai de thi tu PDF/Image.
Thay the Tesseract OCR + TextToLatex pipeline.
"""
import os
import json
import time
import tempfile

from google import genai
from google.genai import types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

PROMPT = """
You are an expert Math Teacher in Vietnam. I am giving you an exam paper.
1. Parse the structure of the exam (Trắc nghiệm, Đúng/Sai, Trả lời ngắn).
2. Extract the content of questions and options exactly. DO NOT solve them or provide explanations.
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
              "explanation": ""
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
               "correctAnswer": "",
               "explanation": ""
            }
         ]
     }
  ]
}
- Set "correctAnswer" to 0 for MCQ (default index).
- Set "isTrue" to false for all True/False items.
- Set "correctAnswer" to "" for short answer.
- Set "explanation" to "" for all questions.
- Use LaTeX notation for math: $x^2$, $\\frac{a}{b}$, $\\sqrt{x}$
- DO NOT output ANY markdown. Just the raw JSON object.
"""

MODELS_TO_TRY = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


def _clean_and_parse_json(raw_text: str) -> dict:
    """Helper to clean markdown fences and parse JSON."""
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
    if raw_text.endswith("```"):
        raw_text = raw_text.rsplit("```", 1)[0]
    raw_text = raw_text.strip()
    return json.loads(raw_text)


def parse_exam_with_gemini(file_bytes: bytes, mime_type: str) -> dict:
    """
    Giai de thi tu file PDF/Image bang Gemini API.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY chua duoc cau hinh trong .env")

    client = genai.Client(api_key=GEMINI_API_KEY)

    # Save to temp file for upload
    suffix = ".pdf" if "pdf" in mime_type else ".png"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as f:
            uploaded = client.files.upload(
                file=f,
                config=types.UploadFileConfig(
                    display_name="exam_upload",
                    mime_type=mime_type
                )
            )
        print(f"[Gemini Parser] Uploaded: {uploaded.name}, state={uploaded.state}")

        # Wait for processing
        while uploaded.state.name == "PROCESSING":
            time.sleep(3)
            uploaded = client.files.get(name=uploaded.name)

        if uploaded.state.name != "ACTIVE":
            raise ValueError(f"File processing failed: {uploaded.state}")

        response = None
        last_error = None

        for model_name in MODELS_TO_TRY:
            for attempt in range(2):
                try:
                    print(f"[Gemini Parser] Trying {model_name} (attempt {attempt+1})...")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_uri(file_uri=uploaded.uri, mime_type=uploaded.mime_type),
                            PROMPT
                        ],
                        config=types.GenerateContentConfig(temperature=0.1)
                    )
                    break
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    if "429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        time.sleep(30 * (attempt + 1))
                    else:
                        break
            if response:
                break

        if not response:
            raise ValueError(f"Tat ca model Gemini deu that bai. Loi cuoi: {last_error}")

        quiz_data = _clean_and_parse_json(response.text)
        total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
        print(f"[Gemini Parser] ✅ Parsed {total} questions from PDF/Image")
        return quiz_data

    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass


def parse_latex_with_gemini(latex_text: str) -> dict:
    """
    Giai de thi tu noi dung LaTeX (.tex) bang Gemini API.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY chua duoc cau hinh trong .env")

    client = genai.Client(api_key=GEMINI_API_KEY)
    
    # Prompt tuy chinh cho LaTeX text
    latex_prompt = PROMPT + "\n\nExam Content (LaTeX Source Code):\n" + latex_text

    response = None
    last_error = None

    for model_name in MODELS_TO_TRY:
        for attempt in range(2):
            try:
                print(f"[Gemini Parser] (LaTeX) Trying {model_name}...")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[latex_prompt],
                    config=types.GenerateContentConfig(temperature=0.1)
                )
                break
            except Exception as e:
                last_error = e
                if "429" in str(e) or "503" in str(e):
                    time.sleep(10 * (attempt + 1))
                else:
                    break
        if response:
            break

    if not response:
        raise ValueError(f"Gemini LaTeX parse that bai: {last_error}")

    quiz_data = _clean_and_parse_json(response.text)
    total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
    print(f"[Gemini Parser] ✅ Parsed {total} questions from LaTeX source")
    return quiz_data
