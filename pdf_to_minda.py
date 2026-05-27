import os
import subprocess
from marker.convert import convert_single_pdf
from marker.models import load_all_models
from marker.output import save_output

# --- CẤU HÌNH ---
INPUT_DIR = "projects/MINDA/inputs"
OUTPUT_DIR = "projects/MINDA/content"
GIT_REPO_PATH = "projects/MINDA"

def process_pdfs():
    # 1. Load các model nhận diện AI (chỉ load 1 lần)
    print("🧠 Đang nạp các model nhận diện toán học (Marker)...")
    model_lst = load_all_models()

    if not os.path.exists(INPUT_DIR):
        os.makedirs(INPUT_DIR)
        print(f"👉 Hãy bỏ file PDF của bạn vào thư mục: {INPUT_DIR}")
        return

    files = [f for f in os.listdir(INPUT_DIR) if f.endswith(".pdf")]
    
    if not files:
        print("📭 Không tìm thấy file PDF nào trong folder inputs.")
        return

    for file in files:
        pdf_path = os.path.join(INPUT_DIR, file)
        subfolder_name = file.replace(".pdf", "")
        out_path = os.path.join(OUTPUT_DIR, subfolder_name)

        print(f"🚀 Đang xử lý: {file}...")
        
        # 2. Chuyển đổi PDF sang Markdown/LaTeX
        full_text, images, out_metadata = convert_single_pdf(pdf_path, model_lst)

        # 3. Lưu kết quả
        save_output(out_path, full_text, images, out_metadata)
        print(f"✅ Đã lưu LaTeX/Markdown vào: {out_path}")

    # 4. Tự động Git Push
    print("⬆️ Đang chuẩn bị Push lên GitHub...")
    try:
        subprocess.run(["git", "-C", GIT_REPO_PATH, "add", "."], check=True)
        subprocess.run(["git", "-C", GIT_REPO_PATH, "commit", "-m", "Auto-update: New PDF content added"], check=True)
        subprocess.run(["git", "-C", GIT_REPO_PATH, "push"], check=True)
        print("🎉 Đã Push thành công lên Web!")
    except Exception as e:
        print(f"⚠️ Lỗi Git (Có thể do chưa setup repo hoặc không có thay đổi): {e}")

if __name__ == "__main__":
    process_pdfs()
