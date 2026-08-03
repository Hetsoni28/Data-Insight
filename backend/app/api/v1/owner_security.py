import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.security import SecurityEvent, ThreatIntelligence, ComplianceReport
from app.models.user_session import UserSession

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
    # KPI Logic
    active_sessions = await db.scalar(select(func.count(UserSession.id)).where(UserSession.is_active == True))
    blocked_ips = await db.scalar(select(func.count(ThreatIntelligence.id)).where(ThreatIntelligence.is_blocked == True))
    critical_events = await db.scalar(select(func.count(SecurityEvent.id)).where(SecurityEvent.severity == 'critical', SecurityEvent.resolved == False))
    total_events = await db.scalar(select(func.count(SecurityEvent.id)))
    
    # Calculate a rough security score based on unresolved critical events and active blocked threats
    base_score = 100.0
    deduction = (critical_events or 0) * 5
    security_score = max(0.0, base_score - deduction)

    return {
        "kpis": {
            "security_score": security_score,
            "active_sessions": active_sessions or 0,
            "blocked_ips": blocked_ips or 0,
            "critical_events": critical_events or 0,
            "total_events": total_events or 0,
        }
    }

@router.get("/events")
async def get_security_events(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(SecurityEvent).order_by(desc(SecurityEvent.created_at)).limit(limit))
    events = result.scalars().all()
    
    return {
        "events": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "severity": e.severity,
                "ip_address": e.ip_address,
                "location": e.location,
                "actor": e.actor,
                "metadata": e.metadata_,
                "resolved": e.resolved,
                "created_at": e.created_at.isoformat()
            }
            for e in events
        ]
    }

@router.get("/threats")
async def get_threats(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(ThreatIntelligence).order_by(desc(ThreatIntelligence.last_seen_at)).limit(limit))
    threats = result.scalars().all()
    
    return {
        "threats": [
            {
                "id": str(t.id),
                "indicator_value": t.indicator_value,
                "indicator_type": t.indicator_type,
                "threat_type": t.threat_type,
                "country": t.country,
                "reputation_score": t.reputation_score,
                "is_blocked": t.is_blocked,
                "last_seen_at": t.last_seen_at.isoformat()
            }
            for t in threats
        ]
    }

@router.get("/sessions")
async def get_sessions(
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    stmt = (
        select(UserSession, User)
        .join(User, UserSession.user_id == User.id)
        .where(UserSession.is_active == True)
        .order_by(desc(UserSession.last_active_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    return {
        "sessions": [
            {
                "id": str(s.id),
                "user_id": str(s.user_id),
                "user_email": u.email,
                "user_name": u.full_name,
                "user_role": u.role,
                "device_name": s.device_name or "Desktop",
                "os": s.os or "Windows",
                "browser": s.browser or "Browser",
                "ip_address": s.ip_address or "127.0.0.1",
                "location": s.location or "Localhost",
                "last_active_at": s.last_active_at.isoformat(),
                "created_at": s.created_at.isoformat()
            }
            for s, u in rows
        ]
    }

@router.get("/compliance")
async def get_compliance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    result = await db.execute(select(ComplianceReport))
    reports = result.scalars().all()
    
    return {
        "reports": [
            {
                "id": str(r.id),
                "framework": r.framework,
                "status": r.status,
                "score": r.score,
                "controls_passed": r.controls_passed,
                "controls_failed": r.controls_failed,
                "last_audit_at": r.last_audit_at.isoformat() if r.last_audit_at else None
            }
            for r in reports
        ]
    }

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner)
) -> Any:
    """Revoke an active user session (force logout)."""
    result = await db.execute(
        select(UserSession).where(UserSession.id == session_id)
    )
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    await db.commit()
    
    return {"status": "success", "message": "Session revoked successfully"}
