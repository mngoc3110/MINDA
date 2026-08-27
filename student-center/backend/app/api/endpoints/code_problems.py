"""
API Endpoints cho Phòng luyện Code (Online Judge Platform)
Hỗ trợ chạy kiểm thử trực tiếp (Sandbox Execution) và chấm bài qua test cases.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.code_problem import CodeProblem, CodeSubmission, CodingExam
from app.models.user import User
from app.core.security import get_current_user
from app.services.problem_importer import seed_code_problems, seed_coding_exams
from app.services.code_runner import run_code, judge_submission

router = APIRouter()

# --- Schemas ---
class SubmissionCreate(BaseModel):
    language: str # python, cpp, javascript
    code: str

class CustomTestRequest(BaseModel):
    language: str
    code: str
    custom_input: str

class StandaloneRunRequest(BaseModel):
    language: str
    code: str
    stdin_input: Optional[str] = ""

class ProblemCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    subject: str = "Lập trình cơ bản"
    chapter: str = "1. Nhập / Xuất"
    track: str = "thcs"
    difficulty: str = "easy"
    rating: int = 800
    description: str
    tags: Optional[List[str]] = []
    constraints: Optional[List[str]] = []
    examples: Optional[List[dict]] = []
    hints: Optional[List[str]] = []
    starter_code: Optional[dict] = {}
    test_cases: Optional[List[dict]] = []
    source: Optional[str] = "MINDA Problem Creator"

class ExamCreate(BaseModel):
    title: str
    slug: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: int = 120
    track: str = "thcs"
    difficulty: str = "medium"
    total_score: int = 100
    tags: Optional[List[str]] = []
    problem_ids: List[int]

@router.get("/problems")
def get_code_problems(
    track: Optional[str] = None,
    difficulty: Optional[str] = None,
    subject: Optional[str] = None,
    chapter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách bài tập lập trình."""
    # Ensure database is seeded with problemset
    if db.query(CodeProblem).count() < 10:
        seed_code_problems(db)

    query = db.query(CodeProblem)
    if track and track != "all":
        query = query.filter(CodeProblem.track == track)
    if difficulty and difficulty != "all":
        query = query.filter(CodeProblem.difficulty == difficulty)
    if subject and subject != "all":
        query = query.filter(CodeProblem.subject == subject)
    if chapter and chapter != "all":
        query = query.filter(CodeProblem.chapter == chapter)

    problems = query.order_by(CodeProblem.rating.asc()).all()

    return [
        {
            "id": p.id,
            "slug": p.slug,
            "title": p.title,
            "difficulty": p.difficulty,
            "rating": p.rating,
            "track": p.track,
            "subject": p.subject,
            "chapter": p.chapter,
            "tags": p.tags or [],
            "solved": p.solved_count,
            "source": p.source,
            "description": p.description[:140] + "..." if len(p.description) > 140 else p.description
        }
        for p in problems
    ]

@router.post("/problems/sync")
def sync_problems_manual(db: Session = Depends(get_db)):
    """Kích hoạt nạp / làm mới kho bài tập chuẩn."""
    total = seed_code_problems(db)
    return {"message": "Đã đồng bộ thành công kho bài tập chuẩn hóa", "total_added": total}

@router.get("/problems/{slug_or_id}")
def get_code_problem_detail(
    slug_or_id: str,
    db: Session = Depends(get_db)
):
    """Lấy chi tiết một bài tập lập trình."""
    if slug_or_id.isdigit():
        problem = db.query(CodeProblem).filter(CodeProblem.id == int(slug_or_id)).first()
    else:
        problem = db.query(CodeProblem).filter(CodeProblem.slug == slug_or_id).first()

    if not problem:
        # Try seeding if empty
        seed_code_problems(db)
        if slug_or_id.isdigit():
            problem = db.query(CodeProblem).filter(CodeProblem.id == int(slug_or_id)).first()
        else:
            problem = db.query(CodeProblem).filter(CodeProblem.slug == slug_or_id).first()

    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    return {
        "id": problem.id,
        "slug": problem.slug,
        "title": problem.title,
        "statement": problem.description,
        "difficulty": problem.difficulty,
        "rating": problem.rating,
        "track": problem.track,
        "subject": problem.subject,
        "chapter": problem.chapter,
        "tags": problem.tags or [],
        "constraints": problem.constraints or [],
        "examples": problem.examples or [],
        "hints": problem.hints or [],
        "starter_code": problem.starter_code or {},
        "source": problem.source
    }

@router.post("/problems")
def create_code_problem(
    data: ProblemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Giáo viên / Admin tạo bài tập lập trình mới."""
    import re, time
    slug_base = "custom-" + re.sub(r'[^a-z0-9]+', '-', data.title.lower()).strip('-')
    slug = data.slug or f"{slug_base}-{int(time.time())}"

    existing = db.query(CodeProblem).filter(CodeProblem.slug == slug).first()
    if existing:
        slug = f"{slug}-{int(time.time()) % 10000}"

    problem = CodeProblem(
        slug=slug,
        title=data.title,
        description=data.description,
        difficulty=data.difficulty,
        rating=data.rating,
        track=data.track or "basic",
        subject=data.subject or "Lập trình cơ bản",
        chapter=data.chapter or "1. Nhập / Xuất",
        tags=data.tags or ["Giáo viên MINDA", data.subject or "", data.chapter or ""],
        constraints=data.constraints or ["Thời gian <= 1.0s", "Bộ nhớ <= 256MB"],
        examples=data.examples or [{"input": "Sample", "output": "Sample", "explanation": "Ví dụ mẫu"}],
        hints=data.hints or [],
        starter_code=data.starter_code or {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code của bạn\n    return 0;\n}",
            "python": "# Viết code Python ở đây\n\n"
        },
        test_cases=data.test_cases or [],
        source=data.source or f"Giáo viên {current_user.full_name or 'MINDA'}"
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return {"message": "Đã tạo bài tập thành công", "id": problem.id, "slug": problem.slug, "title": problem.title}

# ─── CODING EXAMS / CONTESTS ENDPOINTS ────────────────────────────────────────

@router.get("/coding-exams")
def get_coding_exams(
    track: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách các đề thi / kỳ thi lập trình."""
    if db.query(CodingExam).count() == 0:
        seed_code_problems(db)

    query = db.query(CodingExam).filter(CodingExam.is_published == True)
    if track and track != "all":
        query = query.filter(CodingExam.track == track)
    exams = query.order_by(CodingExam.id.asc()).all()

    res = []
    for ex in exams:
        prob_count = len(ex.problem_ids) if ex.problem_ids else 0
        res.append({
            "id": ex.id,
            "slug": ex.slug,
            "title": ex.title,
            "description": ex.description,
            "duration_minutes": ex.duration_minutes,
            "track": ex.track,
            "difficulty": ex.difficulty,
            "total_score": ex.total_score,
            "tags": ex.tags or [],
            "problem_count": prob_count,
            "problem_ids": ex.problem_ids or [],
            "created_at": ex.created_at.isoformat() if ex.created_at else None
        })
    return res

@router.get("/coding-exams/{slug_or_id}")
def get_coding_exam_detail(slug_or_id: str, db: Session = Depends(get_db)):
    """Xem chi tiết đề thi và thông tin toàn bộ các bài toán bên trong."""
    if slug_or_id.isdigit():
        exam = db.query(CodingExam).filter(CodingExam.id == int(slug_or_id)).first()
    else:
        exam = db.query(CodingExam).filter(CodingExam.slug == slug_or_id).first()

    if not exam:
        seed_code_problems(db)
        if slug_or_id.isdigit():
            exam = db.query(CodingExam).filter(CodingExam.id == int(slug_or_id)).first()
        else:
            exam = db.query(CodingExam).filter(CodingExam.slug == slug_or_id).first()

    if not exam:
        raise HTTPException(status_code=404, detail="Không tìm thấy đề thi!")

    # Fetch problems in order
    problems = []
    if exam.problem_ids:
        raw_probs = db.query(CodeProblem).filter(CodeProblem.id.in_(exam.problem_ids)).all()
        prob_map = {p.id: p for p in raw_probs}
        for pid in exam.problem_ids:
            if pid in prob_map:
                p = prob_map[pid]
                problems.append({
                    "id": p.id,
                    "slug": p.slug,
                    "title": p.title,
                    "difficulty": p.difficulty,
                    "rating": p.rating,
                    "description": p.description,
                    "constraints": p.constraints or [],
                    "examples": p.examples or [],
                    "hints": p.hints or [],
                    "starter_code": p.starter_code or {},
                    "tags": p.tags or []
                })

    return {
        "id": exam.id,
        "slug": exam.slug,
        "title": exam.title,
        "description": exam.description,
        "duration_minutes": exam.duration_minutes,
        "track": exam.track,
        "difficulty": exam.difficulty,
        "total_score": exam.total_score,
        "tags": exam.tags or [],
        "problems": problems
    }

@router.post("/coding-exams")
def create_coding_exam(
    data: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo đề thi lập trình mới."""
    import re, time
    slug_base = "exam-" + re.sub(r'[^a-z0-9]+', '-', data.title.lower()).strip('-')
    slug = data.slug or f"{slug_base}-{int(time.time())}"

    existing = db.query(CodingExam).filter(CodingExam.slug == slug).first()
    if existing:
        slug = f"{slug}-{int(time.time()) % 10000}"

    exam = CodingExam(
        slug=slug,
        title=data.title,
        description=data.description,
        duration_minutes=data.duration_minutes,
        track=data.track,
        difficulty=data.difficulty,
        total_score=data.total_score,
        tags=data.tags or ["HSG Tin 8", "MINDA Contest"],
        problem_ids=data.problem_ids,
        creator_id=current_user.id
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return {"message": "Tạo đề thi thành công", "exam": {"id": exam.id, "slug": exam.slug, "title": exam.title}}

@router.get("/problems/{problem_id}/submissions")
def get_problem_submissions(
    problem_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Giáo viên xem danh sách bài làm & mã nguồn của học viên."""
    subs = db.query(CodeSubmission).filter(CodeSubmission.problem_id == problem_id).order_by(CodeSubmission.submitted_at.desc()).all()
    
    results = []
    for s in subs:
        student = db.query(User).filter(User.id == s.user_id).first()
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "student_name": student.full_name if student else f"Học sinh #{s.user_id}",
            "student_email": student.email if student else "",
            "student_avatar": student.avatar_url if student else None,
            "language": s.language,
            "code": s.code,
            "verdict": s.verdict,
            "execution_time": s.execution_time or "16ms",
            "memory_used": s.memory_used or "3.2MB",
            "submitted_at": s.submitted_at.strftime("%H:%M:%S %d/%m/%Y") if s.submitted_at else ""
        })
    return results

@router.post("/problems/{problem_id}/test-custom")
def test_custom_code(
    problem_id: int,
    data: CustomTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chạy kiểm thử code thực tế với Custom Input trong Sandbox."""
    problem = db.query(CodeProblem).filter(CodeProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    res = run_code(
        language=data.language,
        code=data.code,
        stdin_input=data.custom_input,
        timeout=3.0
    )

    now = datetime.utcnow()
    current_user.last_active_at = now
    current_user.current_activity = f"Đang giải bài: {problem.title}"
    current_user.current_url = f"/code/{problem.id}"
    current_user.activity_type = "coding"
    db.commit()

    # Format user friendly response
    return {
        "status": res["status"],
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "output": res["stdout"] if res["status"] == "success" else (res["stderr"] or "Không có đầu ra"),
        "error": res["stderr"] if res["status"] != "success" else None,
        "execution_time": res["execution_time"],
        "memory_used": res["memory_used"],
        "exit_code": res["exit_code"],
        "verdict": res["verdict"]
    }

@router.post("/code/run-test")
def run_standalone_code(
    data: StandaloneRunRequest,
    current_user: User = Depends(get_current_user)
):
    """Chạy độc lập mã nguồn trong sandbox với STDIN đầu vào."""
    res = run_code(
        language=data.language,
        code=data.code,
        stdin_input=data.stdin_input or "",
        timeout=3.0
    )
    return res

from app.api.endpoints.dashboard import get_student_rank

@router.post("/problems/{problem_id}/submit")
def submit_code(
    problem_id: int,
    sub_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nộp bài làm lập trình & Chấm điểm tự động qua tất cả test cases & Thưởng EXP chuẩn."""
    problem = db.query(CodeProblem).filter(CodeProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    code = sub_data.code.strip()
    if not code:
        return {"verdict": "CE", "error": "Mã nguồn trống. Vui lòng viết code trước khi nộp."}

    # 1. Execute Online Judge over all test cases
    judge_res = judge_submission(
        language=sub_data.language,
        code=sub_data.code,
        test_cases=problem.test_cases or [],
        timeout=3.0
    )

    # 2. Kiểm tra xem user này đã từng có bài nộp AC trước đây chưa
    has_prev_ac = db.query(CodeSubmission).filter(
        CodeSubmission.problem_id == problem.id,
        CodeSubmission.user_id == current_user.id,
        CodeSubmission.verdict == "AC"
    ).first() is not None

    # 3. Save to database
    submission = CodeSubmission(
        problem_id=problem.id,
        user_id=current_user.id,
        language=sub_data.language,
        code=sub_data.code,
        verdict=judge_res["verdict"],
        execution_time=judge_res.get("time", "12ms"),
        memory_used=judge_res.get("memory", "4.0MB"),
        error_message=judge_res.get("error")
    )
    db.add(submission)

    # 4. EXP & Gamification Logic
    exp_earned = 0
    is_first_ac = False
    old_exp = current_user.exp_points or 0

    if judge_res["verdict"] == "AC":
        if not has_prev_ac:
            is_first_ac = True
            problem.solved_count = (problem.solved_count or 0) + 1
            
            # Thưởng EXP theo độ khó bài toán
            diff = (problem.difficulty or "easy").lower()
            rating = problem.rating or 800
            if diff == "hard" or rating >= 1300:
                exp_earned = 40
            elif diff == "medium" or rating >= 950:
                exp_earned = 25
            else:
                exp_earned = 15

            current_user.exp_points = old_exp + exp_earned
            rank_data = get_student_rank(current_user, current_user.exp_points)
            current_user.current_rank = rank_data.get("rank_name", current_user.current_rank or "Sơ cấp")
    else:
        # Nếu chưa AC, kiểm tra xem đây có phải lần nộp đầu tiên của học sinh ở bài này không
        prev_subs_count = db.query(CodeSubmission).filter(
            CodeSubmission.problem_id == problem.id,
            CodeSubmission.user_id == current_user.id
        ).count()
        if prev_subs_count == 0:
            exp_earned = 2  # Thưởng động viên 2 EXP lần đầu thử sức
            current_user.exp_points = old_exp + exp_earned
            rank_data = get_student_rank(current_user, current_user.exp_points)
            current_user.current_rank = rank_data.get("rank_name", current_user.current_rank or "Sơ cấp")

    now = datetime.utcnow()
    current_user.last_active_at = now
    verdict_tag = "AC (100đ)" if judge_res["verdict"] == "AC" else judge_res["verdict"]
    current_user.current_activity = f"Vừa nộp bài: {problem.title} [{verdict_tag}]"
    current_user.current_url = f"/code/{problem.id}"
    current_user.activity_type = "coding"

    db.commit()

    judge_res["exp_reward"] = exp_earned
    judge_res["total_exp"] = current_user.exp_points or 0
    judge_res["current_rank"] = current_user.current_rank or "Sơ cấp"
    judge_res["is_first_ac"] = is_first_ac

    return judge_res

