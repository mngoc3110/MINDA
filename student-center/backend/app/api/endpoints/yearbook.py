from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.yearbook import YearbookMessage, YearbookGroup
from app.models.user import User, UserRole
from app.schemas.yearbook import YearbookMessageCreate, YearbookMessageResponse, YearbookHeartUpdate, YearbookGroupCreate, YearbookGroupResponse
from app.core.security import get_current_user
import uuid

router = APIRouter()

@router.get("/groups", response_model=List[YearbookGroupResponse])
def get_yearbook_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.teacher, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Giáo viên chỉ thấy sổ của mình, Admin thấy tất cả
    if current_user.role == UserRole.admin:
        groups = db.query(YearbookGroup).order_by(YearbookGroup.created_at.desc()).all()
    else:
        groups = db.query(YearbookGroup).filter(YearbookGroup.teacher_id == current_user.id).order_by(YearbookGroup.created_at.desc()).all()
    return groups

@router.post("/groups", response_model=YearbookGroupResponse)
def create_yearbook_group(
    group: YearbookGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in [UserRole.teacher, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    new_group = YearbookGroup(
        id=f"group_{uuid.uuid4().hex[:8]}",
        title=group.title,
        description=group.description,
        teacher_id=current_user.id
    )
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@router.get("/groups/{group_id}", response_model=YearbookGroupResponse)
def get_yearbook_group(
    group_id: str,
    db: Session = Depends(get_db)
):
    group = db.query(YearbookGroup).filter(YearbookGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group

# Dependency to optionally get user if token is provided
def get_optional_user(token: str = None, db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        from app.core.security import oauth2_scheme, verify_token
        from sqlalchemy.orm import Session
        
        # We need a custom way to handle optional oauth2_scheme since fastapi's Depends(oauth2_scheme) raises 401 if missing.
        # But for simplicity, we'll just use a header directly.
        pass
    except Exception:
        return None

from fastapi import Header

def get_optional_user_from_header(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    from app.core.security import get_current_user
    try:
        return get_current_user(token=token, db=db)
    except:
        return None


@router.get("/{yearbook_id}/messages", response_model=List[YearbookMessageResponse])
def get_yearbook_messages(
    yearbook_id: str, 
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user_from_header)
):
    query = db.query(YearbookMessage).filter(YearbookMessage.yearbook_id == yearbook_id)
    
    # If the user is a teacher or admin, they can see ALL messages (public & private)
    # If not, they can only see public messages
    if current_user and current_user.role in [UserRole.teacher, UserRole.admin]:
        pass # Can see all
    else:
        query = query.filter(YearbookMessage.is_public == True)
        
    messages = query.order_by(YearbookMessage.created_at.desc()).all()
    return messages


@router.post("/messages", response_model=YearbookMessageResponse)
def create_yearbook_message(
    message: YearbookMessageCreate,
    db: Session = Depends(get_db)
):
    # Dữ liệu từ form học sinh gửi lên
    new_message = YearbookMessage(
        id=message.id or str(uuid.uuid4()),
        yearbook_id=message.yearbook_id,
        author_name=message.author_name,
        emoji=message.emoji,
        bg_color=message.bg_color,
        message=message.message,
        image_data=message.image_data,
        is_public=message.is_public,
        hearts=0
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@router.put("/messages/{message_id}/heart", response_model=YearbookMessageResponse)
def update_message_heart(
    message_id: str,
    heart_data: YearbookHeartUpdate,
    db: Session = Depends(get_db)
):
    message = db.query(YearbookMessage).filter(YearbookMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.hearts = heart_data.hearts
    db.commit()
    db.refresh(message)
    return message
