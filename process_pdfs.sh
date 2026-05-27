#!/bin/bash

# Thư mục chứa PDF
PDF_DIR="/Users/minhngoc/HCMUE/MINDA/tổng ôn"
# Thư mục output
OUTPUT_DIR="/Users/minhngoc/HCMUE/MINDA/tổng ôn/output"

# Lấy ngày giờ hiện tại để tạo thư mục logs
LOG_FILE="$PDF_DIR/process.log"

# Tạo thư mục output nếu chưa có
mkdir -p "$OUTPUT_DIR"

# Activate môi trường chứa MinerU
source /Users/minhngoc/HCMUE/MINDA/tools/pdf2latex/.venv/bin/activate

echo "Bắt đầu xử lý các file PDF bằng siêu trí tuệ VLM..." > "$LOG_FILE"
echo "Bắt đầu xử lý. Vui lòng đợi..."

# Lặp qua tất cả file pdf trong thư mục
for pdf_file in "$PDF_DIR"/*.pdf; do
    if [ -f "$pdf_file" ]; then
        filename=$(basename "$pdf_file")
        filename_noext="${filename%.*}"
        
        # MinerU VLM backend cho ra output trong thư mục con vlm/ thay vì auto/
        vlm_md_file="$OUTPUT_DIR/$filename_noext/vlm/$filename_noext.md"
        
        echo "----------------------------------------"
        echo ">>> Đang xử lý AI OCR: $filename"
        
        # Chạy MinerU VLM để nhận diện chính xác 100% Tiếng Việt có dấu
        mineru -p "$pdf_file" -o "$OUTPUT_DIR" --method auto --backend vlm-auto-engine >> "$LOG_FILE" 2>&1
        
        # Nếu ra file md thành công thì chuyển thành TeX (có documentclass)
        if [ -f "$vlm_md_file" ]; then
            echo ">>> Đang đóng gói Markdown sang LaTeX tiêu chuẩn (.tex)..."
            /Users/minhngoc/HCMUE/MINDA/tools/pdf2latex/.venv/bin/python /Users/minhngoc/HCMUE/MINDA/md_to_tex.py "$vlm_md_file" >> "$LOG_FILE" 2>&1
        fi
        
        echo ">>> Xong: $filename"
    fi
done

echo "----------------------------------------"
echo "Hoàn thành xử lý tất cả các file PDF! Kết quả lưu tại: $OUTPUT_DIR"
