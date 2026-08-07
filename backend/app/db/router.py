"""Enterprise Dynamic Database Connection Router.

Supports multi-tier database isolation:
- Shared Database: Default PostgreSQL pool with tenant-level RLS / schema partitioning.
- Dedicated Database: Dynamic engine pooling for Enterprise tenants with isolated Supabase/PostgreSQL instances.
"""

from __future__ import annotations
import asyncio
import time
import uuid
from typing import AsyncGenerator, Dict, Optional, Tuple
from contextlib import asynccontextmanager
from loguru import logger
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text

from app.core.config import settings
from app.core.tenant_context import get_tenant_context, TenantContext
from app.db.session import engine as shared_engine, AsyncSessionLocal as SharedAsyncSessionLocal


def normalize_db_url(url: str) -> str:
    """Normalize database connection string to asyncpg driver."""
    url = url.strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class TenantDatabaseRouter:
    """Manages dynamic connection pools for shared and dedicated tenant databases."""

    _instance: Optional[TenantDatabaseRouter] = None
    _lock = asyncio.Lock()

    def __init__(self):
        # Cache dedicated engines and sessionmakers keyed by tenant_id string
        self._dedicated_engines: Dict[str, AsyncEngine] = {}
        self._dedicated_sessionmakers: Dict[str, async_sessionmaker[AsyncSession]] = {}
        self._engine_created_at: Dict[str, float] = {}

    @classmethod
    def get_instance(cls) -> TenantDatabaseRouter:
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _build_engine(self, db_url: str) -> AsyncEngine:
        """Create a optimized async engine for a dedicated tenant database."""
        async_url = normalize_db_url(db_url)
        return create_async_engine(
            async_url,
            echo=(settings.APP_ENV == "development"),
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=5,
            pool_recycle=1800,
            pool_timeout=30,
        )

    async def get_engine_for_tenant(
        self, tenant_id: Optional[uuid.UUID], dedicated_url: Optional[str] = None
    ) -> AsyncEngine:
        """Retrieve the dedicated engine for a tenant or fall back to shared engine."""
        if not tenant_id or not dedicated_url:
            return shared_engine

        key = str(tenant_id)
        if key in self._dedicated_engines:
            return self._dedicated_engines[key]

        async with self._lock:
            if key in self._dedicated_engines:
                return self._dedicated_engines[key]

            logger.info(f"[DB Router] Initializing dedicated engine pool for tenant: {tenant_id}")
            engine = self._build_engine(dedicated_url)
            session_factory = async_sessionmaker(
                bind=engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
                autocommit=False,
            )
            self._dedicated_engines[key] = engine
            self._dedicated_sessionmakers[key] = session_factory
            self._engine_created_at[key] = time.time()
            return engine

    async def get_sessionmaker_for_tenant(
        self, tenant_id: Optional[uuid.UUID], dedicated_url: Optional[str] = None
    ) -> async_sessionmaker[AsyncSession]:
        """Retrieve the session factory for a tenant or fall back to shared sessionmaker."""
        if not tenant_id or not dedicated_url:
            return SharedAsyncSessionLocal

        key = str(tenant_id)
        if key in self._dedicated_sessionmakers:
            return self._dedicated_sessionmakers[key]

        # Ensure engine is created under lock
        await self.get_engine_for_tenant(tenant_id, dedicated_url)
        return self._dedicated_sessionmakers[key]

    async def evict_tenant_engine(self, tenant_id: uuid.UUID) -> None:
        """Dispose and evict a dedicated tenant's connection pool from cache."""
        key = str(tenant_id)
        async with self._lock:
            if key in self._dedicated_engines:
                engine = self._dedicated_engines.pop(key, None)
                self._dedicated_sessionmakers.pop(key, None)
                self._engine_created_at.pop(key, None)
                if engine:
                    logger.info(f"[DB Router] Disposing dedicated engine pool for tenant: {tenant_id}")
                    await engine.dispose()

    async def dispose_all(self) -> None:
        """Dispose all dedicated engines on server shutdown."""
        async with self._lock:
            logger.info(f"[DB Router] Disposing {len(self._dedicated_engines)} dedicated connection pools...")
            for key, engine in list(self._dedicated_engines.items()):
                try:
                    await engine.dispose()
                except Exception as e:
                    logger.warning(f"[DB Router] Error disposing engine for {key}: {e}")
            self._dedicated_engines.clear()
            self._dedicated_sessionmakers.clear()
            self._engine_created_at.clear()
            logger.info("[DB Router] All dedicated connection pools disposed.")

    @staticmethod
    async def test_connection(db_url: str) -> Tuple[bool, Optional[str], float]:
        """
        Test reachability and measure query latency for a dedicated database connection.
        Returns: (success: bool, error_message: str | None, latency_ms: float)
        """
        start_time = time.perf_counter()
        normalized = normalize_db_url(db_url)
        test_engine = create_async_engine(
            normalized,
            pool_pre_ping=True,
            connect_args={"timeout": 10},
        )
        try:
            async with test_engine.connect() as conn:
                res = await conn.execute(text("SELECT 1 AS alive"))
                row = res.scalar()
                latency_ms = (time.perf_counter() - start_time) * 1000.0
                if row == 1:
                    return True, None, round(latency_ms, 2)
                return False, "Database test query returned unexpected result.", round(latency_ms, 2)
        except Exception as e:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            return False, str(e), round(latency_ms, 2)
        finally:
            await test_engine.dispose()


# Global Router instance
db_router = TenantDatabaseRouter.get_instance()


@asynccontextmanager
async def get_tenant_db_session(
    tenant_id: Optional[uuid.UUID] = None,
    dedicated_url: Optional[str] = None,
) -> AsyncGenerator[AsyncSession, None]:
    """Context manager yielding a transactional AsyncSession routed for the specific tenant."""
    session_factory = await db_router.get_sessionmaker_for_tenant(
        tenant_id=tenant_id, dedicated_url=dedicated_url
    )
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
