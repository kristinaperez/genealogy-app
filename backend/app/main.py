import logging 
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.database import engine
from app.models import *
from app.db.database import Base

from app.config import settings
from app.db.database import check_db_connection
from app.routers import cities, persons
from app.routers import relationships
from app.routers.import_router import router as import_router 

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- STARTUP ---
    ok = await check_db_connection()

    if ok:
        logger.info("✓ Database connection OK")
    else:
        logger.error("✗ Database connection FAILED")

    logger.info("App started in '%s' mode", settings.APP_ENV)

    # (опционально) если ты создаёшь таблицы автоматически
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # --- SHUTDOWN ---
    logger.info("App shutting down")
 



app = FastAPI(
    title="Genealogy Platform API",
    version="0.1.0",
    description="",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan)

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
app.include_router(cities.router)
app.include_router(import_router)
app.include_router(relationships.router)

# ─── Health & meta ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["meta"], summary="Health check")
async def health() -> JSONResponse:
    """
    Возвращает статус приложения и БД.
    Используется load-балансером / мониторингом.
    """
    db_ok = await check_db_connection()
    status_code = 200 if db_ok else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ok" if db_ok else "degraded",
            "database": "connected" if db_ok else "unreachable",
            "env": settings.APP_ENV,
        },
    )


@app.get("/", tags=["meta"], include_in_schema=False)
async def root():
    return {"message": "Genealogy Platform API", "docs": "/docs"}
