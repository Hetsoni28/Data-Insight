import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class UserRole:
    """Role constants — stored as plain strings in DB."""

    owner = "owner"  # Platform god — seeded only, never registerable
    org_admin = "org_admin"  # Auto-assigned when creating an org
    manager = "manager"  # Assigned via invitation only
    analyst = "analyst"  # Assigned via invitation only
    viewer = "viewer"  # Default for individual registrations

    ALL = [owner, org_admin, manager, analyst, viewer]
    INVITABLE = [manager, analyst, viewer]  # Org admin can assign these


class AccountType:
    """Account type — individual or organization."""

    individual = "individual"
    organization = "organization"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Tenant link (null until user is onboarded to an org)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # RBAC
    role: Mapped[str] = mapped_column(
        String(50), default=UserRole.viewer, nullable=False
    )
    account_type: Mapped[str] = mapped_column(
        String(50), default=AccountType.individual, nullable=False
    )

    # Flags
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verification_token: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    password_reset_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_reset_expires: Mapped[datetime | None] = mapped_column(
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
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users", lazy="noload")  # type: ignore[name-defined]
    sessions: Mapped[list["UserSession"]] = relationship("UserSession", back_populates="user", lazy="noload")  # type: ignore[name-defined]
