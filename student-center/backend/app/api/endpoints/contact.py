from fastapi import APIRouter, BackgroundTasks, Request
from app.schemas.user import ContactUsRequest
from app.core.email import send_contact_email
from app.core.limiter import limiter

router = APIRouter()

@router.post("/submit")
@limiter.limit("3/hour")
def submit_contact_form(request: Request, payload: ContactUsRequest, background_tasks: BackgroundTasks):
    """Gửi email liên hệ từ Trang Chủ."""
    
    # Send email in background to not block the response
    background_tasks.add_task(
        send_contact_email,
        name=payload.name,
        sender_email=payload.email,
        content=payload.message
    )
    
    return {"message": "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất."}
