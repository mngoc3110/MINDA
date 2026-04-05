from pydantic import BaseModel

class FileCreate(BaseModel):
    filename: str
    file_url: str
    file_type: str
    file_size: str

class FileResponse(FileCreate):
    id: int
    owner_id: int

    class Config:
        from_attributes = True
