import os
import requests
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv

load_dotenv()

from app.db.database import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

SCOPES = ['https://www.googleapis.com/auth/drive.file']
REDIRECT_URI = "http://localhost:8000/api/auth/google/callback"

def get_google_credentials():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        print("Lỗi: Không tìm thấy GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET. Tệp .env chưa được load đúng cách.")
        raise HTTPException(status_code=500, detail="Google Client ID bị thiếu")
    return client_id, client_secret

@router.get("/connect")
def connect_google_drive(current_user: User = Depends(get_current_user)):
    """Trả về URL chuyển hướng học sinh sang màn hình xin quyền Google Drive"""
    client_id, _ = get_google_credentials()
    
    # State parameter dùng để định danh user gửi request khi Google trả callback về
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={urllib.parse.quote(REDIRECT_URI)}&"
        "response_type=code&"
        "scope=https://www.googleapis.com/auth/drive.file&"
        "access_type=offline&"
        "prompt=consent&"
        f"state={current_user.id}"
    )
    
    return {"authorization_url": auth_url}

@router.get("/callback")
def google_auth_callback(request: Request, state: str, code: str, db: Session = Depends(get_db)):
    """Xử lý Callback từ Google, lưu Token vào DB và thiết lập thư mục Gốc"""
    try:
        user_id = int(state)
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

        client_id, client_secret = get_google_credentials()

        # Stateless Token Exchange
        token_res = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": REDIRECT_URI
        })
        token_data = token_res.json()

        if "error" in token_data:
            print(f"Token Endpoint Error: {token_data}")
            return RedirectResponse(url="http://localhost:3000/profile?google_error=true")

        # Lưu Token vào DB
        user.google_access_token = token_data.get("access_token")
        if token_data.get("refresh_token"):
            user.google_refresh_token = token_data.get("refresh_token")
        db.commit()

        # Khởi tạo Credentials cho SDK
        credentials = Credentials(
            token=user.google_access_token,
            refresh_token=user.google_refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret
        )

        # Tạo thư mục rễ ngay sau khi Connect thành công
        service = build('drive', 'v3', credentials=credentials)
        if not user.google_folder_id:
            folder_metadata = {
                'name': 'MINDA EduCenter (App)',
                'mimeType': 'application/vnd.google-apps.folder'
            }
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            user.google_folder_id = folder.get('id')
            
            # Cấp quyền public đọc để Avatar hiển thị được cho web
            service.permissions().create(
                fileId=user.google_folder_id,
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()
            db.commit()

        # Redirect thành công về Frontend Profile Page
        return RedirectResponse(url="http://localhost:3000/profile?google_connected=true")

    except Exception as e:
        import traceback
        traceback.print_exc()
        return RedirectResponse(url="http://localhost:3000/profile?google_error=true")
