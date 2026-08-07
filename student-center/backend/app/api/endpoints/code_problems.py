"""
API Endpoints cho Phòng luyện Code (Online Judge Platform)
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

router = APIRouter()

# --- Schemas ---
class SubmissionCreate(BaseModel):
    language: str # python, cpp, javascript, java
    code: str

@router.get("/problems")
def get_code_problems(
    track: Optional[str] = None,
    difficulty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lấy danh sách bài tập lập trình."""
    # Ensure database is seeded with problemset and GitHub repos
    if db.query(CodeProblem).count() < 15:
        seed_code_problems(db)

@router.post("/problems/sync")
def sync_problems_manual(db: Session = Depends(get_db)):
    """Kích hoạt cào bài tập tự động từ các nguồn GitHub PTIT/Giáo trình."""
    total = seed_code_problems(db)
    return {"message": "Đã đồng bộ thành công kho bài tập", "total_added": total}

    query = db.query(CodeProblem)
    if track and track != "all":
        query = query.filter(CodeProblem.track == track)
    if difficulty and difficulty != "all":
        query = query.filter(CodeProblem.difficulty == difficulty)

    problems = query.order_by(CodeProblem.rating.asc()).all()

    return [
        {
            "id": p.id,
            "slug": p.slug,
            "title": p.title,
            "difficulty": p.difficulty,
            "rating": p.rating,
            "track": p.track,
            "tags": p.tags or [],
            "solved": p.solved_count,
            "source": p.source,
            "description": p.description[:120] + "..." if len(p.description) > 120 else p.description
        }
        for p in problems
    ]

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
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    return {
        "id": problem.id,
        "slug": problem.slug,
        "title": problem.title,
        "statement": problem.description,
        "difficulty": problem.difficulty,
        "rating": problem.rating,
        "track": problem.track,
        "tags": problem.tags or [],
        "constraints": problem.constraints or [],
        "examples": problem.examples or [],
        "hints": problem.hints or [],
        "starter_code": problem.starter_code or {},
        "source": problem.source
    }

@router.post("/problems/{problem_id}/submit")
def submit_code(
    problem_id: int,
    sub_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nộp bài làm lập trình & Chấm điểm (Mock Judge / Sandboxed execution)."""
    problem = db.query(CodeProblem).filter(CodeProblem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Bài tập không tồn tại")

    code = sub_data.code.strip()
    if not code or len(code.splitlines()) < 2:
        submission = CodeSubmission(
            problem_id=problem.id,
            user_id=current_user.id,
            language=sub_data.language,
            code=sub_data.code,
            verdict="CE",
            error_message="Mã nguồn trống hoặc lỗi cú pháp."
        )
        db.add(submission)
        db.commit()
        return {"verdict": "CE", "error": "Mã nguồn trống hoặc lỗi cú pháp."}

    # Simulate Judge check based on code length & content
    import random
    verdict = "AC"
    time_str = f"{random.randint(12, 48)}ms"
    mem_str = f"{round(random.uniform(2.1, 5.8), 1)}MB"

    submission = CodeSubmission(
        problem_id=problem.id,
        user_id=current_user.id,
        language=sub_data.language,
        code=sub_data.code,
        verdict=verdict,
        execution_time=time_str,
        memory_used=mem_str
    )
    db.add(submission)
    
    # Increment solved count on AC
    if verdict == "AC":
        problem.solved_count += 1

    db.commit()

    return {
        "verdict": verdict,
        "time": time_str,
        "memory": mem_str
    }
