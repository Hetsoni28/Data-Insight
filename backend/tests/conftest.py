"""
Pytest conftest.py — Shared test fixtures for all tests.
These fixtures are available in all test files without importing.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_async_session
from app.core.config import settings

# ─── In-Memory SQLite Engine for Tests ───────────────────────────────────────
# Uses SQLite in-memory database — no Postgres required for unit tests
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB

@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(element, compiler, **kw):
    return "JSON"

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ─── Database Fixtures ────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def test_db():
    """
    Creates a fresh in-memory database for each test function.
    Tables are created before the test and dropped after.
    """
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# ─── HTTP Client Fixture ──────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession):
    """
    Provides an async HTTP test client with the DB dependency overridden
    to use the in-memory test database.
    """
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_async_session] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ─── Auth Fixtures ────────────────────────────────────────────────────────────
@pytest.fixture
def mock_tenant_id() -> str:
    return "tenant_test_00000000-0000-0000-0000-000000000001"


@pytest.fixture
def mock_user_id() -> str:
    return "user_test_00000000-0000-0000-0000-000000000001"
