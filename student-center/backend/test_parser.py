import os
import sys
sys.path.append('.')
from app.services.gemini_parser import parse_latex_with_gemini

try:
    print(parse_latex_with_gemini("Solve for x: $x^2 + 1 = 0$"))
except Exception as e:
    print("FAILED:", e)
