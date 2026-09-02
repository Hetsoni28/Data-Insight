import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class IntegrationConnection(Base):
    """Tracks connected external services and integrations."""

    __tablename__ = "integration_connections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(
        String(100), nullable=False,
    )  # e.g., 'Cloud', 'AI', 'Payment', 'Storage'
    status: Mapped[str] = mapped_column(
        String(50), default="online",
    )  # online, degraded, offline, maintenance
    health_score: Mapped[float] = mapped_column(Float, default=100.0)
    auth_type: Mapped[str] = mapped_column(
        String(50), nullable=False,
    )  # OAuth2, API_Key, IAM_Role
    latency_ms: Mapped[int] = mapped_column(Integer, default=0)
    error_rate: Mapped[float] = mapped_column(Float, default=0.0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    last_sync_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )


class IntegrationLog(Base):
    """Tracks API requests across all integrations for audit and analytics."""

    __tablename__ = "integration_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    integration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("integration_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    request_method: Mapped[str] = mapped_column(String(20), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(2048), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True,
    )


class AutomationWorkflow(Base):
    """Visual workflow configurations."""

    __tablename__ = "automation_workflows"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    trigger_type: Mapped[str] = mapped_column(
        String(100), nullable=False,
    )  # e.g., 'webhook', 'schedule', 'event'
    trigger_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    actions: Mapped[list[dict]] = mapped_column(JSONB, default=list)

    status: Mapped[str] = mapped_column(
        String(50), default="active",
    )  # active, paused, error
    success_rate: Mapped[float] = mapped_column(Float, default=100.0)
    execution_count: Mapped[int] = mapped_column(Integer, default=0)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    last_executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )
