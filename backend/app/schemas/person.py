from datetime import date
from pydantic import BaseModel


class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: date | None = None
    death_date: date | None = None
    bio: str | None = None


class PersonUpdate(BaseModel):
    """Все поля опциональны — PATCH-семантика"""
    first_name: str | None = None
    last_name: str | None = None
    birth_date: date | None = None
    death_date: date | None = None
    bio: str | None = None


class PersonResponse(PersonCreate):
    id: int
    photo_url: str | None = None

    class Config:
        from_attributes = True

