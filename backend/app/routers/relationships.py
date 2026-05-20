from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.person import Person
from app.models.relationship import Relationship, RelationType
from app.schemas.relationship import (
    RelationshipCreate,
    RelationshipResponse,
    RelativeInfo,
)

router = APIRouter(prefix="/relationships", tags=["relationships"])


# ─── Хелпер: получить человека или 404 ────────────────────────────────────────
async def get_person_or_404(db: AsyncSession, pid: int) -> Person:
    p = await db.get(Person, pid)
    if not p:
        raise HTTPException(404, f"Person {pid} not found")
    return p


# ─── POST /relationships ───────────────────────────────────────────────────────
@router.post("/", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
async def create_relationship(
    data: RelationshipCreate,
    db: AsyncSession = Depends(get_db),
):
    await get_person_or_404(db, data.person_a)
    await get_person_or_404(db, data.person_b)

    # Проверка дубликата
    existing = await db.execute(
        select(Relationship).where(
            and_(
                Relationship.person_a == data.person_a,
                Relationship.person_b == data.person_b,
                Relationship.type == data.type,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Relationship already exists")

    rel = Relationship(**data.model_dump())
    db.add(rel)
    await db.commit()
    await db.refresh(rel)
    return rel


# ─── GET /relationships ────────────────────────────────────────────────────────
@router.get("/", response_model=list[RelationshipResponse])
async def list_relationships(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Relationship))
    return result.scalars().all()


# ─── DELETE /relationships/{id} ───────────────────────────────────────────────
@router.delete("/{rel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_relationship(rel_id: int, db: AsyncSession = Depends(get_db)):
    rel = await db.get(Relationship, rel_id)
    if not rel:
        raise HTTPException(404, "Relationship not found")
    await db.delete(rel)
    await db.commit()


# ─── GET /relationships/person/{id} — все родственники одним запросом ─────────
@router.get("/person/{person_id}", response_model=list[RelativeInfo])
async def get_relatives(person_id: int, db: AsyncSession = Depends(get_db)):
    await get_person_or_404(db, person_id)

    result = await db.execute(
        select(Relationship).where(
            or_(
                Relationship.person_a == person_id,
                Relationship.person_b == person_id,
            )
        )
    )
    rels = result.scalars().all()

    relatives: list[RelativeInfo] = []

    for r in rels:
        # Определяем «другого» человека и его роль
        if r.type == RelationType.parent:
            if r.person_a == person_id:
                # я — родитель, другой — мой ребёнок
                other_id, role = r.person_b, "child"
            else:
                # я — ребёнок, другой — мой родитель
                other_id, role = r.person_a, "parent"
        else:
            # spouse — симметрично
            other_id = r.person_b if r.person_a == person_id else r.person_a
            role = "spouse"

        other = await db.get(Person, other_id)
        if other:
            relatives.append(
                RelativeInfo(
                    id=other.id,
                    first_name=other.first_name,
                    last_name=other.last_name,
                    photo_url=other.photo_url,
                    role=role,
                )
            )

    return relatives
