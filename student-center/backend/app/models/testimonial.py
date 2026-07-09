from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    student_name = Column(String(255), nullable=False)
    avatar_url = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=5)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Optional relationship
    # user = relationship("User", back_populates="testimonials")
