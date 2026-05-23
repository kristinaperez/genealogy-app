"""
config.py — конфигурация приложения через pydantic-settings.
Значения читаются из переменных окружения или файла .env.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ───────────────────────────────────────────────────────────────
    # asyncpg — обязателен для async SQLAlchemy
    # Формат: postgresql+asyncpg://user:password@host:port/dbname
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/genealogy"
    DB_ECHO: bool = False          # True → логировать все SQL-запросы

    # ── App ────────────────────────────────────────────────────────────────────
    APP_ENV: str = "development"   # development | production
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"

    # ── CORS ───────────────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Wikidata ───────────────────────────────────────────────────────────────
    WIKIDATA_USER_AGENT: str = "GenealogyPlatform/1.0 (genealogy@example.com)"
    WIKIDATA_REQUEST_TIMEOUT: int = 15  # секунды

    # ── Celery / Redis ─────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


settings = Settings()

