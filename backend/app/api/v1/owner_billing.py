from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, desc
from datetime import datetime, timezone, timedelta

from app.api.deps import get_db, get_current_user
from app.models.tenant import Tenant, PlanType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.billing_activity import BillingActivity
from app.models.user import User
from app.models.operating_expense import OperatingExpense
from app.models.ai_token_usage import AITokenUsage
from app.models.storage import StorageFile

router = APIRouter()

async def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if getattr(current_user, 'role', '') != 'owner' and not getattr(current_user, 'is_owner', False):
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.get("/kpis")
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Get high-level revenue and subscription KPIs."""
    # Active subscriptions
    active_subs_count = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0
    
    trial_subs_count = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.plan == PlanType.starter, Tenant.is_active == True)
    ) or 0

    # Calculate MRR (sum of all tenant MRRs where active)
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0.0

    arr = total_mrr * 12
    
    # Revenue data
    total_revenue = await db.scalar(
        select(func.sum(Invoice.amount)).where(Invoice.status == InvoiceStatus.paid)
    ) or 0.0
    
    failed_payments = await db.scalar(
        select(func.sum(Invoice.amount)).where(Invoice.status == InvoiceStatus.failed)
    ) or 0.0
    
    # Advanced KPIs
    arpu = (total_mrr / active_subs_count) if active_subs_count else 0.0
    # Calculate churn: tenants that became inactive in the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    cancelled_count = await db.scalar(
        select(func.count(Tenant.id)).where(
            Tenant.is_active == False,
            Tenant.updated_at >= thirty_days_ago,
            Tenant.is_deleted == False
        )
    ) or 0
    total_start_count = max(active_subs_count + cancelled_count, 1)
    churn_rate = round((cancelled_count / total_start_count) * 100, 2)
    ltv = (arpu / (churn_rate / 100)) if churn_rate > 0 else 0.0
    
    # Real Profitability based on costs
    # Total Operating Expenses
    total_operating_cost = await db.scalar(
        select(func.sum(OperatingExpense.amount))
    ) or 0.0

    # Total AI Costs
    total_ai_cost = await db.scalar(
        select(func.sum(AITokenUsage.cost_usd))
    ) or 0.0

    # Calculate real profits based on historical revenue vs costs
    # Using total_revenue as the basis for gross profit calculation
    gross_profit = max(total_revenue - total_ai_cost, 0.0)
    operating_profit = max(gross_profit - total_operating_cost, 0.0)
    net_profit = operating_profit # Assuming no tax logic yet
    
    # We don't have line items in Invoices yet, so these return 0 for now
    ai_revenue = 0.0
    storage_revenue = 0.0
    api_revenue = 0.0

    # Real Sparklines: Last 7 months revenue
    sparkline_revenue = []
    for i in range(6, -1, -1):
        d = datetime.now(timezone.utc) - timedelta(days=30*i)
        month_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (month_start + timedelta(days=32)).replace(day=1)
        rev = await db.scalar(
            select(func.sum(Invoice.amount))
            .where(Invoice.status == InvoiceStatus.paid, Invoice.invoice_date >= month_start, Invoice.invoice_date < next_month_start)
        ) or 0.0
        sparkline_revenue.append(float(rev))

    return {
        "mrr": total_mrr,
        "arr": arr,
        "total_revenue": total_revenue,
        "active_subscriptions": active_subs_count,
        "trial_subscriptions": trial_subs_count,
        "failed_payments": failed_payments,
        "arpu": arpu,
        "ltv": ltv,
        "churn_rate": churn_rate,
        "gross_profit": gross_profit,
        "net_profit": net_profit,
        "operating_profit": operating_profit,
        "ai_revenue": ai_revenue,
        "storage_revenue": storage_revenue,
        "api_revenue": api_revenue,
        "sparkline_revenue": sparkline_revenue
    }


@router.get("/revenue-trends")
async def get_revenue_trends(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Get revenue charts and plan distribution."""
    # Group by plan
    plan_dist = (await db.execute(
        select(Tenant.plan, func.count(Tenant.id), func.sum(Tenant.mrr))
        .where(Tenant.is_active == True, Tenant.is_deleted == False)
        .group_by(Tenant.plan)
    )).all()
    
    distribution = []
    for plan, count, revenue in plan_dist:
        distribution.append({
            "plan": plan.title(),
            "count": count,
            "revenue": float(revenue or 0)
        })

    # Group revenue by month for the last 6 months (simplification)
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        d = now - timedelta(days=30*i)
        month_name = d.strftime("%b")
        # In a real app we'd group by `date_trunc('month', invoice_date)`
        # Here we do it manually by filtering for each month for speed
        month_start = d.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (month_start + timedelta(days=32)).replace(day=1)
        
        month_rev = await db.scalar(
            select(func.sum(Invoice.amount))
            .where(Invoice.status == InvoiceStatus.paid, Invoice.invoice_date >= month_start, Invoice.invoice_date < next_month_start)
        ) or 0.0
        
        months.append({
            "name": month_name,
            "revenue": float(month_rev)
        })

    return {
        "revenue_history": months,
        "plan_distribution": distribution
    }


@router.get("/organizations")
async def get_subscription_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
) -> Any:
    """Advanced subscription table data."""
    tenants = (await db.execute(
        select(Tenant)
        .where(Tenant.is_deleted == False)
        .order_by(desc(Tenant.created_at))
        .offset(skip).limit(limit)
    )).scalars().all()
    
    result = []
    for t in tenants:
        # Get real user count
        user_count = await db.scalar(select(func.count(User.id)).where(User.tenant_id == t.id)) or 0
        
        # Get real storage used (bytes to GB)
        storage_bytes = await db.scalar(select(func.sum(StorageFile.file_size_bytes)).where(StorageFile.tenant_id == t.id)) or 0
        storage_gb = storage_bytes / (1024 ** 3)
        
        result.append({
            "id": t.id,
            "name": t.name,
            "plan": t.plan,
            "billing_cycle": t.billing_cycle,
            "mrr": float(t.mrr),
            "status": "Active" if t.is_active else "Suspended",
            "users": user_count,
            "storage_used": round(storage_gb, 2),
            "created_at": t.created_at.isoformat()
        })
    return {"data": result}


@router.get("/invoices")
async def get_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tenant_id: str | None = Query(None, description="Filter invoices by tenant UUID")
) -> Any:
    """Fetch global invoices, optionally filtered by tenant_id."""
    query = (
        select(Invoice, Tenant.name.label("tenant_name"))
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .order_by(desc(Invoice.invoice_date))
    )

    if tenant_id:
        from uuid import UUID as PyUUID
        try:
            query = query.where(Invoice.tenant_id == PyUUID(tenant_id))
        except ValueError:
            pass  # invalid UUID — ignore filter gracefully

    invoices = (await db.execute(query.offset(skip).limit(limit))).all()

    result = []
    for inv, tenant_name in invoices:
        result.append({
            "id": str(inv.id),
            "tenant_name": tenant_name,
            "amount": float(inv.amount),
            "currency": inv.currency,
            "status": inv.status.value,
            "date": inv.invoice_date.isoformat()
        })

    return {"data": result}


@router.post("/{tenant_id}/toggle-status")
async def toggle_subscription_status(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Toggle a tenant's active status."""
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    tenant.is_active = not tenant.is_active
    await db.commit()
    
    # Log the billing activity
    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="subscription_updated",
        description=f"Subscription {'activated' if tenant.is_active else 'suspended'} by Platform Owner",
        metadata_json={"is_active": tenant.is_active}
    )
    db.add(activity)
    await db.commit()
    
    return {"status": "success", "is_active": tenant.is_active}


@router.post("/{tenant_id}/cancel")
async def cancel_subscription(
    tenant_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Cancel a tenant's subscription (sets MRR to 0 and suspends)."""
    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    tenant.is_active = False
    tenant.mrr = 0.0
    await db.commit()
    
    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="subscription_canceled",
        description="Subscription canceled by Platform Owner",
        metadata_json={"reason": "owner_forced_cancellation"}
    )
    db.add(activity)
    await db.commit()
    
    return {"status": "success"}


@router.get("/analytics/ai-costs")
async def get_ai_costs(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Real AI provider costs dynamically calculated from token usage."""
    # Group costs by model
    costs = (await db.execute(
        select(AITokenUsage.model, func.sum(AITokenUsage.cost_usd))
        .group_by(AITokenUsage.model)
    )).all()
    
    total_cost = sum([float(c[1] or 0) for c in costs])
    
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0.0
    
    providers = []
    colors = ["#10a37f", "#d97757", "#4285f4", "#8b5cf6"]
    for i, (model, cost) in enumerate(costs):
        c = float(cost or 0)
        providers.append({
            "name": model,
            "cost": c,
            "percentage": (c / total_cost * 100) if total_cost > 0 else 0,
            "color": colors[i % len(colors)]
        })
        
    return {
        "total_estimated_cost": total_cost,
        "margin": 100 - ((total_cost / total_mrr) * 100) if total_mrr > 0 else 100,
        "providers": sorted(providers, key=lambda x: x["cost"], reverse=True)
    }


@router.get("/analytics/forecast")
async def get_revenue_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Generate a revenue forecast based on historical Invoice data trend."""
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0.0
    
    # Calculate historical average growth rate from the last 6 months of invoices
    now = datetime.now(timezone.utc)
    historical_months = []
    
    # We'll calculate total revenue for the 6 previous months
    for i in range(6, 0, -1):
        month_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        next_month_start = (month_start + timedelta(days=32)).replace(day=1)
        month_rev = await db.scalar(
            select(func.sum(Invoice.amount))
            .where(Invoice.status == InvoiceStatus.paid, Invoice.invoice_date >= month_start, Invoice.invoice_date < next_month_start)
        ) or 0.0
        historical_months.append(float(month_rev))
        
    growth_rates = []
    for i in range(1, len(historical_months)):
        prev = historical_months[i-1]
        curr = historical_months[i]
        if prev > 0:
            growth_rates.append((curr - prev) / prev)
            
    avg_growth_rate = sum(growth_rates) / len(growth_rates) if growth_rates else 0.0
    # Bound the growth rate to reasonable limits for forecasting (-10% to +20% max)
    avg_growth_rate = max(-0.1, min(0.2, avg_growth_rate))
    
    forecast = []
    current_forecast = float(total_mrr)
    
    for i in range(1, 7):
        d = now + timedelta(days=30*i)
        current_forecast = current_forecast * (1 + avg_growth_rate)
        
        forecast.append({
            "name": d.strftime("%b"),
            "expected": current_forecast,
            "best_case": current_forecast * 1.05,
            "worst_case": current_forecast * 0.95
        })
        
    return {"forecast": forecast}


@router.get("/analytics/health")
async def get_financial_health(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Calculate platform financial health score dynamically from actuals."""
    active_subs = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0.0
    
    # Simple real rules
    score = 100
    status = "Excellent"
    if active_subs == 0:
        score = 0
        status = "Critical (No Users)"
    elif active_subs < 5:
        score -= 20
        status = "Needs Attention"
    if total_mrr < 1000:
        score -= 10
        if score < 80:
            status = "Needs Attention"
        
    return {
        "score": max(0, min(100, score)),
        "status": status,
        "metrics": {
            "revenue_score": score,
            "growth_score": score,
            "retention_score": score,
            "margin_score": score
        }
    }


@router.get("/activity")
async def get_global_billing_activity(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Fetch recent global billing events."""
    activities = (await db.execute(
        select(BillingActivity, Tenant.name)
        .join(Tenant, BillingActivity.tenant_id == Tenant.id)
        .order_by(desc(BillingActivity.created_at))
        .limit(10)
    )).all()
    
    result = []
    for act, tenant_name in activities:
        result.append({
            "id": act.id,
            "tenant": tenant_name,
            "type": act.event_type,
            "description": act.description,
            "date": act.created_at.isoformat()
        })
        
    return {"data": result}
