import sys
from pypdf import PdfReader

reader = PdfReader("/Users/minhngoc/HCMUE/MINDA/bang diem.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

print("--- START OF PDF ---")
print(text)
print("--- END OF PDF ---")
