import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class DatasetAlert(Base):
    __tablename__ = "dataset_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    dataset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String, nullable=False)
    metric_column = Column(String, nullable=False)
    condition = Column(String, nullable=False)  # e.g. ">", "<", "=="
    threshold_value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tenant = relationship("Tenant")
    dataset = relationship("Dataset")
