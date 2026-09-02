from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter()


async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, "role", "") != "owner" and not getattr(
        current_user, "is_owner", False,
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner),
) -> Any:
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0,
    )

    total_events = await db.scalar(select(func.count(AuditLog.id)))
    today_events = await db.scalar(
        select(func.count(AuditLog.id)).where(AuditLog.created_at >= today_start),
    )
    critical_events = await db.scalar(
        select(func.count(AuditLog.id)).where(AuditLog.severity == "critical"),
    )
    failed_events = await db.scalar(
        select(func.count(AuditLog.id)).where(AuditLog.status == "failure"),
    )

    # Active modules calculation
    module_counts_res = await db.execute(
        select(AuditLog.module, func.count(AuditLog.id)).group_by(AuditLog.module),
    )
    module_counts = {row[0]: row[1] for row in module_counts_res.all()}

    return {
        "kpis": {
            "total_events": total_events or 0,
            "today_events": today_events or 0,
            "critical_events": critical_events or 0,
            "failed_events": failed_events or 0,
            "module_counts": module_counts,
        },
    }


@router.get("/events")
async def get_events(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    module: str | None = None,
    severity: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
) -> Any:
    query = select(AuditLog)

    if module:
        query = query.where(AuditLog.module == module)
    if severity:
        query = query.where(AuditLog.severity == severity)
    if search:
        query = query.where(
            or_(
                AuditLog.action.ilike(f"%{search}%"),
                AuditLog.ip_address.ilike(f"%{search}%"),
                AuditLog.correlation_id.ilike(f"%{search}%"),
            ),
        )

    # Count total matching
    total_count = await db.scalar(select(func.count()).select_from(query.subquery()))

    # Apply pagination and sorting
    query = query.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset)

    # Eager load the actor user if needed, or join manually. We will do a manual join to get specific fields.
    # To keep it simple, we'll fetch the users separately or join. Let's do a join.
    stmt = (
        select(AuditLog, User.full_name, User.email, User.avatar_url)
        .outerjoin(User, User.id == AuditLog.actor_user_id)
        .where(AuditLog.id.in_(select(AuditLog.id).select_from(query.subquery())))
        .order_by(desc(AuditLog.created_at))
    )

    result = await db.execute(stmt)
    rows = result.all()

    return {
        "total": total_count or 0,
        "events": [
            {
                "id": str(e.AuditLog.id),
                "action": e.AuditLog.action,
                "module": e.AuditLog.module,
                "severity": e.AuditLog.severity,
                "status": e.AuditLog.status,
                "ip_address": e.AuditLog.ip_address,
                "user_id": str(e.AuditLog.user_id) if e.AuditLog.user_id else None,
                "actor_user_id": (
                    str(e.AuditLog.actor_user_id) if e.AuditLog.actor_user_id else None
                ),
                "actor_name": e.full_name or "System",
                "actor_email": e.email or "system@platform",
                "actor_avatar": e.avatar_url,
                "correlation_id": e.AuditLog.correlation_id,
                "old_value": e.AuditLog.old_value,
                "new_value": e.AuditLog.new_value,
                "created_at": e.AuditLog.created_at.isoformat(),
            }
            for e in rows
        ],
    }


@router.get("/timeline")
async def get_timeline(
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
) -> Any:
    # Fetch only significant events (warnings, critical, or specific modules) for the timeline
    query = (
        select(AuditLog, User.full_name, User.email, User.avatar_url)
        .outerjoin(User, User.id == AuditLog.actor_user_id)
        .where(
            or_(
                AuditLog.severity.in_(["warning", "critical"]),
                AuditLog.module.in_(["authentication", "billing", "security"]),
            ),
        )
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )

    result = await db.execute(query)
    rows = result.all()

    return {
        "timeline": [
            {
                "id": str(e.AuditLog.id),
                "action": e.AuditLog.action,
                "module": e.AuditLog.module,
                "severity": e.AuditLog.severity,
                "status": e.AuditLog.status,
                "actor_name": e.full_name or "System",
                "actor_email": e.email or "system@platform",
                "actor_avatar": e.avatar_url,
                "created_at": e.AuditLog.created_at.isoformat(),
            }
            for e in rows
        ],
    }
