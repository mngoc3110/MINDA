import os
import json
import base64
import requests
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from google.genai import types

from app.db.database import get_db
from app.models.user import User
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.course import AssignmentCreate, AssignmentResponse, SubmissionCreate, SubmissionResponse, GradeSubmission
from app.core.security import get_current_user, get_current_user_optional, require_role
from app.services.ocr_service import extract_quiz_from_pdf_local, extract_quiz_from_image_local
from app.api.endpoints.ai_solver import _get_client, _call_gemini, SYSTEM_INSTRUCTION

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


@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse], response_model_exclude={"quiz_data"})
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
    
    is_standard = assignment.exam_format in ("standard", "tin_thptqg")
    is_tin = assignment.exam_format == "tin_thptqg"
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
                        if ok: earned += float(q.get("score", 0.25))
                
                elif stype == "true_false":
                    if not is_standard: total_possible += 1.0
                    if ans and isinstance(ans, dict) and any(str(v).strip() for v in ans.values()):
                        n = count_tf_correct(ans, q.get("items", []))
                        pts = 0.0
                        if is_standard:
                            if n == 4: pts = 1.0
                            elif n == 3: pts = 0.5
                            elif n == 2: pts = 0.25
                            
                            if not hasattr(sub, '_tf_pts'): sub._tf_pts = []
                            sub._tf_pts.append(pts)
                        else:
                            q_score = float(q.get("score", 0.25))
                            if n == 4: pts = q_score
                            elif n == 3: pts = q_score * 0.5
                            elif n == 2: pts = q_score * 0.25
                            elif n == 1: pts = q_score * 0.1
                            earned += pts
                
                elif stype == "short_answer":
                    student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                    correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                    if is_standard:
                        if student_sa and student_sa == correct_sa:
                            earned += 0.25 if is_tin else 0.5
                    else:
                        total_possible += 1.0
                        if student_sa and student_sa == correct_sa: earned += float(q.get("score", 0.25))
        
        if is_standard:
            tf_pts = getattr(sub, '_tf_pts', [])
            if is_tin and len(tf_pts) > 4:
                earned += sum(tf_pts[:2]) # Phạt: chỉ tính 2 câu chung nếu làm cả 2 phần lựa chọn
            else:
                earned += sum(tf_pts)
            sub.score = round(earned, 2)
        else:
            # Đề ôn tập: điểm tùy chỉnh trên mỗi câu (hoặc mặc định 0.25)
            sub.score = round(earned, 2)
        
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
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Nộp bài tập (hỗ trợ cả học sinh, giáo viên, admin và khách tự luyện)."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    
    user_id = current_user.id if current_user else None
    already_earned_exp = False
    
    if user_id:
        existing_count = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.student_id == user_id
        ).count()
        already_earned_exp = existing_count > 0
        
        dumped = data.model_dump(exclude={"candidate_info"})
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=user_id,
            **dumped,
        )
    else:
        dumped = data.model_dump(exclude={"candidate_info"})
        guest_user = db.query(User).filter(User.email == "guest_candidate@minda.io.vn").first()
        guest_student_id = guest_user.id if guest_user else 75
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=guest_student_id,
            **dumped,
        )
    
    # Auto-grader for quiz
    if assignment.assignment_type == "quiz" and assignment.quiz_data and data.quiz_answers:
        is_standard = getattr(assignment, "exam_format", "practice") in ("standard", "tin_thptqg")
        is_tin = getattr(assignment, "exam_format", "practice") == "tin_thptqg"
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
                # Short answer:  môn Toán=0.5đ, môn Tin=0.25đ
                tf_earned = []
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
                            if ans and isinstance(ans, dict) and any(str(v).strip() for v in ans.values()):
                                n = count_tf_correct(ans, q.get("items", []))
                                pts = 0.0
                                if n == 4:   pts = 1.0
                                elif n == 3: pts = 0.5
                                elif n == 2: pts = 0.25
                                tf_earned.append(pts)

                        elif stype == "short_answer":
                            # Normalize: comma→period, strip spaces (VN: "3,68" == "3.68")
                            student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                            correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                            if student_sa and student_sa == correct_sa:
                                earned += 0.25 if is_tin else 0.5

                # Xử lý phần tự chọn (True/False) cho môn Tin
                if is_tin and len(tf_earned) > 4:
                    earned += sum(tf_earned[:2]) # Chỉ tính điểm 2 câu chung nếu HS làm cả 2 phần tự chọn
                else:
                    earned += sum(tf_earned)

                submission.score = round(earned, 2)  # Giữ dạng thập phân (8.75)

            else:
                # ── Đề Ôn Tập (thang điểm tùy chỉnh hoặc mặc định 0.25) ──────────
                total_possible = 0.0
                for s_idx, section in enumerate(assignment.quiz_data.get("sections", [])):
                    for q in section.get("questions", []):
                        raw_id = q.get("id") or ""
                        qid = f"s{s_idx}_{raw_id}" if raw_id else None
                        ans = data.quiz_answers.get(qid) if qid else None
                        stype = section.get("type")
                        
                        q_score = float(q.get("score", 0.25))

                        if stype == "mcq":
                            total_possible += 1.0
                            if ans is not None and str(ans).strip() == str(q.get("correctAnswer")).strip():
                                earned += q_score

                        elif stype == "true_false":
                            total_possible += 1.0
                            if ans and isinstance(ans, dict):
                                n = count_tf_correct(ans, q.get("items", []))
                                if n == 4:   earned += q_score
                                elif n == 3: earned += q_score * 0.5
                                elif n == 2: earned += q_score * 0.25
                                elif n == 1: earned += q_score * 0.1

                        elif stype == "short_answer":
                            total_possible += 1.0
                            student_sa = str(ans).strip().lower().replace(",", ".") if ans is not None else ""
                            correct_sa = str(q.get("correctAnswer")).strip().lower().replace(",", ".")
                            if student_sa and student_sa == correct_sa:
                                earned += q_score

                # Tính điểm dựa trên tổng các câu 
                submission.score = round(earned, 2)

            submission.graded_at = datetime.utcnow()
        except Exception as e:
            print("Auto-grade error:", e)

    if not current_user:
        # Khách nộp bài: Lưu vào DB dưới tài khoản guest để giáo viên theo dõi và chấm bài
        try:
            db.add(submission)
            db.commit()
            db.refresh(submission)
        except Exception as e:
            print("Lỗi lưu bài nộp của khách:", e)
            db.rollback()

        if assignment_id in [234, 235] or getattr(assignment, "exam_format", "") == "practice":
            try:
                send_candidate_result_email(
                    assignment=assignment,
                    submission=submission,
                    candidate_info=data.candidate_info,
                    quiz_answers=data.quiz_answers,
                )
            except Exception as e:
                print("Lỗi gửi email cho khách:", e)

        return SubmissionResponse(
            id=submission.id or 0,
            assignment_id=assignment_id,
            student_id=submission.student_id or 0,
            content=data.content or "Khách tự luyện",
            file_url=data.file_url,
            quiz_answers=data.quiz_answers,
            score=submission.score,
            feedback="Tự động chấm điểm bài tập",
            submitted_at=submission.submitted_at or datetime.utcnow(),
            graded_at=submission.graded_at or datetime.utcnow()
        )

    # ── EXP Logic chỉ áp dụng cho học sinh ──
    is_student = getattr(current_user.role, "value", str(current_user.role)) == "student"
    if is_student and not already_earned_exp and submission.score is not None:
        # Quy về thang 10 (giữ thập phân)
        if assignment.max_score and float(assignment.max_score) > 0:
            score_10 = (float(submission.score) / float(assignment.max_score)) * 10
        else:
            score_10 = 0
        
        if score_10 >= 8:
            exp_change = 50
        elif score_10 >= 5:
            exp_change = 20
        else:
            exp_change = 10
        
        new_exp = (current_user.exp_points or 0) + exp_change
        current_user.exp_points = max(new_exp, 0)  # Không cho EXP âm

        # Cộng EXP cho giáo viên khi có HS nộp bài (lần đầu)
        teacher = db.query(User).filter(User.id == assignment.teacher_id).first()
        if teacher:
            teacher.exp_points = (teacher.exp_points or 0) + 5

    now = datetime.utcnow()
    current_user.last_active_at = now
    score_tag = f" ({submission.score}đ)" if submission.score is not None else ""
    current_user.current_activity = f"Vừa làm bài tập: {assignment.title}{score_tag}"
    current_user.current_url = f"/assignments"
    current_user.activity_type = "assignment"

    db.add(submission)
    db.commit()
    db.refresh(submission)

    if assignment_id in [234, 235] or getattr(assignment, "exam_format", "") == "practice":
        try:
            cand_dict = data.candidate_info or {"fullName": current_user.full_name, "phone": current_user.phone or "Tài khoản học sinh"}
            send_candidate_result_email(
                assignment=assignment,
                submission=submission,
                candidate_info=cand_dict,
                quiz_answers=data.quiz_answers,
            )
        except Exception as e:
            print("Lỗi gửi email học sinh:", e)

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
@router.put("/assignments/submissions/{submission_id}/grade", response_model=SubmissionResponse)
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

class AIGradeResponse(BaseModel):
    score: float
    feedback: str

@router.post("/submissions/{submission_id}/ai-grade", response_model=AIGradeResponse)
@router.post("/assignments/submissions/{submission_id}/ai-grade", response_model=AIGradeResponse)
def ai_grade_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "admin")),
):
    """Giáo viên gọi AI để chấm điểm tự luận/file_upload."""
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Bài nộp không tồn tại")
    
    assignment = submission.assignment
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    prompt = f"Bạn là giáo viên chấm điểm bài tập. Dưới đây là thông tin bài tập:\n- Tiêu đề: {assignment.title}\n- Yêu cầu: {assignment.description}\n- Điểm tối đa: {assignment.max_score}\n\n"
    prompt += f"Dưới đây là phần bài làm của học sinh:\n"
    
    if submission.content:
        prompt += f"- Trả lời văn bản: {submission.content}\n"
    if submission.file_url:
        prompt += f"- Hình ảnh đính kèm: (hãy xem ảnh học sinh nộp)\n"

    prompt += "\nNhiệm vụ của bạn: Hãy phân tích bài làm, chỉ ra chỗ đúng/sai (nếu có), cho điểm trên thang điểm tối đa, và viết nhận xét chi tiết. PHẢI TRẢ VỀ DỮ LIỆU ĐÚNG CHUẨN JSON VỚI ĐỊNH DẠNG SAU (tuyệt đối không thêm text bên ngoài JSON):\n"
    prompt += '{\n  "score": <số_điểm>,\n  "feedback": "<nhận xét của bạn>"\n}'

    contents = []
    
    # Tải ảnh nếu có
    if submission.file_url and (submission.file_url.lower().endswith(".jpg") or submission.file_url.lower().endswith(".jpeg") or submission.file_url.lower().endswith(".png")):
        try:
            image_bytes = requests.get(submission.file_url).content
            mime_type = "image/jpeg" if "jpg" in submission.file_url.lower() or "jpeg" in submission.file_url.lower() else "image/png"
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            contents.append(image_part)
        except Exception as e:
            print(f"Lỗi tải ảnh để AI chấm: {e}")

    contents.append(prompt)

    try:
        client = _get_client()
        reply_json = _call_gemini(client, contents, system_instruction=SYSTEM_INSTRUCTION)
        # Parse JSON
        start_idx = reply_json.find('{')
        end_idx = reply_json.rfind('}')
        if start_idx != -1 and end_idx != -1:
            reply_json = reply_json[start_idx:end_idx+1]
        
        parsed = json.loads(reply_json)
        return AIGradeResponse(score=float(parsed.get("score", 0)), feedback=parsed.get("feedback", "AI đã chấm điểm thành công."))
    except Exception as e:
        print(f"AI Grade Error: {e}")
        raise HTTPException(status_code=500, detail="Không thể kết nối API AI hoặc AI trả về sai định dạng. Vui lòng thử lại.")

@router.get("/assignments/practice")
def get_practice_assignments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lấy danh sách các Bài tập luyện thi tự do (không thuộc khóa học nào)."""
    from app.models.assignment_folder import AssignmentFolder
    from app.models.user import TeacherStudentLink
    from sqlalchemy.orm import joinedload
    
    assignments = db.query(Assignment).filter(Assignment.course_id == None)\
        .options(joinedload(Assignment.folder), joinedload(Assignment.assignees))\
        .order_by(Assignment.created_at.desc()).all()
    
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
            item = resp.model_dump(exclude={"quiz_data"})
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
    """Lấy danh sách Bài tập đã tạo của Giáo viên (kèm assignee_ids) không thuộc khoá học nào."""
    assignments = db.query(Assignment).filter(
        Assignment.teacher_id == current_user.id
    ).order_by(Assignment.created_at.desc()).all()
    
    result = []
    for a in assignments:
        resp_dict = AssignmentResponse.model_validate(a).model_dump(exclude={"quiz_data"})
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
            "student_id": sub.student_id,
            "student_name": sub.student.full_name or f"Học sinh #{sub.student_id}",
            "student_avatar": sub.student.avatar_url,
            "assignment_id": sub.assignment_id,
            "assignment_title": sub.assignment.title if sub.assignment else "Bài tập",
            "max_score": sub.assignment.max_score if sub.assignment else 10,
            "score": sub.score,
            "feedback": sub.feedback,
            "content": sub.content,
            "file_url": sub.file_url,
            "submitted_at": sub.submitted_at.isoformat(),
            "graded_at": sub.graded_at.isoformat() if sub.graded_at else None
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
    
    res = []
    import re
    for sub in submissions:
        student_name = (sub.student.full_name if sub.student else None) or f"Học sinh #{sub.student_id}"
        if sub.content and "Thí sinh mới:" in sub.content:
            m = re.search(r"Thí sinh mới:\s*([^|\]]+)", sub.content)
            p = re.search(r"SĐT:\s*([^|\]]+)", sub.content)
            if m:
                cand_name = m.group(1).strip()
                phone_str = f" ({p.group(1).strip()})" if p else ""
                student_name = f"👤 {cand_name}{phone_str} [Khách]"

        res.append({
            "id": sub.id,
            "student_id": sub.student_id,
            "student_name": student_name,
            "student_avatar": sub.student.avatar_url if sub.student else None,
            "course_title": sub.assignment.course.title if (sub.assignment and sub.assignment.course) else None,
            "assignment_id": sub.assignment_id,
            "assignment_title": sub.assignment.title if sub.assignment else "Bài tập",
            "max_score": sub.assignment.max_score if sub.assignment else 10.0,
            "status": "graded" if sub.score is not None else "pending",
            "score": sub.score,
            "feedback": sub.feedback,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "quiz_answers": sub.quiz_answers,
            "content": sub.content,
            "file_url": sub.file_url,
        })
    return res

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


@router.post("/assignments/upload-submission-image")
async def upload_submission_image(
    file: UploadFile = File(...)
):
    """Upload ảnh bài làm tự luận của học sinh, lưu trữ cục bộ vào static/submissions/"""
    import uuid
    import shutil
    
    valid_exts = ["jpg", "jpeg", "png", "webp", "heic", "pdf", "bmp", "gif"]
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail="Định dạng không hỗ trợ. Vui lòng chọn ảnh JPG, PNG, WEBP hoặc PDF.")
    
    unique_id = str(uuid.uuid4())[:12]
    save_dir = os.path.join("static", "submissions")
    os.makedirs(save_dir, exist_ok=True)
    
    safe_name = f"{unique_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(save_dir, safe_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = f"/static/submissions/{safe_name}"
    return {
        "file_url": file_url,
        "url": file_url,
        "filename": file.filename
    }


def send_candidate_result_email(
    assignment,
    submission=None,
    candidate_info=None,
    agent_result=None,
    quiz_answers=None,
    recipient="darber3110@gmail.com",
):
    """Gửi email thông báo kết quả bài thi tới giáo viên."""
    import os
    import smtplib
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText
    from datetime import datetime
    import logging

    cand = candidate_info or {}
    full_name = cand.get("fullName") or cand.get("name") or "Thí sinh Tự do"
    phone = cand.get("phone") or "Chưa cung cấp"
    school_class = cand.get("schoolClass") or cand.get("grade") or "Chưa cung cấp"

    obj_score = float(submission.score or 0.0) if submission else 0.0
    essay_score = float(agent_result.get("total_essay_score", 0.0)) if agent_result else 0.0
    total_score = float(agent_result.get("updated_total_score", (obj_score + essay_score))) if agent_result else obj_score
    total_score = round(min(10.0, total_score), 2)

    answers_to_scan = quiz_answers or (submission.quiz_answers if submission else {}) or {}
    essay_images = []
    for k, v in answers_to_scan.items():
        if isinstance(v, dict) and "images" in v and isinstance(v["images"], list):
            essay_images.extend(v["images"])

    # Xây dựng danh sách nhận xét từng câu tự luận nếu có
    html_items = []
    if agent_result and agent_result.get("graded_items"):
        for item in agent_result["graded_items"]:
            q_label = item.get("question_label", "Câu tự luận")
            score_item = item.get("score", 0)
            max_s = item.get("max_score", 1.0)
            feed = item.get("feedback", "")
            steps = item.get("steps_breakdown", [])
            step_html = "".join([f"<li style='margin-bottom: 4px; font-size: 13px;'>{st}</li>" for st in steps])
            html_items.append(f"""
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                <div style="font-weight: bold; margin-bottom: 6px; color: #1e293b;">
                    <span>{q_label}</span> • <span style="color: #4f46e5;">{score_item}/{max_s} điểm</span>
                </div>
                <p style="margin: 4px 0 8px 0; font-size: 13px; color: #475569;"><strong>Nhận xét AI:</strong> {feed}</p>
                {f'<ul style="margin: 0; padding-left: 20px; color: #334155;">{step_html}</ul>' if steps else ''}
            </div>
            """)

    images_html = ""
    if essay_images:
        img_links = []
        for img in essay_images:
            link = f"https://minda.io.vn{img}" if img.startswith("/") else img
            img_links.append(f"<li style='margin-bottom: 6px;'><a href='{link}' target='_blank' style='color: #4f46e5; font-weight: bold;'>{link}</a></li>")
        images_html = f"""
        <div style="margin-top: 16px;">
            <h4 style="margin-bottom: 8px; color: #1e293b;">📸 Ảnh bài làm tự luận ({len(essay_images)} ảnh):</h4>
            <ul style="padding-left: 20px;">{''.join(img_links)}</ul>
        </div>
        """

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e0e7ff; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #4f46e5; margin: 0;">MINDA • THÔNG BÁO THÍ SINH MỚI NỘP BÀI TEST</h2>
            <p style="color: #64748b; margin-top: 6px; font-weight: bold;">{assignment.title}</p>
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #6366f1;">
            <h4 style="margin: 0 0 10px 0; color: #1e293b;">📋 Thông tin thí sinh:</h4>
            <p style="margin: 4px 0;"><strong>Họ và tên:</strong> {full_name}</p>
            <p style="margin: 4px 0;"><strong>Số điện thoại / Zalo phụ huynh:</strong> <a href="tel:{phone}" style="color: #4f46e5; font-weight: bold;">{phone}</a></p>
            <p style="margin: 4px 0;"><strong>Trường / Lớp:</strong> {school_class}</p>
            <p style="margin: 4px 0;"><strong>Thời gian nộp:</strong> {datetime.now().strftime('%H:%M:%S ngày %d/%m/%Y')}</p>
        </div>

        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
            <h4 style="margin: 0 0 10px 0; color: #065f46;">🎯 Kết quả tổng thể:</h4>
            <p style="margin: 4px 0; font-size: 20px;"><strong>Tổng điểm:</strong> <span style="color: #059669; font-weight: bold; font-size: 24px;">{total_score} / 10.0 đ</span></p>
            <p style="margin: 4px 0; font-size: 13px; color: #047857;">• Điểm trắc nghiệm & điền khuyết: <strong>{obj_score} đ</strong></p>
            <p style="margin: 4px 0; font-size: 13px; color: #047857;">• Điểm tự luận AI Agent chấm: <strong>{essay_score} đ</strong></p>
        </div>

        {f'<div style="margin-top: 16px;"><h4 style="color: #1e293b; margin-bottom: 10px;">📝 Chi tiết AI chấm tự luận:</h4>{"".join(html_items)}</div>' if html_items else ''}

        {images_html}

        <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            Hệ thống Tự Động MINDA EduCenter • <a href="https://minda.io.vn" style="color: #6366f1;">minda.io.vn</a>
        </div>
    </div>
    """

    try:
        from app.core.email import conf
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[MINDA TEST] Thí sinh: {full_name} ({phone}) đã nộp {assignment.title} - Điểm: {total_score}/10"
        msg["From"] = f"{conf.MAIL_FROM_NAME} <{conf.MAIL_FROM}>"
        msg["To"] = recipient
        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(conf.MAIL_SERVER, conf.MAIL_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(conf.MAIL_USERNAME, conf.MAIL_PASSWORD)
        server.sendmail(conf.MAIL_FROM, [recipient], msg.as_string())
        server.quit()
        logging.info(f"Đã gửi email thông báo thí sinh {full_name} tới {recipient}")
    except Exception as e:
        logging.error(f"Gửi email thông báo tới {recipient} thất bại: {e}")


class GradeEssayRequest(BaseModel):
    submission_id: Optional[int] = None
    quiz_answers: Optional[Dict[str, Any]] = None
    candidate_info: Optional[Dict[str, Any]] = None


@router.post("/assignments/{assignment_id}/grade-essay-ai")
def grade_essay_ai_endpoint(
    assignment_id: int,
    payload: GradeEssayRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Kích hoạt AI Agent chấm điểm bài làm tự luận từ ảnh viết tay học sinh đã nộp,
    đối chiếu từng bước với biểu điểm và đáp án chính thức.
    """
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    
    quiz_answers = payload.quiz_answers or {}
    submission = None
    if payload.submission_id and payload.submission_id > 0:
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.id == payload.submission_id
        ).first()
        if submission and not quiz_answers and submission.quiz_answers:
            quiz_answers = submission.quiz_answers

    from app.services.essay_grader_agent import grade_essay_submission_with_agent
    
    agent_result = grade_essay_submission_with_agent(
        assignment_data=assignment.quiz_data or {},
        quiz_answers=quiz_answers,
        base_dir=os.getcwd()
    )
    
    # Nếu có submission trong DB, cập nhật điểm tổng & feedback
    if submission and agent_result.get("status") == "success":
        essay_score = float(agent_result.get("total_essay_score", 0.0))
        submission.feedback = json.dumps(agent_result, ensure_ascii=False)
        
        # Cập nhật tổng điểm: Điểm trắc nghiệm cơ bản + essay_score
        base_obj_score = float(submission.score or 0.0)
        max_score = float(assignment.max_score or 10.0)
        submission.score = round(min(max_score, base_obj_score + essay_score), 2)
        submission.graded_at = datetime.utcnow()
        db.commit()
        db.refresh(submission)
        agent_result["updated_total_score"] = submission.score
        agent_result["submission_id"] = submission.id

    if assignment_id in [234, 235] or getattr(assignment, "exam_format", "") == "practice":
        try:
            send_candidate_result_email(
                assignment=assignment,
                submission=submission,
                candidate_info=payload.candidate_info,
                agent_result=agent_result,
                quiz_answers=quiz_answers,
            )
        except Exception as e:
            print("Lỗi gửi email kết quả tự luận:", e)

    return agent_result


