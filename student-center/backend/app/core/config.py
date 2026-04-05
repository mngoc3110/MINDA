from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MINDA EduCenter AI"
    # Dùng SQLite thay vi PostgreSQL để chạy cục bộ (Dev) cho dễ
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./minda_local.db"
    
    @field_validator("SQLALCHEMY_DATABASE_URI", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str]) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql://", 1)
        return v

    SECRET_KEY: str = "MINDA_SUPER_SECRET_RANK_KEY_FOR_LOCAL"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    CORS_ORIGINS: str = "http://localhost:3000"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
