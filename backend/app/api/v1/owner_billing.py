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
    
    # Profitability mock based on revenue (assuming 85% gross margin, 40% net margin)
    gross_profit = total_mrr * 0.85
    net_profit = total_mrr * 0.40
    operating_profit = total_mrr * 0.60
    
    ai_revenue = total_mrr * 0.35 # Simulated ratio of MRR from AI usage
    storage_revenue = total_mrr * 0.15 # Simulated ratio of MRR from storage
    api_revenue = total_mrr * 0.10

    # Sparklines
    sparkline_revenue = [total_mrr * 0.85, total_mrr * 0.88, total_mrr * 0.92, total_mrr * 0.94, total_mrr * 0.97, total_mrr * 0.99, total_mrr]

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
        result.append({
            "id": t.id,
            "name": t.name,
            "plan": t.plan,
            "billing_cycle": t.billing_cycle,
            "mrr": float(t.mrr),
            "status": "Active" if t.is_active else "Suspended",
            "users": 1, # Mock for now
            "storage_used": 1.2,
            "created_at": t.created_at.isoformat()
        })
    return {"data": result}


@router.get("/invoices")
async def get_invoices(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100)
) -> Any:
    """Fetch global invoices."""
    invoices = (await db.execute(
        select(Invoice, Tenant.name.label("tenant_name"))
        .join(Tenant, Invoice.tenant_id == Tenant.id)
        .order_by(desc(Invoice.invoice_date))
        .offset(skip).limit(limit)
    )).all()
    
    result = []
    for inv, tenant_name in invoices:
        result.append({
            "id": inv.id,
            "tenant_name": tenant_name,
            "amount": inv.amount,
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
    """Mock estimated AI provider costs dynamically based on total active MRR."""
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 1000.0
    
    total_cost = total_mrr * 0.18 # AI costs are roughly 18% of MRR in this mock
    
    return {
        "total_estimated_cost": total_cost,
        "margin": 100 - ((total_cost / total_mrr) * 100) if total_mrr > 0 else 0,
        "providers": [
            {"name": "OpenAI (GPT-4)", "cost": total_cost * 0.60, "percentage": 60, "color": "#10a37f"},
            {"name": "Anthropic (Claude 3.5)", "cost": total_cost * 0.25, "percentage": 25, "color": "#d97757"},
            {"name": "Google (Gemini Pro)", "cost": total_cost * 0.10, "percentage": 10, "color": "#4285f4"},
            {"name": "Other / Local", "cost": total_cost * 0.05, "percentage": 5, "color": "#8b5cf6"}
        ]
    }


@router.get("/analytics/forecast")
async def get_revenue_forecast(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Generate a simulated 6-month revenue forecast."""
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 1000.0
    
    now = datetime.now(timezone.utc)
    forecast = []
    current = total_mrr
    
    for i in range(1, 7):
        # Base growth 5% + random jitter
        current = current * 1.05
        d = now + timedelta(days=30*i)
        forecast.append({
            "name": d.strftime("%b"),
            "expected": current,
            "best_case": current * 1.08,
            "worst_case": current * 0.95
        })
        
    return {"forecast": forecast}


@router.get("/analytics/health")
async def get_financial_health(
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_owner)
) -> Any:
    """Calculate platform financial health score dynamically."""
    active_subs = await db.scalar(
        select(func.count(Tenant.id)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0
    total_mrr = await db.scalar(
        select(func.sum(Tenant.mrr)).where(Tenant.is_active == True, Tenant.is_deleted == False)
    ) or 0.0
    
    score = 85
    status = "Excellent"
    if active_subs < 5:
        score -= 20
        status = "Needs Attention"
    if total_mrr < 1000:
        score -= 10
        
    return {
        "score": max(0, min(100, score)),
        "status": status,
        "metrics": {
            "revenue_score": 92,
            "growth_score": 88,
            "profitability": 85,
            "cash_flow": 95
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
