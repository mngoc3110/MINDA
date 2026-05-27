import os
import google.generativeai as genai
import sys
sys.path.append('.')
from app.services.gemini_key_manager import _KEYS

genai.configure(api_key=_KEYS[0])
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
