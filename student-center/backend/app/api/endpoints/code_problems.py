"""
API Endpoints cho Phòng luyện Code (Online Judge Platform)
Hỗ trợ chạy kiểm thử trực tiếp (Sandbox Execution) và chấm bài qua test cases.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.models.code_problem import CodeProblem, CodeSubmission
from app.models.user import User
from app.core.security import get_current_user
from app.services.problem_importer import seed_code_problems
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
    subject: str = "Lập trình cơ bản"
    chapter: str = "1. Nhập / Xuất"
    difficulty: str = "easy"
    rating: int = 800
    description: str
    constraints: Optional[List[str]] = []
    examples: Optional[List[dict]] = []
    hints: Optional[List[str]] = []
    starter_code: Optional[dict] = {}
    test_cases: Optional[List[dict]] = []

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
    slug = f"{slug_base}-{int(time.time())}"

    problem = CodeProblem(
        slug=slug,
        title=data.title,
        description=data.description,
        difficulty=data.difficulty,
        rating=data.rating,
        track="basic",
        subject=data.subject,
        chapter=data.chapter,
        tags=["Giáo viên MINDA", data.subject, data.chapter],
        constraints=data.constraints or ["Thời gian <= 1.0s", "Bộ nhớ <= 256MB"],
        examples=data.examples or [{"input": "Sample", "output": "Sample", "explanation": "Ví dụ mẫu"}],
        hints=data.hints or [],
        starter_code=data.starter_code or {
            "cpp": "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code của bạn\n    return 0;\n}",
            "python": "# Viết code Python ở đây\n\n"
        },
        test_cases=data.test_cases or [],
        source=f"Giáo viên {current_user.full_name or 'MINDA'}"
    )
    db.add(problem)
    db.commit()
    db.refresh(problem)
    return {"message": "Đã tạo bài tập thành công", "id": problem.id, "slug": problem.slug}

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

@router.post("/problems/{problem_id}/submit")
def submit_code(
    problem_id: int,
    sub_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nộp bài làm lập trình & Chấm điểm tự động qua tất cả test cases."""
    problem = db.query(CodeProblem).filter(CodeProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    code = sub_data.code.strip()
    if not code:
        return {"verdict": "CE", "error": "Mã nguồn trống. Vui lòng viết code trước khi nộp."}

    # Execute Online Judge over all test cases
    judge_res = judge_submission(
        language=sub_data.language,
        code=sub_data.code,
        test_cases=problem.test_cases or [],
        timeout=3.0
    )

    # Save to database
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

    if judge_res["verdict"] == "AC":
        problem.solved_count = (problem.solved_count or 0) + 1

    db.commit()

    return judge_res
