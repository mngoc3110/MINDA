import os
import google.generativeai as genai
import sys
sys.path.append('.')
from app.services.gemini_key_manager import _KEYS

for key in _KEYS:
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content("hello")
        print(f"Key {key[-5:]}: SUCCESS")
    except Exception as e:
        print(f"Key {key[-5:]}: FAILED - {e}")
