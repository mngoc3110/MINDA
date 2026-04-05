from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class FileItem(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    file_url = Column(String)
    file_type = Column(String)
    file_size = Column(String)
    file_category = Column(String, default="general") # e.g avatar, cover, featured, assignment
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    owner = relationship("User")
