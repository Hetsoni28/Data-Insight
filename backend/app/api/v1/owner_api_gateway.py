import uuid
from typing import Any
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.api_gateway import (
    ApiRequestLog,
    OAuthClient,
    ApiRateLimit,
    ApiIntegration,
)
from app.models.api_key import ApiKey
from app.models.security import ThreatIntelligence

router = APIRouter(tags=["owner-api-gateway"])


def require_owner(current_user: User = Depends(get_current_user)):
    # UserRole is a plain class with string constants, owner = "owner"
    # Also accept is_owner flag as fallback for platform owners
    if current_user.role != UserRole.owner and not current_user.is_owner:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get live KPIs for the API Gateway."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total requests in last 30 days
    total_req_result = await db.execute(
        select(func.count(ApiRequestLog.id)).where(
            ApiRequestLog.created_at >= thirty_days_ago
        )
    )
    total_requests = total_req_result.scalar_one_or_none() or 0

    # Today's requests
    today_req_result = await db.execute(
        select(func.count(ApiRequestLog.id)).where(ApiRequestLog.created_at >= today)
    )
    today_requests = today_req_result.scalar_one_or_none() or 0

    # Errors in last 30 days
    error_req_result = await db.execute(
        select(func.count(ApiRequestLog.id)).where(
            and_(
                ApiRequestLog.created_at >= thirty_days_ago,
                ApiRequestLog.status_code >= 400,
            )
        )
    )
    error_requests = error_req_result.scalar_one_or_none() or 0

    # Average Latency
    avg_latency_result = await db.execute(
        select(func.avg(ApiRequestLog.latency_ms)).where(
            ApiRequestLog.created_at >= thirty_days_ago
        )
    )
    avg_latency = float(avg_latency_result.scalar_one_or_none() or 0.0)

    # Active Keys
    active_keys_result = await db.execute(
        select(func.count(ApiKey.id)).where(ApiKey.is_active == True)
    )
    active_keys = active_keys_result.scalar_one_or_none() or 0

    # Developer Apps
    apps_result = await db.execute(select(func.count(OAuthClient.id)))
    developer_apps = apps_result.scalar_one_or_none() or 0

    return {
        "total_requests": total_requests,
        "today_requests": today_requests,
        "successful_requests": total_requests - error_requests,
        "failed_requests": error_requests,
        "error_rate": (
            (error_requests / total_requests * 100) if total_requests > 0 else 0
        ),
        "avg_latency_ms": round(avg_latency, 2),
        "active_api_keys": active_keys,
        "developer_apps": developer_apps,
        "api_availability": (
            99.99
            if total_requests == 0
            else round(100 - ((error_requests / total_requests) * 100), 2)
        ),
    }


@router.get("/usage-trends")
async def get_usage_trends(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get usage trends for the charts (last 30 days aggregated by day)."""
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    # In postgres, we can use date_trunc. For sqlite compat in dev, we cast to date
    from sqlalchemy import cast, Date

    result = await db.execute(
        select(
            cast(ApiRequestLog.created_at, Date).label("date"),
            func.count(ApiRequestLog.id).label("requests"),
        )
        .where(ApiRequestLog.created_at >= thirty_days_ago)
        .group_by("date")
        .order_by("date")
    )

    trends = []
    for row in result:
        # Convert date object to string "YYYY-MM-DD"
        date_str = row.date.strftime("%Y-%m-%d")
        trends.append({"date": date_str, "requests": row.requests})

    return {"trends": trends}


@router.get("/errors")
async def get_error_analytics(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get error counts grouped by status code."""
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    result = await db.execute(
        select(ApiRequestLog.status_code, func.count(ApiRequestLog.id))
        .where(
            and_(
                ApiRequestLog.created_at >= thirty_days_ago,
                ApiRequestLog.status_code >= 400,
            )
        )
        .group_by(ApiRequestLog.status_code)
    )

    errors = {}
    for code, count in result:
        errors[str(code)] = count

    return {"errors": errors}


@router.get("/live-requests")
async def get_live_requests(
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_owner),
) -> Any:
    """Get the most recent API requests."""
    result = await db.execute(
        select(ApiRequestLog).order_by(desc(ApiRequestLog.created_at)).limit(limit)
    )
    logs = result.scalars().all()

    return {
        "requests": [
            {
                "id": str(log.id),
                "endpoint": log.endpoint,
                "method": log.method,
                "status_code": log.status_code,
                "latency_ms": log.latency_ms,
                "ip_address": log.ip_address,
                "country": log.country,
                "timestamp": log.created_at.isoformat(),
            }
            for log in logs
        ]
    }


@router.get("/keys")
async def get_api_keys(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get all API keys across the platform."""
    result = await db.execute(select(ApiKey).order_by(desc(ApiKey.created_at)))
    keys = result.scalars().all()

    return {
        "keys": [
            {
                "id": str(key.id),
                "name": key.name,
                "prefix": key.prefix,
                "is_active": key.is_active,
                "created_at": key.created_at.isoformat(),
                "last_used_at": (
                    key.last_used_at.isoformat() if key.last_used_at else None
                ),
                "usage_count": key.usage_count,
            }
            for key in keys
        ]
    }


@router.get("/oauth-clients")
async def get_oauth_clients(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get all OAuth clients (Developer Apps)."""
    result = await db.execute(
        select(OAuthClient).order_by(desc(OAuthClient.created_at))
    )
    clients = result.scalars().all()

    return {
        "clients": [
            {
                "id": str(client.id),
                "name": client.client_name,
                "is_active": client.is_active,
                "usage_count": client.usage_count,
                "created_at": client.created_at.isoformat(),
                "scopes": client.scopes,
            }
            for client in clients
        ]
    }


@router.get("/integrations")
async def get_integrations(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get status of all external API Integrations."""
    result = await db.execute(select(ApiIntegration))
    integrations = result.scalars().all()

    return {
        "integrations": [
            {
                "id": str(integ.id),
                "provider": integ.provider,
                "is_active": integ.is_active,
                "health_status": integ.health_status,
                "last_sync_at": (
                    integ.last_sync_at.isoformat() if integ.last_sync_at else None
                ),
            }
            for integ in integrations
        ]
    }


@router.get("/security")
async def get_security_overview(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(require_owner)
) -> Any:
    """Get security events, threat detection, rate limit violations."""
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

    # Example: Rate limit violations (429)
    rate_limit_result = await db.execute(
        select(func.count(ApiRequestLog.id)).where(
            and_(
                ApiRequestLog.created_at >= thirty_days_ago,
                ApiRequestLog.status_code == 429,
            )
        )
    )
    rate_limit_violations = rate_limit_result.scalar_one_or_none() or 0

    # Example: Unauthorized (401/403)
    auth_failure_result = await db.execute(
        select(func.count(ApiRequestLog.id)).where(
            and_(
                ApiRequestLog.created_at >= thirty_days_ago,
                ApiRequestLog.status_code.in_([401, 403]),
            )
        )
    )
    auth_failures = auth_failure_result.scalar_one_or_none() or 0

    # Query actual blocked IPs from ThreatIntelligence
    blocked_ips_result = await db.execute(
        select(func.count(ThreatIntelligence.id)).where(
            ThreatIntelligence.is_blocked == True
        )
    )
    blocked_ips_count = blocked_ips_result.scalar_one_or_none() or 0

    # Calculate dynamic threat level
    threat_level = "Low"
    if blocked_ips_count > 100 or auth_failures > 500:
        threat_level = "High"
    elif blocked_ips_count > 20 or auth_failures > 100:
        threat_level = "Medium"

    return {
        "rate_limit_violations": rate_limit_violations,
        "authentication_failures": auth_failures,
        "blocked_ips_count": blocked_ips_count,
        "threat_level": threat_level,
    }
