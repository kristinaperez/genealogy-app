
"""
database.py — настройка подключения к PostgreSQL и async-сессий.

Использование в роутерах FastAPI:
    from database import get_db
    async def my_endpoint(db: AsyncSession = Depends(get_db)): ...

Переменные окружения (в .env):
    DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/genealogy
"""

import os
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.db.base import Base

from sqlalchemy.orm import DeclarativeBase

from os import getenv


DATABASE_URL = getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://genealogy:secret@db:5432/genealogy",
)


engine = create_async_engine(
    DATABASE_URL,
    echo=True,
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False 
)


# ─── FastAPI dependency ────────────────────────────────────────────────────────

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency для FastAPI-роутеров.
    Открывает сессию, передаёт в endpoint, закрывает после ответа.
    При исключении — откатывает транзакцию.

    Пример:
        @router.get("/cities/{id}")
        async def get_city(id: int, db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Утилиты ───────────────────────────────────────────────────────────────────

async def create_tables() -> None:
    """
    Создаёт все таблицы из моделей (если не существуют).
    Вызывается один раз при старте приложения (lifespan).
    В production — использовать Alembic migrations.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def check_db_connection() -> bool:
    """
    Health-check: проверяет, что БД доступна.
    Используется в GET /health.
    """
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


