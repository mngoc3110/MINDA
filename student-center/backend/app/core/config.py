from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MINDA EduCenter AI"
    # Dùng SQLite thay vi PostgreSQL để chạy cục bộ (Dev) cho dễ, không cần cài server DB
    SQLALCHEMY_DATABASE_URI: str = "sqlite:///./minda_local.db"
    SECRET_KEY: str = "MINDA_SUPER_SECRET_RANK_KEY_FOR_LOCAL" # Should be overridden in .env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    CORS_ORIGINS: str = "http://localhost:3000" # Comma separated
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
