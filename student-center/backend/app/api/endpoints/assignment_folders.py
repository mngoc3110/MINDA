from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.assignment import Assignment
from app.models.assignment_folder import AssignmentFolder
from app.schemas.course import FolderCreate, FolderResponse, FolderMoveRequest
from app.core.security import get_current_user, require_role

router = APIRouter()


def _parse_classes(folder) -> list:
    """Parse comma-separated assigned_classes string to list."""
    if not folder.assigned_classes:
        return []
    return [c.strip() for c in folder.assigned_classes.split(",") if c.strip()]


def _to_response(f) -> FolderResponse:
    return FolderResponse(
        id=f.id,
        name=f.name,
        teacher_id=f.teacher_id,
        is_assigned_to_all=f.is_assigned_to_all,
        assignee_ids=[u.id for u in f.assignees],
        assigned_classes=_parse_classes(f),
        assignment_count=len(f.assignments),
        created_at=f.created_at,
    )


@router.get("/", response_model=List[FolderResponse])
def list_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Danh sách folder của giáo viên hiện tại."""
    folders = db.query(AssignmentFolder).options(
        joinedload(AssignmentFolder.assignments),
        joinedload(AssignmentFolder.assignees),
    ).filter(
        AssignmentFolder.teacher_id == current_user.id
    ).order_by(AssignmentFolder.created_at.desc()).all()

    return [_to_response(f) for f in folders]


@router.post("/", response_model=FolderResponse)
def create_folder(
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo folder mới."""
    folder = AssignmentFolder(
        name=data.name,
        teacher_id=current_user.id,
        is_assigned_to_all=data.is_assigned_to_all,
        assigned_classes=",".join(data.assigned_classes) if data.assigned_classes else None,
    )

    if not data.is_assigned_to_all and data.assignee_ids:
        students = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
        folder.assignees = students

    db.add(folder)
    db.commit()
    db.refresh(folder)

    return _to_response(folder)


@router.put("/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: int,
    data: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Cập nhật tên folder, danh sách lớp/học sinh."""
    folder = db.query(AssignmentFolder).options(
        joinedload(AssignmentFolder.assignments),
        joinedload(AssignmentFolder.assignees),
    ).filter(
        AssignmentFolder.id == folder_id,
        AssignmentFolder.teacher_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder không tồn tại")

    folder.name = data.name
    folder.is_assigned_to_all = data.is_assigned_to_all
    folder.assigned_classes = ",".join(data.assigned_classes) if data.assigned_classes else None

    if not data.is_assigned_to_all and data.assignee_ids is not None:
        students = db.query(User).filter(User.id.in_(data.assignee_ids)).all()
        folder.assignees = students
    elif data.is_assigned_to_all:
        folder.assignees = []

    db.commit()
    db.refresh(folder)

    return _to_response(folder)


@router.delete("/{folder_id}")
def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Xoá folder (không xoá bài tập bên trong, chỉ gỡ liên kết folder_id)."""
    folder = db.query(AssignmentFolder).filter(
        AssignmentFolder.id == folder_id,
        AssignmentFolder.teacher_id == current_user.id,
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder không tồn tại")

    db.query(Assignment).filter(Assignment.folder_id == folder_id).update(
        {Assignment.folder_id: None}, synchronize_session=False
    )

    db.delete(folder)
    db.commit()
    return {"message": f"Đã xoá folder '{folder.name}' thành công"}


@router.put("/move-assignment/{assignment_id}")
def move_assignment_to_folder(
    assignment_id: int,
    data: FolderMoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Di chuyển bài tập vào/ra folder."""
    assignment = db.query(Assignment).filter(
        Assignment.id == assignment_id,
        Assignment.teacher_id == current_user.id,
    ).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    if data.folder_id is not None:
        folder = db.query(AssignmentFolder).filter(
            AssignmentFolder.id == data.folder_id,
            AssignmentFolder.teacher_id == current_user.id,
        ).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder không tồn tại")

    assignment.folder_id = data.folder_id
    db.commit()
    return {"message": "Đã di chuyển bài tập thành công"}


@router.get("/student-folders")
def list_student_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Học sinh lấy danh sách folder được giao cho mình."""
    from app.models.user import TeacherStudentLink
    
    # Lấy danh sách GV đã thêm mình + lớp tương ứng
    links = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == current_user.id
    ).all()
    my_teacher_ids = set(link.teacher_id for link in links)
    my_classes = set(link.class_name for link in links if link.class_name)
    
    # Chỉ lấy folder của các GV đã thêm mình
    all_folders = db.query(AssignmentFolder).options(
        joinedload(AssignmentFolder.assignments),
        joinedload(AssignmentFolder.assignees),
    ).filter(
        AssignmentFolder.teacher_id.in_(my_teacher_ids)
    ).all()

    result = []
    for f in all_folders:
        folder_classes = _parse_classes(f)
        is_allowed = (
            f.is_assigned_to_all
            or any(u.id == current_user.id for u in f.assignees)
            or bool(my_classes & set(folder_classes))
        )
        if is_allowed and len(f.assignments) > 0:
            result.append({
                "id": f.id,
                "name": f.name,
                "assignment_count": len(f.assignments),
                "created_at": f.created_at.isoformat() if f.created_at else None,
            })

    return result
