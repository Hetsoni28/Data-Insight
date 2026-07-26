"""AITokenUsage model — tracks every AI API call for billing and cost monitoring."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class AITokenUsage(Base):
    __tablename__ = "ai_token_usage"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    # Which feature triggered the call
    feature: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g. "copilot_chat", "report_blueprint", "report_narrative", "forecast_explanation"

    model: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g. "gpt-4o", "gpt-4o-mini", "claude-3-5-sonnet-20241022"

    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Cost in USD (calculated at call time based on published pricing)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Link to the job that triggered this (optional)
    report_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    dataset_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
