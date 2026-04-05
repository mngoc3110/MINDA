import os
import json
import base64
import google.generativeai as genai
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
    # Xử lý course_id optional có thể truyền trong data.model_dump()
    assignment = Assignment(**data.model_dump(), teacher_id=current_user.id)
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/courses/{course_id}/assignments", response_model=List[AssignmentResponse])
def list_assignments(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Danh sách bài tập của khoá học."""
    return db.query(Assignment).filter(Assignment.course_id == course_id).all()


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
    for key, value in update_data.items():
        setattr(assignment, key, value)
    
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
    """Học sinh nộp bài tập."""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")
    
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

@router.get("/assignments/practice", response_model=List[AssignmentResponse])
def get_practice_assignments(db: Session = Depends(get_db)):
    """Lấy danh sách các Bài tập luyện thi tự do (không thuộc khóa học nào)."""
    # course_id is None indicates standalone assignment
    assignments = db.query(Assignment).filter(Assignment.course_id == None).order_by(Assignment.created_at.desc()).all()
    return assignments

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
    """Lấy danh sách Bài tập đã tạo của Giáo viên."""
    assignments = db.query(Assignment).filter(Assignment.teacher_id == current_user.id).order_by(Assignment.created_at.desc()).all()
    return assignments

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
    """Sử dụng Gemini bóc tách Đề (Pdf/Image) thành JSON cấu trúc THPT 2025."""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="Thiếu API Key Gemini trên server.")
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        content = await file.read()
        mime_type = file.content_type
        
        prompt = """
        Phân tích đề bài tập/kiểm tra trong ảnh này theo 3 phần cấu trúc THPT Quốc gia 2025:
        1. Trắc nghiệm MCQ (A,B,C,D - 1 đáp án đúng). correctAnswer là index (0-3).
        2. Trắc nghiệm Đúng/Sai (Mỗi câu có 4 ý a,b,c,d). items có label (a,b,c,d), text (nội dung ý), và isTrue (tự phân tích hoặc đoán đúng/sai).
        3. Trả lời ngắn. correctAnswer là chuỗi kết quả (chỉ số học/đáp án ngắn).
        
        QUY TẮC HIỂN THỊ TOÁN HỌC: QUAN TRỌNG: Mọi công thức Toán học, Hóa học, Vật lý (như mũ, phân số, giới hạn, tích phân) PHẢI ĐƯỢC GIỮ NGUYÊN hoặc CHUYỂN ĐỔI SANG MÃ LaTeX. KHÔNG ĐƯỢC việt hóa thành chữ.
          - Đối với công thức nằm trên một dòng (inline), bọc mã LaTeX trong `$ $` (ví dụ: `$\lim_{x \to 0} f(x)$`, `$x^2 + y^2 = 4$`).
          - Đối với công thức cần xuống dòng canh giữa (block), bọc trong `$$ $$` (ví dụ: `$$ \int_0^1 x^2 dx $$`).

        Hãy generate ra ĐÚNG ĐỊNH DẠNG JSON sau, không bọc markdown ```json, không thêm chữ nào khác. Tự giải và điền correctAnswer/isTrue. 
        QUAN TRỌNG: Hãy thêm trường "explanation" chứa lời giải thích rõ ràng, ngắn gọn cho mỗi CÂU HỎI hoặc CHI TIẾT (Với dạng ý thì thêm explanation vào trong mỗi item). Lời giải thích cũng phải tuân thủ chuẩn LaTeX.
        {
          "sections": [
            {
              "type": "mcq",
              "instruction": "Phần I: Trắc nghiệm khách quan",
              "questions": [
                { "id": "q1", "text": "Câu 1:...", "options": ["A. x=1", "B. x=2", "C. x=3", "D. x=4"], "correctAnswer": 0, "explanation": "Do hàm số bậc nhất..." }
              ]
            },
            {
              "type": "true_false",
              "instruction": "Phần II: Câu trắc nghiệm đúng sai",
              "questions": [
                { "id": "q2", "text": "Câu 1: Cho hàm số...", "items": [
                   { "label": "a", "text": "Ý a...", "isTrue": true, "explanation": "Hàm đồng biến trên khoảng..." },
                   { "label": "b", "text": "Ý b...", "isTrue": false, "explanation": "Đạo hàm âm nên nghịch biến..." }
                ]}
              ]
            },
            {
              "type": "short_answer",
              "instruction": "Phần III: Câu trắc nghiệm trả lời ngắn",
              "questions": [
                { "id": "q3", "text": "Câu 1: Giải phương trình...", "correctAnswer": "5" }
              ]
            }
          ]
        }
        Nếu là môn nguyên MCQ (như Tin học), thì chỉ tạo 1 section mcq. Chỉ trả về chuỗi parse dạng JSON, tuyệt đối không chèn giải thích.
        """
        
        response = model.generate_content([
            {"mime_type": mime_type, "data": content},
            prompt
        ], generation_config={"response_mime_type": "application/json"})
        
        quiz_data = json.loads(response.text)
        return quiz_data
        
    except Exception as e:
        print(f"Error parsing upload: {e}")
        raise HTTPException(status_code=500, detail="Lỗi khi phân tích AI: " + str(e))
