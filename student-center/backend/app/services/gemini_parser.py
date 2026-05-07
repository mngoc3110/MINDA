"""
Gemini PDF Parser - Dung Gemini 2.5 Flash de giai de thi tu PDF/Image.
Thay the Tesseract OCR + TextToLatex pipeline.
"""
import os
import json
import time
import requests
import base64
from typing import List, Dict

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
- For data tables (frequency tables, statistics tables, measurement tables), convert them to LaTeX array format INSIDE the question text using display math. Format: $$\\begin{array}{|l|c|c|c|} \\hline \\text{Header1} & \\text{Header2} & \\text{Header3} \\\\ \\hline \\text{Data1} & 5 & 10 \\\\ \\hline \\end{array}$$ Use \\text{} for Vietnamese text cells. Use \\hline for horizontal rules. Use | in the column spec for vertical rules.
- For complex drawings, TikZ diagrams, coordinate graphs, or variation tables (bảng biến thiên), replace with "[Hình vẽ - Vui lòng xem ảnh đính kèm]".
- DO NOT output ANY markdown. Just the raw JSON object.
"""

def _clean_and_parse_json(raw_text: str) -> dict:
    """Helper to clean markdown fences and parse JSON."""
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:].strip()
    if raw_text.endswith("```"):
        raw_text = raw_text.rsplit("```", 1)[0]
    raw_text = raw_text.strip()
    return json.loads(raw_text)


def _call_openrouter(messages: List[Dict]) -> str:
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        raise ValueError("Khong tim thay OPENROUTER_API_KEY nao.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {openrouter_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "google/gemini-2.5-flash",
        "messages": messages,
        "temperature": 0.1
    }
    
    for attempt in range(2):
        try:
            print(f"[OpenRouter Parser] Sending request... (attempt {attempt+1})")
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            err_msg = str(e)
            if 'response' in locals() and hasattr(response, 'text'):
                err_msg += f" - {response.text}"
            print(f"[OpenRouter Parser] Error: {err_msg}")
            if attempt == 1:
                raise Exception(f"OpenRouter that bai: {err_msg}")
            time.sleep(2)
            
    raise Exception("Loi khong the ket noi OpenRouter")


def parse_exam_with_gemini(file_bytes: bytes, mime_type: str) -> dict:
    """
    Giai de thi tu file PDF/Image bang OpenRouter API.
    """
    messages = [
        {"role": "system", "content": "You are a helpful assistant that strictly follows instructions."}
    ]
    
    content_parts = [{"type": "text", "text": PROMPT}]
    
    is_pdf = "pdf" in mime_type.lower()
    
    if is_pdf:
        try:
            from pdf2image import convert_from_bytes
            import io
            print("[OpenRouter Parser] Converting PDF to images...")
            images = convert_from_bytes(file_bytes, dpi=200)
            for i, img in enumerate(images):
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG")
                img_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
                content_parts.append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"}
                })
        except Exception as e:
            raise Exception(f"Loi khi convert PDF sang Image: {e}")
    else:
        img_b64 = base64.b64encode(file_bytes).decode("utf-8")
        content_parts.append({
            "type": "image_url",
            "image_url": {"url": f"data:{mime_type};base64,{img_b64}"}
        })
        
    messages.append({
        "role": "user",
        "content": content_parts
    })

    result_text = _call_openrouter(messages)
    
    quiz_data = _clean_and_parse_json(result_text)
    total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
    print(f"[OpenRouter Parser] ✅ Parsed {total} questions from PDF/Image")
    return quiz_data


def parse_latex_with_gemini(latex_text: str) -> dict:
    """
    Giai de thi tu noi dung LaTeX (.tex) bang OpenRouter API.
    """
    latex_prompt = PROMPT + "\n\nExam Content (LaTeX Source Code):\n" + latex_text
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant that strictly follows instructions."},
        {"role": "user", "content": latex_prompt}
    ]
    
    result_text = _call_openrouter(messages)
    
    quiz_data = _clean_and_parse_json(result_text)
    total = sum(len(s.get("questions", [])) for s in quiz_data.get("sections", []))
    print(f"[OpenRouter Parser] ✅ Parsed {total} questions from LaTeX source")
    return quiz_data
