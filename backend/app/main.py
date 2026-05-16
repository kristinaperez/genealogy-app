from fastapi import FastAPI
from sqlalchemy import text
from app.routers.persons import router as persons_router

from app.db.database import engine

app = FastAPI()

app.include_router(persons_router)

@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health/db")
async def db_health():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1"))
        return {"database": result.scalar()}
