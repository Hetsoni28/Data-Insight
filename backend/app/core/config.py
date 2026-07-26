# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # Application
    APP_ENV: str = "development"
    APP_NAME: str = "Data Insight"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Master Database (Platform Registry)
    DATABASE_URL: str

    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # AI Models
    OPENAI_API_KEY: str
    ANTHROPIC_API_KEY: str

    # Email
    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@datainsight.ai"

    # Billing
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Token Settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


# Singleton instance — import this everywhere
settings = Settings()
