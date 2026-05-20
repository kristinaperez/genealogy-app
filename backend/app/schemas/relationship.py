from pydantic import BaseModel, model_validator
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
    id: int
    person_a: int
    person_b: int
    type: RelationType

    class Config:
        from_attributes = True


# ── Удобный формат для карточки человека ──────────────────────────────────────
class RelativeInfo(BaseModel):
    id: int
    first_name: str
    last_name: str
    photo_url: str | None
    role: str   # "parent" | "child" | "spouse"
