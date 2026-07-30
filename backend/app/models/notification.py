import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.session import Base

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    
    # AI, Security, Billing, System, Organization
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Critical, High, Medium, Low
    priority: Mapped[str] = mapped_column(String(50), default="Medium")
    
    # Specific type e.g., 'report.generate', 'user.login'
    type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    # Unread, Read, Resolved
    status: Mapped[str] = mapped_column(String(50), default="Unread")
    
    # Who does this notification belong to? Null means platform-wide
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    
    # Contextual data
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    # State flags
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # UI actions
    action_url: Mapped[str | None] = mapped_column(String, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(100), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", lazy="noload") # type: ignore
    user: Mapped["User"] = relationship("User", lazy="noload") # type: ignore
