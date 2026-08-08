"""RentalContract model — tracks enterprise resource rental contracts."""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, Text, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class ContractType(str, enum.Enum):
    dedicated_system_rental = "dedicated_system_rental"
    custom_global_license = "custom_global_license"


class ContractStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    renewal_pending = "renewal_pending"
    payment_due = "payment_due"
    payment_overdue = "payment_overdue"
    expiring = "expiring"
    suspended = "suspended"
    cancelled = "cancelled"
    expired = "expired"


class RentalContract(Base):
    __tablename__ = "rental_contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )

    contract_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    contract_type: Mapped[str] = mapped_column(
        String(50), default=ContractType.dedicated_system_rental.value, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(50), default=ContractStatus.active.value, nullable=False
    )

    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    end_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    renewal_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    billing_cycle: Mapped[str] = mapped_column(String(20), default="annual", nullable=False)
    base_price_monthly: Mapped[float] = mapped_column(Float, default=12500.0, nullable=False)
    annual_contract_value: Mapped[float] = mapped_column(Float, default=150000.0, nullable=False)
    annual_discount: Mapped[float] = mapped_column(Float, default=30000.0, nullable=False)
    contracted_annual_amount: Mapped[float] = mapped_column(Float, default=120000.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)

    payment_terms: Mapped[str] = mapped_column(String(50), default="Annual Advance", nullable=False)
    support_tier: Mapped[str] = mapped_column(String(50), default="24/7 Dedicated Engineering", nullable=False)
    sla_guarantee: Mapped[str] = mapped_column(String(50), default="99.99% Uptime SLA", nullable=False)
    deployment_model: Mapped[str] = mapped_column(
        String(100), default="Dedicated Single-Tenant VPC", nullable=False
    )

    document_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
