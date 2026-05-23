from enum import Enum as PyEnum
from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RelationType(str, PyEnum):
    parent   = "parent"    # parent_id → child_id
    spouse   = "spouse"    # симметричная связь


class Relationship(Base):
    __tablename__ = "relationships"

    id:        Mapped[int] = mapped_column(primary_key=True)
    person_a:  Mapped[int] = mapped_column(ForeignKey("persons.id", ondelete="CASCADE"))
    person_b:  Mapped[int] = mapped_column(ForeignKey("persons.id", ondelete="CASCADE"))
    type:      Mapped[RelationType] = mapped_column(Enum(RelationType), nullable=False)

    # person_a — родитель person_b (type=parent)
    # person_a — супруг  person_b (type=spouse, симметрично)
