import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class ReportShare(Base):
    """Tracks which users or tenants a report has been shared with."""

    __tablename__ = "report_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    report_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    shared_by_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )

    # Can be shared with specific user or entire tenant
    shared_with_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    shared_with_tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    permission_level = Column(String, nullable=False, default="view")  # view, edit

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
