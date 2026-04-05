from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user
import random

router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản mới. Mặc định role=student."""
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="Tài khoản với email này đã tồn tại trong hệ thống."
        )
    
    # Validate role
    try:
        role = UserRole(user_in.role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Vai trò không hợp lệ. Chọn: student, teacher, admin")
    
    hashed_password = get_password_hash(user_in.password)
    # Random default avatar cho người mới
    avatar_id = random.randint(1, 70)
    default_avatar = f"https://i.pravatar.cc/300?img={avatar_id}"

    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=hashed_password,
        role=role,
        avatar_url=default_avatar,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
def login(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Đăng nhập. Trả về JWT Token kèm role để Frontend điều hướng Dashboard."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thông tin đăng nhập không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role.value,
        "user_id": user.id,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "cover_url": user.cover_url,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Lấy thông tin User hiện tại từ JWT Token."""
    # Pydantic v2 requires manually assigning mapped properties if they are declared as fields
    current_user.is_google_connected = current_user.google_refresh_token is not None
    return current_user
