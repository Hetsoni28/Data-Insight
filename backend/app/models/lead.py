"""Lead / Inquiry model — tracks inbound demo requests from prospective clients."""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class LeadStatus(str, PyEnum):
    new = "new"
    contacted = "contacted"
    demo = "demo"
    negotiation = "negotiation"
    approved = "approved"
    provisioning = "provisioning"
    active = "active"
    rejected = "rejected"


class LeadSource(str, PyEnum):
    pricing_page = "pricing_page"
    landing_page = "landing_page"
    referral = "referral"
    direct = "direct"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )

    # ── Contact Info ──────────────────────────────────────────────────────────
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(200), nullable=False)
    business_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Organisation Context ──────────────────────────────────────────────────
    company_size: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )  # "1-10", "11-50" ...
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expected_users: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_storage_gb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_data_volume: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )  # "< 10GB", "10–100GB" ...

    # ── Requirements ──────────────────────────────────────────────────────────
    ai_bi_requirements: Mapped[str | None] = mapped_column(Text, nullable=True)
    preferred_contact_time: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Internal Pipeline ─────────────────────────────────────────────────────
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="lead_status", create_type=True),
        default=LeadStatus.new,
        nullable=False,
        index=True,
    )
    source: Mapped[LeadSource] = mapped_column(
        Enum(LeadSource, name="lead_source", create_type=True),
        default=LeadSource.pricing_page,
        nullable=False,
    )
    lead_id: Mapped[str] = mapped_column(
        String(30), nullable=False, unique=True,
    )  # e.g. LEAD-2026-0001
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(
        String(200), nullable=True,
    )  # sales rep name
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True,
    )  # set when provisioned

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    contacted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    demo_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    rejected_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
