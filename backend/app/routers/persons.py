from fastapi import APIRouter

router = APIRouter(prefix="/persons", tags=["persons"])


@router.get("/")
async def get_persons():
    return [{"message": "persons endpoint works"}]
