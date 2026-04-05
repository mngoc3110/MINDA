import os
import uuid
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from dotenv import load_dotenv

# Tải biến môi trường từ file .env
load_dotenv()

# Khởi tạo Cloudinary bằng biến môi trường CLOUDINARY_URL
# Nếu lỗi "Must supply api_key", nghĩa là user chưa điền đúng chuỗi bảo mật vào file .env
try:
    url = os.getenv("CLOUDINARY_URL")
    if url and url.startswith("cloudinary://"):
        parts = url.replace("cloudinary://", "").split("@")
        if len(parts) == 2:
            creds = parts[0].split(":")
            cloudinary.config(
                cloud_name=parts[1],
                api_key=creds[0],
                api_secret=creds[1],
                secure=True
            )
except Exception as e:
    print(f"Cảnh báo Cloudinary chưa cấu hình đúng: {e}")

class CloudinaryService:
    def __init__(self):
        pass

    def delete_file(self, file_identifier: str):
        """
        Xoá file trên Cloudinary bằng public_id.
        Cloudinary URL thường có dạng: https://res.cloudinary.com/.../upload/v1234/folder/public_id.jpg
        Ta cần cắt lấy public_id (bao gồm cả thư mục nhưng bỏ đuôi mở rộng).
        """
        if not file_identifier or 'cloudinary.com' not in file_identifier:
            return

        try:
            # Parse URL để lấy public_id. Ví dụ:
            # .../upload/v12345/MINDA_Storage/avatar/nguyen_van_a_abcd1234.jpg
            # public_id sẽ là "MINDA_Storage/avatar/nguyen_van_a_abcd1234"
            parts = file_identifier.split('/upload/')
            if len(parts) > 1:
                path = parts[1]
                # Bỏ qua phần phiên bản (vd: v1710928374/)
                slash_index = path.find('/')
                if path.startswith('v') and slash_index > 0 and path[1:slash_index].isdigit():
                    path = path[slash_index + 1:]
                
                # Bỏ đuôi mở rộng (.jpg, .png)
                public_id = os.path.splitext(path)[0]
                
                print(f"Bắt đầu xoá ảnh Cloudinary với public_id: {public_id}")
                cloudinary.uploader.destroy(public_id)
                print(f"✅ Đã xoá file {public_id} khỏi Cloudinary.")
        except Exception as e:
            print(f"Lỗi khi xoá file Cloudinary: {e}")

    async def upload_file(self, file: UploadFile, user_name: str, user_id: int, role: str, folder_suffix="files") -> str:
        """
        Nhận file, upload lên Cloudinary vào thư mục MINDA_Storage.
        Trả về URL trực tiếp của hình ảnh (HTTPS).
        """
        if not os.getenv("CLOUDINARY_URL") or "**********" in os.getenv("CLOUDINARY_URL"):
            raise Exception("Chưa điền mã API Secret vào file .env!")

        # Chuẩn hoá tên thư mục để gọn gàng hơn trên Cloudinary
        role_label = str(role).split('.')[-1].lower()
        base_folder = f"MINDA_Storage/{folder_suffix}/{role_label}_{user_id}"
        
        # Đọc nội dung file
        content = await file.read()
        
        try:
            # Sinh ID ngẫu nhiên để tránh trùng lặp
            unique_id = uuid.uuid4().hex[:8]
            
            response = cloudinary.uploader.upload(
                content,
                folder=base_folder,
                public_id=f"{unique_id}_{file.filename.split('.')[0]}",
                resource_type="auto" # Tự nhận diện ảnh/video/raw
            )
            
            # Trả về link https an toàn luôn, không cần cấp quyền rườm rà như Google Drive
            return response.get('secure_url')
        except Exception as e:
            raise Exception(f"Cloudinary upload failed: {str(e)}")

cloudinary_service = CloudinaryService()
