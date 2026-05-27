import requests
import json
import os
import sys

BASE_URL = "http://14.225.206.241:8000"
EMAIL = "darber3110@gmail.com"
PASSWORD = "Bin@31102004"
FOLDER_NAME = "đề 9+"
FILEPATH = "/Users/macbook/Desktop/coding/projects/MINDA/main.tex"
TITLE = "Đề 9+ số 5"

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

def get_or_create_folder(token):
    url = f"{BASE_URL}/api/folders/"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Try creating it
    payload = {"name": FOLDER_NAME, "is_assigned_to_all": True}
    print(f"📁 Đang tạo/lấy folder '{FOLDER_NAME}'...")
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        folder_id = res.json().get("id")
        print(f"✅ Đã tạo mới folder ID: {folder_id}")
        return folder_id
    elif res.status_code == 400 and "already exists" in res.text.lower():
        # Folder might already exist, let's list them
        pass
        
    res_get = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    if res_get.status_code == 200:
        for f in res_get.json():
            if f["name"].lower() == FOLDER_NAME.lower():
                folder_id = f["id"]
                print(f"✅ Đã tìm thấy folder ID: {folder_id}")
                return folder_id
    
    print(f"❌ Không thể tạo hoặc tìm thấy folder: {res.text if res.status_code != 200 else res_get.text}")
    sys.exit(1)

def upload_file_to_drive(token, filepath):
    url = f"{BASE_URL}/api/files/upload"
    headers = {"Authorization": f"Bearer {token}"}
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        files = {"file": (filename, f, "application/octet-stream")}
        print(f"⏳ Đang upload file lên Drive: {filename}...")
        res = requests.post(url, headers=headers, files=files)
        if res.status_code == 200:
            file_url = res.json().get("file_url")
            print(f"✅ Upload Drive thành công: {file_url}")
            return file_url
        else:
            print(f"❌ Upload Drive thất bại: {res.text}")
            return None

def parse_latex(token, filepath):
    url = f"{BASE_URL}/api/assignments/parse-upload"
    headers = {"Authorization": f"Bearer {token}"}
    filename = os.path.basename(filepath)
    with open(filepath, 'rb') as f:
        files = {"file": (filename, f, "text/x-tex")}
        print(f"⏳ Đang bóc tách file LaTeX (parse-upload)...")
        res = requests.post(url, headers=headers, files=files)
        if res.status_code == 200:
            print(f"✅ Bóc tách LaTeX thành công!")
            return res.json()
        else:
            print(f"❌ Bóc tách LaTeX thất bại: {res.text}")
            return None

def create_assignment(token, folder_id, file_url, quiz_data):
    url = f"{BASE_URL}/api/assignments"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "title": TITLE,
        "description": "Đề thi tự động tải lên từ CLI",
        "assignment_type": "quiz",
        "attachment_url": file_url,
        "quiz_data": quiz_data,
        "folder_id": folder_id,
        "exam_format": "standard",
        "max_score": 10,
        "is_assigned_to_all": True
    }
    print(f"⏳ Đang tạo Assignment trên hệ thống...")
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        print(f"✅ Đã tạo bài tập (Assignment): {TITLE}")
    else:
        print(f"❌ Tạo bài tập thất bại: {res.text}")

def main():
    if not os.path.exists(FILEPATH):
        print(f"❌ Không tìm thấy file: {FILEPATH}")
        return
        
    token = login()
    folder_id = get_or_create_folder(token)
    
    file_url = upload_file_to_drive(token, FILEPATH)
    quiz_data = parse_latex(token, FILEPATH)
    
    if quiz_data:
        create_assignment(token, folder_id, file_url, quiz_data)
        print("🚀 Hoàn tất quá trình upload!")
    else:
        print("❌ Không thể lấy quiz_data, huỷ bỏ upload.")

if __name__ == "__main__":
    main()
