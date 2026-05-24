import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from typing import Annotated

from app.db.database import get_db
from app.models.person import Person
from app.schemas.person import PersonCreate, PersonUpdate, PersonResponse

router = APIRouter(prefix="/api/persons", tags=["persons"])


# ─── POST /persons ─────────────────────────────────────────────────────────────
@router.post("/", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
):
    payload = data.model_dump()
    if not payload.get("wikidata_id"):
        payload["wikidata_id"] = f"manual-{uuid.uuid4().hex[:10]}"

    person = Person(**payload)
    db.add(person)
    await db.commit()
    await db.refresh(person)
    return person


# ─── GET /persons ──────────────────────────────────────────────────────────────
@router.get("/", response_model=list[PersonResponse])
async def list_persons(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Person).offset(skip).limit(limit))
    return result.scalars().all()


# ─── GET /persons/{id} ─────────────────────────────────────────────────────────
@router.get("/{person_id}", response_model=PersonResponse)
async def get_person(
    person_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Person:
    result = await db.execute(
        select(Person)
        .options(selectinload(Person.birth_city))
        .where(Person.id == person_id)
    )
    person = result.scalar_one_or_none()

    if person is None:
        raise HTTPException(status_code=404, detail="Person not found")

    return person


@router.get("/wikidata/{wikidata_id}", response_model=PersonResponse)
async def get_person_by_wikidata(
    wikidata_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Person:
    """
    Возвращает карточку человека по Wikidata QID (например, Q5593).
    """
    result = await db.execute(
        select(Person)
        .options(selectinload(Person.birth_city))
        .where(Person.wikidata_id == wikidata_id)
    )
    person = result.scalar_one_or_none()

    if person is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with wikidata_id '{wikidata_id}' not found",
        )

    return person



# ─── PATCH /persons/{id} ───────────────────────────────────────────────────────
@router.patch("/{person_id}", response_model=PersonResponse)
async def update_person(
    person_id: int,
    data: PersonUpdate,
    db: AsyncSession = Depends(get_db),
):
    person = await db.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(person, field, value)

    await db.commit()
    await db.refresh(person)
    return person


# ─── DELETE /persons/{id} ──────────────────────────────────────────────────────
@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_person(
    person_id: int,
    db: AsyncSession = Depends(get_db),
):
    person = await db.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    await db.delete(person)
    await db.commit()


# ─── POST /persons/{id}/photo ──────────────────────────────────────────────────
@router.post("/{person_id}/photo", response_model=PersonResponse)
async def upload_photo(
    person_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Загружает фото в MinIO и сохраняет URL в Person.photo_url"""
    from app.services.storage import upload_photo as s3_upload

    person = await db.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    url = await s3_upload(file, object_name=f"person_{person_id}")
    person.photo_url = url

    await db.commit()
    await db.refresh(person)
    return person
