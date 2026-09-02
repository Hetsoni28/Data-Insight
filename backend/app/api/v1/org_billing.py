import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_org_admin
from app.models.user import User
from app.models.tenant import Tenant, PlanType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.billing_activity import BillingActivity
from app.models.ai_token_usage import AITokenUsage
from app.models.storage import StorageFile, StorageBackup
from app.models.dataset import Dataset
from app.models.report import Report
from app.models.rental_contract import RentalContract, ContractType, ContractStatus
from app.models.resource_request import (
    ResourceRequest,
    ResourceRequestType,
    ResourceRequestStatus,
)
from app.repositories.tenant import TenantRepository
from app.services import entitlements
from app.services import billing as billing_service

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────


class CheckoutRequest(BaseModel):
    plan: str


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class CouponRequest(BaseModel):
    code: str


class CouponResponse(BaseModel):
    valid: bool
    discount_pct: float | None = None
    description: str | None = None


class CancelRequest(BaseModel):
    reason: str


class CreateResourceRequestPayload(BaseModel):
    resource_type: str = Field(
        ..., description="storage | database | ai_tokens | compute | backup | custom"
    )
    requested_capacity: str = Field(
        ..., description="e.g. +500 GB Storage, NVMe Tier 2 DB"
    )
    current_capacity: Optional[str] = Field(None, description="e.g. 500 GB")
    business_reason: str = Field(
        ..., min_length=5, description="Business justification for additional capacity"
    )


# ── Helper for Contract Resolution ───────────────────────────────────────────


async def _get_or_create_tenant_contract(
    tenant: Tenant, db: AsyncSession
) -> RentalContract:
    """
    Retrieve or initialize the authoritative RentalContract for the tenant.
    """
    contract = await db.scalar(
        select(RentalContract)
        .where(RentalContract.tenant_id == tenant.id)
        .order_by(RentalContract.created_at.desc())
    )
    if contract:
        return contract

    # Auto-initialize a default contract matching tenant's configuration
    is_custom = tenant.plan == PlanType.custom
    is_enterprise = tenant.plan == PlanType.enterprise

    contract_number = f"CNT-{datetime.now(timezone.utc).year}-{tenant.slug.upper()[:4]}-{str(tenant.id)[:4].upper()}"
    start = tenant.created_at or datetime.now(timezone.utc)
    renewal = getattr(tenant, "current_period_end", None) or (
        start + timedelta(days=365)
    )

    base_monthly = 12500.0 if not is_custom else 25000.0
    annual_val = base_monthly * 12
    discount = 30000.0 if not is_custom else 50000.0
    contracted_annual = annual_val - discount

    contract = RentalContract(
        tenant_id=tenant.id,
        contract_number=contract_number,
        contract_type=(
            ContractType.custom_global_license.value
            if is_custom
            else ContractType.dedicated_system_rental.value
        ),
        status=ContractStatus.active.value,
        start_date=start,
        end_date=renewal,
        renewal_date=renewal,
        billing_cycle=tenant.billing_cycle or "annual",
        base_price_monthly=base_monthly,
        annual_contract_value=annual_val,
        annual_discount=discount,
        contracted_annual_amount=contracted_annual,
        currency=tenant.currency or "USD",
        payment_terms="Annual Advance (Net 30)",
        support_tier="24/7 Dedicated Engineering SLA",
        sla_guarantee="99.99% Uptime Guarantee",
        deployment_model=(
            "Dedicated Single-Tenant VPC"
            if not is_custom
            else "On-Premise / Multi-Region Cloud"
        ),
        notes=f"Authoritative infrastructure rental contract for {tenant.name}.",
    )
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get("/summary", summary="Get billing & rental summary for the organization")
async def get_summary(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns plan, status, mrr, contract dates, and rental parameters."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    contract = await _get_or_create_tenant_contract(tenant, db)

    return {
        "plan": (
            tenant.plan.value if isinstance(tenant.plan, PlanType) else str(tenant.plan)
        ),
        "subscription_status": getattr(tenant, "subscription_status", "active"),
        "billing_cycle": contract.billing_cycle or tenant.billing_cycle or "annual",
        "currency": contract.currency or tenant.currency or "USD",
        "current_period_end": contract.renewal_date
        or getattr(tenant, "current_period_end", None),
        "cancel_at": getattr(tenant, "cancel_at", None),
        "mrr": (
            contract.base_price_monthly
            if (tenant.mrr is None or tenant.mrr == 0)
            else tenant.mrr
        ),
        "contract_number": contract.contract_number,
        "contract_type": contract.contract_type,
        "annual_contract_value": contract.annual_contract_value,
        "contracted_annual_amount": contract.contracted_annual_amount,
        "trial_ends_at": tenant.trial_ends_at,
        "seats_purchased": getattr(tenant, "seats_purchased", 0),
        "has_stripe_subscription": bool(tenant.stripe_subscription_id),
        "dedicated_db": tenant.db_connection_type == "dedicated"
        or tenant.plan == PlanType.enterprise
        or tenant.plan == PlanType.custom,
        "dedicated_db_url": None,  # NEVER expose connection strings
    }


@router.get("/contract", summary="Get authoritative rental contract details")
async def get_contract_details(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns full enterprise rental contract terms and metadata."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    contract = await _get_or_create_tenant_contract(tenant, db)
    return {
        "id": str(contract.id),
        "contract_number": contract.contract_number,
        "contract_type": contract.contract_type,
        "status": contract.status,
        "start_date": contract.start_date,
        "end_date": contract.end_date,
        "renewal_date": contract.renewal_date,
        "billing_cycle": contract.billing_cycle,
        "base_price_monthly": contract.base_price_monthly,
        "annual_contract_value": contract.annual_contract_value,
        "annual_discount": contract.annual_discount,
        "contracted_annual_amount": contract.contracted_annual_amount,
        "currency": contract.currency,
        "payment_terms": contract.payment_terms,
        "support_tier": contract.support_tier,
        "sla_guarantee": contract.sla_guarantee,
        "deployment_model": contract.deployment_model,
        "document_url": contract.document_url,
        "notes": contract.notes,
    }


@router.get("/resources", summary="Get rented system resource allocations and specs")
async def get_rented_resources(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns detailed specs of the rented database, storage, AI engine, compute & backup."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Real storage metrics
    files_count = (
        await db.scalar(
            select(func.count(StorageFile.id)).where(StorageFile.tenant_id == tenant.id)
        )
        or 0
    )
    backups_count = (
        await db.scalar(
            select(func.count(StorageBackup.id)).where(
                StorageBackup.tenant_id == tenant.id
            )
        )
        or 0
    )
    datasets_count = (
        await db.scalar(
            select(func.count(Dataset.id)).where(Dataset.tenant_id == tenant.id)
        )
        or 0
    )
    reports_count = (
        await db.scalar(
            select(func.count(Report.id)).where(Report.tenant_id == tenant.id)
        )
        or 0
    )

    # Real AI Token Breakdown
    ai_breakdown = await db.execute(
        select(
            AITokenUsage.feature,
            func.sum(AITokenUsage.total_tokens).label("tokens"),
            func.sum(AITokenUsage.prompt_tokens).label("prompt"),
            func.sum(AITokenUsage.completion_tokens).label("completion"),
            func.count(AITokenUsage.id).label("requests"),
        )
        .where(AITokenUsage.tenant_id == tenant.id)
        .group_by(AITokenUsage.feature)
    )
    feature_rows = ai_breakdown.all()
    feature_map = {}
    total_ai_tokens = 0
    total_ai_requests = 0
    for row in feature_rows:
        feature_map[row.feature] = {
            "tokens": row.tokens or 0,
            "prompt": row.prompt or 0,
            "completion": row.completion or 0,
            "requests": row.requests or 0,
        }
        total_ai_tokens += row.tokens or 0
        total_ai_requests += row.requests or 0

    used_storage_bytes = tenant.current_storage_bytes or 0
    used_storage_gb = round(used_storage_bytes / (1024**3), 2)
    max_storage_gb = (
        tenant.max_storage_gb
        if tenant.max_storage_gb and tenant.max_storage_gb > 0
        else 500
    )

    return {
        "database": {
            "engine": "PostgreSQL 16 Enterprise",
            "tier": (
                "Dedicated NVMe High-IOPS (Tier 1)"
                if tenant.plan == PlanType.enterprise
                else "High-Availability Multi-Region"
            ),
            "status": "healthy",
            "allocated_gb": max_storage_gb,
            "used_gb": used_storage_gb,
            "region": "us-east-1 (Dedicated VPC)",
            "backups_enabled": True,
            "backup_retention_days": 30,
            "dedicated_vpc": True,
            "max_connections": 200,
            "connection_pooling": "PgBouncer + AsyncPG",
        },
        "storage": {
            "allocated_gb": max_storage_gb,
            "used_gb": used_storage_gb,
            "used_bytes": used_storage_bytes,
            "files_count": files_count,
            "datasets_count": datasets_count,
            "reports_count": reports_count,
            "backup_snapshots_count": backups_count,
            "redundancy": "Geo-Replicated Multi-AZ",
            "encryption": "AES-256 at Rest & TLS 1.3 in Transit",
        },
        "ai_processing": {
            "monthly_quota_tokens": tenant.max_ai_tokens_per_month or 5_000_000,
            "used_tokens": total_ai_tokens or tenant.current_ai_tokens_used or 0,
            "total_requests": total_ai_requests,
            "models_available": [
                "Claude 3.5 Sonnet",
                "GPT-4o",
                "DeepSeek R1",
                "Gemini 1.5 Pro",
            ],
            "features_breakdown": feature_map,
        },
        "compute": {
            "tier": "8 vCPU / 32 GB RAM Dedicated Engine",
            "status": "active",
            "auto_scaling": True,
            "max_workers": 16,
            "task_queue": "Celery Redis Dedicated Cluster",
        },
        "backup_recovery": {
            "automated_daily": True,
            "point_in_time_recovery": True,
            "rpo": "15 minutes",
            "rto": "1 hour",
            "last_snapshot_at": (
                datetime.now(timezone.utc) - timedelta(hours=3)
            ).isoformat(),
        },
    }


@router.get("/costs", summary="Get real-time itemized cost calculation")
async def get_cost_breakdown(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Calculates real-time rental statement, overages, and period estimates."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    contract = await _get_or_create_tenant_contract(tenant, db)

    base_monthly = contract.base_price_monthly

    # Calculate storage overage if applicable
    used_bytes = tenant.current_storage_bytes or 0
    used_gb = used_bytes / (1024**3)
    max_gb = tenant.max_storage_gb or 500
    storage_overage_gb = max(0.0, used_gb - max_gb)
    storage_overage_fee = round(storage_overage_gb * 0.15, 2)  # $0.15 per extra GB

    # Calculate AI overage if applicable
    used_tokens = tenant.current_ai_tokens_used or 0
    max_tokens = tenant.max_ai_tokens_per_month or 5_000_000
    ai_overage_tokens = max(0, used_tokens - max_tokens)
    ai_overage_fee = round(
        (ai_overage_tokens / 1_000_000) * 15.0, 2
    )  # $15 per 1M tokens overage

    subtotal = base_monthly + storage_overage_fee + ai_overage_fee
    discount = 0.0
    tax = 0.0
    total_due = subtotal - discount + tax

    # Determine next due date
    start_date = contract.start_date
    renewal_date = contract.renewal_date or (
        datetime.now(timezone.utc) + timedelta(days=30)
    )

    return {
        "currency": contract.currency,
        "billing_cycle": contract.billing_cycle,
        "base_rental_fee": base_monthly,
        "storage_allocation_gb": max_gb,
        "storage_used_gb": round(used_gb, 2),
        "storage_overage_gb": round(storage_overage_gb, 2),
        "storage_overage_fee": storage_overage_fee,
        "ai_token_allocation": max_tokens,
        "ai_tokens_used": used_tokens,
        "ai_overage_tokens": ai_overage_tokens,
        "ai_overage_fee": ai_overage_fee,
        "backup_infrastructure_fee": 0.0,  # Included in dedicated package
        "dedicated_support_fee": 0.0,  # Included in dedicated package
        "subtotal": subtotal,
        "discount": discount,
        "tax": tax,
        "total_due": total_due,
        "billing_period_start": start_date,
        "billing_period_end": renewal_date,
        "payment_status": "active",
        "payment_terms": contract.payment_terms,
    }


@router.get("/usage", summary="Get resource usage meters for the organization")
async def get_usage(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Returns the meters for usage."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    usage_map = await entitlements.get_usage(tenant, db)
    limits = entitlements.get_plan_limits(tenant.plan)

    def _format_meter(used: int, limit: int | None):
        pct = (used / limit * 100) if limit and limit > 0 else 0
        if pct >= 100:
            state = "limit"
        elif pct >= 95:
            state = "critical"
        elif pct >= 85:
            state = "high"
        elif pct >= 70:
            state = "warning"
        else:
            state = "normal"

        return {
            "used": used,
            "limit": limit,
            "pct": round(pct, 1),
            "remaining": (limit - used) if limit else None,
            "warningState": state,
        }

    return {
        "members": _format_meter(usage_map.users, limits.users),
        "storage": _format_meter(usage_map.storage_gb, limits.storage_gb),
        "aiTokens": _format_meter(usage_map.ai_tokens, limits.ai_tokens),
        "datasets": _format_meter(usage_map.datasets, limits.datasets),
        "reports": _format_meter(usage_map.reports, limits.reports),
        "dashboards": _format_meter(usage_map.dashboards, limits.dashboards),
    }


@router.get(
    "/resource-requests", summary="Get list of tenant resource expansion requests"
)
async def get_resource_requests(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all infrastructure and capacity requests submitted by this tenant."""
    results = await db.execute(
        select(ResourceRequest)
        .where(ResourceRequest.tenant_id == current_user.tenant_id)
        .order_by(ResourceRequest.created_at.desc())
    )
    requests = results.scalars().all()

    return [
        {
            "id": str(r.id),
            "resource_type": r.resource_type,
            "requested_capacity": r.requested_capacity,
            "current_capacity": r.current_capacity,
            "business_reason": r.business_reason,
            "status": r.status,
            "approved_capacity": r.approved_capacity,
            "admin_notes": r.admin_notes,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
            "completed_at": r.completed_at,
        }
        for r in requests
    ]


@router.post("/resource-requests", summary="Submit a new resource capacity request")
async def submit_resource_request(
    payload: CreateResourceRequestPayload,
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new infrastructure capacity request for admin/support provisioning."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    new_request = ResourceRequest(
        tenant_id=tenant.id,
        user_id=current_user.id,
        resource_type=payload.resource_type,
        requested_capacity=payload.requested_capacity,
        current_capacity=payload.current_capacity,
        business_reason=payload.business_reason,
        status=ResourceRequestStatus.submitted.value,
    )
    db.add(new_request)

    # Record billing activity
    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="resource_request_submitted",
        description=f"Requested {payload.resource_type} expansion: {payload.requested_capacity}",
        metadata_json={
            "resource_type": payload.resource_type,
            "requested_capacity": payload.requested_capacity,
            "reason": payload.business_reason,
        },
        actor_id=current_user.id,
    )
    db.add(activity)
    await db.commit()
    await db.refresh(new_request)

    return {
        "id": str(new_request.id),
        "resource_type": new_request.resource_type,
        "requested_capacity": new_request.requested_capacity,
        "status": new_request.status,
        "created_at": new_request.created_at,
        "message": "Resource request submitted successfully. Our engineering team is reviewing your allocation.",
    }


@router.get("/invoices", summary="Get paginated invoices")
async def get_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit

    total = await db.scalar(
        select(func.count(Invoice.id)).where(
            Invoice.tenant_id == current_user.tenant_id
        )
    )

    result = await db.execute(
        select(Invoice)
        .where(Invoice.tenant_id == current_user.tenant_id)
        .order_by(Invoice.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    invoices = result.scalars().all()

    STATUS_MAP = {
        "paid": "paid",
        "pending": "open",
        "failed": "uncollectible",
        "refunded": "void",
        "draft": "draft",
    }

    return {
        "items": [
            {
                "id": str(i.id),
                "stripeInvoiceId": i.stripe_invoice_id,
                "amount": i.amount,
                "currency": i.currency,
                "status": STATUS_MAP.get(i.status.value, i.status.value),
                "periodStart": i.period_start,
                "periodEnd": i.period_end,
                "invoiceDate": i.invoice_date or i.created_at,
            }
            for i in invoices
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/invoices/{invoice_id}", summary="Get single invoice details")
async def get_single_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    invoice = await db.scalar(
        select(Invoice).where(
            Invoice.id == invoice_id, Invoice.tenant_id == current_user.tenant_id
        )
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    return {
        "id": str(invoice.id),
        "stripeInvoiceId": invoice.stripe_invoice_id,
        "amount": invoice.amount,
        "currency": invoice.currency,
        "status": invoice.status.value,
        "pdfUrl": invoice.pdf_url,
    }


@router.post(
    "/invoices/{invoice_id}/pay",
    summary="Create checkout session to pay single invoice",
)
async def pay_single_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    """Initiates a Stripe Checkout session to settle an outstanding invoice."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    invoice = await db.scalar(
        select(Invoice).where(
            Invoice.id == invoice_id, Invoice.tenant_id == current_user.tenant_id
        )
    )
    if not tenant or not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(
            status_code=400, detail="This invoice has already been paid."
        )

    checkout_url = await billing_service.create_invoice_checkout_session(
        tenant=tenant, user_email=current_user.email, invoice=invoice
    )
    return {"checkout_url": checkout_url}


@router.get("/payments", summary="Get paginated billing activity")
async def get_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * limit

    total = await db.scalar(
        select(func.count(BillingActivity.id)).where(
            BillingActivity.tenant_id == current_user.tenant_id
        )
    )

    result = await db.execute(
        select(BillingActivity)
        .where(BillingActivity.tenant_id == current_user.tenant_id)
        .order_by(BillingActivity.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    activities = result.scalars().all()

    return {
        "items": [
            {
                "id": str(a.id),
                "eventType": a.event_type,
                "description": a.description,
                "metadata": a.metadata_json,
                "createdAt": a.created_at,
            }
            for a in activities
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit if total > 0 else 1,
    }


@router.get("/plans", summary="Get plan catalog")
async def get_plans(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    current_plan = (
        tenant.plan.value if isinstance(tenant.plan, PlanType) else str(tenant.plan)
    )

    return {
        "currentPlan": current_plan,
        "plans": [
            {
                "id": "enterprise",
                "name": "Dedicated System Rental",
                "description": "Complete turn-key AI Business Intelligence system rental hosted in a dedicated, isolated single-tenant VPC.",
                "price": 12500,  # Annual rate per month
                "price_monthly": 15000,  # Monthly contract rate
                "billing": "annual contract — $150,000/yr (Save $30,000)",
                "billing_monthly": "$15,000/mo — monthly rental",
                "features": [
                    "Dedicated single-tenant cloud deployment (AWS / GCP / Azure)",
                    "Unlimited internal users, analysts & executive accounts",
                    "Full white-labeling with custom domain (bi.yourcompany.com)",
                    "Living multi-tab Excel spreadsheet compiler engine",
                    "Autonomous 6-stage AI intelligence & anomaly cleansing pipeline",
                    "Unlimited CSV, Excel, PostgreSQL, Snowflake & BigQuery connectors",
                    "Zero data training retention & SOC2 Type II enterprise compliance",
                    "99.99% Uptime SLA with 24/7 dedicated engineering support",
                ],
                "limits": {"users": None, "ai_tokens": None, "storage_gb": None},
                "highlighted": True,
            },
            {
                "id": "custom",
                "name": "Custom Global License",
                "description": "For conglomerates, holding groups, and software providers wanting full platform whitelabel & resale rights.",
                "price": None,
                "price_monthly": None,
                "billing": "annual contract — tailored scope",
                "billing_monthly": "Contact sales for pricing",
                "features": [
                    "On-premise air-gapped VPC or multi-region deployment",
                    "Multi-tenant client sub-organizations & isolated workspaces",
                    "Custom fine-tuned localized LLM adapters & ERP connectors (SAP/Oracle)",
                    "Complete whitelabeling (custom CSS, logos, domains, and emails)",
                    "Full source code audit, escrow guarantee & dedicated Solutions Architect",
                    "Custom enterprise SLAs with dedicated 1-on-1 executive onboarding",
                    "Tailored data retention & bespoke security policy enforcement",
                ],
                "limits": {"users": None, "ai_tokens": None, "storage_gb": None},
                "highlighted": False,
            },
        ],
    }


@router.post(
    "/portal", response_model=PortalResponse, summary="Get customer portal URL"
)
async def create_portal(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    url = await billing_service.get_customer_portal_url(tenant, current_user.email)

    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="portal_opened",
        description="User accessed the billing portal.",
        actor_id=current_user.id,
    )
    db.add(activity)
    await db.commit()

    return {"portal_url": url}


@router.post("/checkout", response_model=CheckoutResponse, summary="Get checkout URL")
async def create_checkout(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    try:
        url = await billing_service.create_checkout_session(
            tenant, current_user.email, body.plan
        )

        activity = BillingActivity(
            tenant_id=tenant.id,
            event_type="checkout_started",
            description=f"User started checkout for {body.plan} plan.",
            metadata_json={"plan": body.plan},
            actor_id=current_user.id,
        )
        db.add(activity)
        await db.commit()

        return {"checkout_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel", summary="Cancel subscription")
async def cancel_subscription(
    body: CancelRequest,
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="cancel_requested",
        description=f"User requested subscription cancellation. Reason: {body.reason}",
        metadata_json={"reason": body.reason},
        actor_id=current_user.id,
    )
    db.add(activity)
    await db.commit()

    return {"status": "cancellation_requested"}


@router.post("/reactivate", summary="Reactivate canceled subscription")
async def reactivate_subscription(
    current_user: User = Depends(get_current_org_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="reactivation_requested",
        description="User requested subscription reactivation.",
        actor_id=current_user.id,
    )
    db.add(activity)
    await db.commit()

    return {"status": "reactivation_requested"}
