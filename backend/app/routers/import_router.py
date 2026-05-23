
"""
FastAPI endpoint: POST /api/admin/import-famous-people

Принимает список имён и запускает batch-импорт.
Каждый человек обрабатывается независимо — ошибка одного
не прерывает остальных.
"""

import asyncio
import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.services.person_importer import ImportResult, import_person
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


# ─── Schemas ───────────────────────────────────────────────────────────────────

class ImportRequest(BaseModel):
    names: list[str] = Field(
        ...,
        min_length=1,
        max_length=200,
        examples=[["Pablo Picasso", "Federico García Lorca", "Salvador Dalí"]],
    )


class PersonResult(BaseModel):
    name: str
    status: str
    wikidata_id: str | None = None
    confidence: float | None = None
    city_name: str | None = None
    error: str | None = None


class ImportResponse(BaseModel):
    total: int
    success: int
    not_found: int
    errors: int
    results: list[PersonResult]


# ─── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/import-famous-people", response_model=ImportResponse)
async def import_famous_people(
    body: ImportRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ImportResponse:
    """
    Batch-импорт известных испанцев.

    - Каждое имя обрабатывается отдельно.
    - Ошибка одной записи не прерывает остальные.
    - Возвращает сводку результатов.
    """
    logger.info("Import requested: %d names", len(body.names))

    # Обрабатываем параллельно, но с ограничением concurrency
    # чтобы не перегружать Wikidata API
    semaphore = asyncio.Semaphore(3)

    async def _bounded_import(name: str) -> ImportResult:
        async with semaphore:
            return await import_person(name.strip(), db)

    tasks = [_bounded_import(name) for name in body.names if name.strip()]
    raw_results: list[ImportResult] = await asyncio.gather(*tasks)

    # Формируем ответ
    results = [
        PersonResult(
            name=r.name,
            status=r.status,
            wikidata_id=r.wikidata_id,
            confidence=r.confidence,
            city_name=r.city_name,
            error=r.error,
        )
        for r in raw_results
    ]

    success  = sum(1 for r in raw_results if r.status in ("imported", "updated"))
    not_found = sum(1 for r in raw_results if r.status == "not_found")
    errors   = sum(1 for r in raw_results if r.status == "error")

    logger.info(
        "Import done: success=%d not_found=%d errors=%d",
        success, not_found, errors,
    )

    return ImportResponse(
        total=len(results),
        success=success,
        not_found=not_found,
        errors=errors,
        results=results,
    )

