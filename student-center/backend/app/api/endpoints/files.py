from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.file import FileItem
from app.schemas.file import FileResponse
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.core.drive_service import upload_file as drive_upload
from typing import List
import os
import uuid
import zipfile
import shutil
from typing import List

router = APIRouter()

@router.post("/upload", response_model=FileResponse)
async def upload_file_to_drive(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Dùng core drive_service để ném file sang Google Drive theo chuẩn v3
    try:
        drive_link = await drive_upload(file, current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi upload Drive: {str(e)}")

    # Tính kích thước MB
    size_mb = f"{file.size / (1024 * 1024):.2f} MB" if file.size else "Unknown"

    db_file = FileItem(
        filename=file.filename,
        file_url=drive_link,
        file_type=file.content_type or "unknown",
        file_size=size_mb,
        owner_id=current_user.id
    )
    db.add(db_file)
    
    # Reward EXP for uploading documents
    current_user.exp_points = (current_user.exp_points or 0) + 10
    
    db.commit()
    db.refresh(db_file)
    return db_file

@router.get("/my-drive", response_model=List[FileResponse])
def list_my_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    files = db.query(FileItem).filter(FileItem.owner_id == current_user.id).order_by(FileItem.id.desc()).all()
    return files

@router.post("/upload_scorm", response_model=FileResponse)
async def upload_scorm_package(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="SCORM phải là file .zip")
        
    unique_id = str(uuid.uuid4())
    scorm_dir = os.path.join("static", "scorm", unique_id)
    os.makedirs(scorm_dir, exist_ok=True)
    
    zip_path = os.path.join(scorm_dir, "package.zip")
    
    with open(zip_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(scorm_dir)
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="File zip không hợp lệ")
        
    os.remove(zip_path)
    
    # Tìm file khởi chạy
    entry_point = ""
    for possible in ["index.html", "story.html", "main.html", "index_lms.html"]:
        if os.path.exists(os.path.join(scorm_dir, possible)):
            entry_point = possible
            break
            
    if not entry_point:
        for root, dirs, files_in_dir in os.walk(scorm_dir):
            for f in files_in_dir:
                if f.endswith('.html'):
                    rel_dir = os.path.relpath(root, scorm_dir)
                    entry_point = os.path.join(rel_dir, f).replace("\\", "/") if rel_dir != "." else f
                    break
            if entry_point:
                break
                
    if not entry_point:
        raise HTTPException(status_code=400, detail="Không tìm thấy trang HTML nào trong SCORM")
        
    file_url = f"http://localhost:8000/static/scorm/{unique_id}/{entry_point}"
    
    db_file = FileItem(
        filename=file.filename,
        file_url=file_url,
        file_type="application/x-scorm",
        file_size="Unknown",
        owner_id=current_user.id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher", "admin"))
):
    """API lưu trữ video bài giảng trực tiếp vào máy chủ cục bộ."""
    valid_extensions = ["mp4", "webm", "ogg", "mov", "avi"]
    ext = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
    if ext not in valid_extensions:
        raise HTTPException(status_code=400, detail="Định dạng không hỗ trợ. Hãy chọn tệp Video (MP4, WebM...).")
        
    unique_id = str(uuid.uuid4())
    save_dir = os.path.join("static", "videos")
    os.makedirs(save_dir, exist_ok=True)
    
    safe_name = f"{unique_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(save_dir, safe_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"video_url": f"/static/videos/{safe_name}", "filename": safe_name}
