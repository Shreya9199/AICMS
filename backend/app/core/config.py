import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AICMS - AICTE Integrated Case Monitoring System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "nivaran_hackathon_super_secret_jwt_key_2026_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for MVP
    
    # Database
    DATABASE_URL: str = "sqlite:///./nivaran.db"  # Supports postgresql://user:pass@host/db on Render
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "https://*.vercel.app"
    ]
    
    # SLA Config
    DEFAULT_SLA_DAYS: int = 14
    
    # Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"]
    
    # Notifications / Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "notifications@nivaran.gov.in"
    
    # Google Gemini AI Integration
    GEMINI_API_KEY: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
