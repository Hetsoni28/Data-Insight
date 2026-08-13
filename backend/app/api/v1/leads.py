"""
Leads API — public endpoint for inbound demo/access requests + owner pipeline management.

Public  (no auth):
  POST /leads/inquire              → Submit a demo request form

Owner-only:
  GET  /leads/                     → List all leads (with filters/pagination)
  GET  /leads/stats                → Pipeline stats (count per status)
  GET  /leads/{lead_id}            → Get single lead detail
  PATCH /leads/{lead_id}/status    → Update lead status
  PATCH /leads/{lead_id}/notes     → Update internal notes
  DELETE /leads/{lead_id}          → Soft-delete / reject a lead
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel, EmailStr, Field

from app.api.deps import get_shared_db, get_current_user
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadSource
from app.core.config import settings
from app.services import email as email_service

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _require_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.owner, UserRole.super_admin):
        raise HTTPException(status_code=403, detail="Owner access required.")
    return current_user


def _generate_lead_id(db_count: int) -> str:
    """Generate a sequential human-readable lead ID like LEAD-2026-0042."""
    year = datetime.now(timezone.utc).year
    seq = str(db_count + 1).zfill(4)
    return f"LEAD-{year}-{seq}"


def _lead_to_dict(lead: Lead) -> dict:
    return {
        "id": str(lead.id),
        "lead_id": lead.lead_id,
        "company_name": lead.company_name,
        "contact_person": lead.contact_person,
        "business_email": lead.business_email,
        "phone": lead.phone,
        "company_size": lead.company_size,
        "industry": lead.industry,
        "expected_users": lead.expected_users,
        "expected_storage_gb": lead.expected_storage_gb,
        "expected_data_volume": lead.expected_data_volume,
        "ai_bi_requirements": lead.ai_bi_requirements,
        "preferred_contact_time": lead.preferred_contact_time,
        "message": lead.message,
        "status": lead.status.value,
        "source": lead.source.value,
        "internal_notes": lead.internal_notes,
        "assigned_to": lead.assigned_to,
        "tenant_id": str(lead.tenant_id) if lead.tenant_id else None,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
        "contacted_at": lead.contacted_at.isoformat() if lead.contacted_at else None,
        "demo_at": lead.demo_at.isoformat() if lead.demo_at else None,
        "approved_at": lead.approved_at.isoformat() if lead.approved_at else None,
        "rejected_at": lead.rejected_at.isoformat() if lead.rejected_at else None,
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class InquirySubmission(BaseModel):
    company_name: str              = Field(..., min_length=2, max_length=200)
    contact_person: str            = Field(..., min_length=2, max_length=200)
    business_email: EmailStr
    phone: Optional[str]           = Field(None, max_length=50)
    company_size: Optional[str]    = None    # "1-10", "11-50", "51-200", "201-500", "500+"
    industry: Optional[str]        = None
    expected_users: Optional[int]  = None
    expected_storage_gb: Optional[int] = None
    expected_data_volume: Optional[str] = None
    ai_bi_requirements: Optional[str]   = None
    preferred_contact_time: Optional[str] = None
    message: Optional[str]         = None
    source: Optional[str]          = "pricing_page"


class UpdateStatusPayload(BaseModel):
    status: LeadStatus
    internal_notes: Optional[str] = None
    assigned_to: Optional[str] = None


class UpdateNotesPayload(BaseModel):
    internal_notes: str
    assigned_to: Optional[str] = None


# ── Public: Submit Inquiry ─────────────────────────────────────────────────────

@router.post("/inquire", summary="Submit a demo / access request (public — no auth)")
async def submit_inquiry(
    payload: InquirySubmission,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_shared_db),
):
    """
    Public endpoint — no authentication required.
    Anyone can submit a demo request from the pricing/landing page.
    Creates a Lead record, sends a confirmation to the applicant,
    and notifies the owner.
    """
    # Generate sequential Lead ID
    total = await db.scalar(select(func.count(Lead.id))) or 0
    lead_id = _generate_lead_id(total)

    # Map source string to enum
    source_map = {
        "pricing_page": LeadSource.pricing_page,
        "landing_page": LeadSource.landing_page,
        "referral": LeadSource.referral,
        "direct": LeadSource.direct,
    }
    source = source_map.get(payload.source or "pricing_page", LeadSource.pricing_page)

    lead = Lead(
        company_name=payload.company_name,
        contact_person=payload.contact_person,
        business_email=str(payload.business_email),
        phone=payload.phone,
        company_size=payload.company_size,
        industry=payload.industry,
        expected_users=payload.expected_users,
        expected_storage_gb=payload.expected_storage_gb,
        expected_data_volume=payload.expected_data_volume,
        ai_bi_requirements=payload.ai_bi_requirements,
        preferred_contact_time=payload.preferred_contact_time,
        message=payload.message,
        status=LeadStatus.new,
        source=source,
        lead_id=lead_id,
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    # Fire emails in background — don't block the response
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    owner_email  = getattr(settings, "EMAIL_FROM", None) or getattr(settings, "OWNER_EMAIL", None)
    dashboard_url = f"{frontend_url}/owner/dashboard/leads"

    background_tasks.add_task(
        email_service.send_lead_inquiry_confirmation,
        to_email=str(payload.business_email),
        contact_person=payload.contact_person,
        company_name=payload.company_name,
        lead_id=lead_id,
    )

    if owner_email:
        background_tasks.add_task(
            email_service.send_new_lead_notification,
            owner_email=owner_email,
            lead_id=lead_id,
            company_name=payload.company_name,
            contact_person=payload.contact_person,
            business_email=str(payload.business_email),
            company_size=payload.company_size,
            industry=payload.industry,
            message=payload.message,
            dashboard_url=dashboard_url,
        )

    return {
        "success": True,
        "lead_id": lead_id,
        "message": "Your demo request has been received. We will contact you within 1 business day.",
    }


# ── Owner: Pipeline Management ─────────────────────────────────────────────────

@router.get("/", summary="List all leads (owner only)")
async def list_leads(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(_require_owner),
    db: AsyncSession = Depends(get_shared_db),
):
    offset = (page - 1) * limit
    q = select(Lead).order_by(desc(Lead.created_at))

    if status:
        try:
            status_enum = LeadStatus(status)
            q = q.where(Lead.status == status_enum)
        except ValueError:
            pass

    if search:
        like = f"%{search}%"
        from sqlalchemy import or_
        q = q.where(or_(
            Lead.company_name.ilike(like),
            Lead.contact_person.ilike(like),
            Lead.business_email.ilike(like),
            Lead.lead_id.ilike(like),
        ))

    total_q = select(func.count()).select_from(q.subquery())
    total = await db.scalar(total_q) or 0

    result = await db.execute(q.offset(offset).limit(limit))
    leads = result.scalars().all()

    return {
        "items": [_lead_to_dict(l) for l in leads],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/stats", summary="Pipeline stats — count per status (owner only)")
async def get_pipeline_stats(
    current_user: User = Depends(_require_owner),
    db: AsyncSession = Depends(get_shared_db),
):
    result = await db.execute(
        select(Lead.status, func.count(Lead.id).label("count"))
        .group_by(Lead.status)
    )
    rows = result.all()
    counts = {row.status.value: row.count for row in rows}

    # Ensure all statuses are present even if 0
    return {
        "pipeline": {s.value: counts.get(s.value, 0) for s in LeadStatus},
        "total": sum(counts.values()),
    }


@router.get("/{lead_id}", summary="Get single lead detail (owner only)")
async def get_lead(
    lead_id: str,
    current_user: User = Depends(_require_owner),
    db: AsyncSession = Depends(get_shared_db),
):
    lead = await db.scalar(
        select(Lead).where(Lead.lead_id == lead_id)
    )
    if not lead:
        # Also try by UUID
        try:
            uid = uuid.UUID(lead_id)
            lead = await db.scalar(select(Lead).where(Lead.id == uid))
        except ValueError:
            pass
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    return _lead_to_dict(lead)


@router.patch("/{lead_id}/status", summary="Update lead pipeline status (owner only)")
async def update_lead_status(
    lead_id: str,
    payload: UpdateStatusPayload,
    current_user: User = Depends(_require_owner),
    db: AsyncSession = Depends(get_shared_db),
):
    lead = await db.scalar(select(Lead).where(Lead.lead_id == lead_id))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    now = datetime.now(timezone.utc)
    lead.status = payload.status

    # Set milestone timestamps
    if payload.status == LeadStatus.contacted and not lead.contacted_at:
        lead.contacted_at = now
    elif payload.status == LeadStatus.demo and not lead.demo_at:
        lead.demo_at = now
    elif payload.status == LeadStatus.approved and not lead.approved_at:
        lead.approved_at = now
    elif payload.status == LeadStatus.rejected and not lead.rejected_at:
        lead.rejected_at = now

    if payload.internal_notes is not None:
        lead.internal_notes = payload.internal_notes
    if payload.assigned_to is not None:
        lead.assigned_to = payload.assigned_to

    lead.updated_at = now
    await db.commit()
    await db.refresh(lead)
    return _lead_to_dict(lead)


@router.patch("/{lead_id}/notes", summary="Update internal notes (owner only)")
async def update_lead_notes(
    lead_id: str,
    payload: UpdateNotesPayload,
    current_user: User = Depends(_require_owner),
    db: AsyncSession = Depends(get_shared_db),
):
    lead = await db.scalar(select(Lead).where(Lead.lead_id == lead_id))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    lead.internal_notes = payload.internal_notes
    if payload.assigned_to is not None:
        lead.assigned_to = payload.assigned_to
    lead.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"success": True}
