from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.db.database import get_db
from app.models.user import User
from app.models.revision import RevisionNotebook, RevisionDocument, RevisionQuiz, RevisionAttempt
from app.core.security import get_current_user
from app.services.revision_ai import parse_document_content, generate_smart_quiz_from_docs, chat_with_notebook_documents
import datetime

router = APIRouter(prefix="/revision", tags=["AI Revision Center"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class NotebookCreate(BaseModel):
    title: str
    subject: str = "Toán học"
    grade: str = "Lớp 12"
    description: Optional[str] = None

class GenerateQuizRequest(BaseModel):
    title: Optional[str] = None
    quiz_type: str = "mcq_4"  # mcq_4, true_false, flashcard, short_answer
    total_questions: int = 10
    duration_minutes: int = 15
    ratio_recall: int = 40
    ratio_understanding: int = 30
    ratio_application: int = 20
    ratio_high_application: int = 10
    focus_topic: Optional[str] = None

class SubmitQuizRequest(BaseModel):
    user_answers: dict  # {q_id: selected_option}
    time_spent_seconds: int = 0

class NotebookChatRequest(BaseModel):
    message: str

# ── 1. Notebooks Management ──────────────────────────────────────────────────

@router.get("/notebooks")
def list_notebooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các không gian ôn tập của học sinh/giáo viên."""
    notebooks = db.query(RevisionNotebook).filter(RevisionNotebook.user_id == current_user.id).order_by(RevisionNotebook.updated_at.desc()).all()
    
    results = []
    for nb in notebooks:
        doc_count = db.query(RevisionDocument).filter(RevisionDocument.notebook_id == nb.id).count()
        quiz_count = db.query(RevisionQuiz).filter(RevisionQuiz.notebook_id == nb.id).count()
        results.append({
            "id": nb.id,
            "title": nb.title,
            "subject": nb.subject,
            "grade": nb.grade,
            "description": nb.description,
            "doc_count": doc_count,
            "quiz_count": quiz_count,
            "updated_at": nb.updated_at.strftime("%H:%M %d/%m/%Y") if nb.updated_at else ""
        })
    return results

@router.post("/notebooks")
def create_notebook(
    data: NotebookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo không gian ôn tập mới."""
    nb = RevisionNotebook(
        user_id=current_user.id,
        title=data.title,
        subject=data.subject,
        grade=data.grade,
        description=data.description
    )
    db.add(nb)
    db.commit()
    db.refresh(nb)
    return {"id": nb.id, "title": nb.title, "message": "Đã tạo không gian ôn tập thành công"}

@router.get("/notebooks/{notebook_id}")
def get_notebook_detail(
    notebook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết Notebook kèm danh sách tài liệu và các đề thi đã tạo."""
    nb = db.query(RevisionNotebook).filter(RevisionNotebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(status_code=404, detail="Không gian ôn tập không tồn tại")

    docs = db.query(RevisionDocument).filter(RevisionDocument.notebook_id == nb.id).order_by(RevisionDocument.created_at.desc()).all()
    quizzes = db.query(RevisionQuiz).filter(RevisionQuiz.notebook_id == nb.id).order_by(RevisionQuiz.created_at.desc()).all()

    return {
        "id": nb.id,
        "title": nb.title,
        "subject": nb.subject,
        "grade": nb.grade,
        "description": nb.description,
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "file_type": d.file_type,
                "char_count": d.char_count,
                "snippet": d.content_text[:200] + "..." if len(d.content_text) > 200 else d.content_text,
                "created_at": d.created_at.strftime("%H:%M %d/%m/%Y") if d.created_at else ""
            }
            for d in docs
        ],
        "quizzes": [
            {
                "id": q.id,
                "title": q.title,
                "quiz_type": q.quiz_type,
                "total_questions": q.total_questions,
                "duration_minutes": q.duration_minutes,
                "created_at": q.created_at.strftime("%H:%M %d/%m/%Y") if q.created_at else "",
                "attempt_count": db.query(RevisionAttempt).filter(RevisionAttempt.quiz_id == q.id).count()
            }
            for q in quizzes
        ]
    }

from app.models.file import FileItem
import urllib.request

class ImportDriveRequest(BaseModel):
    file_ids: List[int]

# ── 2. Multi-Document Upload & Parsing + Drive Sync ──────────────────────────

@router.get("/drive-files")
def list_available_drive_files(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các file trong Cặp xách / Drive của học sinh để chọn nạp vào Notebook."""
    files = db.query(FileItem).filter(FileItem.owner_id == current_user.id).order_by(FileItem.id.desc()).all()
    return [
        {
            "id": f.id,
            "filename": f.filename,
            "file_url": f.file_url,
            "file_type": f.file_type,
            "file_size": f.file_size
        }
        for f in files
    ]

@router.post("/notebooks/{notebook_id}/documents")
async def upload_documents(
    notebook_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload đồng thời nhiều tài liệu đề cương (PDF, DOCX, TXT) vào Notebook và lưu vào Drive."""
    nb = db.query(RevisionNotebook).filter(RevisionNotebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(status_code=404, detail="Không gian ôn tập không tồn tại")

    saved_docs = []
    for file in files:
        file_bytes = await file.read()
        file_type, text_content = parse_document_content(file.filename, file_bytes)

        if not text_content.strip():
            text_content = f"Tài liệu {file.filename} đã được tải lên thành công."
        else:
            text_content = text_content.replace('\x00', '')

        doc = RevisionDocument(
            notebook_id=nb.id,
            filename=file.filename,
            file_type=file_type,
            content_text=text_content,
            char_count=len(text_content)
        )
        db.add(doc)

        # Lưu đồng thời vào Cặp xách (Drive / FileItem) để học sinh lưu trữ lâu dài
        size_mb = f"{len(file_bytes) / (1024 * 1024):.2f} MB" if len(file_bytes) > 0 else "0.1 MB"
        db_file = FileItem(
            filename=file.filename,
            file_url="", # Lưu nội bộ
            file_type=file.content_type or file_type,
            file_size=size_mb,
            owner_id=current_user.id
        )
        db.add(db_file)

        saved_docs.append({"filename": file.filename, "chars": len(text_content), "type": file_type})

    # Tặng EXP cho học sinh
    current_user.exp_points = (current_user.exp_points or 0) + (10 * len(files))
    nb.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": f"Đã nạp và lưu thành công {len(saved_docs)} tài liệu vào Notebook & Drive", "documents": saved_docs}

@router.post("/notebooks/{notebook_id}/import-from-drive")
def import_files_from_drive(
    notebook_id: int,
    data: ImportDriveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Nạp nhanh các tài liệu đã có sẵn trong Cặp xách (Drive) vào Notebook."""
    nb = db.query(RevisionNotebook).filter(RevisionNotebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(status_code=404, detail="Không gian ôn tập không tồn tại")

    drive_files = db.query(FileItem).filter(FileItem.id.in_(data.file_ids), FileItem.owner_id == current_user.id).all()
    if not drive_files:
        raise HTTPException(status_code=400, detail="Không tìm thấy file nào được chọn từ Drive")

    imported_docs = []
    for f in drive_files:
        # Nếu có URL tải về thì tải, ngược lại dùng nội dung văn bản mặc định
        file_bytes = b""
        if f.file_url and f.file_url.startswith("http"):
            try:
                req = urllib.request.Request(f.file_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    file_bytes = resp.read()
            except Exception as e:
                print(f"Lỗi tải file từ Drive URL: {e}")

        if file_bytes:
            file_type, text_content = parse_document_content(f.filename, file_bytes)
        else:
            file_type = "doc"
            text_content = f"Tài liệu {f.filename} từ Drive của học sinh.\nNội dung đề cương ôn tập môn {nb.subject} {nb.grade}."

        doc = RevisionDocument(
            notebook_id=nb.id,
            filename=f.filename,
            file_type=file_type,
            content_text=text_content,
            char_count=len(text_content)
        )
        db.add(doc)
        imported_docs.append({"filename": f.filename, "chars": len(text_content)})

    nb.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": f"Đã nạp thành công {len(imported_docs)} tài liệu từ Cặp xách (Drive)", "documents": imported_docs}

@router.delete("/documents/{doc_id}")
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xoá tài liệu khỏi Notebook."""
    doc = db.query(RevisionDocument).filter(RevisionDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại")
    db.delete(doc)
    db.commit()
    return {"message": "Đã xoá tài liệu thành công"}

# ── 3. AI Quiz Generator (GDPT 2018 Standard) ────────────────────────────────

@router.post("/notebooks/{notebook_id}/generate-quiz")
def generate_quiz(
    notebook_id: int,
    req: GenerateQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Sinh bộ câu hỏi ôn tập thông minh bằng Gemini 2.0 theo chuẩn GDPT 2018."""
    nb = db.query(RevisionNotebook).filter(RevisionNotebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(status_code=404, detail="Không gian ôn tập không tồn tại")

    docs = db.query(RevisionDocument).filter(RevisionDocument.notebook_id == nb.id).all()
    if not docs:
        raise HTTPException(status_code=400, detail="Vui lòng tải lên ít nhất 1 tài liệu hoặc đề cương để AI phân tích.")

    docs_payload = [{"filename": d.filename, "content_text": d.content_text} for d in docs]
    ratio_matrix = {
        "recall": req.ratio_recall,
        "understanding": req.ratio_understanding,
        "application": req.ratio_application,
        "high_application": req.ratio_high_application
    }

    # Sinh câu hỏi qua AI Engine
    generated_questions = generate_smart_quiz_from_docs(
        documents=docs_payload,
        quiz_type=req.quiz_type,
        total_questions=req.total_questions,
        ratio_matrix=ratio_matrix,
        focus_topic=req.focus_topic
    )

    if not generated_questions:
        raise HTTPException(status_code=500, detail="AI không thể tạo câu hỏi từ tài liệu này. Vui lòng kiểm tra lại nội dung file.")

    quiz_title = req.title or f"Đề Ôn Tập {nb.subject} - Chuẩn GDPT ({len(generated_questions)} câu)"

    quiz = RevisionQuiz(
        notebook_id=nb.id,
        user_id=current_user.id,
        title=quiz_title,
        quiz_type=req.quiz_type,
        total_questions=len(generated_questions),
        ratio_matrix=ratio_matrix,
        questions=generated_questions,
        duration_minutes=req.duration_minutes
    )
    db.add(quiz)
    nb.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(quiz)

    return {
        "id": quiz.id,
        "title": quiz.title,
        "quiz_type": quiz.quiz_type,
        "total_questions": quiz.total_questions,
        "duration_minutes": quiz.duration_minutes,
        "questions": quiz.questions
    }

@router.get("/quizzes/{quiz_id}")
def get_quiz_detail(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết bài kiểm tra để học sinh làm bài."""
    quiz = db.query(RevisionQuiz).filter(RevisionQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Bài ôn tập không tồn tại")

    return {
        "id": quiz.id,
        "title": quiz.title,
        "quiz_type": quiz.quiz_type,
        "total_questions": quiz.total_questions,
        "duration_minutes": quiz.duration_minutes,
        "questions": quiz.questions,
        "ratio_matrix": quiz.ratio_matrix
    }

@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    sub: SubmitQuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chấm điểm và phân tích ma trận năng lực theo 4 mức độ nhận thức GDPT."""
    quiz = db.query(RevisionQuiz).filter(RevisionQuiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Bài ôn tập không tồn tại")

    questions = quiz.questions or []
    correct_count = 0
    total = len(questions)

    # Thống kê ma trận năng lực
    competency = {
        "Nhận biết": {"total": 0, "correct": 0},
        "Thông hiểu": {"total": 0, "correct": 0},
        "Vận dụng": {"total": 0, "correct": 0},
        "Vận dụng cao": {"total": 0, "correct": 0}
    }

    detailed_results = []

    for q in questions:
        qid = str(q.get("id"))
        level = q.get("cognitive_level", "Thông hiểu")
        if level not in competency:
            level = "Thông hiểu"
        competency[level]["total"] += 1

        user_ans = sub.user_answers.get(qid)
        correct_ans = q.get("correct_answer")

        is_correct = False
        if quiz.quiz_type == "mcq_4":
            is_correct = (user_ans == correct_ans)
        elif quiz.quiz_type == "true_false":
            # True/False sub items check
            sub_items = q.get("sub_items", [])
            sub_correct = 0
            for idx, item in enumerate(sub_items):
                item_key = f"{qid}_{item.get('label', idx)}"
                user_val = sub.user_answers.get(item_key)
                if user_val == item.get("is_true"):
                    sub_correct += 1
            is_correct = (sub_correct == len(sub_items))
        else:
            is_correct = bool(user_ans)

        if is_correct:
            correct_count += 1
            competency[level]["correct"] += 1

        detailed_results.append({
            "id": q.get("id"),
            "question": q.get("question"),
            "cognitive_level": level,
            "user_answer": user_ans,
            "correct_answer": correct_ans,
            "is_correct": is_correct,
            "explanation": q.get("explanation"),
            "citation": q.get("citation")
        })

    # Tính điểm hệ 10
    final_score = round((correct_count / total) * 10, 1) if total > 0 else 0

    attempt = RevisionAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        user_answers=sub.user_answers,
        score=int(final_score * 10),
        correct_count=correct_count,
        total_questions=total,
        competency_matrix=competency,
        time_spent_seconds=sub.time_spent_seconds
    )
    db.add(attempt)
    db.commit()

    return {
        "score": final_score,
        "correct_count": correct_count,
        "total_questions": total,
        "competency_matrix": competency,
        "detailed_results": detailed_results,
        "time_spent_seconds": sub.time_spent_seconds
    }

# ── 4. NotebookLM Document Chat ──────────────────────────────────────────────

@router.post("/notebooks/{notebook_id}/chat")
def chat_notebook(
    notebook_id: int,
    req: NotebookChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trợ lý AI trả lời câu hỏi bám sát các tài liệu đã tải lên trong Notebook."""
    nb = db.query(RevisionNotebook).filter(RevisionNotebook.id == notebook_id).first()
    if not nb:
        raise HTTPException(status_code=404, detail="Không gian ôn tập không tồn tại")

    docs = db.query(RevisionDocument).filter(RevisionDocument.notebook_id == nb.id).all()
    if not docs:
        return {"reply": "Chưa có tài liệu nào trong không gian này. Hãy tải lên tài liệu đề cương để tôi có thể hỗ trợ bạn chính xác nhất!"}

    docs_payload = [{"filename": d.filename, "content_text": d.content_text} for d in docs]
    reply = chat_with_notebook_documents(documents=docs_payload, user_message=req.message)
    return {"reply": reply}
