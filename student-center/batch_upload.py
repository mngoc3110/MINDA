#!/usr/bin/env python3
"""
MINDA - Batch Upload Đề Khởi Động
Tự động upload 19 đề (từ Đề 2 → Đề 20) vào folder "Đề nhẹ nhàng" trên MINDA.

Cách dùng:
  1. Mở minda.io.vn, F12 > Console > gõ: localStorage.getItem("minda_token")
  2. Copy token
  3. Chạy: python3 batch_upload.py
"""

import os
import sys
import json
import time
import requests

API = "https://minda.io.vn"
BASE_DIR = "/Users/minhngoc/HCMUE/MINDA/3. 20 ĐỀ KHỞI ĐỘNG - KHÓA LUYỆN ĐỀ THPTQG 2026_"

def get_token():
    """Get token from env, file, or user input."""
    token = os.environ.get("MINDA_TOKEN")
    if token:
        return token
    token_file = os.path.join(os.path.dirname(__file__), ".minda_token")
    if os.path.exists(token_file):
        with open(token_file) as f:
            token = f.read().strip()
            if token:
                return token
    print("\n🔑 Cần token xác thực.")
    print("   Mở minda.io.vn → F12 → Console → gõ: localStorage.getItem('minda_token')")
    token = input("   Paste token vào đây: ").strip().strip('"').strip("'")
    if token:
        with open(token_file, "w") as f:
            f.write(token)
        print(f"   ✅ Đã lưu token vào {token_file}")
    return token

def get_folder_id(token, folder_name="Đề nhẹ nhàng"):
    """Tìm folder_id theo tên."""
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{API}/api/folders/", headers=headers)
    if res.status_code != 200:
        print(f"❌ Lỗi lấy folders: {res.status_code} {res.text}")
        return None
    folders = res.json()
    for f in folders:
        if f["name"] == folder_name:
            return f["id"]
    # Tạo folder mới nếu chưa có
    print(f"📁 Chưa có folder '{folder_name}', đang tạo...")
    res = requests.post(f"{API}/api/folders/", headers={**headers, "Content-Type": "application/json"},
                        json={"name": folder_name})
    if res.status_code == 200:
        return res.json()["id"]
    print(f"❌ Không tạo được folder: {res.text}")
    return None

def upload_pdf(token, pdf_path, max_retries=2):
    """Upload PDF qua parse-upload API, trả về quiz_data."""
    headers = {"Authorization": f"Bearer {token}"}
    for attempt in range(max_retries + 1):
        try:
            with open(pdf_path, "rb") as f:
                files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
                res = requests.post(f"{API}/api/assignments/parse-upload", headers=headers, files=files, timeout=300)
            if res.status_code != 200:
                print(f"  ❌ Parse failed: {res.status_code} {res.text[:200]}")
                return None
            return res.json()
        except requests.exceptions.ReadTimeout:
            if attempt < max_retries:
                print(f"  ⏰ Timeout (lần {attempt+1}), thử lại sau 5 giây...")
                time.sleep(5)
            else:
                print(f"  ❌ Timeout sau {max_retries+1} lần thử!")
                return None
        except Exception as e:
            print(f"  ❌ Lỗi: {e}")
            return None

def create_assignment(token, title, quiz_data, folder_id, max_score=10):
    """Tạo assignment trên MINDA."""
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "title": title,
        "description": f"Đề thi thử THPT-TN 2026 - {title}",
        "assignment_type": "quiz",
        "quiz_data": quiz_data,
        "folder_id": folder_id,
        "max_score": max_score,
        "exam_format": "practice",
        "is_assigned_to_all": True,
    }
    res = requests.post(f"{API}/api/assignments", headers=headers, json=payload, timeout=30)
    if res.status_code != 200:
        print(f"  ❌ Create failed: {res.status_code} {res.text[:200]}")
        return None
    return res.json()

def main():
    print("=" * 60)
    print("🚀 MINDA - Batch Upload Đề Khởi Động THPTQG 2026")
    print("=" * 60)
    
    token = get_token()
    if not token:
        print("❌ Không có token, thoát.")
        sys.exit(1)
    print(f"🔑 Token: ...{token[-20:]}")
    
    folder_id = get_folder_id(token)
    if not folder_id:
        print("❌ Không tìm/tạo được folder, thoát.")
        sys.exit(1)
    print(f"📁 Folder ID: {folder_id}")
    
    # Upload từ Đề 2 → 20
    start = int(input("\n📝 Bắt đầu từ đề số (mặc định 2): ").strip() or "2")
    end = int(input("📝 Kết thúc ở đề số (mặc định 20): ").strip() or "20")
    
    success = 0
    fail = 0
    
    for i in range(start, end + 1):
        folder_name = f"{i}_ ĐỀ KHỞI ĐỘNG SỐ {i} - 2026"
        folder_path = os.path.join(BASE_DIR, folder_name)
        
        if not os.path.isdir(folder_path):
            print(f"\n⚠️  Đề {i}: Thư mục không tồn tại ({folder_name})")
            fail += 1
            continue
        
        # Tìm file PDF
        pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith(".pdf")]
        if not pdf_files:
            print(f"\n⚠️  Đề {i}: Không tìm thấy file PDF trong {folder_name}")
            fail += 1
            continue
        
        pdf_path = os.path.join(folder_path, pdf_files[0])
        title = f"Đề nhẹ nhàng số {i}"
        
        print(f"\n{'─' * 50}")
        print(f"📄 Đề {i}: {pdf_files[0]}")
        print(f"   → Tiêu đề: {title}")
        
        # Step 1: Parse PDF
        print(f"   🔄 Đang phân tích PDF bằng AI...")
        quiz_data = upload_pdf(token, pdf_path)
        if not quiz_data:
            fail += 1
            continue
        
        # Count questions
        total_q = 0
        if "sections" in quiz_data:
            for s in quiz_data["sections"]:
                total_q += len(s.get("questions", []))
        elif "questions" in quiz_data:
            total_q = len(quiz_data["questions"])
        print(f"   ✅ Parse thành công: {total_q} câu hỏi")
        
        # Step 2: Create assignment
        print(f"   🔄 Đang tạo bài tập trên MINDA...")
        result = create_assignment(token, title, quiz_data, folder_id, max_score=10)
        if result:
            print(f"   ✅ Tạo thành công! ID: {result.get('id')}")
            success += 1
        else:
            fail += 1
        
        # Rate limiting - chờ 2 giây giữa mỗi đề
        if i < end:
            print(f"   ⏳ Chờ 3 giây (tránh rate limit)...")
            time.sleep(3)
    
    print(f"\n{'=' * 60}")
    print(f"📊 KẾT QUẢ: {success} thành công / {fail} thất bại / {end - start + 1} tổng")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
