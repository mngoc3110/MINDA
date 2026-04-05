from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Giải mã JWT Token và trả về User object. Dùng như Depends() trong mọi endpoint cần xác thực."""
    from app.models.user import User  # Import trễ để tránh circular import
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token không hợp lệ hoặc đã hết hạn",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


# Phân cấp quyền: Admin thừa kậ quyền của Teacher, Teacher thừa kế quyền của Student
# darbar3110@gmail.com sẽ có cả teacher + admin rights dựa trên email đặc biệt này
ROLE_HIERARCHY = {
    "admin": {"admin", "teacher", "student"},
    "teacher": {"teacher", "student"},
    "student": {"student"},
}


def require_role(*allowed_roles: str):
    """
    Dependency factory: Kiểm tra vai trò người dùng.
    Admin luôn có quyền của teacher và student (kiế trúc phân cấp RBAC).
    Cách dùng: current_user = Depends(require_role("teacher", "admin"))
    """
    def role_checker(current_user = Depends(get_current_user)):
        user_role = current_user.role.value
        # Lấy tập hợp quyền thực sự của user dựa theo phân cấp
        effective_roles = ROLE_HIERARCHY.get(user_role, {user_role})
        if not effective_roles.intersection(set(allowed_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền truy cập. Yêu cầu vai trò: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker
