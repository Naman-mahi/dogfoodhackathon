import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DOGFOOD Hackathon Evaluation Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dogfood-master-secret-key-2026")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://dogfood:dogfood@127.0.0.1:5432/dogfood"
    )
    FIXTURES_PATH: str = os.getenv("FIXTURES_PATH", "/app/fixtures.json")
    DEFAULT_SHRINKAGE_K: float = 2.0

    # Email & SMTP Settings
    EMAIL_ENABLED: bool = os.getenv("EMAIL_ENABLED", "true").lower() in ("true", "1", "yes")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "notifications@dogfood.dev")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "DOGFOOD Hackathons")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")

    class Config:
        case_sensitive = True
        env_file = [".env", "../.env", "../../.env", "/app/.env"]
        extra = "ignore"

settings = Settings()
