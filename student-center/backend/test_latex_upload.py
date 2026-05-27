import asyncio
import os
import sys
sys.path.append('.')

from app.services.gemini_parser import parse_latex_with_gemini

async def test_parse():
    latex_text = r"complex weird latex string"
    try:
        print("[Parse Upload] Thử fallback sang Gemini AI...")
        quiz_data = parse_latex_with_gemini(latex_text)
        print("Gemini result:", quiz_data)
    except Exception as gemini_err:
        print(f"[Parse Upload] Gemini cũng thất bại: {gemini_err}")

if __name__ == "__main__":
    asyncio.run(test_parse())
