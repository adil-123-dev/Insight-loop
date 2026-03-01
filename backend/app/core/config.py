"""
Application configuration settings
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings and environment variables"""

    # Application Info
    APP_NAME: str = "InsightLoop API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database — Railway injects DATABASE_URL automatically
    DATABASE_URL: str = os.environ.get(
        "DATABASE_URL",
        "postgresql://insightloop:dev_password@localhost:5433/insightloop_db"
    )

    # JWT Settings
    SECRET_KEY: str = os.environ.get(
        "SECRET_KEY",
        "your-secret-key-change-in-production-make-it-long-and-random"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create global settings instance
settings = Settings()
