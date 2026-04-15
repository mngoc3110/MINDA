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

    
    db.commit()
    db.refresh(assignment)
    return assignment


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
    """Học sinh nộp bài tập. UPSERT: làm lại ghi đè bài cũ, EXP chỉ cộng 1 lần khi ≥80%."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    
    # ── UPSERT: Kiểm tra xem đã có submission cũ chưa ──
    existing_submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).first()
    
    # Ghi nhận xem lần trước đã từng đạt ≥80% và được cộng EXP chưa
    already_earned_exp = False
    if existing_submission and existing_submission.score is not None:
        threshold = 0.8 * assignment.max_score
        already_earned_exp = existing_submission.score >= threshold
    
    # Sử dụng submission cũ hoặc tạo mới
    if existing_submission:
        submission = existing_submission
        # Cập nhật dữ liệu mới
        for key, value in data.model_dump().items():
            setattr(submission, key, value)
        submission.submitted_at = datetime.utcnow()
    else:
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
                            if ans is not None and str(ans).strip().lower() == str(q.get("correctAnswer")).strip().lower():
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
                            if ans is not None and str(ans).strip().lower() == str(q.get("correctAnswer")).strip().lower():
                                earned += 1.0

                if total_possible > 0:
                    submission.score = int(round((earned / total_possible) * assignment.max_score))

            submission.graded_at = datetime.utcnow()
        except Exception as e:
            print("Auto-grade error:", e)

    # ── EXP Logic: Quy đổi điểm thang 10 → EXP, chỉ 1 lần duy nhất ──
    if not already_earned_exp and submission.score is not None:
        # Quy về thang 10
        if assignment.max_score and assignment.max_score > 0:
            score_10 = round((submission.score / assignment.max_score) * 10)
        else:
            score_10 = 0
        
        if score_10 >= 8:
            exp_change = 20
        elif score_10 >= 5:
            exp_change = 10
        else:
            # Dưới trung bình: 4→-1, 3→-2, 2→-3, 1→-4, 0→-5
            exp_change = -(5 - score_10)
        
        new_exp = (current_user.exp_points or 0) + exp_change
        current_user.exp_points = max(new_exp, 0)  # Không cho EXP âm

    if not existing_submission:
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
    assignments = db.query(Assignment).filter(Assignment.course_id == None).order_by(Assignment.created_at.desc()).all()
    
    # Lấy tất cả submissions của user hiện tại
    my_subs = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == current_user.id
    ).all()
    sub_map = {s.assignment_id: s for s in my_subs}
    
    result = []
    for a in assignments:
        is_allowed = True
        if current_user.role.value == "student" and not getattr(a, "is_assigned_to_all", True):
            if not any(u.id == current_user.id for u in getattr(a, "assignees", [])):
                is_allowed = False
        
        if is_allowed:
            resp = AssignmentResponse.model_validate(a)
            resp.assignee_ids = [u.id for u in getattr(a, "assignees", [])]
            
            # Thêm info submission của student
            sub = sub_map.get(a.id)
            item = resp.model_dump()
            item["my_score"] = sub.score if sub else None
            item["my_submitted_at"] = str(sub.submitted_at) if sub else None
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
            "student_name": sub.student.full_name or f"Học sinh #{sub.student_id}",
            "course_title": sub.assignment.course.title if sub.assignment.course else None,
            "assignment_title": sub.assignment.title,
            "status": "graded" if sub.score is not None else "pending",
            "score": sub.score,
            "submitted_at": sub.submitted_at.isoformat()
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

