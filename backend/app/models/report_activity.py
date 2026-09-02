import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.session import Base


class ReportActivity(Base):
    """Tracks granular actions performed on a report for auditing and history."""

    __tablename__ = "report_activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    action = Column(String, nullable=False)  # viewed, exported, scheduled, published
    metadata_json = Column(JSONB, nullable=True)  # e.g. {"export_format": "pdf"}

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
