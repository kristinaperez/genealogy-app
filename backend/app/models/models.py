"""
SQLAlchemy ORM модели: Person, City, CityPeople.
"""

from datetime import datetime
from typing import Optional
from app.db.base import Base

from sqlalchemy import (
    BigInteger, Column, DateTime, Float,
    ForeignKey, Integer, String, Table, UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ─── City ──────────────────────────────────────────────────────────────────────

class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    wikidata_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    name:     Mapped[str]           = mapped_column(String(255), nullable=False)
    province: Mapped[Optional[str]] = mapped_column(String(255))
    region:   Mapped[Optional[str]] = mapped_column(String(255))
    country:  Mapped[str]           = mapped_column(String(100), default="España")

    latitude:  Mapped[Optional[float]] = mapped_column(Float)
    longitude: Mapped[Optional[float]] = mapped_column(Float)

    coat_of_arms_url: Mapped[Optional[str]] = mapped_column(String(1024))
    hero_image_url:   Mapped[Optional[str]] = mapped_column(String(1024))

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Связь: люди, родившиеся в этом городе
    natives: Mapped[list["Person"]] = relationship(
        "Person", back_populates="birth_city", foreign_keys="Person.birth_city_id"
    )
    # Связь через city_people (известные люди города)
    famous_people: Mapped[list["Person"]] = relationship(
        "Person", secondary="city_people", back_populates="cities"
    )

    def __repr__(self) -> str:
        return f"<City id={self.id} name='{self.name}'>"


# ─── Person ────────────────────────────────────────────────────────────────────

class Person(Base):
    __tablename__ = "persons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    wikidata_id: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    full_name:  Mapped[Optional[str]] = mapped_column(String(512))
    birth_date: Mapped[Optional[str]] = mapped_column(String(30))   # ISO string из Wikidata
    death_date: Mapped[Optional[str]] = mapped_column(String(30))

    birth_city_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("cities.id"), nullable=True
    )
    birth_city: Mapped[Optional[City]] = relationship(
        "City", back_populates="natives", foreign_keys=[birth_city_id]
    )

    summary_es:     Mapped[Optional[str]] = mapped_column(String(4096))
    main_image_url: Mapped[Optional[str]] = mapped_column(String(1024))
    occupation:     Mapped[Optional[str]] = mapped_column(String(512))
    source_url:     Mapped[Optional[str]] = mapped_column(String(1024))

    confidence_score: Mapped[Optional[float]] = mapped_column(Float)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Многие-ко-многим через city_people
    cities: Mapped[list[City]] = relationship(
        "City", secondary="city_people", back_populates="famous_people"
    )

    def __repr__(self) -> str:
        return f"<Person id={self.id} name='{self.full_name}'>"


# ─── CityPeople (junction) ─────────────────────────────────────────────────────

class CityPeople(Base):
    __tablename__ = "city_people"

    city_id:   Mapped[int] = mapped_column(Integer, ForeignKey("cities.id"),  primary_key=True)
    person_id: Mapped[int] = mapped_column(Integer, ForeignKey("persons.id"), primary_key=True)

