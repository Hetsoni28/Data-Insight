"""Tenant (organization) management, DB routing, and quota usage endpoints."""

import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.api.deps import (
    get_db,
    get_redis,
    get_current_user,
    get_current_active_tenant_user,
    RequireRole,
)
from app.models.user import User
from app.models.tenant import DBConnectionType
from app.schemas.tenant import (
    TenantCreateRequest,
    TenantUpdateRequest,
    TenantResponse,
    TenantUsageResponse,
    DatabaseConnectionTestRequest,
    DatabaseConnectionTestResponse,
    TenantDatabaseConfigRequest,
)
from app.services.tenant import TenantService
from app.services.quota_service import QuotaService
from app.db.router import TenantDatabaseRouter, db_router
from app.core.exceptions import ForbiddenException, ValidationException

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post(
    "",
    response_model=TenantResponse,
    status_code=201,
    summary="Create a new organization",
)
async def create_tenant(
    body: TenantCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    return await svc.create_tenant(name=body.name, owner=current_user, plan=body.plan)


@router.get("/me", response_model=TenantResponse, summary="Get my organization details")
async def get_my_tenant(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    return await svc.get_tenant(current_user.tenant_id)


@router.patch("/me", response_model=TenantResponse, summary="Update my organization")
async def update_my_tenant(
    body: TenantUpdateRequest,
    current_user: User = Depends(RequireRole(["owner", "org_admin"])),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    tenant = await svc.get_tenant(current_user.tenant_id)
    return await svc.update_tenant(
        tenant, body.model_dump(exclude_none=True), actor=current_user
    )


# ─── Quota & Real-Time Usage Endpoint ─────────────────────────────────────────
@router.get(
    "/me/usage",
    response_model=TenantUsageResponse,
    summary="Get organization quota usage breakdown",
)
async def get_tenant_usage(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    """Returns storage (MB/GB), monthly AI token consumption, and seat allocation analytics."""
    quota_svc = QuotaService(db, redis)
    return await quota_svc.get_usage_summary(current_user.tenant_id)


# ─── Database Isolation & Routing Endpoints ───────────────────────────────────
@router.post(
    "/me/database/test-connection",
    response_model=DatabaseConnectionTestResponse,
    summary="Test dedicated enterprise database connection",
)
async def test_dedicated_db_connection(
    body: DatabaseConnectionTestRequest,
    current_user: User = Depends(RequireRole(["owner", "org_admin"])),
):
    """Verifies reachability and query latency for an isolated Supabase/PostgreSQL instance."""
    success, error, latency_ms = await TenantDatabaseRouter.test_connection(body.db_url)
    return DatabaseConnectionTestResponse(
        success=success,
        latency_ms=latency_ms,
        message=(
            "Database connection verified successfully."
            if success
            else "Failed to connect to database."
        ),
        error=error,
    )


@router.put(
    "/me/database",
    response_model=TenantResponse,
    summary="Configure dedicated enterprise database routing",
)
async def configure_tenant_database(
    body: TenantDatabaseConfigRequest,
    current_user: User = Depends(RequireRole(["owner", "org_admin"])),
    db: AsyncSession = Depends(get_db),
):
    """
    Switch tenant database routing between shared pool and dedicated enterprise VPC.
    Tests connection before activating dedicated routing.
    """
    svc = TenantService(db)
    tenant = await svc.get_tenant(current_user.tenant_id)

    if body.db_connection_type == "dedicated":
        if not body.dedicated_db_url:
            raise ValidationException(
                "A dedicated database connection URL is required for dedicated mode."
            )
        if tenant.plan not in ("enterprise", "custom") and not current_user.is_owner:
            raise ForbiddenException(
                "Dedicated database isolation is exclusively available on Enterprise plans."
            )

        # Test connection health first
        success, error, _ = await TenantDatabaseRouter.test_connection(
            body.dedicated_db_url
        )
        if not success:
            raise ValidationException(f"Cannot activate dedicated database: {error}")

        tenant.db_connection_type = DBConnectionType.dedicated
        tenant.dedicated_db_url = body.dedicated_db_url
    else:
        tenant.db_connection_type = DBConnectionType.shared
        tenant.dedicated_db_url = None

    # Evict cached engine to force reload
    await db_router.evict_tenant_engine(tenant.id)
    await db.commit()
    await db.refresh(tenant)
    return tenant
