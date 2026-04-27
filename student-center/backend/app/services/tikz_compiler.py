import os
import uuid
import subprocess
import shutil

STATIC_TIKZ_DIR = "/var/www/minda/student-center/backend/static/tikz"

def compile_tikz_to_svg(tikz_content: str) -> str:
    """
    Biên dịch đoạn mã TikZ thành ảnh SVG, lưu vào thư mục static và trả về đường dẫn URL.
    Nếu thất bại, trả về None.
    """
    try:
        os.makedirs(STATIC_TIKZ_DIR, exist_ok=True)
        
        unique_id = str(uuid.uuid4())
        workspace = f"/tmp/tikz_{unique_id}"
        os.makedirs(workspace, exist_ok=True)
        
        tex_file = os.path.join(workspace, "graph.tex")
        pdf_file = os.path.join(workspace, "graph.pdf")
        svg_file = os.path.join(workspace, "graph.svg")
        
        # Bọc mã TikZ bằng document standalone
        tex_content = r"""\documentclass[tikz,border=2mm]{standalone}
\usepackage[utf8]{inputenc}
\usepackage[vietnamese]{babel}
\usepackage{amsmath, amssymb, amsfonts}
\begin{document}
""" + tikz_content + r"""
\end{document}
"""
        
        with open(tex_file, "w", encoding="utf-8") as f:
            f.write(tex_content)
            
        # Compile to PDF
        result = subprocess.run(
            ["pdflatex", "-interaction=nonstopmode", "graph.tex"],
            cwd=workspace,
            capture_output=True,
            text=True
        )
        
        if not os.path.exists(pdf_file) or result.returncode != 0:
            print(f"[TikZ Compiler] Lỗi biên dịch pdflatex:\n{result.stdout}\n{result.stderr}")
            return None
            
        # Convert PDF to SVG
        result_svg = subprocess.run(
            ["pdftocairo", "-svg", "graph.pdf", "graph.svg"],
            cwd=workspace,
            capture_output=True,
            text=True
        )
        
        if not os.path.exists(svg_file) or result_svg.returncode != 0:
            print(f"[TikZ Compiler] Lỗi chuyển đổi pdftocairo:\n{result_svg.stderr}")
            return None
            
        # Di chuyển SVG vào static folder
        final_svg_path = os.path.join(STATIC_TIKZ_DIR, f"{unique_id}.svg")
        shutil.move(svg_file, final_svg_path)
        
        # Cleanup
        shutil.rmtree(workspace, ignore_errors=True)
        
        # URL trả về cho Frontend
        return f"/static/tikz/{unique_id}.svg"
        
    except Exception as e:
        print(f"[TikZ Compiler] Ngoại lệ xảy ra: {e}")
        return None
