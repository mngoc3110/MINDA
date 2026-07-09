import sys

with open("backend/app/api/endpoints/profile.py", "r") as f:
    content = f.read()

# 1. search-students: accept class_name, filter by it.
search_old = """@router.get("/search-students")
def search_students(q: str = "", db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Tìm kiếm học sinh theo tên hoặc email (cho giáo viên thêm vào lớp).\"\"\"
    from app.models.user import TeacherStudentLink
    
    # Lấy danh sách ID đã có trong lớp
    linked_ids = [link.student_id for link in db.query(TeacherStudentLink).filter(
        TeacherStudentLink.teacher_id == current_user.id
    ).all()]
    
    query = db.query(User).filter(User.role == "student")
    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
    students = query.order_by(User.full_name).limit(50).all()
    
    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "avatar_url": s.avatar_url,
            "email": s.email,
            "already_linked": s.id in linked_ids
        }
        for s in students
    ]"""

search_new = """@router.get("/search-students")
def search_students(q: str = "", class_name: str = "", db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Tìm kiếm học sinh theo tên hoặc email (cho giáo viên thêm vào lớp).\"\"\"
    from app.models.user import TeacherStudentLink
    
    # Lấy danh sách ID đã có trong lớp cụ thể (để disable nút chọn)
    query_linked = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.teacher_id == current_user.id
    )
    if class_name:
        query_linked = query_linked.filter(TeacherStudentLink.class_name == class_name)
    linked_ids = [link.student_id for link in query_linked.all()]
    
    query = db.query(User).filter(User.role == "student")
    if q:
        query = query.filter(
            (User.full_name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%"))
        )
    students = query.order_by(User.full_name).limit(50).all()
    
    return [
        {
            "id": s.id,
            "full_name": s.full_name,
            "avatar_url": s.avatar_url,
            "email": s.email,
            "already_linked": s.id in linked_ids
        }
        for s in students
    ]"""
content = content.replace(search_old, search_new)

# 2. add-student-to-class
add_old = """    added = 0
    for sid in student_ids:
        existing = db.query(TeacherStudentLink).filter(
            TeacherStudentLink.student_id == sid,
            TeacherStudentLink.teacher_id == current_user.id
        ).first()
        if not existing:
            link = TeacherStudentLink(
                student_id=sid, 
                teacher_id=current_user.id, 
                class_name=class_name or None,
                academic_year=academic_year,
                is_graduated=is_graduated
            )
            db.add(link)
            added += 1
    db.commit()"""

add_new = """    added = 0
    for sid in student_ids:
        # Check if already in THIS class
        existing = db.query(TeacherStudentLink).filter(
            TeacherStudentLink.student_id == sid,
            TeacherStudentLink.teacher_id == current_user.id,
            TeacherStudentLink.class_name == class_name
        ).first()
        
        if not existing:
            # If they have an "Unclassified" link (class_name=None), update it instead of creating duplicate
            unclassified = db.query(TeacherStudentLink).filter(
                TeacherStudentLink.student_id == sid,
                TeacherStudentLink.teacher_id == current_user.id,
                TeacherStudentLink.class_name == None
            ).first()
            
            if unclassified:
                unclassified.class_name = class_name
                unclassified.academic_year = academic_year
                unclassified.is_graduated = is_graduated
            else:
                link = TeacherStudentLink(
                    student_id=sid, 
                    teacher_id=current_user.id, 
                    class_name=class_name or None,
                    academic_year=academic_year,
                    is_graduated=is_graduated
                )
                db.add(link)
            added += 1
    db.commit()"""
content = content.replace(add_old, add_new)

# 3. update-student-class (Move class)
update_old = """@router.put("/update-student-class/{student_id}")
def update_student_class(student_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Đổi lớp cho học sinh.\"\"\"
    from app.models.user import TeacherStudentLink
    link = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == student_id,
        TeacherStudentLink.teacher_id == current_user.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh này trong lớp của bạn")
    
    class_name = data.get("class_name", "")
    link.class_name = class_name"""

update_new = """@router.put("/update-student-class/{student_id}")
def update_student_class(student_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Đổi lớp cho học sinh.\"\"\"
    from app.models.user import TeacherStudentLink
    old_class_name = data.get("old_class_name")
    
    query = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == student_id,
        TeacherStudentLink.teacher_id == current_user.id
    )
    if old_class_name is not None:
        if old_class_name == "__unclassified__":
            query = query.filter(TeacherStudentLink.class_name == None)
        else:
            query = query.filter(TeacherStudentLink.class_name == old_class_name)
            
    link = query.first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy học sinh này trong lớp của bạn")
    
    class_name = data.get("class_name", "")
    link.class_name = class_name"""
content = content.replace(update_old, update_new)

# 4. batch-update-class (Batch Add)
batch_old = """    count = 0
    for sid in student_ids:
        link = db.query(TeacherStudentLink).filter(
            TeacherStudentLink.student_id == sid,
            TeacherStudentLink.teacher_id == current_user.id
        ).first()
        if link:
            link.class_name = class_name
            if class_name:
                link.academic_year = academic_year
                link.is_graduated = is_graduated
            count += 1
    db.commit()"""

batch_new = """    count = 0
    for sid in student_ids:
        # Check if already in THIS class
        existing = db.query(TeacherStudentLink).filter(
            TeacherStudentLink.student_id == sid,
            TeacherStudentLink.teacher_id == current_user.id,
            TeacherStudentLink.class_name == class_name
        ).first()
        
        if not existing:
            # Check if they have an unclassified link
            unclassified = db.query(TeacherStudentLink).filter(
                TeacherStudentLink.student_id == sid,
                TeacherStudentLink.teacher_id == current_user.id,
                TeacherStudentLink.class_name == None
            ).first()
            
            if unclassified:
                unclassified.class_name = class_name
                unclassified.academic_year = academic_year
                unclassified.is_graduated = is_graduated
            else:
                link = TeacherStudentLink(
                    student_id=sid,
                    teacher_id=current_user.id,
                    class_name=class_name,
                    academic_year=academic_year,
                    is_graduated=is_graduated
                )
                db.add(link)
            count += 1
    db.commit()"""
content = content.replace(batch_old, batch_new)

# 5. remove-student (Delete link)
remove_old = """@router.delete("/remove-student/{student_id}")
def remove_student_from_class(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Giáo viên xoá học sinh khỏi lớp.\"\"\"
    from app.models.user import TeacherStudentLink
    link = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == student_id,
        TeacherStudentLink.teacher_id == current_user.id
    ).first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết này")
    db.delete(link)
    db.commit()"""

remove_new = """@router.delete("/remove-student/{student_id}")
def remove_student_from_class(student_id: int, class_name: str = None, db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    \"\"\"Giáo viên xoá học sinh khỏi lớp.\"\"\"
    from app.models.user import TeacherStudentLink
    query = db.query(TeacherStudentLink).filter(
        TeacherStudentLink.student_id == student_id,
        TeacherStudentLink.teacher_id == current_user.id
    )
    if class_name is not None:
        if class_name == "__unclassified__":
            query = query.filter(TeacherStudentLink.class_name == None)
        else:
            query = query.filter(TeacherStudentLink.class_name == class_name)
            
    link = query.first()
    if not link:
        raise HTTPException(status_code=404, detail="Không tìm thấy liên kết này")
    db.delete(link)
    db.commit()"""
content = content.replace(remove_old, remove_new)

with open("backend/app/api/endpoints/profile.py", "w") as f:
    f.write(content)
