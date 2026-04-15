import sys
try:
    import pypdf
    reader = pypdf.PdfReader("/Users/minhngoc/HCMUE/MINDA/ĐỀ TRẮC NGHIỆM ÔN TẬP HTML VÀ CSS - 100 CÂU.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("/Users/minhngoc/HCMUE/MINDA/questions_extracted.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Extracted using pypdf")
except ImportError:
    import os
    os.system("pip install pypdf")
    import pypdf
    reader = pypdf.PdfReader("/Users/minhngoc/HCMUE/MINDA/ĐỀ TRẮC NGHIỆM ÔN TẬP HTML VÀ CSS - 100 CÂU.pdf")
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    with open("/Users/minhngoc/HCMUE/MINDA/questions_extracted.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Installed pypdf and extracted")

