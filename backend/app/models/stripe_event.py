import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class StripeEvent(Base):
    """
    Tracks processed Stripe webhooks to ensure idempotency.
    If we receive the same stripe_event_id again, we skip processing.
    """
    __tablename__ = "stripe_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    
    # The actual Stripe Event ID (evt_...)
    stripe_event_id: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Keep the raw payload for audit and debugging purposes
    payload: Mapped[dict] = mapped_column(JSON, nullable=True)
    
    # When this event was processed by our system
    processed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
