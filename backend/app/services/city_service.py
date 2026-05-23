"""
City Service — создание или получение карточки города.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import City
from app.services.wikidata_service import get_city_details


async def get_or_create_city(
    db: AsyncSession,
    wikidata_id: str,
) -> City | None:
    """
    Ищет город в БД по wikidata_id.
    Если не найден — запрашивает данные из Wikidata и создаёт запись.
    Возвращает City или None, если данные получить не удалось.
    """
    # Попытка найти существующую запись
    result = await db.execute(
        select(City).where(City.wikidata_id == wikidata_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    # Загружаем данные из Wikidata
    details = await get_city_details(wikidata_id)
    if not details:
        return None

    city = City(
        wikidata_id=details["wikidata_id"],
        name=details["name"],
        province=details.get("province"),
        region=details.get("region"),
        country=details.get("country", "España"),
        latitude=details.get("latitude"),
        longitude=details.get("longitude"),
        coat_of_arms_url=details.get("coat_of_arms_url"),
        hero_image_url=details.get("hero_image_url"),
    )

    db.add(city)
    await db.flush()   # получаем city.id без коммита
    return city

