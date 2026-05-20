from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import engine
from app.models import *
from app.db.database import Base

from app.routers import persons
from app.routers import relationships 

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(lifespan=lifespan)

origins = [
          "http://localhost:4173",
          "http://127.0.0.1:4173",
          "http://localhost:5173",
          "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("CORS_LOADED")
@app.get("/cors-test")
def cors_test():
    return {"ok": True}

app.include_router(persons.router)
app.include_router(relationships.router)

@app.get("/")
async def root():
    return {"status": "ok"}
