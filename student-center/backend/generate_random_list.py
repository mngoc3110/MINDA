import re
import random

# Read the raw text from parse_pdf.py output or parse it again
from pypdf import PdfReader

reader = PdfReader("../bang diem.pdf")
text = ""
for page in reader.pages:
    text += page.extract_text() + "\n"

# We split the text by "LỚP: " to identify classes
classes_data = text.split("LỚP: ")

result_str = ""
for class_block in classes_data[1:]:
    class_name = class_block.split(" - Môn:", 1)[0].strip()
    result_str += f"### 📘 Lớp: {class_name}\n"
    
    # Extract the block after "ĐGGK\n" up to "Thành phố Hồ Chí Minh"
    start_str = "ĐGGK\n"
    end_str = "Thành phố Hồ Chí Minh"
    
    start_idx = class_block.find(start_str)
    end_idx = class_block.find(end_str)
    
    if start_idx == -1 or end_idx == -1:
        continue
        
    student_section = class_block[start_idx + len(start_str):end_idx].strip()
    lines = student_section.split("\n")
    
    students = []
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        # look for an integer (STT)
        if line.isdigit():
            stt = int(line)
            # Next line is usually Ho
            last_middle = lines[i+1].strip()
            # Next line is Ten
            first_name = lines[i+2].strip()
            # Sometime if the first name or last name is missing/wrapped differently it might break, 
            # but looking at the PDF output, it's strictly STT -> Ho -> Ten -> then 4 floats or something.
            # Skip the floats until we hit the next integer.
            # Actually, just parse [lastName] and [firstName] right after the digit.
            full_name = f"{last_middle} {first_name}"
            students.append((stt, full_name))
            
            # Jump over the scores. The next STT is stt + 1
            i += 3
            while i < len(lines) and not lines[i].strip().isdigit():
                i += 1
        else:
            i += 1

    for stt, name in students:
        score = random.choice([9.0, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.0])
        result_str += f"{stt}. **{name}** - {score} điểm\n"
    
    result_str += "\n"

print(result_str)
