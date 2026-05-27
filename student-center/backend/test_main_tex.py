import asyncio
import os
import sys
sys.path.append('.')

from app.services.latex_parser import parse_latex_directly

async def test_parse():
    with open('/Users/minhngoc/HCMUE/MINDA/main.tex', 'r') as f:
        latex_text = f.read()
    
    try:
        print("[Parse Upload] Parse trực tiếp file LaTeX (không dùng AI)...")
        quiz_data = parse_latex_directly(latex_text)
        print(f"[Parse Upload] ✅ Parse LaTeX trực tiếp thành công!")
        print("Total questions parsed:", sum(len(s.get("questions", [])) for s in quiz_data.get("sections", [])))
    except Exception as latex_err:
        print(f"[Parse Upload] Parse LaTeX trực tiếp thất bại: {latex_err}")

if __name__ == "__main__":
    asyncio.run(test_parse())
