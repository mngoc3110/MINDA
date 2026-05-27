import requests
import json
import os
import sys

BASE_URL = "http://14.225.206.241:8000"
EMAIL = "darber3110@gmail.com"
PASSWORD = "Bin@31102004"
FOLDER_NAME = "Đề thi Tin học THPT - 2k8"
TARGET_DIR = "projects/MINDA/de_tin_hoc"

def login():
    url = f"{BASE_URL}/api/auth/login"
    data = {"username": EMAIL, "password": PASSWORD}
    print(f"🔑 Đang đăng nhập với {EMAIL}...")
    res = requests.post(url, data=data)
    if res.status_code == 200:
        print("✅ Đăng nhập thành công!")
        return res.json().get("access_token")
    else:
        print(f"❌ Đăng nhập thất bại: {res.text}")
        sys.exit(1)

def create_folder(token):
    url = f"{BASE_URL}/api/folders/"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"name": FOLDER_NAME, "is_assigned_to_all": True}
    print(f"📁 Đang tạo folder '{FOLDER_NAME}'...")
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        folder_id = res.json().get("id")
        print(f"✅ Đã tạo/Lấy folder ID: {folder_id}")
        return folder_id
    else:
        print(f"❌ Tạo folder thất bại: {res.text}")
        sys.exit(1)

def upload_file(token, filepath):
    url = f"{BASE_URL}/api/files/upload"
    headers = {"Authorization": f"Bearer {token}"}
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        files = {"file": (filename, f, "application/octet-stream")}
        print(f"⏳ Đang upload file lên Google Drive: {filename}...")
        res = requests.post(url, headers=headers, files=files)
        if res.status_code == 200:
            file_url = res.json().get("file_url")
            print(f"✅ Upload thành công: {file_url}")
            return file_url
        else:
            print(f"❌ Upload thất bại {filename}: {res.text}")
            return None

def create_assignment(token, folder_id, filename, file_url):
    url = f"{BASE_URL}/api/assignments"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "title": filename.replace(".docx", "").replace(".pdf", ""),
        "description": "Đề thi tự động tải lên từ CLI",
        "assignment_type": "file_upload",
        "attachment_url": file_url,
        "folder_id": folder_id,
        "exam_format": "2025" # Update exam format if needed
    }
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        print(f"✅ Đã tạo bài tập (Assignment): {filename}")
    else:
        print(f"❌ Tạo bài tập thất bại: {res.text}")

def main():
    if not os.path.exists(TARGET_DIR):
        print(f"❌ Không tìm thấy thư mục: {TARGET_DIR}")
        return
        
    token = login()
    folder_id = create_folder(token)
    
    files = [f for f in os.listdir(TARGET_DIR) if f.endswith(('.docx', '.pdf'))]
    if not files:
        print("📭 Không có đề thi nào để upload.")
        return
        
    for file in files:
        filepath = os.path.join(TARGET_DIR, file)
        file_url = upload_file(token, filepath)
        if file_url:
            create_assignment(token, folder_id, file, file_url)
            
    print("🚀 Hoàn tất quá trình upload!")

if __name__ == "__main__":
    main()
