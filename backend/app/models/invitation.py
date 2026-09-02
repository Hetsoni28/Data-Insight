import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REVOKED = "revoked"


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # We store the intended role (e.g., manager, analyst, viewer)
    role: Mapped[str] = mapped_column(String(50), nullable=False)

    token: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False,
    )
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus), default=InvitationStatus.PENDING, nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", lazy="noload")  # type: ignore[name-defined]
