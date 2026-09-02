import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class UserActivity(Base):
    __tablename__ = "user_activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Event details
    action: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    module: Mapped[str] = mapped_column(
        String(100), nullable=False,
    )  # e.g., 'profile', 'dataset', 'report'

    # Context (e.g., target ID, metadata)
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Environment
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", lazy="noload")  # type: ignore[name-defined]
