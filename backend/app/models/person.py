from datetime import date
from sqlalchemy import String, Text, Date
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(primary_key=True)

    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))

    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    death_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    bio: Mapped[str | None] = mapped_column(Text(), nullable=True)

    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
