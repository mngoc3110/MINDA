import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env')
env_key = os.getenv('GEMINI_API_KEY')
print("Testing env key:", env_key[-5:] if env_key else "None")

genai.configure(api_key=env_key)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"FAILED: {e}")
