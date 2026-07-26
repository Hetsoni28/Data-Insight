# app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from contextlib import asynccontextmanager
from app.core.config import settings

# ─── Async Engine ─────────────────────────────────────────────────────────────
# Uses Supabase Session-mode pooler (port 5432) which supports prepared statements
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),  # Log SQL in dev only
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)


# ─── Session Factory ──────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevents lazy-loading issues after commit
    autoflush=False,
    autocommit=False,
)


# ─── Base Model ───────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """
    All SQLAlchemy ORM models inherit from this Base.
    Import this in every model file.
    """
    pass


# ─── Session Dependency (FastAPI) ────────────────────────────────────────────
async def get_async_session():
    """
    FastAPI dependency that provides a scoped AsyncSession.
    Automatically commits on success and rolls back on exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
