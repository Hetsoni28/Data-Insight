"""ResourceRequest model — tracks tenant requests for infrastructure/resource capacity."""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class ResourceRequestType(str, enum.Enum):
    storage = "storage"
    database = "database"
    ai_tokens = "ai_tokens"
    compute = "compute"
    backup = "backup"
    custom = "custom"


class ResourceRequestStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    provisioning = "provisioning"
    completed = "completed"
    cancelled = "cancelled"


class ResourceRequest(Base):
    __tablename__ = "resource_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )

    resource_type: Mapped[str] = mapped_column(
        String(50), default=ResourceRequestType.storage.value, nullable=False,
    )
    requested_capacity: Mapped[str] = mapped_column(String(100), nullable=False)
    current_capacity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    business_reason: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        String(50), default=ResourceRequestStatus.submitted.value, nullable=False,
    )
    approved_capacity: Mapped[str | None] = mapped_column(String(100), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
