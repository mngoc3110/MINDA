import os
import sys
sys.path.append('.')
from google import genai
from google.genai import types
import base64
from app.services.gemini_key_manager import get_next_gemini_key

def generate_ai_response_new(prompt: str, system_instruction: str, image_b64: str = None, mime_type: str = "image/jpeg"):
    key = get_next_gemini_key()
    client = genai.Client(api_key=key)
    
    contents = []
    if image_b64:
        image_bytes = base64.b64decode(image_b64)
        contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
        
    contents.append(prompt)
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2
            )
        )
        return response.text
    except Exception as e:
        print(f"[Gemini Exception]: {e}")
        raise Exception(f"Gemini API Error: {e}")

try:
    print(generate_ai_response_new("1 + 1 = ?", "You are a helpful assistant."))
except Exception as e:
    print("FAILED:", e)
