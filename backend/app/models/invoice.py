"""Invoice model for tracking organization billing."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Float, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base
import enum


class InvoiceStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    failed = "failed"
    refunded = "refunded"
    draft = "draft"


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    status: Mapped[InvoiceStatus] = mapped_column(
        SQLAlchemyEnum(InvoiceStatus), default=InvoiceStatus.pending, nullable=False
    )

    stripe_invoice_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )
    pdf_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)

    billing_reason: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # subscription_cycle, manual, etc.

    period_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    invoice_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
