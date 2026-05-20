from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.person import Person
from app.schemas.person import PersonCreate, PersonUpdate, PersonResponse

router = APIRouter(prefix="/persons", tags=["persons"])


# ─── POST /persons ─────────────────────────────────────────────────────────────
@router.post("/", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person(
    data: PersonCreate,
    db: AsyncSession = Depends(get_db),
):
    person = Person(**data.model_dump())
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
    db: AsyncSession = Depends(get_db),
):
    person = await db.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
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
