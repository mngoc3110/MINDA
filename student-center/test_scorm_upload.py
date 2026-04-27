#!/usr/bin/env python3
"""
Test SCORM upload trên MINDA - Tạo khoá học, chapters, lessons, upload SCORM.
"""

import requests
import os

API_BASE = "https://minda.io.vn/api"
TOKEN = open("/Users/minhngoc/HCMUE/MINDA/student-center/.minda_token").read().strip()
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
SCORM_DIR = "/Users/minhngoc/HCMUE/MINDA/SVTT-MINH NGỌC - BỘ GIÁO ÁN BÀI DẠY/_SCORM_FIXED"

LESSONS = [
    {"bai": 5, "title": "Bài 5: Chèn đa phương tiện vào HTML"},
    {"bai": 6, "title": "Bài 6: Biểu mẫu HTML"},
    {"bai": 7, "title": "Bài 7: Bảng trong HTML"},
    {"bai": 8, "title": "Bài 8: Giới thiệu CSS"},
    {"bai": 9, "title": "Bài 9: Bộ chọn CSS và thuộc tính"},
    {"bai": 10, "title": "Bài 10: Bộ chọn lớp và định danh CSS"},
    {"bai": 11, "title": "Bài 11: Box Model & Flexbox"},
]

def main():
    print("=" * 60)
    print("🧪 Test SCORM Upload trên MINDA")
    print("=" * 60)
    
    # 1. Tạo khoá học
    print("\n📚 Tạo khoá học...")
    res = requests.post(f"{API_BASE}/courses/", json={
        "title": "Tin học 10 - Bài giảng tương tác SCORM",
        "description": "Khoá học Tin học 10 với bài giảng tương tác SCORM - SVTT Minh Ngọc",
    }, headers=HEADERS)
    
    if res.status_code != 200:
        print(f"  ❌ Lỗi tạo khoá học: {res.status_code} - {res.text}")
        return
    
    course = res.json()
    course_id = course["id"]
    print(f"  ✅ Khoá học ID: {course_id}")
    
    # 2. Tạo 1 chapter
    print("\n📖 Tạo chapter...")
    res = requests.post(f"{API_BASE}/courses/{course_id}/chapters", json={
        "title": "Chương 1: HTML & CSS cơ bản",
        "order_index": 0
    }, headers=HEADERS)
    
    if res.status_code != 200:
        print(f"  ❌ Lỗi tạo chapter: {res.status_code} - {res.text}")
        return
    
    chapter = res.json()
    chapter_id = chapter["id"]
    print(f"  ✅ Chapter ID: {chapter_id}")
    
    # 3. Upload SCORM và tạo lessons
    for i, lesson_info in enumerate(LESSONS):
        bai = lesson_info["bai"]
        title = lesson_info["title"]
        zip_path = os.path.join(SCORM_DIR, f"Bai_{bai}_SCORM.zip")
        
        if not os.path.exists(zip_path):
            print(f"\n  ❌ Bài {bai}: File ZIP không tồn tại!")
            continue
        
        print(f"\n{'─' * 50}")
        print(f"📄 {title}")
        
        # Upload SCORM
        print(f"  🔄 Uploading SCORM ({os.path.getsize(zip_path) / 1024 / 1024:.1f} MB)...")
        with open(zip_path, "rb") as f:
            upload_res = requests.post(
                f"{API_BASE}/files/upload_scorm",
                headers={"Authorization": f"Bearer {TOKEN}"},
                files={"file": (f"Bai_{bai}_SCORM.zip", f, "application/zip")},
                timeout=120
            )
        
        if upload_res.status_code != 200:
            print(f"  ❌ Upload lỗi: {upload_res.status_code} - {upload_res.text[:200]}")
            continue
        
        scorm_data = upload_res.json()
        scorm_url = scorm_data.get("file_url", "")
        # Sửa localhost → minda.io.vn
        scorm_url = scorm_url.replace("http://localhost:8000", "https://minda.io.vn")
        print(f"  ✅ SCORM URL: {scorm_url}")
        
        # Tạo lesson
        res = requests.post(f"{API_BASE}/courses/chapters/{chapter_id}/lessons", json={
            "title": title,
            "description": f"Bài giảng tương tác SCORM - {title}",
            "document_url": scorm_url,
            "order_index": i
        }, headers=HEADERS)
        
        if res.status_code == 200:
            lesson = res.json()
            print(f"  ✅ Lesson ID: {lesson['id']}")
        else:
            print(f"  ❌ Tạo lesson lỗi: {res.status_code} - {res.text[:200]}")
    
    print(f"\n{'=' * 60}")
    print(f"✅ HOÀN TẤT! Vào minda.io.vn/courses/{course_id} để kiểm tra")
    print(f"{'=' * 60}")

if __name__ == "__main__":
    main()
