from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, Token, UserUpdate
from app.core.security import get_password_hash, verify_password, create_access_token, get_current_user, ALGORITHM
from app.core.limiter import limiter
from app.core.email import send_reset_password_email
from passlib.context import CryptContext
from jose import jwt, JWTError
import random
import os
from datetime import datetime, timedelta

SECRET_KEY = os.getenv("SECRET_KEY", "2098e80e6ffb09517dbcd7baa913fc4663831cc02364d3516e76b8e91c295654")

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

    # Validate phone
    if not user_in.phone:
        raise HTTPException(status_code=400, detail="Số điện thoại là bắt buộc để đăng ký tài khoản.")

    # Giáo viên phải chờ admin phê duyệt trước khi được kích hoạt
    is_active = role != UserRole.teacher

    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=hashed_password,
        role=role,
        avatar_url=default_avatar,
        is_active=is_active,
        current_rank="Sơ cấp",  # Bật thấp nhất cho mọi user mới
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Đăng nhập. Trả về JWT Token kèm role để Frontend điều hướng Dashboard."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thông tin đăng nhập không chính xác",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Kiểm tra tài khoản giáo viên chưa được duyệt
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản chưa được phê duyệt. Vui lòng chờ Admin chấp thuận đăng ký Giáo viên của bạn.",
        )
    
    access_token = create_access_token(subject=user.id)
    
    # Email đặc biệt: darbar3110@gmail.com có dual-role (teacher + admin)
    # Trả về role "teacher" mặc định để hiện Teacher Dashboard khi đăng nhập thường
    # Khi vào /admin/login mới dùng role admin
    DUAL_ROLE_EMAILS = {"darbar3110@gmail.com", "darber3110@gmail.com"}
    effective_role = user.role.value
    if user.email in DUAL_ROLE_EMAILS and user.role.value == "admin":
        effective_role = "teacher"  # Hiện Teacher Portal mặc định
    
    # Phone intercept
    requires_phone_flag = False
    if not user.phone:
        requires_phone_flag = True

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": effective_role,
        "user_id": user.id,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "cover_url": user.cover_url,
        "requires_phone": requires_phone_flag,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Lấy thông tin User hiện tại từ JWT Token."""
    # Pydantic v2 requires manually assigning mapped properties if they are declared as fields
    current_user.is_google_connected = current_user.google_refresh_token is not None
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Cập nhật thông tin cá nhân."""
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.phone is not None:
        current_user.phone = user_in.phone
    db.commit()
    db.refresh(current_user)
    current_user.is_google_connected = current_user.google_refresh_token is not None
    return current_user


from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest

@router.post("/forgot-password")
@limiter.limit("3/hour")
def forgot_password(request: Request, req: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Tạo token đặt lại mật khẩu và gửi email."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        # Avoid user enumeration by returning a generic message
        return {
            "message": "Nếu email tồn tại trong hệ thống, một email chứa liên kết đặt lại mật khẩu đã được gửi.",
            "reset_link": None
        }

    # Generate a stateless token signed with SECRET_KEY + user's current hashed_password
    # This ensures the token becomes invalid as soon as the password is changed.
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"sub": user.email, "exp": expire}
    
    # Secret depends on current password hash
    secret = SECRET_KEY + user.hashed_password
    encoded_jwt = jwt.encode(to_encode, secret, algorithm=ALGORITHM)
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    if os.getenv("NODE_ENV") == "production":
        frontend_url = "https://minda.io.vn"
        
    reset_link = f"{frontend_url}/reset-password?token={encoded_jwt}&email={user.email}"
    
    # Send email in background
    background_tasks.add_task(send_reset_password_email, email=user.email, reset_link=reset_link)
    
    return {
        "message": "Vui lòng kiểm tra email của bạn để lấy liên kết đặt lại mật khẩu.",
        "reset_link": None  # Removed to enforce checking email
    }


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, email: str, db: Session = Depends(get_db)):
    """Đặt lại mật khẩu dựa trên token."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Người dùng không hợp lệ.")
        
    secret = SECRET_KEY + user.hashed_password
    try:
        payload = jwt.decode(req.token, secret, algorithms=[ALGORITHM])
        token_email: str = payload.get("sub")
        if token_email is None or token_email != user.email:
            raise HTTPException(status_code=400, detail="Token không hợp lệ.")
    except JWTError:
        raise HTTPException(
            status_code=400, 
            detail="Token không hợp lệ hoặc đã hết hạn (có thể mật khẩu đã được thay đổi trước đó)."
        )

    # Valid token. Change password.
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Đặt lại mật khẩu thành công!"}
