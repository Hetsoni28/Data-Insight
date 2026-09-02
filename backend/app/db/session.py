# app/db/session.py
import sys

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings

# ─── Async Engine ─────────────────────────────────────────────────────────────
# If running inside Celery, we MUST use NullPool because celery uses asyncio.run()
# for each task, creating a new event loop. Using QueuePool will result in
# "Future attached to a different loop" errors when connections are reused.
is_celery = "celery" in sys.argv[0]

engine_kwargs = {
    "echo": (settings.APP_ENV == "development"),
    "pool_pre_ping": True,
}

if is_celery:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 3
    engine_kwargs["max_overflow"] = 2

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)


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
    """All SQLAlchemy ORM models inherit from this Base.
    Import this in every model file.
    """



# ─── Session Dependency (FastAPI) ────────────────────────────────────────────
async def get_async_session():
    """FastAPI dependency that provides a scoped AsyncSession.
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
