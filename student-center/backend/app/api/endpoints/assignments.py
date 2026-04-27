import os
import json
import base64
from app.services.ocr_service import extract_quiz_from_pdf_local, extract_quiz_from_image_local
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.database import get_db
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.course import AssignmentCreate, AssignmentResponse, SubmissionCreate, SubmissionResponse, GradeSubmission
from app.core.security import get_current_user, require_role

router = APIRouter()


@router.post("/assignments", response_model=AssignmentResponse)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Tạo bài tập mới tự do (Teacher/Admin)."""
    # Lấy ra thông tin assignee_ids
    dump_data = data.model_dump()
    assignee_ids = dump_data.pop("assignee_ids", [])
    
    assignment = Assignment(**dump_data, teacher_id=current_user.id)
    
    if hasattr(assignment, "is_assigned_to_all") and not assignment.is_assigned_to_all and assignee_ids:
        students = db.query(User).filter(User.id.in_(assignee_ids)).all()
        assignment.assignees = students

    db.add(assignment)
    
    # Cộng 10 EXP cho giáo viên
    current_user.exp_points = (current_user.exp_points or 0) + 10
    
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])
def list_assignments(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Danh sách bài tập của khoá học."""
    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).all()
    
    result = []
    for a in assignments:
        is_allowed = True
        if current_user.role.value == "student" and not getattr(a, "is_assigned_to_all", True):
            if not any(u.id == current_user.id for u in getattr(a, "assignees", [])):
                is_allowed = False
        
        if is_allowed:
            resp = AssignmentResponse.model_validate(a)
            resp.assignee_ids = [u.id for u in a.assignees]
            result.append(resp)
            
    return result


@router.put("/assignments/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Giáo viên cập nhật nội dung bài tập."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    if assignment.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền sửa bài tập này")
    
    update_data = data.model_dump(exclude_unset=True)
    assignee_ids = update_data.pop("assignee_ids", None)
    
    for key, value in update_data.items():
        setattr(assignment, key, value)
        
    if assignee_ids is not None and not getattr(assignment, "is_assigned_to_all", True):
        students = db.query(User).filter(User.id.in_(assignee_ids)).all()
        assignment.assignees = students
    elif getattr(assignment, "is_assigned_to_all", True):
        assignment.assignees = []

    # Check if quiz_data changed → auto recalculate scores
    quiz_data_changed = "quiz_data" in update_data
    
    db.commit()
    db.refresh(assignment)

    # ── Auto-recalculate all submission scores when answers change ──
    if quiz_data_changed and assignment.quiz_data:
        _recalc_all_scores(assignment, db)
    
    return assignment


def _recalc_all_scores(assignment, db):
    """Recalculate scores for all submissions of this assignment and update EXP."""
    from datetime import datetime
    from sqlalchemy import func
    
    subs = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment.id
    ).all()
    
    if not subs:
        return
        
    # Get the earliest submission date for each student for this assignment
    # (EXP is only calculated based on the first submission)
    earliest_subs = db.query(
        AssignmentSubmission.student_id, 
        func.min(AssignmentSubmission.submitted_at).label('min_date')
    ).filter(AssignmentSubmission.assignment_id == assignment.id).group_by(AssignmentSubmission.student_id).all()
    
    first_sub_dates = {(row.student_id, row.min_date) for row in earliest_subs}
    
    is_standard = assignment.exam_format == "standard"
    sections = assignment.quiz_data.get("sections", [])
    
    def norm_tf(val):
        if isinstance(val, bool): return val
        if isinstance(val, int): return val != 0
        s = str(val).strip().lower()
        return s in ("true", "1", "yes")

    def count_tf_correct(ans_dict, items):
        count = 0
        for item in items:
            lbl = item.get("label")
            student_raw = ans_dict.get(lbl)
            if student_raw is None: continue
            if norm_tf(student_raw) == norm_tf(item.get("isTrue")):
                count += 1
        return count

    def get_exp_change(score_val, max_score_val, current_exp_val):
        if score_val is None: return 0
        ms = float(max_score_val) if max_score_val else 10.0
        if ms > 0:
            s10 = (float(score_val) / ms) * 10
        else:
            s10 = 0
        if s10 >= 8: return 20
        elif s10 >= 5: return 10
        if (current_exp_val or 0) < 800:
            return 5
        return -int(5 - s10)
    
    for sub in subs:
        if not sub.quiz_answers:
            continue
            
        old_score = sub.score
        answers = sub.quiz_answers
        earned = 0.0
        total_possible = 0.0
        
        for s_idx, section in enumerate(sections):
            stype = section.get("type")
            for q in section.get("questions", []):
                raw_id = q.get("id") or ""
                qid = f"s{s_idx}_{raw_id}" if raw_id else None
                ans = answers.get(qid) if qid else None
                
                if stype == "mcq":
                    ok = ans is not None and str(ans).strip() == str(q.get("correctAnswer")).strip()
                    if is_standard:
                        if ok: earned += 0.25
                    else:
                        total_possible += 1.0
                        if ok: earned += 1.0
                
                elif stype == "true_false":
                    if not is_standard: total_possible += 1.0
                    if ans and isinstance(ans, dict):
                        n = count_tf_correct(ans, q.get("items", []))
                        if n == 4: earned += 1.0
                        elif n == 3: earned += 0.5
                        elif n == 2: earned += 0.25
                        elif not is_standard and n == 1: earned += 0.1
                
                elif stype == "short_answer":
                    student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                    correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                    if is_standard:
                        if student_sa and student_sa == correct_sa: earned += 0.5
                    else:
                        total_possible += 1.0
                        if student_sa and student_sa == correct_sa: earned += 1.0
        
        if is_standard:
            sub.score = round(earned, 2)
        else:
            # Đề ôn tập: cố định 0.25 điểm mỗi câu thay vì chia theo tỉ lệ max_score
            sub.score = round(earned * 0.25, 2)
        
        sub.graded_at = datetime.utcnow()
        
        # Recalculate EXP for the student if this is their first submission
        if (sub.student_id, sub.submitted_at) in first_sub_dates:
            old_exp = get_exp_change(old_score, assignment.max_score, sub.student.exp_points if sub.student else 0)
            new_exp = get_exp_change(sub.score, assignment.max_score, sub.student.exp_points if sub.student else 0)
            diff = new_exp - old_exp
            
            if diff != 0 and sub.student:
                sub.student.exp_points = max(0, (sub.student.exp_points or 0) + diff)
    
    db.commit()


@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Giáo viên xoá bài tập (xoá kèm bài nộp)."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    if assignment.teacher_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Không có quyền xoá bài tập này")
    
    # Delete associated submissions first to avoid FK constraint issues if cascade is not set
    db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).delete()
    db.delete(assignment)
    db.commit()
    return {"message": "Đã xoá bài tập và điểm thành công"}



@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionResponse)
def submit_assignment(
    assignment_id: int,
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("student")),
):
    """Học sinh nộp bài tập. Mỗi lần nộp tạo record mới (lịch sử), EXP chỉ cộng 1 lần duy nhất/đề."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    
    # ── Kiểm tra đã có submission cũ chưa (để biết cộng EXP hay không) ──
    existing_count = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).count()
    
    # EXP chỉ cộng lần đầu tiên (chưa có submission nào trước đó)
    already_earned_exp = existing_count > 0
    
    # Luôn tạo submission mới (giữ lịch sử các lần làm)
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        **data.model_dump(),
    )
    
    # Auto-grader for quiz
    if assignment.assignment_type == "quiz" and assignment.quiz_data and data.quiz_answers:
        is_standard = getattr(assignment, "exam_format", "practice") == "standard"
        earned = 0.0

        def norm_tf(val):
            """Normalize any truthy representation to Python bool."""
            if isinstance(val, bool): return val
            if isinstance(val, int): return val != 0
            s = str(val).strip().lower()
            return s in ("true", "1", "yes")

        def count_tf_correct(ans_dict, items):
            """Count how many true/false items the student answered correctly."""
            count = 0
            for item in items:
                lbl = item.get("label")
                student_raw = ans_dict.get(lbl)
                if student_raw is None:
                    continue
                student_val = norm_tf(student_raw)
                correct_val = norm_tf(item.get("isTrue"))
                if student_val == correct_val:
                    count += 1
            return count

        try:
            if is_standard:
                # ── Đề Chuẩn (thang điểm 10) ──────────────────────────────
                # MCQ:           mỗi câu đúng = 0.25đ
                # True/False:    2/4 đúng=0.25đ, 3/4=0.5đ, 4/4=1đ (1/4=0đ)
                # Short answer:  mỗi câu đúng = 0.5đ
                for s_idx, section in enumerate(assignment.quiz_data.get("sections", [])):
                    for q in section.get("questions", []):
                        raw_id = q.get("id") or ""
                        qid = f"s{s_idx}_{raw_id}" if raw_id else None
                        ans = data.quiz_answers.get(qid) if qid else None
                        stype = section.get("type")

                        if stype == "mcq":
                            if ans is not None and str(ans).strip() == str(q.get("correctAnswer")).strip():
                                earned += 0.25

                        elif stype == "true_false":
                            if ans and isinstance(ans, dict):
                                n = count_tf_correct(ans, q.get("items", []))
                                if n == 4:   earned += 1.0
                                elif n == 3: earned += 0.5
                                elif n == 2: earned += 0.25
                                # n == 1 hoặc 0 → 0đ

                        elif stype == "short_answer":
                            # Normalize: comma→period, strip spaces (VN: "3,68" == "3.68")
                            student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                            correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                            if student_sa and student_sa == correct_sa:
                                earned += 0.5

                submission.score = round(earned, 2)  # Giữ dạng thập phân (8.75)

            else:
                # ── Đề Ôn Tập (thang điểm tỉ lệ theo max_score) ──────────
                total_possible = 0.0
                for s_idx, section in enumerate(assignment.quiz_data.get("sections", [])):
                    for q in section.get("questions", []):
                        raw_id = q.get("id") or ""
                        qid = f"s{s_idx}_{raw_id}" if raw_id else None
                        ans = data.quiz_answers.get(qid) if qid else None
                        stype = section.get("type")

                        if stype == "mcq":
                            total_possible += 1.0
                            if ans is not None and str(ans).strip() == str(q.get("correctAnswer")).strip():
                                earned += 1.0

                        elif stype == "true_false":
                            total_possible += 1.0
                            if ans and isinstance(ans, dict):
                                n = count_tf_correct(ans, q.get("items", []))
                                if n == 4:   earned += 1.0
                                elif n == 3: earned += 0.5
                                elif n == 2: earned += 0.25
                                elif n == 1: earned += 0.1

                        elif stype == "short_answer":
                            total_possible += 1.0
                            student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                            correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                            if student_sa and student_sa == correct_sa:
                                earned += 1.0

                # Tính điểm cố định 0.25 cho mỗi câu đối với Đề Ôn Tập
                submission.score = round(earned * 0.25, 2)

            submission.graded_at = datetime.utcnow()
        except Exception as e:
            print("Auto-grade error:", e)

    # ── EXP Logic: Quy đổi điểm thang 10 → EXP, chỉ 1 lần duy nhất ──
    if not already_earned_exp and submission.score is not None:
        # Quy về thang 10 (giữ thập phân)
        if assignment.max_score and float(assignment.max_score) > 0:
            score_10 = (float(submission.score) / float(assignment.max_score)) * 10
        else:
            score_10 = 0
        
        if score_10 >= 8:
            exp_change = 20
        elif score_10 >= 5:
            exp_change = 10
        else:
            # Dưới trung bình: nếu hạng Học bá trở xuống (< 800 EXP) thì cộng 5, ngược lại trừ EXP
            if (current_user.exp_points or 0) < 800:
                exp_change = 5
            else:
                exp_change = -int(5 - score_10)
        
        new_exp = (current_user.exp_points or 0) + exp_change
        current_user.exp_points = max(new_exp, 0)  # Không cho EXP âm

    # ── Cộng EXP cho giáo viên khi có HS nộp bài (lần đầu) ──
    if not already_earned_exp:
        teacher = db.query(User).filter(User.id == assignment.teacher_id).first()
        if teacher:
            teacher.exp_points = (teacher.exp_points or 0) + 5

    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/assignments/{assignment_id}/submissions", response_model=List[SubmissionResponse])
def list_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Danh sách bài nộp (Teacher/Admin xem)."""
    return db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id == assignment_id).all()


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(
    submission_id: int,
    data: GradeSubmission,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Chấm điểm bài nộp (Teacher/Admin)."""
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Bài nộp không tồn tại")
    
    submission.score = data.score
    submission.feedback = data.feedback
    submission.graded_at = datetime.utcnow()
    db.commit()
    db.refresh(submission)
    return submission

@router.get("/assignments/practice")
def get_practice_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách các Bài tập luyện thi tự do (không thuộc khóa học nào)."""
    from app.models.assignment_folder import AssignmentFolder
    from app.models.user import TeacherStudentLink
    
    assignments = db.query(Assignment).filter(Assignment.course_id == None).order_by(Assignment.created_at.desc()).all()
    
    # Lấy tất cả submissions của user hiện tại
    my_subs = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == current_user.id
    ).all()
    sub_map = {s.assignment_id: s for s in my_subs}
    
    # Lấy danh sách GV đã thêm mình + lớp tương ứng
    my_teacher_ids = set()
    my_classes_by_teacher = {}  # teacher_id -> set of class_names
    if current_user.role.value == "student":
        links = db.query(TeacherStudentLink).filter(
            TeacherStudentLink.student_id == current_user.id
        ).all()
        for link in links:
            my_teacher_ids.add(link.teacher_id)
            if link.class_name:
                if link.teacher_id not in my_classes_by_teacher:
                    my_classes_by_teacher[link.teacher_id] = set()
                my_classes_by_teacher[link.teacher_id].add(link.class_name)
    
    result = []
    for a in assignments:
        is_allowed = True
        if current_user.role.value == "student":
            # Bước 1: Phải là HS của GV tạo bài tập này
            if a.teacher_id not in my_teacher_ids:
                is_allowed = False
                # Nếu không phải HS => skip luôn
            else:
                # Bước 2: Kiểm tra phân quyền folder/lớp
                if a.folder_id and a.folder:
                    folder = a.folder
                    if folder.is_assigned_to_all:
                        is_allowed = True  # Folder giao tất cả HS của GV => OK
                    else:
                        # Kiểm tra theo HS cụ thể
                        by_user = any(u.id == current_user.id for u in folder.assignees)
                        # Kiểm tra theo lớp
                        folder_classes = set(c.strip() for c in (folder.assigned_classes or "").split(",") if c.strip())
                        my_classes = my_classes_by_teacher.get(a.teacher_id, set())
                        by_class = bool(my_classes & folder_classes)
                        is_allowed = by_user or by_class
                else:
                    # Bài tập lẻ (không trong folder): kiểm tra assignee
                    if not getattr(a, "is_assigned_to_all", True):
                        if not any(u.id == current_user.id for u in getattr(a, "assignees", [])):
                            is_allowed = False
        
        if is_allowed:
            resp = AssignmentResponse.model_validate(a)
            resp.assignee_ids = [u.id for u in getattr(a, "assignees", [])]
            
            sub = sub_map.get(a.id)
            item = resp.model_dump()
            item["my_score"] = sub.score if sub else None
            item["my_submitted_at"] = str(sub.submitted_at) if sub else None
            item["folder_id"] = a.folder_id
            item["folder_name"] = a.folder.name if a.folder else None
            result.append(item)
            
    return result

@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """Lấy chi tiết một bài tập."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    return assignment

@router.get("/assignments/{assignment_id}/my-submission", response_model=SubmissionResponse)
def get_my_submission(assignment_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Học sinh lấy bài nộp của KÌ NÀY (nếu có)."""
    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).order_by(AssignmentSubmission.submitted_at.desc()).first()
    
    if not sub:
        raise HTTPException(status_code=404, detail="Chưa có bài nộp")
    return sub

@router.get("/assignments/teacher/dashboard/assignments")
def teacher_dashboard_assignments(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    """Lấy danh sách Bài tập đã tạo của Giáo viên (kèm assignee_ids)."""
    assignments = db.query(Assignment).filter(Assignment.teacher_id == current_user.id).order_by(Assignment.created_at.desc()).all()
    
    result = []
    for a in assignments:
        resp_dict = AssignmentResponse.model_validate(a).model_dump()
        resp_dict["assignee_ids"] = [u.id for u in getattr(a, "assignees", [])]
        result.append(resp_dict)
    return result

@router.get("/assignments/student/my-submissions")
def get_all_my_submissions(db: Session = Depends(get_db), current_user: User = Depends(require_role("student", "admin"))):
    """Học sinh lấy toàn bộ lịch sử bài nộp của mình."""
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == current_user.id
    ).order_by(AssignmentSubmission.submitted_at.desc()).all()
    
    unique_subs = {}
    for sub in submissions:
        if sub.assignment_id not in unique_subs:
            unique_subs[sub.assignment_id] = sub
        else:
            if (sub.score or 0) > (unique_subs[sub.assignment_id].score or 0):
                unique_subs[sub.assignment_id] = sub
                
    return [
        {
            "id": sub.id,
            "assignment_title": sub.assignment.title if sub.assignment else "Bài tập",
            "score": sub.score,
            "submitted_at": sub.submitted_at.isoformat()
        }
        for sub in unique_subs.values()
    ]

@router.get("/assignments/teacher/dashboard/submissions")
def teacher_dashboard_submissions(db: Session = Depends(get_db), current_user: User = Depends(require_role("teacher", "admin"))):
    """Dashboard: Toàn bộ bài nộp của học sinh (đã map tên) cho các khoá học của giáo viên."""
    submissions = db.query(AssignmentSubmission)\
        .join(Assignment, AssignmentSubmission.assignment_id == Assignment.id)\
        .filter(Assignment.teacher_id == current_user.id)\
        .order_by(AssignmentSubmission.submitted_at.desc())\
        .all()
    
    return [
        {
            "id": sub.id,
            "student_id": sub.student_id,
            "student_name": sub.student.full_name or f"Học sinh #{sub.student_id}",
            "student_avatar": sub.student.avatar_url,
            "course_title": sub.assignment.course.title if sub.assignment.course else None,
            "assignment_id": sub.assignment_id,
            "assignment_title": sub.assignment.title,
            "max_score": sub.assignment.max_score,
            "status": "graded" if sub.score is not None else "pending",
            "score": sub.score,
            "submitted_at": sub.submitted_at.isoformat(),
            "quiz_answers": sub.quiz_answers,
        }
        for sub in submissions
    ]

@router.post("/assignments/parse-upload")
async def parse_upload_to_quiz(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("teacher", "admin"))
):
    """Bóc tách Đề (Pdf/Image/Tex) thành JSON cấu trúc quiz bằng Gemini AI."""
    try:
        content = await file.read()
        mime_type = file.content_type
        filename = file.filename.lower()
        
        is_tex = filename.endswith(".tex") or mime_type == "text/x-tex"
        is_pdf = mime_type == "application/pdf"
        is_image = mime_type.startswith("image/")

        if not (is_tex or is_pdf or is_image):
            raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF, Hình ảnh hoặc LaTeX (.tex)")

        quiz_data = None
        
        # === LaTeX: Parse trực tiếp (KHÔNG CẦN AI) ===
        if is_tex:
            try:
                from app.services.latex_parser import parse_latex_directly
                print("[Parse Upload] Parse trực tiếp file LaTeX (không dùng AI)...")
                latex_text = content.decode("utf-8")
                quiz_data = parse_latex_directly(latex_text)
                print(f"[Parse Upload] ✅ Parse LaTeX trực tiếp thành công!")
            except Exception as latex_err:
                print(f"[Parse Upload] Parse LaTeX trực tiếp thất bại: {latex_err}")
                # Fallback sang Gemini AI nếu parse trực tiếp không được
                try:
                    from app.services.gemini_parser import parse_latex_with_gemini
                    print("[Parse Upload] Thử fallback sang Gemini AI...")
                    quiz_data = parse_latex_with_gemini(latex_text)
                except Exception as gemini_err:
                    print(f"[Parse Upload] Gemini cũng thất bại: {gemini_err}")
                    raise ValueError(f"Không thể xử lý file LaTeX: {latex_err}")
        
        # === PDF/Image: Dùng Gemini AI ===
        if not is_tex:
            try:
                from app.services.gemini_parser import parse_exam_with_gemini
                print("[Parse Upload] Đang dùng Gemini AI để phân tích PDF/Image...")
                quiz_data = parse_exam_with_gemini(content, mime_type)
            except Exception as gemini_err:
                print(f"[Parse Upload] Gemini thất bại: {gemini_err}")
                print("[Parse Upload] Chuyển sang Tesseract OCR (fallback)...")

        # === FALLBACK: Tesseract OCR (chỉ cho PDF/Image) ===
        if quiz_data is None and not is_tex:
            if is_pdf:
                quiz_data = extract_quiz_from_pdf_local(content)
            else:
                quiz_data = extract_quiz_from_image_local(content)
        
        if not quiz_data:
            raise ValueError("Không thể trích xuất dữ liệu từ file upload")

        # Validation
        has_sections = quiz_data.get("sections") and any(
            len(s.get("questions", [])) > 0 for s in quiz_data["sections"]
        )
        has_questions = bool(quiz_data.get("questions"))
        
        if not has_sections and not has_questions:
            raise ValueError("AI không nhận diện được cấu trúc đề thi")
            
        print("✅ Tạo dữ liệu Quiz JSON thành công!")
        return quiz_data

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error parsing upload: {e}")
        raise HTTPException(status_code=500, detail="Lỗi khi phân tích AI: " + str(e))

