"""Billing Activity model for tracking financial events."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class BillingActivity(Base):
    __tablename__ = "billing_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    
    event_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. subscription_created, payment_failed, plan_upgraded
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True) # stores old_plan, new_plan, invoice_id, etc.
    
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True) # if triggered by a user
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
