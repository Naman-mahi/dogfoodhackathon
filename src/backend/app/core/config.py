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

    class Config:
        case_sensitive = True

settings = Settings()
