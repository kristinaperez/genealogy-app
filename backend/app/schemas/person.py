from datetime import date
from pydantic import BaseModel


class PersonCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: date | None = None
    death_date: date | None = None
    bio: str | None = None
    photo_url: str | None = None


class PersonRead(PersonCreate):
    id: int

    class Config:
        from_attributes = True
