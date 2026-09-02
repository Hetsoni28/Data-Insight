from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.ai_token_usage import AITokenUsage
from app.models.dataset import Dataset
from app.models.invoice import Invoice
from app.models.report import Report
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_session import UserSession

router = APIRouter()


async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, "role", "") != "owner" and not getattr(
        current_user, "is_owner", False,
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user


@router.get("/overview", summary="Executive Intelligence Overview KPIs")
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns high-level KPIs for the Executive Intelligence Dashboard.
    Calculates current metrics and compares them against the previous 30 days.
    """
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)
    now.replace(hour=0, minute=0, second=0, microsecond=0)

    # 1. User Metrics
    total_users = (
        await db.execute(select(func.count(User.id)).where(User.is_active == True))
    ).scalar_one()

    # Active Users (Logins in last 30 days)
    mau_stmt = select(func.count(func.distinct(UserSession.user_id))).where(
        UserSession.created_at >= thirty_days_ago,
    )
    mau = (await db.execute(mau_stmt)).scalar_one()

    # 2. Organization Metrics
    total_orgs = (
        await db.execute(
            select(func.count(Tenant.id)).where(Tenant.is_deleted == False),
        )
    ).scalar_one()
    active_orgs = (
        await db.execute(
            select(func.count(Tenant.id)).where(
                Tenant.is_deleted == False, Tenant.is_active == True,
            ),
        )
    ).scalar_one()

    new_orgs_last_30 = (
        await db.execute(
            select(func.count(Tenant.id)).where(Tenant.created_at >= thirty_days_ago),
        )
    ).scalar_one()
    new_orgs_prev_30 = (
        await db.execute(
            select(func.count(Tenant.id)).where(
                Tenant.created_at >= sixty_days_ago, Tenant.created_at < thirty_days_ago,
            ),
        )
    ).scalar_one()
    org_growth = (
        (new_orgs_last_30 - new_orgs_prev_30) / max(new_orgs_prev_30, 1)
    ) * 100

    # 3. Revenue Metrics (MRR / ARR based on invoices)
    mrr_stmt = select(func.sum(Invoice.amount)).where(
        Invoice.status == "paid", Invoice.created_at >= thirty_days_ago,
    )
    mrr_cents = (await db.execute(mrr_stmt)).scalar_one() or 0
    mrr = mrr_cents / 100
    arr = mrr * 12

    # Previous MRR for growth
    prev_mrr_stmt = select(func.sum(Invoice.amount)).where(
        Invoice.status == "paid",
        Invoice.created_at >= sixty_days_ago,
        Invoice.created_at < thirty_days_ago,
    )
    prev_mrr_cents = (await db.execute(prev_mrr_stmt)).scalar_one() or 0
    prev_mrr = prev_mrr_cents / 100
    mrr_growth = ((mrr - prev_mrr) / max(prev_mrr, 1)) * 100

    # 4. AI Metrics
    ai_requests_stmt = select(func.count(AITokenUsage.id)).where(
        AITokenUsage.created_at >= thirty_days_ago,
    )
    ai_requests = (await db.execute(ai_requests_stmt)).scalar_one()

    prev_ai_requests_stmt = select(func.count(AITokenUsage.id)).where(
        AITokenUsage.created_at >= sixty_days_ago,
        AITokenUsage.created_at < thirty_days_ago,
    )
    prev_ai_requests = (await db.execute(prev_ai_requests_stmt)).scalar_one()
    ai_growth = ((ai_requests - prev_ai_requests) / max(prev_ai_requests, 1)) * 100

    # 5. Platform Usage — datasets & reports with real period-over-period growth
    total_datasets = (
        await db.execute(
            select(func.count(Dataset.id)).where(Dataset.is_deleted == False),
        )
    ).scalar_one()
    total_reports = (await db.execute(select(func.count(Report.id)))).scalar_one()

    # Dataset growth: new datasets created last 30d vs prior 30d
    new_datasets_stmt = select(func.count(Dataset.id)).where(
        Dataset.created_at >= thirty_days_ago, Dataset.is_deleted == False,
    )
    new_datasets = (await db.execute(new_datasets_stmt)).scalar_one()
    prev_datasets_stmt = select(func.count(Dataset.id)).where(
        Dataset.created_at >= sixty_days_ago,
        Dataset.created_at < thirty_days_ago,
        Dataset.is_deleted == False,
    )
    prev_datasets = (await db.execute(prev_datasets_stmt)).scalar_one()
    dataset_growth = round(
        ((new_datasets - prev_datasets) / max(prev_datasets, 1)) * 100, 1,
    )

    # Report growth: new reports created last 30d vs prior 30d
    new_reports_stmt = select(func.count(Report.id)).where(
        Report.created_at >= thirty_days_ago,
    )
    new_reports = (await db.execute(new_reports_stmt)).scalar_one()
    prev_reports_stmt = select(func.count(Report.id)).where(
        Report.created_at >= sixty_days_ago, Report.created_at < thirty_days_ago,
    )
    prev_reports = (await db.execute(prev_reports_stmt)).scalar_one()
    report_growth = round(
        ((new_reports - prev_reports) / max(prev_reports, 1)) * 100, 1,
    )

    # User growth (period-over-period, reusing org_growth variable)
    new_users_stmt = select(func.count(User.id)).where(
        User.created_at >= thirty_days_ago, User.is_active == True,
    )
    new_users = (await db.execute(new_users_stmt)).scalar_one()
    prev_users_stmt = select(func.count(User.id)).where(
        User.created_at >= sixty_days_ago,
        User.created_at < thirty_days_ago,
        User.is_active == True,
    )
    prev_users = (await db.execute(prev_users_stmt)).scalar_one()
    user_growth = round(((new_users - prev_users) / max(prev_users, 1)) * 100, 1)

    return {
        "status": "success",
        "data": {
            "users": {
                "total": total_users,
                "mau": mau,
                "new_last_30d": new_users,
                "growth": user_growth,
                "trend": f"{'+' if user_growth >= 0 else ''}{user_growth}%",
                "sparkline": [],
            },
            "organizations": {
                "total": total_orgs,
                "active": active_orgs,
                "new": new_orgs_last_30,
                "growth": round(org_growth, 1),
                "sparkline": [],
            },
            "revenue": {
                "mrr": mrr,
                "arr": arr,
                "growth": round(mrr_growth, 1),
                "sparkline": [],
            },
            "ai": {
                "total_requests": ai_requests,
                "growth": round(ai_growth, 1),
                "sparkline": [],
            },
            "platform": {
                "datasets": total_datasets,
                "reports": total_reports,
                "dataset_growth": dataset_growth,
                "report_growth": report_growth,
                "sparkline": [],
            },
        },
    }


@router.get("/ai-summary", summary="Daily Executive AI Briefing")
async def get_ai_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns an AI-generated executive briefing.
    In a real production environment, a background worker would query the DB daily,
    pass the metrics to Gemini, and store the resulting text to be served here.
    For this demo, we return a dynamic but structured mockup string.
    """
    return {
        "status": "success",
        "briefing": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "business_growth": "Monthly Recurring Revenue (MRR) grew by 14% this month, primarily driven by enterprise upgrades in the NA region. Active organizations increased by 8%.",
            "churn_risk": "3 mid-market organizations have shown a 40% drop in login activity over the last 14 days. Recommend reaching out to their primary admins.",
            "feature_adoption": "The new AI Excel Generator feature has seen a 65% adoption rate among premium users, significantly boosting overall token usage.",
            "recommendations": [
                "Launch a targeted re-engagement campaign for the 3 at-risk mid-market organizations.",
                "Consider increasing API rate limits for the Enterprise tier as 4 organizations are hitting their daily caps.",
                "Promote the AI Copilot to free-tier users, as conversion rates are 2x higher for users who interact with AI features.",
            ],
        },
    }


@router.get("/revenue", summary="Revenue Analytics Trend")
async def get_revenue_analytics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns 12-month revenue trend from real Invoice data."""
    now = datetime.now(timezone.utc)

    start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(11):
        start_date = (start_date - timedelta(days=1)).replace(day=1)

    revenue_stmt = (
        select(
            func.date_trunc("month", Invoice.invoice_date).label("month"),
            func.sum(Invoice.amount).label("total"),
        )
        .where(Invoice.status == "paid", Invoice.invoice_date >= start_date)
        .group_by(text("1"))
    )
    revenue_result = (await db.execute(revenue_stmt)).all()
    revenue_by_month = {}
    for row in revenue_result:
        dt = (
            row.month
            if not isinstance(row.month, str)
            else datetime.fromisoformat(row.month)
        )
        revenue_by_month[dt.strftime("%Y-%m")] = float(row.total or 0.0)

    new_tenants_stmt = (
        select(
            func.date_trunc("month", Tenant.created_at).label("month"),
            func.count(Tenant.id).label("total"),
        )
        .where(Tenant.created_at >= start_date, Tenant.is_deleted == False)
        .group_by(text("1"))
    )
    new_tenants_result = (await db.execute(new_tenants_stmt)).all()
    new_tenants_by_month = {}
    for row in new_tenants_result:
        dt = (
            row.month
            if not isinstance(row.month, str)
            else datetime.fromisoformat(row.month)
        )
        new_tenants_by_month[dt.strftime("%Y-%m")] = int(row.total)

    base_active_tenants = (
        await db.scalar(
            select(func.count(Tenant.id)).where(
                Tenant.created_at < start_date, Tenant.is_deleted == False,
            ),
        )
        or 0
    )

    data = []
    current_active = base_active_tenants
    current_month = start_date
    for i in range(12):
        key = current_month.strftime("%Y-%m")
        rev = revenue_by_month.get(key, 0.0)
        new_t = new_tenants_by_month.get(key, 0)

        current_active += new_t

        data.append(
            {
                "date": current_month.strftime("%b"),
                "amount": round(rev, 2),
                "target": round(rev * 1.2, 2) if rev > 0 else 1000,
                "active": current_active,
                "new": new_t,
            },
        )

        current_month = (current_month + timedelta(days=32)).replace(day=1)

    return {"status": "success", "data": data}


@router.get("/users", summary="User Analytics Trend")
async def get_user_analytics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns 12-month User/Org growth trend from real DB data."""
    now = datetime.now(timezone.utc)

    start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(11):
        start_date = (start_date - timedelta(days=1)).replace(day=1)

    new_users_stmt = (
        select(
            func.date_trunc("month", User.created_at).label("month"),
            func.count(User.id).label("total"),
        )
        .where(User.created_at >= start_date)
        .group_by(text("1"))
    )
    new_users_result = (await db.execute(new_users_stmt)).all()
    new_users_by_month = {}
    for row in new_users_result:
        dt = (
            row.month
            if not isinstance(row.month, str)
            else datetime.fromisoformat(row.month)
        )
        new_users_by_month[dt.strftime("%Y-%m")] = int(row.total)

    new_orgs_stmt = (
        select(
            func.date_trunc("month", Tenant.created_at).label("month"),
            func.count(Tenant.id).label("total"),
        )
        .where(Tenant.created_at >= start_date, Tenant.is_deleted == False)
        .group_by(text("1"))
    )
    new_orgs_result = (await db.execute(new_orgs_stmt)).all()
    new_orgs_by_month = {}
    for row in new_orgs_result:
        dt = (
            row.month
            if not isinstance(row.month, str)
            else datetime.fromisoformat(row.month)
        )
        new_orgs_by_month[dt.strftime("%Y-%m")] = int(row.total)

    base_users = (
        await db.scalar(select(func.count(User.id)).where(User.created_at < start_date))
        or 0
    )
    base_orgs = (
        await db.scalar(
            select(func.count(Tenant.id)).where(
                Tenant.created_at < start_date, Tenant.is_deleted == False,
            ),
        )
        or 0
    )

    data = []
    cum_users = base_users
    cum_orgs = base_orgs
    current_month = start_date

    for i in range(12):
        key = current_month.strftime("%Y-%m")
        nu = new_users_by_month.get(key, 0)
        no = new_orgs_by_month.get(key, 0)

        cum_users += nu
        cum_orgs += no

        data.append(
            {
                "month": current_month.strftime("%b"),
                "active_users": cum_users,
                "active_orgs": cum_orgs,
                "new_signups": nu,
                "new_orgs": no,
            },
        )
        current_month = (current_month + timedelta(days=32)).replace(day=1)

    return {"status": "success", "data": data}


@router.get("/forecast", summary="Predictive Forecasting")
async def get_predictive_forecast(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns 6 months actual + 6 months projected MRR based on real DB data."""
    now = datetime.now(timezone.utc)

    start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for _ in range(5):
        start_date = (start_date - timedelta(days=1)).replace(day=1)

    actuals_stmt = (
        select(
            func.date_trunc("month", Invoice.invoice_date).label("month"),
            func.sum(Invoice.amount).label("total"),
        )
        .where(Invoice.status == "paid", Invoice.invoice_date >= start_date)
        .group_by(text("1"))
    )
    actuals_result = (await db.execute(actuals_stmt)).all()
    actuals_by_month = {}
    for row in actuals_result:
        dt = (
            row.month
            if not isinstance(row.month, str)
            else datetime.fromisoformat(row.month)
        )
        actuals_by_month[dt.strftime("%Y-%m")] = float(row.total or 0.0)

    data = []
    current_month = start_date
    for i in range(6):
        key = current_month.strftime("%Y-%m")
        actual = actuals_by_month.get(key, 0.0)
        data.append(
            {
                "month": current_month.strftime("%b"),
                "mrr_actual": round(actual, 2),
                "mrr_forecast": None,
            },
        )
        current_month = (current_month + timedelta(days=32)).replace(day=1)

    # Current MRR base from Tenant.mrr
    current_mrr = (
        await db.scalar(
            select(func.coalesce(func.sum(Tenant.mrr), 0.0)).where(
                Tenant.is_active == True, Tenant.is_deleted == False,
            ),
        )
        or 0.0
    )

    # Next 6 months — 5% monthly growth projection
    for i in range(1, 7):
        projected = current_mrr * (1.05**i)
        data.append(
            {
                "month": current_month.strftime("%b"),
                "mrr_actual": None,
                "mrr_forecast": round(projected, 2),
            },
        )
        current_month = (current_month + timedelta(days=32)).replace(day=1)

    return {"status": "success", "data": data}


@router.get("/anomalies", summary="System Anomaly Detection")
async def get_anomalies(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    from sqlalchemy import desc

    from app.models.audit_log import AuditLog
    from app.models.security import SecurityEvent

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=7)

    # Fetch recent high/critical security events
    sec_result = await db.execute(
        select(SecurityEvent)
        .where(
            SecurityEvent.severity.in_(["high", "critical"]),
            SecurityEvent.created_at >= cutoff,
        )
        .order_by(desc(SecurityEvent.created_at))
        .limit(5),
    )
    sec_events = sec_result.scalars().all()

    # Fetch recent critical audit failures
    audit_result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.severity.in_(["warning", "critical"]),
            AuditLog.status == "failure",
            AuditLog.created_at >= cutoff,
        )
        .order_by(desc(AuditLog.created_at))
        .limit(5),
    )
    audit_events = audit_result.scalars().all()

    anomalies = []
    for e in sec_events:
        anomalies.append(
            {
                "id": str(e.id),
                "type": "security",
                "severity": e.severity,
                "title": e.event_type.replace("_", " ").title(),
                "description": f"{e.event_type} from {e.ip_address or 'unknown'}",
                "timestamp": e.created_at.isoformat(),
                "resolved": e.resolved,
            },
        )
    for e in audit_events:
        anomalies.append(
            {
                "id": str(e.id),
                "type": "audit",
                "severity": e.severity,
                "title": e.action.replace("_", " ").title(),
                "description": f"Failed {e.action} in {e.module}",
                "timestamp": e.created_at.isoformat(),
                "resolved": False,
            },
        )

    # Sort combined by timestamp desc
    anomalies.sort(key=lambda x: x["timestamp"], reverse=True)

    return {"status": "success", "data": anomalies[:8]}


@router.get("/health", summary="Customer Health Scores")
async def get_customer_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_owner),
):
    """Returns a matrix of organizations and their calculated health scores.
    """
    # Fetch all active orgs from DB
    stmt = (
        select(
            Tenant.id,
            Tenant.name,
            Tenant.plan,
            Tenant.mrr,
            Tenant.is_active,
            Tenant.created_at,
            Tenant.updated_at,
        )
        .where(Tenant.is_deleted == False)
        .order_by(Tenant.mrr.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    tenants = result.all()

    # Get user counts per tenant
    user_counts_stmt = (
        select(User.tenant_id, func.count(User.id).label("user_count"))
        .where(User.is_active == True)
        .group_by(User.tenant_id)
    )
    user_counts_result = await db.execute(user_counts_stmt)
    user_counts = {str(row.tenant_id): row.user_count for row in user_counts_result}

    # Get recent session counts (last 14 days) per tenant to determine engagement
    fourteen_days_ago = datetime.now(timezone.utc) - timedelta(days=14)
    recent_sessions_stmt = (
        select(User.tenant_id, func.count(UserSession.id).label("session_count"))
        .join(UserSession, UserSession.user_id == User.id)
        .where(UserSession.created_at >= fourteen_days_ago)
        .group_by(User.tenant_id)
    )
    recent_sessions_result = await db.execute(recent_sessions_stmt)
    recent_sessions = {
        str(row.tenant_id): row.session_count for row in recent_sessions_result
    }

    health_data = []
    for t in tenants:
        tid = str(t.id)
        users = user_counts.get(tid, 0)
        sessions = recent_sessions.get(tid, 0)

        # Calculate a simple health score
        # Based on: active status (30pts), recent engagement/sessions (40pts), MRR (30pts)
        active_score = 30 if t.is_active else 0
        engagement_score = min(40, int((sessions / max(users, 1)) * 10))
        mrr_score = min(30, int((t.mrr / 5000) * 30)) if t.mrr else 0
        total_score = active_score + engagement_score + mrr_score

        if total_score >= 75:
            status = "Healthy"
        elif total_score >= 50:
            status = "At Risk"
        else:
            status = "Churning"

        # Trend: if updated recently and has sessions, trending up
        days_since_update = (
            (datetime.now(timezone.utc) - t.updated_at).days if t.updated_at else 999
        )
        trend = (
            "up"
            if sessions > 0 and days_since_update < 7
            else ("down" if sessions == 0 else "stable")
        )

        health_data.append(
            {
                "org_id": tid,
                "org_name": t.name,
                "plan": t.plan.capitalize() if t.plan else "Starter",
                "score": total_score,
                "status": status,
                "mrr": round(t.mrr, 2),
                "users": users,
                "sessions_14d": sessions,
                "trend": trend,
            },
        )

    return {"status": "success", "data": health_data}
