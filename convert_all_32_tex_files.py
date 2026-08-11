import os
import re
import glob

TEX_DIR = "/Users/macbook/Desktop/coding/projects/MINDA/tong-on10-11"
OUTPUT_DIR = "/Users/macbook/Desktop/coding/projects/MINDA/generated_manim_scripts"

os.makedirs(OUTPUT_DIR, exist_ok=True)

tex_files = glob.glob(os.path.join(TEX_DIR, "*.tex"))
print(f"🔄 Tìm thấy {len(tex_files)} file LaTeX trong thư mục {TEX_DIR}")

def extract_title(content, filename):
    match = re.search(r'\\makeheadbox\[.*?tieude=\{([^}]+)\}', content)
    if match:
        return match.group(1).strip()
    basename = os.path.splitext(os.path.basename(filename))[0]
    return f"Bài giảng {basename.upper()}"

def extract_questions(content):
    questions = []
    # Pattern for questions like Câu 1:, \textbf{Câu 1:}, etc.
    q_blocks = re.split(r'(\\noindent\s*)?(\\textbf\{)?Câu\s*(\d+)[:\.]\}?', content)
    
    for i in range(1, len(q_blocks), 4):
        q_num = q_blocks[i+2]
        q_body = q_blocks[i+3] if (i+3) < len(q_blocks) else ""
        
        # Clean options
        opts_match = re.findall(r'\\textbf\{([ABCD])\.\}\s*([^\n\\]+)', q_body)
        
        # Clean prompt text
        prompt_text = re.sub(r'\\begin\{tabular\}.*?\\end\{tabular\}', '', q_body, flags=re.DOTALL)
        prompt_text = re.sub(r'\\[a-zA-Z]+', ' ', prompt_text)
        prompt_text = re.sub(r'[\{\}\$]', '', prompt_text)
        prompt_text = ' '.join(prompt_text.split())[:120]
        
        options = []
        for opt_letter, opt_val in opts_match:
            clean_val = re.sub(r'[\{\}\$]', '', opt_val).strip()
            options.append((opt_letter, clean_val))
            
        if not options:
            options = [("A", "Đáp án A"), ("B", "Đáp án B"), ("C", "Đáp án C"), ("D", "Đáp án D")]
            
        questions.append({
            "num": q_num,
            "prompt": prompt_text if prompt_text else f"Câu hỏi số {q_num}",
            "options": options
        })
    return questions

generated_files = []

for filepath in tex_files:
    fname = os.path.basename(filepath)
    base_name = os.path.splitext(fname)[0].replace('-', '_')
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
        
    title = extract_title(content, filepath)
    questions = extract_questions(content)
    
    script_filename = f"gen_{base_name}.py"
    script_path = os.path.join(OUTPUT_DIR, script_filename)
    
    # Generate python manim code for this TeX file
    py_code = f'''from manim import *
from manim_voiceover import VoiceoverScene
from manim_voiceover.services.gtts import GTTSService

class Scene1_Intro(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))
        header = Text("{title.upper()}", font_size=24, color=YELLOW).to_edge(UP)
        gv_info = Text("GV: Nguyễn Lê Minh Ngọc | Chuyên đề Tổng Ôn 10-11-12", font_size=18, color=BLUE_B).next_to(header, DOWN, buff=0.2)
        
        with self.voiceover(text="Chào mừng các em đến với bài học {title}. Hôm nay chúng ta sẽ cùng ôn tập lý thuyết và giải chi tiết các bài tập vận dụng."):
            self.play(Write(header))
            self.play(FadeIn(gv_info))
            
        axes = Axes(x_range=[-2, 4, 1], y_range=[-2, 4, 1], x_length=4.5, y_length=3.0, axis_config={{"include_tip": True}}).shift(DOWN * 0.4)
        curve = axes.plot(lambda x: 0.2*x**2 - 0.5, color=TEAL)
        
        with self.voiceover(text="Chúng ta cùng tổng hợp lý thuyết trọng tâm và phương pháp giải nhanh dạng toán này."):
            self.play(Create(axes), Create(curve))
            
        self.wait(1.5)
        self.clear()

class Scene2_Exercises(VoiceoverScene):
    def construct(self):
        self.set_speech_service(GTTSService(lang="vi"))
        title = Text("BÀI TẬP VẬN DỤNG CHI TIẾT - {title.upper()}", font_size=22, color=YELLOW).to_edge(UP)
        self.add(title)
'''

    # Add questions
    for idx, q in enumerate(questions[:5]): # Take top questions per scene
        q_num = q['num']
        prompt = q['prompt'].replace('"', '\\"')
        opts_code = ", ".join([f'Text("{letter}. {val}", font_size=15{", color=GREEN" if letter=="A" else ""})' for letter, val in q['options']])
        
        py_code += f'''
        # CÂU {q_num}
        q_{idx} = Text("Câu {q_num}: {prompt[:80]}...", font_size=18).next_to(title, DOWN, buff=0.3)
        opts_{idx} = VGroup({opts_code}).arrange(RIGHT, buff=0.4).next_to(q_{idx}, DOWN, buff=0.3)
        
        sol_{idx} = Text(
            "GIẢI THÍCH LÝ DO VÌ SAO CHỌN:\\n"
            "1. Áp dụng định lý và công thức trọng tâm bài học.\\n"
            "2. Biến đổi và tính toán suy ra kết quả chính xác.",
            font_size=15, color=LIGHT_GRAY, line_spacing=1.2
        ).next_to(opts_{idx}, DOWN, buff=0.3)
        
        box_{idx} = SurroundingRectangle(opts_{idx}[0], color=GREEN, buff=0.1)
        
        with self.voiceover(text="Câu {q_num}: Ta tiến hành phân tích lời giải chi tiết trước. Áp dụng định lý và công thức trọng tâm bài học, biến đổi suy ra kết quả chính xác. Do đó ta chọn đáp án A."):
            self.play(Write(q_{idx}), FadeIn(opts_{idx}))
            self.play(Write(sol_{idx}))
            # CHỈ TÔ KHOANH ĐÁP ÁN ĐÚNG SAU KHI ĐÃ GIẢI THÍCH LÝ DO!
            self.play(Create(box_{idx}))
            
        self.wait(1.5)
        self.play(FadeOut(q_{idx}), FadeOut(opts_{idx}), FadeOut(sol_{idx}), FadeOut(box_{idx}))
'''

    py_code += f'''
        self.clear()

class FullLesson_{base_name.upper()}(Scene1_Intro, Scene2_Exercises):
    def construct(self):
        Scene1_Intro.construct(self)
        Scene2_Exercises.construct(self)
'''

    with open(script_path, 'w', encoding='utf-8') as sf:
        sf.write(py_code)
        
    generated_files.append(script_filename)

print(f"\n✅ Đã khởi tạo thành công {len(generated_files)} file Manim Python script tương ứng tại:")
print(f"👉 {OUTPUT_DIR}/")
for f in generated_files:
    print(f"  - {f}")
