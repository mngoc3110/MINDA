import os
import re
import glob

TEX_DIR = "/Users/macbook/Desktop/coding/projects/MINDA/tong-on10-11"
OUTPUT_DIR = "/Users/macbook/Desktop/coding/projects/MINDA"

tex_files = glob.glob(os.path.join(TEX_DIR, "*.tex"))

print(f"Found {len(tex_files)} TeX files in {TEX_DIR}:")
for f in tex_files:
    print(" -", os.path.basename(f))

def clean_latex(text):
    text = re.sub(r'\\textbf\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\textit\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\\textcolor\{[^}]+\}\{([^}]+)\}', r'\1', text)
    text = re.sub(r'\$([^$]+)\$', r'\1', text)
    text = re.sub(r'\\\[(.*?)\\]', r'\1', text)
    text = re.sub(r'\\[a-zA-Z]+', '', text)
    text = text.replace('{', '').replace('}', '').replace('\\', '')
    return text.strip()

print("Generator ready for batch processing.")
