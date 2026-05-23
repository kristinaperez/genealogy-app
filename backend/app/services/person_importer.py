"""
Person Importer — основной оркестратор импорта одного человека.

Шаги:
  1. Поиск кандидатов в Wikidata
  2. Верификация каждого кандидата (confidence score)
  3. Загрузка полных деталей для лучшего совпадения
  4. Создание/обновление записи Person в БД
  5. Создание/обновление карточки города
  6. Привязка person → city
"""

import logging
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models    import Person, City, CityPeople
from app.services.wikidata_service import search_person, get_person_details
from app.services.person_verifier import verify_person, CONFIDENCE_THRESHOLD
from app.services.city_service import get_or_create_city

logger = logging.getLogger(__name__)


@dataclass
class ImportResult:
    name: str
    status: str                    # "imported" | "updated" | "not_found" | "error"
    wikidata_id: Optional[str] = None
    confidence: Optional[float] = None
    city_name: Optional[str] = None
    error: Optional[str] = None


async def import_person(name: str, db: AsyncSession) -> ImportResult:
    """
    Импортирует одного человека. Никогда не бросает исключения —
    все ошибки оборачиваются в ImportResult со статусом "error".
    """
    try:
        return await _import_person_inner(name, db)
    except Exception as exc:
        logger.exception("Unexpected error importing '%s'", name)
        return ImportResult(name=name, status="error", error=str(exc))


async def _import_person_inner(name: str, db: AsyncSession) -> ImportResult:
    # ── Шаг 1: поиск кандидатов ────────────────────────────────────────────────
    candidates = await search_person(name)
    if not candidates:
        logger.info("No candidates found for '%s'", name)
        return ImportResult(name=name, status="not_found")

    # ── Шаг 2: верификация — берём лучшего кандидата ───────────────────────────
    best_wikidata_id: Optional[str] = None
    best_details: Optional[dict] = None
    best_confidence: float = 0.0

    for candidate in candidates:
        wid = candidate["wikidata_id"]
        details = await get_person_details(wid)
        if not details:
            continue

        result = verify_person(name, details)
        logger.debug(
            "Candidate %s '%s' → confidence=%.2f",
            wid, details.get("full_name"), result.confidence,
        )

        if result.confidence > best_confidence:
            best_confidence = result.confidence
            best_wikidata_id = wid
            best_details = details

        # Если уверены достаточно — дальше не ищем
        if best_confidence >= 0.90:
            break

    if best_confidence < CONFIDENCE_THRESHOLD or not best_details:
        logger.info(
            "No confident match for '%s' (best=%.2f)", name, best_confidence
        )
        return ImportResult(
            name=name,
            status="not_found",
            confidence=best_confidence,
        )

    # ── Шаг 3: создание / обновление Person ────────────────────────────────────
    person, is_new = await _upsert_person(db, best_wikidata_id, best_details, best_confidence)

    # ── Шаг 4: создание / обновление City и привязка ───────────────────────────
    city: Optional[City] = None
    city_wid = best_details.get("birth_place_wikidata_id")

    if city_wid:
        city = await get_or_create_city(db, city_wid)

    if city:
        person.birth_city_id = city.id
        await _link_person_to_city(db, person.id, city.id)

    await db.commit()
    await db.refresh(person)

    return ImportResult(
        name=name,
        status="imported" if is_new else "updated",
        wikidata_id=best_wikidata_id,
        confidence=best_confidence,
        city_name=city.name if city else None,
    )


# ─── Helpers ───────────────────────────────────────────────────────────────────

async def _upsert_person(
    db: AsyncSession,
    wikidata_id: str,
    details: dict,
    confidence: float,
) -> tuple[Person, bool]:
    """Создаёт или обновляет запись Person. Возвращает (person, is_new)."""
    result = await db.execute(
        select(Person).where(Person.wikidata_id == wikidata_id)
    )
    person = result.scalar_one_or_none()
    is_new = person is None

    if is_new:
        person = Person(wikidata_id=wikidata_id)
        db.add(person)

    person.full_name       = details.get("full_name")
    person.birth_date      = details.get("birth_date")
    person.death_date      = details.get("death_date")
    person.occupation      = details.get("occupation")
    person.main_image_url  = details.get("main_image_url")
    person.source_url      = details.get("source_url")
    person.confidence_score = confidence

    await db.flush()
    return person, is_new


async def _link_person_to_city(
    db: AsyncSession,
    person_id: int,
    city_id: int,
) -> None:
    """Создаёт запись city_people, если её ещё нет."""
    existing = await db.execute(
        select(CityPeople).where(
            CityPeople.city_id == city_id,
            CityPeople.person_id == person_id,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(CityPeople(city_id=city_id, person_id=person_id))
        await db.flush()

