from typing import Optional
from pydantic import BaseModel, ConfigDict


class CityBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    wikidata_id: str
    name: str
    province: Optional[str] = None
    region: Optional[str] = None
    coat_of_arms_url: Optional[str] = None


class FamousPersonBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    wikidata_id: str
    full_name: Optional[str] = None
    occupation: Optional[str] = None
    main_image_url: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None


class PersonCreate(BaseModel):
    wikidata_id: Optional[str] = None
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    occupation: Optional[str] = None
    summary_es: Optional[str] = None
    main_image_url: Optional[str] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    birth_city_id: Optional[int] = None


class PersonUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    occupation: Optional[str] = None
    summary_es: Optional[str] = None
    main_image_url: Optional[str] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    birth_city_id: Optional[int] = None


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    wikidata_id: Optional[str] = None
    full_name: Optional[str] = None
    birth_date: Optional[str] = None
    death_date: Optional[str] = None
    occupation: Optional[str] = None
    summary_es: Optional[str] = None
    main_image_url: Optional[str] = None
    source_url: Optional[str] = None
    confidence_score: Optional[float] = None
    birth_city: Optional[CityBrief] = None


class CityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    wikidata_id: Optional[str] = None
    name: str
    province: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    coat_of_arms_url: Optional[str] = None
    hero_image_url: Optional[str] = None
    famous_people: list[FamousPersonBrief] = []

class RelativeInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: Optional[str] = None
    main_image_url: Optional[str] = None
    role: str
