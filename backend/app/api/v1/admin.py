"""Super-admin panel endpoints."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.api.deps import get_db, get_current_superuser
from app.models.user import User
from app.models.tenant import Tenant
from app.models.ai_token_usage import AITokenUsage
from app.repositories.tenant import TenantRepository
from app.repositories.audit_log import AuditLogRepository

router = APIRouter(prefix="/admin", tags=["Admin"])


class ImpersonateRequest(BaseModel):
    reason: str


@router.get("/tenants", summary="List all tenant organizations")
async def list_tenants(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    stmt = select(Tenant).where(Tenant.is_deleted == False).order_by(Tenant.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(stmt)
    tenants = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "plan": t.plan,
            "is_active": t.is_active,
            "created_at": t.created_at.isoformat(),
        }
        for t in tenants
    ]


@router.get("/tenants/{tenant_id}/stats", summary="Tenant usage statistics")
async def tenant_stats(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    from app.models.dataset import Dataset
    from app.models.report import Report

    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(tenant_id)
    if not tenant:
        from app.core.exceptions import ResourceNotFoundException
        raise ResourceNotFoundException("Tenant", str(tenant_id))

    # User count
    user_count_stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id, User.is_active == True)
    user_count = (await db.execute(user_count_stmt)).scalar_one()

    # Dataset count
    ds_count_stmt = select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)
    ds_count = (await db.execute(ds_count_stmt)).scalar_one()

    # Report count
    rp_count_stmt = select(func.count(Report.id)).where(Report.tenant_id == tenant_id, Report.is_deleted == False)
    rp_count = (await db.execute(rp_count_stmt)).scalar_one()

    # AI token usage this month
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    from sqlalchemy import and_
    token_stmt = select(func.coalesce(func.sum(AITokenUsage.total_tokens), 0)).where(
        and_(
            AITokenUsage.tenant_id == tenant_id,
            func.extract("month", AITokenUsage.created_at) == now.month,
            func.extract("year", AITokenUsage.created_at) == now.year,
        )
    )
    tokens_used = (await db.execute(token_stmt)).scalar_one()

    # Cost this month
    cost_stmt = select(func.coalesce(func.sum(AITokenUsage.cost_usd), 0)).where(
        and_(
            AITokenUsage.tenant_id == tenant_id,
            func.extract("month", AITokenUsage.created_at) == now.month,
            func.extract("year", AITokenUsage.created_at) == now.year,
        )
    )
    cost_usd = (await db.execute(cost_stmt)).scalar_one()

    return {
        "tenant_id": str(tenant_id),
        "tenant_name": tenant.name,
        "plan": tenant.plan,
        "users": user_count,
        "max_users": tenant.max_users,
        "datasets": ds_count,
        "reports": rp_count,
        "ai_tokens_this_month": int(tokens_used),
        "ai_tokens_quota": tenant.max_ai_tokens_per_month,
        "ai_cost_usd_this_month": round(float(cost_usd), 4),
    }


@router.post("/tenants/{tenant_id}/impersonate/{user_id}", summary="Impersonate a tenant user (audit-logged)")
async def impersonate_user(
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    body: ImpersonateRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_superuser),
):
    audit_repo = AuditLogRepository(db)
    from app.repositories.user import UserRepository
    from app.core.security import create_access_token
    from datetime import timedelta

    user_repo = UserRepository(db)
    target_user = await user_repo.get_by_id(user_id)
    if not target_user or str(target_user.tenant_id) != str(tenant_id):
        from app.core.exceptions import ResourceNotFoundException
        raise ResourceNotFoundException("User", str(user_id))

    # Log the impersonation with actor info
    await audit_repo.log(
        "admin.impersonate",
        tenant_id=tenant_id,
        user_id=target_user.id,
        actor_user_id=admin.id,
        resource_type="user",
        resource_id=str(user_id),
        extra_metadata={"reason": body.reason, "admin_email": admin.email},
    )

    # Issue a short-lived token for impersonation (1 hour)
    token = create_access_token(subject=str(target_user.id), expires_delta=timedelta(hours=1))
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 3600,
        "impersonating": target_user.email,
        "note": "This session is audited. The tenant user has been notified.",
    }


@router.get("/audit-logs", summary="View platform-wide audit logs")
async def get_audit_logs(
    tenant_id: uuid.UUID | None = None,
    action: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_superuser),
):
    audit_repo = AuditLogRepository(db)
    if tenant_id:
        logs = await audit_repo.get_tenant_logs(tenant_id, action=action, limit=limit)
    else:
        from app.models.audit_log import AuditLog
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if action:
            stmt = stmt.where(AuditLog.action == action)
        result = await db.execute(stmt)
        logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "action": log.action,
            "tenant_id": str(log.tenant_id) if log.tenant_id else None,
            "user_id": str(log.user_id) if log.user_id else None,
            "actor_user_id": str(log.actor_user_id) if log.actor_user_id else None,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "status": log.status,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
