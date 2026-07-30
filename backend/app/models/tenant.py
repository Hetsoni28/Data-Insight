"""Tenant model — one per paying organization."""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class PlanType(str, enum.Enum):
    starter = "starter"
    professional = "professional"
    enterprise = "enterprise"
    custom = "custom"


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    plan: Mapped[str] = mapped_column(
        String(50), default=PlanType.starter, nullable=False
    )

    # Limits based on plan
    max_users: Mapped[int] = mapped_column(default=5)
    max_storage_gb: Mapped[int] = mapped_column(default=5)
    max_ai_tokens_per_month: Mapped[int] = mapped_column(default=100_000)

    # White-label configuration
    white_label_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Stripe billing
    stripe_customer_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True
    )
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
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

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="tenant", lazy="noload")  # type: ignore[name-defined]
    workspaces: Mapped[list["Workspace"]] = relationship("Workspace", back_populates="tenant", lazy="noload")  # type: ignore[name-defined]
