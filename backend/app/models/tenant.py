"""Tenant model — one per paying organization with enterprise DB routing and quota tracking."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, BigInteger, Boolean, DateTime, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class PlanType(str, enum.Enum):
    starter = "starter"
    professional = "professional"
    enterprise = "enterprise"
    custom = "custom"


class DBConnectionType(str, enum.Enum):
    shared = "shared"
    dedicated = "dedicated"


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True,
    )
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    plan: Mapped[str] = mapped_column(
        String(50), default=PlanType.starter, nullable=False,
    )

    # Database Isolation Routing (Shared vs Dedicated Enterprise VPC)
    db_connection_type: Mapped[str] = mapped_column(
        String(20), default=DBConnectionType.shared, nullable=False,
    )
    dedicated_db_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Limits based on plan
    max_users: Mapped[int] = mapped_column(default=5)
    max_storage_gb: Mapped[int] = mapped_column(default=5)
    max_ai_tokens_per_month: Mapped[int] = mapped_column(default=100_000)

    # Real-time usage tracking
    current_storage_bytes: Mapped[int] = mapped_column(
        BigInteger, default=0, nullable=False,
    )
    current_ai_tokens_used: Mapped[int] = mapped_column(
        BigInteger, default=0, nullable=False,
    )
    quota_reset_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # White-label configuration
    white_label_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # General configuration blocks for settings
    data_connections_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    integrations_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    notifications_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    advanced_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Enterprise features
    sso_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    custom_domain: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True,
    )
    custom_domain_status: Mapped[str | None] = mapped_column(
        String(50), nullable=True,
    )  # pending, verified, failed

    # Stripe billing
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True,
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True,
    )
    subscription_status: Mapped[str] = mapped_column(
        String(50), default="active", nullable=False,
    )
    current_period_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    cancel_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    seats_purchased: Mapped[int] = mapped_column(default=0, nullable=False)
    billing_cycle: Mapped[str] = mapped_column(
        String(20), default="monthly",
    )  # monthly, yearly
    mrr: Mapped[float] = mapped_column(
        Float, default=0.0,
    )  # cached Monthly Recurring Revenue
    trial_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # Provisioning (enterprise dedicated DB/storage)
    # Values: "none" | "pending" | "ready" | "failed"
    # The dedicated_db_url field is ALWAYS stored AES-256 Fernet encrypted
    provisioning_status: Mapped[str] = mapped_column(
        String(20), default="none", nullable=False,
    )
    provisioning_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status and Lifecycle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    suspension_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="tenant", lazy="noload")  # type: ignore[name-defined]
    workspaces: Mapped[list["Workspace"]] = relationship("Workspace", back_populates="tenant", lazy="noload")  # type: ignore[name-defined]
