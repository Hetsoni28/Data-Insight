from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, and_
from datetime import datetime, timedelta, timezone

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.audit_log import AuditLog

router = APIRouter()

async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, 'role', '') != 'owner' and not getattr(current_user, 'is_owner', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    total_events = await db.scalar(select(func.count(AuditLog.id)))
    today_events = await db.scalar(select(func.count(AuditLog.id)).where(AuditLog.created_at >= today_start))
    critical_events = await db.scalar(select(func.count(AuditLog.id)).where(AuditLog.severity == 'critical'))
    failed_events = await db.scalar(select(func.count(AuditLog.id)).where(AuditLog.status == 'failure'))
    
    # Active modules calculation
    module_counts_res = await db.execute(
        select(AuditLog.module, func.count(AuditLog.id))
        .group_by(AuditLog.module)
    )
    module_counts = {row[0]: row[1] for row in module_counts_res.all()}

    return {
        "kpis": {
            "total_events": total_events or 0,
            "today_events": today_events or 0,
            "critical_events": critical_events or 0,
            "failed_events": failed_events or 0,
            "module_counts": module_counts
        }
    }

@router.get("/events")
async def get_events(
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    module: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    query = select(AuditLog)
    
    if module:
        query = query.where(AuditLog.module == module)
    if severity:
        query = query.where(AuditLog.severity == severity)
    if search:
        query = query.where(or_(
            AuditLog.action.ilike(f"%{search}%"),
            AuditLog.ip_address.ilike(f"%{search}%"),
            AuditLog.correlation_id.ilike(f"%{search}%")
        ))
        
    # Count total matching
    total_count = await db.scalar(select(func.count()).select_from(query.subquery()))
    
    # Apply pagination and sorting
    query = query.order_by(desc(AuditLog.created_at)).limit(limit).offset(offset)
    result = await db.execute(query)
    events = result.scalars().all()
    
    return {
        "total": total_count or 0,
        "events": [
            {
                "id": str(e.id),
                "action": e.action,
                "module": e.module,
                "severity": e.severity,
                "status": e.status,
                "ip_address": e.ip_address,
                "user_id": str(e.user_id) if e.user_id else None,
                "actor_user_id": str(e.actor_user_id) if e.actor_user_id else None,
                "correlation_id": e.correlation_id,
                "old_value": e.old_value,
                "new_value": e.new_value,
                "created_at": e.created_at.isoformat()
            }
            for e in events
        ]
    }

@router.get("/timeline")
async def get_timeline(
    limit: int = Query(20, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    # Fetch only significant events (warnings, critical, or specific modules) for the timeline
    query = select(AuditLog).where(
        or_(
            AuditLog.severity.in_(['warning', 'critical']),
            AuditLog.module.in_(['authentication', 'billing', 'security'])
        )
    ).order_by(desc(AuditLog.created_at)).limit(limit)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return {
        "timeline": [
            {
                "id": str(e.id),
                "action": e.action,
                "module": e.module,
                "severity": e.severity,
                "status": e.status,
                "created_at": e.created_at.isoformat()
            }
            for e in events
        ]
    }
