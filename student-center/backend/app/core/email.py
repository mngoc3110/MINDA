import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
import logging

logger = logging.getLogger(__name__)

# FastAPI Mail Configuration
# Read from Environment Variables
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "dummy@example.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "dummy_password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "dummy@example.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", "Cổng Học Toán MINDA"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_reset_password_email(email: EmailStr, reset_link: str) -> None:
    """Send an email with the password reset link."""
    # Fast fallback if smtp not configured
    if conf.MAIL_USERNAME == "dummy@example.com":
        logger.warning(f"SMTP not configured. Mock sending reset password to {email}. Link: {reset_link}")
        return

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">MINDA - Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại hệ thống MINDA.</p>
        <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu của bạn. Liên kết này sẽ hết hạn trong vòng 30 phút.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Đặt Mật Khẩu Mới
            </a>
        </div>
        <p>Nếu nút bấm không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="word-break: break-all; color: #64748b; font-size: 14px;">{reset_link}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn sẽ được giữ an toàn.
        </p>
    </div>
    """

    message = MessageSchema(
        subject="[MINDA] Đặt lại mật khẩu của bạn",
        recipients=[email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"Reset password email sent successfully to {email}")
    except Exception as e:
        logger.error(f"Failed to send reset password email to {email}: {e}")

async def send_contact_email(name: str, sender_email: str, content: str) -> None:
    """Send an email from the contact form to the admin."""
    # Fast fallback if smtp not configured
    if conf.MAIL_USERNAME == "dummy@example.com":
        logger.warning(f"SMTP not configured. Mock sending contact form from {name} ({sender_email}). Content: {content}")
        return

    admin_email = os.getenv("ADMIN_EMAIL", conf.MAIL_FROM)
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Có một thắc mắc mới từ Trang Chủ</h2>
        <p><strong>Người gửi:</strong> {name}</p>
        <p><strong>Email:</strong> {sender_email}</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; margin-top: 20px;">
            <p style="margin-top: 0; font-weight: bold; color: #475569;">Nội dung tin nhắn:</p>
            <p style="white-space: pre-wrap; color: #334155;">{content}</p>
        </div>
    </div>
    """

    message = MessageSchema(
        subject=f"[MINDA] Thắc mắc từ sinh viên: {name}",
        recipients=[admin_email],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"Contact email from {sender_email} sent successfully to admin")
    except Exception as e:
        logger.error(f"Failed to send contact email from {sender_email}: {e}")
