import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False,
    )
    requester_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    assigned_to_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )

    subject = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        SQLEnum(TicketStatus, name="ticketstatus_enum", create_type=False),
        default=TicketStatus.OPEN,
        nullable=False,
    )
    priority = Column(
        SQLEnum(TicketPriority, name="ticketpriority_enum", create_type=False),
        default=TicketPriority.MEDIUM,
        nullable=False,
    )
    category = Column(String(100), nullable=True)

    tags = Column(JSON, default=list)
    metadata_ = Column("metadata", JSON, default=dict)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False,
    )
    resolved_at = Column(DateTime, nullable=True)


class PlatformIncident(Base):
    __tablename__ = "platform_incidents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(
        String(50), default="investigating", nullable=False,
    )  # investigating, identified, monitoring, resolved
    severity = Column(
        String(50), default="minor", nullable=False,
    )  # minor, major, critical

    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False,
    )
