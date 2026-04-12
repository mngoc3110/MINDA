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
- If the exam only has MCQ (no True/False or Short Answer), just output 1 section with type "mcq"
- DO NOT output ANY markdown. Just the raw JSON object.
"""

MODELS_TO_TRY = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
]


def parse_exam_with_gemini(file_bytes: bytes, mime_type: str) -> dict:
    """
    Giai de thi bang Gemini API.
    
    Args:
        file_bytes: Noi dung file (PDF hoac Image)
        mime_type: MIME type (application/pdf, image/png, ...)
    
    Returns:
        dict: Quiz JSON data voi dap an da giai
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY chua duoc cau hinh trong .env")

    client = genai.Client(api_key=GEMINI_API_KEY)

    # Upload file to Gemini
    print("[Gemini Parser] Uploading file...")
    
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
            print("[Gemini Parser] Waiting for file processing...")
            time.sleep(3)
            uploaded = client.files.get(name=uploaded.name)

        if uploaded.state.name != "ACTIVE":
            raise ValueError(f"File processing failed: {uploaded.state}")

        # Try multiple models with retry
        response = None
        last_error = None

        for model_name in MODELS_TO_TRY:
            for attempt in range(2):
                try:
                    print(f"[Gemini Parser] Trying {model_name} (attempt {attempt+1})...")
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[
                            types.Part.from_uri(
                                file_uri=uploaded.uri,
                                mime_type=uploaded.mime_type
                            ),
                            PROMPT
                        ],
                        config=types.GenerateContentConfig(temperature=0.1)
                    )
                    print(f"[Gemini Parser] ✅ Got response from {model_name}!")
                    break
                except Exception as e:
                    last_error = e
                    err_str = str(e)
                    if "429" in err_str or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                        wait = 30 * (attempt + 1)
                        print(f"[Gemini Parser] Rate limited, waiting {wait}s...")
                        time.sleep(wait)
                    else:
                        print(f"[Gemini Parser] Error with {model_name}: {e}")
                        break
            if response:
                break

        if not response:
            raise ValueError(f"Tat ca model Gemini deu that bai. Loi cuoi: {last_error}")

        # Parse response
        raw_text = response.text.strip()

        # Clean markdown fences
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
        if raw_text.endswith("```"):
            raw_text = raw_text.rsplit("```", 1)[0]
        raw_text = raw_text.strip()

        quiz_data = json.loads(raw_text)

        total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
        print(f"[Gemini Parser] ✅ Parsed {total} questions across {len(quiz_data.get('sections', []))} sections")

        return quiz_data

    finally:
        # Cleanup temp file
        try:
            os.unlink(tmp_path)
        except:
            pass
