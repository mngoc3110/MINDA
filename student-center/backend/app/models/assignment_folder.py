from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Table, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

folder_assignees = Table(
    'folder_assignees',
    Base.metadata,
    Column('folder_id', Integer, ForeignKey('assignment_folders.id', ondelete="CASCADE"), primary_key=True),
    Column('student_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
)


class AssignmentFolder(Base):
    __tablename__ = "assignment_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_assigned_to_all = Column(Boolean, default=True)
    assigned_classes = Column(Text, nullable=True)  # Comma-separated: "Lớp 12-2k8,Lớp 11-2k9"
    created_at = Column(DateTime, default=datetime.utcnow)

    teacher = relationship("User", foreign_keys=[teacher_id])
    assignments = relationship("Assignment", back_populates="folder", foreign_keys="Assignment.folder_id")
    assignees = relationship("User", secondary=folder_assignees)
