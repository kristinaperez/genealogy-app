"""
routers/cities.py — эндпоинты для работы с городами.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database    import get_db
from app.models.models  import City
from app.schemas.schemas import CityResponse

router = APIRouter(prefix="/api/cities", tags=["cities"])


@router.get("/{city_id}", response_model=CityResponse)
async def get_city(
    city_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> City:
    """
    Возвращает карточку города по внутреннему id.
    Жадно загружает famous_people чтобы избежать N+1.
    """
    result = await db.execute(
        select(City)
        .options(selectinload(City.famous_people))
        .where(City.id == city_id)
    )
    city = result.scalar_one_or_none()

    if city is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City {city_id} not found",
        )

    return city


@router.get("/wikidata/{wikidata_id}", response_model=CityResponse)
async def get_city_by_wikidata(
    wikidata_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> City:
    """
    Возвращает карточку города по Wikidata QID (например, Q8698).
    """
    result = await db.execute(
        select(City)
        .options(selectinload(City.famous_people))
        .where(City.wikidata_id == wikidata_id)
    )
    city = result.scalar_one_or_none()

    if city is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"City with wikidata_id '{wikidata_id}' not found",
        )

    return city

