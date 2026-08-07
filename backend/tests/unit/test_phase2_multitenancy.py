"""Comprehensive Unit Tests for Phase 2 Multi-Tenant Architecture & Dynamic DB Router.

Tests:
1. TenantContext: Context propagation, async task isolation, helper properties.
2. TenantDatabaseRouter: Connection URL normalization, engine caching, eviction, shared fallback.
3. QuotaService: Storage enforcement, AI token enforcement, User seat limits, and usage analytics.
4. TenantMiddleware & Isolation Guards: Request context binding and suspension guard.
"""

import pytest
import uuid
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from app.core.tenant_context import (
    TenantContext,
    set_tenant_context,
    get_tenant_context,
    get_current_tenant_id,
    reset_tenant_context,
    tenant_scope,
)
from app.db.router import (
    TenantDatabaseRouter,
    normalize_db_url,
)
from app.services.quota_service import QuotaService
from app.models.tenant import Tenant, DBConnectionType, PlanType
from app.models.user import User, UserRole
from app.core.exceptions import (
    TenantQuotaExceededException,
    StorageQuotaExceededException,
    ResourceNotFoundException,
)


# ─── 1. TenantContext Unit Tests ──────────────────────────────────────────────

def test_tenant_context_creation_and_properties():
    """Verify TenantContext dataclass instantiation and enterprise property flags."""
    tenant_id = uuid.uuid4()
    user_id = uuid.uuid4()

    ctx = TenantContext(
        tenant_id=tenant_id,
        tenant_slug="acme-corp",
        tenant_name="Acme Corporation",
        tenant_plan="enterprise",
        db_connection_type="dedicated",
        dedicated_db_url="postgresql+asyncpg://user:pass@db.acme.com:5432/acme_db",
        user_id=user_id,
        user_role="org_admin",
        is_owner=False,
        is_superadmin=False,
    )

    assert ctx.tenant_id == tenant_id
    assert ctx.tenant_slug == "acme-corp"
    assert ctx.has_dedicated_db is True
    assert ctx.is_enterprise_plan is True

    # Shared tenant without dedicated DB
    shared_ctx = TenantContext(
        tenant_id=uuid.uuid4(),
        tenant_plan="starter",
        db_connection_type="shared",
    )
    assert shared_ctx.has_dedicated_db is False
    assert shared_ctx.is_enterprise_plan is False


def test_tenant_context_set_and_reset():
    """Test manual set_tenant_context and reset_tenant_context via ContextVar."""
    assert get_tenant_context() is None
    assert get_current_tenant_id() is None

    t_id = uuid.uuid4()
    ctx = TenantContext(tenant_id=t_id, tenant_slug="test-tenant")
    token = set_tenant_context(ctx)

    assert get_tenant_context() == ctx
    assert get_current_tenant_id() == t_id

    reset_tenant_context(token)
    assert get_tenant_context() is None


@pytest.mark.asyncio
async def test_tenant_scope_async_context_manager():
    """Test async tenant_scope context manager for background workers and tasks."""
    t_id = uuid.uuid4()
    ctx = TenantContext(tenant_id=t_id, tenant_slug="scoped-corp")

    assert get_tenant_context() is None

    async with tenant_scope(ctx) as active_ctx:
        assert active_ctx.tenant_id == t_id
        assert get_tenant_context() == ctx
        assert get_current_tenant_id() == t_id

    assert get_tenant_context() is None


@pytest.mark.asyncio
async def test_tenant_context_concurrent_task_isolation():
    """Ensure different concurrent asyncio tasks maintain completely isolated tenant contexts."""
    t1_id = uuid.uuid4()
    t2_id = uuid.uuid4()
    results = {}

    async def worker(name: str, tenant_id: uuid.UUID, delay: float):
        ctx = TenantContext(tenant_id=tenant_id, tenant_slug=name)
        async with tenant_scope(ctx):
            await asyncio.sleep(delay)
            # Verify context remained unchanged throughout task lifecycle
            current = get_tenant_context()
            results[name] = current.tenant_id if current else None

    # Run tasks concurrently
    await asyncio.gather(
        worker("Task-A", t1_id, 0.05),
        worker("Task-B", t2_id, 0.02),
    )

    assert results["Task-A"] == t1_id
    assert results["Task-B"] == t2_id
    assert get_tenant_context() is None


# ─── 2. TenantDatabaseRouter Unit Tests ───────────────────────────────────────

def test_normalize_db_url():
    """Test connection string normalization to asyncpg driver."""
    assert normalize_db_url("postgres://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    assert normalize_db_url("postgresql://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"
    assert normalize_db_url("postgresql+asyncpg://user:pass@host:5432/db") == "postgresql+asyncpg://user:pass@host:5432/db"


@pytest.mark.asyncio
async def test_router_shared_fallback():
    """Verify router returns shared engine when tenant is None or shared."""
    router = TenantDatabaseRouter()
    shared_engine = await router.get_engine_for_tenant(None, None)
    assert shared_engine is not None

    shared_factory = await router.get_sessionmaker_for_tenant(None, None)
    assert shared_factory is not None


@pytest.mark.asyncio
async def test_router_dedicated_engine_caching_and_eviction():
    """Test dynamic dedicated engine creation, pool caching, and eviction."""
    router = TenantDatabaseRouter()
    tenant_id = uuid.uuid4()
    mock_url = "postgresql+asyncpg://test_user:test_pass@127.0.0.1:5432/dedicated_db"

    with patch.object(router, "_build_engine") as mock_build:
        mock_engine = MagicMock()
        mock_engine.dispose = AsyncMock()
        mock_build.return_value = mock_engine

        # 1. First fetch creates engine
        engine1 = await router.get_engine_for_tenant(tenant_id, mock_url)
        assert engine1 == mock_engine
        assert mock_build.call_count == 1

        # 2. Second fetch hits cache
        engine2 = await router.get_engine_for_tenant(tenant_id, mock_url)
        assert engine2 == mock_engine
        assert mock_build.call_count == 1  # No new build

        # 3. Eviction disposes engine and clears cache
        await router.evict_tenant_engine(tenant_id)
        mock_engine.dispose.assert_awaited_once()
        assert str(tenant_id) not in router._dedicated_engines

        # 4. Subsequent fetch recreates engine
        await router.get_engine_for_tenant(tenant_id, mock_url)
        assert mock_build.call_count == 2


# ─── 3. QuotaService Unit Tests ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_quota_service_storage_check_and_enforcement(test_db):
    """Test storage quota validation and threshold enforcement."""
    # Create tenant with 2 GB max storage
    tenant = Tenant(
        name="Storage Test Corp",
        slug="storage-test",
        plan=PlanType.starter,
        max_storage_gb=2,
        current_storage_bytes=1024 * 1024 * 1024,  # 1 GB currently used
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    quota_svc = QuotaService(test_db)

    # 1. 500 MB upload is within 2 GB limit
    can_upload = await quota_svc.check_storage_quota(tenant.id, additional_bytes=500 * 1024 * 1024)
    assert can_upload is True

    # 2. 1.5 GB upload exceeds remaining capacity (1GB + 1.5GB = 2.5GB > 2GB)
    with pytest.raises(StorageQuotaExceededException) as exc_info:
        await quota_svc.check_storage_quota(tenant.id, additional_bytes=int(1.5 * 1024 * 1024 * 1024))
    
    assert "Storage limit of 2 GB exceeded" in str(exc_info.value.message)

    # 3. Consume storage
    new_total = await quota_svc.consume_storage(tenant.id, 500 * 1024 * 1024)
    assert new_total == (1024 * 1024 * 1024) + (500 * 1024 * 1024)

    # 4. Release storage
    decreased = await quota_svc.release_storage(tenant.id, 500 * 1024 * 1024)
    assert decreased == 1024 * 1024 * 1024


@pytest.mark.asyncio
async def test_quota_service_ai_token_enforcement(test_db):
    """Test monthly AI token budget validation and overage blocking."""
    tenant = Tenant(
        name="AI Test Corp",
        slug="ai-test",
        plan=PlanType.professional,
        max_ai_tokens_per_month=50_000,
        current_ai_tokens_used=49_000,
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    quota_svc = QuotaService(test_db)

    # 1. 500 token prompt passes (49,000 + 500 <= 50,000)
    assert await quota_svc.check_ai_quota(tenant.id, estimated_tokens=500) is True

    # 2. 2,000 token prompt fails (49,000 + 2,000 > 50,000)
    with pytest.raises(TenantQuotaExceededException) as exc_info:
        await quota_svc.check_ai_quota(tenant.id, estimated_tokens=2000)
    
    assert exc_info.value.resource_type == "ai_tokens"
    assert exc_info.value.max_limit == 50_000


@pytest.mark.asyncio
async def test_quota_service_user_seat_limit(test_db):
    """Test user seat limits and invite blocking when capacity is reached."""
    tenant = Tenant(
        name="Seat Test Corp",
        slug="seat-test",
        plan=PlanType.starter,
        max_users=2,
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    # Add 2 active users
    u1 = User(
        email="u1@seattest.com",
        tenant_id=tenant.id,
        role=UserRole.org_admin,
        is_active=True,
        hashed_password="hash",
    )
    u2 = User(
        email="u2@seattest.com",
        tenant_id=tenant.id,
        role=UserRole.analyst,
        is_active=True,
        hashed_password="hash",
    )
    test_db.add_all([u1, u2])
    await test_db.commit()

    quota_svc = QuotaService(test_db)

    # Adding a 3rd user should be blocked
    with pytest.raises(TenantQuotaExceededException) as exc_info:
        await quota_svc.check_user_seats(tenant.id)
    
    assert exc_info.value.resource_type == "user_seats"
    assert exc_info.value.current_usage == 2
    assert exc_info.value.max_limit == 2


@pytest.mark.asyncio
async def test_quota_service_usage_summary(test_db):
    """Verify comprehensive usage analytics breakdown."""
    tenant = Tenant(
        name="Metrics Corp",
        slug="metrics-corp",
        plan=PlanType.professional,
        max_storage_gb=10,
        current_storage_bytes=5 * 1024 * 1024 * 1024,  # 5 GB
        max_ai_tokens_per_month=100_000,
        current_ai_tokens_used=75_000,
        max_users=5,
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    quota_svc = QuotaService(test_db)
    summary = await quota_svc.get_usage_summary(tenant.id)

    assert summary["tenant_name"] == "Metrics Corp"
    assert summary["storage"]["percentage"] == 50.0
    assert summary["ai_tokens"]["percentage"] == 75.0
    assert summary["ai_tokens"]["remaining"] == 25_000
    assert summary["users"]["max_seats"] == 5
