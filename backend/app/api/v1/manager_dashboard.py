from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.ai_token_usage import AITokenUsage
from app.models.dataset import Dataset
from app.models.report import Report
from app.models.audit_log import AuditLog
from app.models.integration import IntegrationConnection

router = APIRouter(prefix="/manager-dashboard", tags=["Manager Dashboard"])

# Reusable role dependency for managers and above
manager_role_deps = [Depends(RequireRole([UserRole.manager, UserRole.org_admin, UserRole.owner]))]

# ─── OVERVIEW ──────────────────────────────────────────────────────────────────
@router.get("/overview", summary="High-level Context & Status", dependencies=manager_role_deps)
async def get_manager_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    """Context for the top Welcome Banner."""
    try:
        tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
        if not tenant:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Check if an OpenAI integration exists to determine AI status dynamically
        ai_integration = await db.scalar(select(IntegrationConnection).where(IntegrationConnection.provider == "openai", IntegrationConnection.is_active == True))
        current_ai = "OpenAI (Custom)" if ai_integration else "OpenAI (Platform Default)"
        
        return {
            "status": "success",
            "data": {
                "organization_name": tenant.name,
                "subscription_plan": tenant.plan,
                "subscription_status": "Active" if tenant.is_active else "Inactive",
                "platform_status": "Operational",
                "current_ai_provider": current_ai,
                "greeting": f"Good { 'morning' if datetime.now().hour < 12 else 'afternoon' if datetime.now().hour < 18 else 'evening' }, {current_user.full_name.split()[0] if current_user.full_name else 'User'}",
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching the overview.")

# ─── KPIs ───────────────────────────────────────────────────────────────────────
@router.get("/kpis", summary="Manager Executive KPI Cards", dependencies=manager_role_deps)
async def get_manager_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    """Dynamic metrics for the tenant including growth comparisons, accessible to managers."""
    try:
        tenant_id = current_user.tenant_id
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        
        # 1. Total Team Members
        total_users = await db.scalar(select(func.count(User.id)).where(User.tenant_id == tenant_id, User.is_active == True)) or 0
        
        # 2. Uploaded Datasets
        total_datasets = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)) or 0
        prev_datasets = await db.scalar(select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False, Dataset.created_at < thirty_days_ago)) or 0
        datasets_growth = ((total_datasets - prev_datasets) / max(prev_datasets, 1)) * 100
        
        # 3. Reports
        total_reports = await db.scalar(select(func.count(Report.id)).where(Report.tenant_id == tenant_id)) or 0
        prev_reports = await db.scalar(select(func.count(Report.id)).where(Report.tenant_id == tenant_id, Report.created_at < thirty_days_ago)) or 0
        reports_growth = ((total_reports - prev_reports) / max(prev_reports, 1)) * 100
        
        # 4. Storage Used (bytes to MB)
        storage_used_bytes = await db.scalar(select(func.sum(Dataset.file_size_bytes)).where(Dataset.tenant_id == tenant_id, Dataset.is_deleted == False)) or 0
        storage_mb = round(storage_used_bytes / (1024 * 1024), 2)
        
        # 5. AI Requests (this month)
        ai_requests = await db.scalar(select(func.count(AITokenUsage.id)).where(AITokenUsage.tenant_id == tenant_id, AITokenUsage.created_at >= thirty_days_ago)) or 0
        prev_ai_requests = await db.scalar(select(func.count(AITokenUsage.id)).where(AITokenUsage.tenant_id == tenant_id, AITokenUsage.created_at >= sixty_days_ago, AITokenUsage.created_at < thirty_days_ago)) or 0
        ai_growth = ((ai_requests - prev_ai_requests) / max(prev_ai_requests, 1)) * 100
        
        # Dynamic productivity and data quality score based on actual usage
        productivity_score = min(100, max(0, int(70 + (ai_growth / 10) + (reports_growth / 10))))
        data_quality_score = min(100, max(0, int(75 + (datasets_growth / 5))))
        
        return {
            "status": "success",
            "data": {
                "active_users": total_users,
                "datasets": {
                    "total": total_datasets,
                    "growth": round(datasets_growth, 1)
                },
                "reports": {
                    "total": total_reports,
                    "growth": round(reports_growth, 1)
                },
                "storage_mb": storage_mb,
                "ai_requests": {
                    "total": ai_requests,
                    "growth": round(ai_growth, 1)
                },
                "productivity_score": productivity_score,
                "data_quality_score": data_quality_score
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching KPIs.")

# ─── CHARTS ─────────────────────────────────────────────────────────────────────
@router.get("/charts", summary="Business Analytics Trends", dependencies=manager_role_deps)
async def get_manager_charts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    """Returns 30-day aggregated chart data for charts with ZERO dummy data."""
    try:
        tenant_id = current_user.tenant_id
        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)
        
        # AI Usage grouping
        ai_stmt = select(
            func.date_trunc('day', AITokenUsage.created_at).label('day'),
            func.count(AITokenUsage.id).label('count')
        ).where(
            AITokenUsage.tenant_id == tenant_id, 
            AITokenUsage.created_at >= thirty_days_ago
        ).group_by(text("1")).order_by(text("1"))
        
        ai_results = (await db.execute(ai_stmt)).all()
        ai_map = {row.day.strftime("%Y-%m-%d") if hasattr(row.day, 'strftime') else str(row.day)[:10]: row.count for row in ai_results}
        
        # Reports grouping
        reports_stmt = select(
            func.date_trunc('day', Report.created_at).label('day'),
            func.count(Report.id).label('count')
        ).where(
            Report.tenant_id == tenant_id, 
            Report.created_at >= thirty_days_ago
        ).group_by(text("1")).order_by(text("1"))
        
        reports_results = (await db.execute(reports_stmt)).all()
        reports_map = {row.day.strftime("%Y-%m-%d") if hasattr(row.day, 'strftime') else str(row.day)[:10]: row.count for row in reports_results}

        # Storage grouping
        storage_stmt = select(
            func.date_trunc('day', Dataset.created_at).label('day'),
            func.sum(Dataset.file_size_bytes).label('bytes')
        ).where(
            Dataset.tenant_id == tenant_id,
            Dataset.created_at >= thirty_days_ago,
            Dataset.is_deleted == False
        ).group_by(text("1")).order_by(text("1"))
        
        storage_results = (await db.execute(storage_stmt)).all()
        storage_map = {row.day.strftime("%Y-%m-%d") if hasattr(row.day, 'strftime') else str(row.day)[:10]: (row.bytes or 0) for row in storage_results}

        # Build dense 30-day array
        chart_data = []
        for i in range(30):
            target_date = thirty_days_ago + timedelta(days=i)
            date_str = target_date.strftime("%Y-%m-%d")
            display_str = target_date.strftime("%b %d")
            
            chart_data.append({
                "date": display_str,
                "full_date": date_str,
                "ai_usage": ai_map.get(date_str, 0),
                "reports": reports_map.get(date_str, 0),
                "storage_mb": round(storage_map.get(date_str, 0) / (1024 * 1024), 2)
            })
            
        return {
            "status": "success",
            "data": chart_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching chart data.")

# ─── DATASETS ──────────────────────────────────────────────────────────────────
@router.get("/datasets", summary="Recent Datasets", dependencies=manager_role_deps)
async def get_manager_datasets(
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        stmt = select(Dataset).where(Dataset.tenant_id == current_user.tenant_id, Dataset.is_deleted == False).order_by(desc(Dataset.created_at)).offset(skip).limit(limit)
        datasets = (await db.execute(stmt)).scalars().all()
        
        return {
            "status": "success",
            "data": [{
                "id": str(d.id),
                "name": d.name,
                "rows": d.row_count or 0,
                "columns": d.column_count or 0,
                "status": d.status,
                "created_at": d.created_at
            } for d in datasets]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching datasets.")

# ─── REPORTS ───────────────────────────────────────────────────────────────────
@router.get("/reports", summary="Recent Reports", dependencies=manager_role_deps)
async def get_manager_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        stmt = select(Report).where(Report.tenant_id == current_user.tenant_id).order_by(desc(Report.created_at)).offset(skip).limit(limit)
        reports = (await db.execute(stmt)).scalars().all()
        
        return {
            "status": "success",
            "data": [{
                "id": str(r.id),
                "title": r.title,
                "type": r.report_type,
                "status": r.status,
                "created_at": r.created_at
            } for r in reports]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching reports.")

# ─── ACTIVITY FEED ─────────────────────────────────────────────────────────────
@router.get("/activity", summary="Recent Activity", dependencies=manager_role_deps)
async def get_manager_activity_feed(
    skip: int = Query(0, ge=0),
    limit: int = Query(15, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_tenant_user),
):
    try:
        # Exclude security-sensitive actions from manager's view
        stmt = select(AuditLog).where(
            AuditLog.tenant_id == current_user.tenant_id,
            AuditLog.action.notin_(["user.login", "user.logout", "tenant.update", "billing.update"])
        ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
        logs = (await db.execute(stmt)).scalars().all()
        
        return {
            "status": "success",
            "data": [{
                "id": str(l.id),
                "action": l.action,
                "resource_type": l.resource_type,
                "status": l.status,
                "created_at": l.created_at
            } for l in logs]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching activity logs.")
