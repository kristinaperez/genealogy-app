from typing import Optional
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.relationship import RelationType


class RelationshipCreate(BaseModel):
    person_a: int
    person_b: int
    type: RelationType

    @model_validator(mode="after")
    def persons_differ(self):
        if self.person_a == self.person_b:
            raise ValueError("person_a and person_b must be different")
        return self


class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    person_a: int
    person_b: int
    type: RelationType


# ── Удобный формат для карточки человека ──────────────────────────────────────
class RelativeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    main_image_url: Optional[str] = None
    role: str   # "parent" | "child" | "spouse"
