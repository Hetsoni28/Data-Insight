from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_, text
from datetime import datetime, timezone, timedelta
from typing import List

from app.api.deps import (
    get_db,
    get_current_active_tenant_user,
    RequireRole,
    RequirePermission,
)
from app.models.user import User
from app.models.tenant import Tenant
from app.models.ai_token_usage import AITokenUsage
from app.models.dataset import Dataset
from app.models.report import Report
from app.models.user_session import UserSession
from app.models.audit_log import AuditLog
from app.models.integration import IntegrationConnection
from app.models.dashboard import Dashboard
from app.models.report_activity import ReportActivity
from app.models.report_bookmark import ReportBookmark

# Re-using dict return types to avoid breaking the frontend which expects {"status": "success", "data": ...}
# but adding try/except and dynamic status logic.

router = APIRouter()


# ─── OVERVIEW ──────────────────────────────────────────────────────────────────
@router.get("/overview", summary="High-level Context & Status")
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    """Context for the top Welcome Banner."""
    try:
        tenant = await db.scalar(
            select(Tenant).where(Tenant.id == current_user.tenant_id)
        )
        if not tenant:
            raise HTTPException(status_code=404, detail="Organization not found")

        # Check if an Gemini integration exists to determine AI status dynamically
        ai_integration = await db.scalar(
            select(IntegrationConnection).where(
                IntegrationConnection.provider == "gemini",
                IntegrationConnection.is_active == True,
            )
        )
        current_ai = (
            "Gemini (Custom)" if ai_integration else "Gemini (Platform Default)"
        )

        return {
            "status": "success",
            "data": {
                "organization_name": tenant.name,
                "subscription_plan": tenant.plan,
                "subscription_status": "Active" if tenant.is_active else "Inactive",
                "platform_status": "Operational",
                "current_ai_provider": current_ai,
                "greeting": f"Welcome back, {current_user.full_name.split()[0] if current_user.full_name else 'User'}",
                "mrr": tenant.mrr or 0.0,
                "current_period_end": (
                    tenant.current_period_end.isoformat()
                    if tenant.current_period_end
                    else None
                ),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching the overview."
        )


# ─── KPIs ───────────────────────────────────────────────────────────────────────
@router.get("/kpis", summary="Executive KPI Cards")
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    """Dynamic metrics for the tenant including growth comparisons."""
    try:
        tenant_id = current_user.tenant_id
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)

        # 1. Total Team Members
        total_users = (
            await db.scalar(
                select(func.count(User.id)).where(
                    User.tenant_id == tenant_id, User.is_active == True
                )
            )
            or 0
        )

        # 2. Uploaded Datasets
        total_datasets = (
            await db.scalar(
                select(func.count(Dataset.id)).where(
                    Dataset.tenant_id == tenant_id, Dataset.is_deleted == False
                )
            )
            or 0
        )
        prev_datasets = (
            await db.scalar(
                select(func.count(Dataset.id)).where(
                    Dataset.tenant_id == tenant_id,
                    Dataset.is_deleted == False,
                    Dataset.created_at < thirty_days_ago,
                )
            )
            or 0
        )
        datasets_growth = (
            (total_datasets - prev_datasets) / max(prev_datasets, 1)
        ) * 100

        # 3. Reports
        total_reports = (
            await db.scalar(
                select(func.count(Report.id)).where(Report.tenant_id == tenant_id)
            )
            or 0
        )
        prev_reports = (
            await db.scalar(
                select(func.count(Report.id)).where(
                    Report.tenant_id == tenant_id, Report.created_at < thirty_days_ago
                )
            )
            or 0
        )
        reports_growth = ((total_reports - prev_reports) / max(prev_reports, 1)) * 100

        # 4. Storage Used (bytes to MB)
        storage_used_bytes = (
            await db.scalar(
                select(func.sum(Dataset.file_size_bytes)).where(
                    Dataset.tenant_id == tenant_id, Dataset.is_deleted == False
                )
            )
            or 0
        )
        storage_mb = round(storage_used_bytes / (1024 * 1024), 2)

        # 5. AI Requests (this month)
        ai_requests = (
            await db.scalar(
                select(func.count(AITokenUsage.id)).where(
                    AITokenUsage.tenant_id == tenant_id,
                    AITokenUsage.created_at >= thirty_days_ago,
                )
            )
            or 0
        )
        prev_ai_requests = (
            await db.scalar(
                select(func.count(AITokenUsage.id)).where(
                    AITokenUsage.tenant_id == tenant_id,
                    AITokenUsage.created_at >= sixty_days_ago,
                    AITokenUsage.created_at < thirty_days_ago,
                )
            )
            or 0
        )
        ai_growth = ((ai_requests - prev_ai_requests) / max(prev_ai_requests, 1)) * 100

        # 6. Additional Viewer Analytics
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        total_dashboards = (
            await db.scalar(
                select(func.count(Dashboard.id)).where(
                    Dashboard.tenant_id == tenant_id, Dashboard.is_deleted == False
                )
            )
            or 0
        )
        reports_viewed = (
            await db.scalar(
                select(func.count(ReportActivity.id)).where(
                    ReportActivity.user_id == current_user.id,
                    ReportActivity.action == "viewed",
                    ReportActivity.created_at >= start_of_day,
                )
            )
            or 0
        )
        downloads_count = (
            await db.scalar(
                select(func.count(ReportActivity.id)).where(
                    ReportActivity.user_id == current_user.id,
                    ReportActivity.action == "exported",
                )
            )
            or 0
        )
        bookmarks_count = (
            await db.scalar(
                select(func.count(ReportBookmark.id)).where(
                    ReportBookmark.user_id == current_user.id
                )
            )
            or 0
        )

        # Dynamic productivity and data quality score based on actual usage
        productivity_score = min(
            100, max(0, int(70 + (ai_growth / 10) + (reports_growth / 10)))
        )
        data_quality_score = min(100, max(0, int(75 + (datasets_growth / 5))))

        return {
            "status": "success",
            "data": {
                "active_users": total_users,
                "datasets": {
                    "total": total_datasets,
                    "growth": round(datasets_growth, 1),
                },
                "reports": {"total": total_reports, "growth": round(reports_growth, 1)},
                "dashboards": {"total": total_dashboards},
                "reports_viewed_today": reports_viewed,
                "downloads_count": downloads_count,
                "bookmarks_count": bookmarks_count,
                "storage_mb": storage_mb,
                "ai_requests": {"total": ai_requests, "growth": round(ai_growth, 1)},
                "productivity_score": productivity_score,
                "data_quality_score": data_quality_score,
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching KPIs."
        )


# ─── CHARTS ─────────────────────────────────────────────────────────────────────
@router.get("/charts", summary="Business Analytics Trends")
async def get_dashboard_charts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    """Returns 30-day aggregated chart data for charts with ZERO dummy data."""
    try:
        tenant_id = current_user.tenant_id
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        # AI Usage grouping
        ai_stmt = (
            select(
                func.date_trunc("day", AITokenUsage.created_at).label("day"),
                func.count(AITokenUsage.id).label("count"),
            )
            .where(
                AITokenUsage.tenant_id == tenant_id,
                AITokenUsage.created_at >= thirty_days_ago,
            )
            .group_by(text("1"))
            .order_by(text("1"))
        )

        ai_results = (await db.execute(ai_stmt)).all()
        ai_map = {
            (
                row.day.strftime("%Y-%m-%d")
                if hasattr(row.day, "strftime")
                else str(row.day)[:10]
            ): row.count
            for row in ai_results
        }

        # Reports grouping
        reports_stmt = (
            select(
                func.date_trunc("day", Report.created_at).label("day"),
                func.count(Report.id).label("count"),
            )
            .where(Report.tenant_id == tenant_id, Report.created_at >= thirty_days_ago)
            .group_by(text("1"))
            .order_by(text("1"))
        )

        reports_results = (await db.execute(reports_stmt)).all()
        reports_map = {
            (
                row.day.strftime("%Y-%m-%d")
                if hasattr(row.day, "strftime")
                else str(row.day)[:10]
            ): row.count
            for row in reports_results
        }

        # Storage grouping (cumulative approximation based on dataset creation)
        storage_stmt = (
            select(
                func.date_trunc("day", Dataset.created_at).label("day"),
                func.sum(Dataset.file_size_bytes).label("bytes"),
            )
            .where(
                Dataset.tenant_id == tenant_id,
                Dataset.created_at >= thirty_days_ago,
                Dataset.is_deleted == False,
            )
            .group_by(text("1"))
            .order_by(text("1"))
        )

        storage_results = (await db.execute(storage_stmt)).all()
        storage_map = {
            (
                row.day.strftime("%Y-%m-%d")
                if hasattr(row.day, "strftime")
                else str(row.day)[:10]
            ): (row.bytes or 0)
            for row in storage_results
        }

        # Build dense 30-day array
        chart_data = []
        for i in range(30):
            target_date = thirty_days_ago + timedelta(days=i)
            date_str = target_date.strftime("%Y-%m-%d")
            display_str = target_date.strftime("%b %d")

            chart_data.append(
                {
                    "date": display_str,
                    "full_date": date_str,
                    "ai_usage": ai_map.get(date_str, 0),
                    "reports": reports_map.get(date_str, 0),
                    "storage_mb": round(
                        storage_map.get(date_str, 0) / (1024 * 1024), 2
                    ),
                }
            )

        return {"status": "success", "data": chart_data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching chart data."
        )


# ─── DATASETS ──────────────────────────────────────────────────────────────────
@router.get("/datasets", summary="Recent Datasets")
async def get_recent_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    try:
        stmt = (
            select(Dataset)
            .where(
                Dataset.tenant_id == current_user.tenant_id, Dataset.is_deleted == False
            )
            .order_by(desc(Dataset.created_at))
            .offset(skip)
            .limit(limit)
        )
        datasets = (await db.execute(stmt)).scalars().all()

        return {
            "status": "success",
            "data": [
                {
                    "id": str(d.id),
                    "name": d.name,
                    "rows": d.row_count or 0,
                    "columns": d.column_count or 0,
                    "status": d.status,
                    "created_at": d.created_at,
                }
                for d in datasets
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching datasets."
        )


# ─── REPORTS ───────────────────────────────────────────────────────────────────
@router.get("/reports", summary="Recent Reports")
async def get_recent_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    try:
        stmt = (
            select(Report)
            .where(Report.tenant_id == current_user.tenant_id)
            .order_by(desc(Report.created_at))
            .offset(skip)
            .limit(limit)
        )
        reports = (await db.execute(stmt)).scalars().all()

        return {
            "status": "success",
            "data": [
                {
                    "id": str(r.id),
                    "title": r.title,
                    "type": r.report_type,
                    "status": r.status,
                    "created_at": r.created_at,
                }
                for r in reports
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching reports."
        )


# ─── ACTIVITY FEED ─────────────────────────────────────────────────────────────
@router.get("/activity", summary="Recent Activity")
async def get_activity_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(RequirePermission("DATASET_VIEW")),
):
    try:
        stmt = (
            select(AuditLog)
            .where(AuditLog.tenant_id == current_user.tenant_id)
            .order_by(desc(AuditLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        logs = (await db.execute(stmt)).scalars().all()

        return {
            "status": "success",
            "data": [
                {
                    "id": str(l.id),
                    "action": l.action,
                    "resource_type": l.resource_type,
                    "status": l.status,
                    "created_at": l.created_at,
                }
                for l in logs
            ],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching activity logs."
        )


# ─── SECURITY ──────────────────────────────────────────────────────────────────
@router.get(
    "/security",
    summary="Security & Access",
    dependencies=[Depends(RequireRole(["org_admin"]))],
)
async def get_security_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        # Fetch active sessions
        stmt = (
            select(UserSession)
            .join(User)
            .where(
                User.tenant_id == current_user.tenant_id, UserSession.is_active == True
            )
            .order_by(desc(UserSession.last_active_at))
            .limit(5)
        )
        sessions = (await db.execute(stmt)).scalars().all()

        # Fetch failed logins from audit log
        failed_stmt = (
            select(AuditLog)
            .where(
                AuditLog.tenant_id == current_user.tenant_id,
                AuditLog.action == "user.login",
                AuditLog.status == "failure",
            )
            .order_by(desc(AuditLog.created_at))
            .limit(5)
        )
        failed_logins = (await db.execute(failed_stmt)).scalars().all()

        return {
            "status": "success",
            "data": {
                "active_sessions": [
                    {
                        "id": str(s.id),
                        "device": s.device_name,
                        "browser": s.browser,
                        "ip": s.ip_address,
                        "last_active": s.last_active_at,
                    }
                    for s in sessions
                ],
                "failed_logins": [
                    {"id": str(f.id), "ip": f.ip_address, "created_at": f.created_at}
                    for f in failed_logins
                ],
            },
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching security data."
        )
