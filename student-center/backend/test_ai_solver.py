import os
import sys
sys.path.append('.')
from app.api.endpoints.ai_solver import generate_ai_response

try:
    print(generate_ai_response("1 + 1 = ?", "You are a helpful assistant."))
except Exception as e:
    print("FAILED:", e)
