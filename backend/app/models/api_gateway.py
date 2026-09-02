import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Integer, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, INET
from app.db.session import Base


class ApiRequestLog(Base):
    """
    Logs every API request passing through the gateway.
    Used for Usage Analytics, Error Analytics, Latency monitoring, and Live Streams.
    """

    __tablename__ = "api_request_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    api_key_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("api_keys.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    endpoint: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    payload_size_bytes: Mapped[int] = mapped_column(Integer, default=0)

    ip_address: Mapped[str | None] = mapped_column(
        String(45), nullable=True
    )  # Supporting IPv6 length
    country: Mapped[str | None] = mapped_column(
        String(2), nullable=True
    )  # ISO country code
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    version: Mapped[str] = mapped_column(String(10), default="v1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )


class OAuthClient(Base):
    """
    Developer applications created by users.
    """

    __tablename__ = "oauth_clients"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_id: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    client_secret_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    redirect_uris: Mapped[list[str]] = mapped_column(JSON, default=list)
    scopes: Mapped[list[str]] = mapped_column(JSON, default=list)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ApiRateLimit(Base):
    """
    Rate limit configurations for organizations or global tiers.
    """

    __tablename__ = "api_rate_limits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        unique=True,
    )  # Null = Global

    requests_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    burst_capacity: Mapped[int] = mapped_column(Integer, default=100)
    monthly_quota: Mapped[int] = mapped_column(Integer, default=100000)

    current_period_usage: Mapped[int] = mapped_column(Integer, default=0)
    alerts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class ApiIntegration(Base):
    """
    Status and configurations for external API integrations (Stripe, OpenAI, Supabase).
    """

    __tablename__ = "api_integrations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True
    )  # 'stripe', 'openai', 'supabase'

    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    health_status: Mapped[str] = mapped_column(
        String(20), default="unknown"
    )  # 'healthy', 'degraded', 'offline'
    last_sync_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    config: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
