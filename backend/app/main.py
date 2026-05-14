from fastapi import FastAPI
from sqlalchemy import text

from app.db.database import engine

app = FastAPI()


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health/db")
async def db_health():
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1"))
        return {"database": result.scalar()}
