import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from fastapi import UploadFile
import aiofiles
import uuid

# Scope cần thiết để upload, lấy link và chỉnh quyền
SCOPES = ['https://www.googleapis.com/auth/drive']
CREDENTIALS_FILE = "drive_credentials.json"
TARGET_FOLDER_NAME = "MINDA_Storage"

import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from fastapi import UploadFile
import aiofiles
import uuid
from app.models.user import User

def get_user_drive_service(user: User):
    """
    Xây dựng Google Drive Service dựa trên Credentials của người dùng (nếu có).
    Nếu không có, ném exception để yêu cầu Connect Google Drive.
    """
    if not user.google_refresh_token:
        raise Exception("Người dùng chưa liên kết Google Drive.")

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    creds = Credentials(
        token=user.google_access_token,
        refresh_token=user.google_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret
    )
    
    # Optional: Build the service. google-api-python-client will automatically refresh tokens if expired!
    return build('drive', 'v3', credentials=creds)


def delete_file(file_identifier: str, user: User):
    """Xoá file trực tiếp từ Google Drive cá nhân của học sinh."""
    if not file_identifier:
        return
        
    try:
        service = get_user_drive_service(user)
        
        file_id = file_identifier
        if 'drive.google.com' in file_identifier:
            try:
                # Mẫu link: https://drive.google.com/file/d/1Xy_.../view
                file_id = file_identifier.split('/d/')[1].split('/')[0]
            except Exception:
                pass
                
        service.files().delete(fileId=file_id).execute()
        print(f"✅ Đã xoá file {file_id} khỏi Google Drive cá nhân.")
    except Exception as e:
        print(f"Lỗi khi xoá file Google Drive: {e}")


async def upload_file(file: UploadFile, user: User) -> str:
    """
    Upload file vào thẳng thư mục MINDA mặc định trong Google Drive cá nhân của học sinh.
    """
    try:
        service = get_user_drive_service(user)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise Exception(f"UNAUTHORIZED_DRIVE: {e}")

    user_folder_id = user.google_folder_id
    if not user_folder_id:
        raise Exception("Không tìm thấy folder cấu hình gốc. Vui lòng Liên kết lại Google Drive.")

    # Lưu file tạm local
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    safe_filename = f"{uuid.uuid4().hex[:8]}_{file.filename}"
    temp_path = os.path.join(temp_dir, safe_filename)

    try:
        async with aiofiles.open(temp_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)

        file_metadata = {
            'name': file.filename,
            'parents': [user_folder_id]
        }
        media = MediaFileUpload(temp_path, mimetype=file.content_type, resumable=True)
        
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink, webContentLink'
        ).execute()

        file_id = uploaded_file.get('id')
        
        # Đảm bảo file được thấy by public (Avatar public view)
        service.permissions().create(
            fileId=file_id,
            body={'type': 'anyone', 'role': 'reader'}
        ).execute()

        return uploaded_file.get('webViewLink')

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_msg = str(e)
        if "invalid_grant" in error_msg:
            raise Exception("Liên kết Google Drive đã hết hạn hoặc bị lỗi! Vui lòng vào mục 'Trang cá nhân', bấm 'Ngắt kết nối' rồi 'Liên Kết Drive Ngay' để cấp quyền lại.")
        raise Exception(f"Lỗi hệ thống Drive API: {e}")
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
