"""Operating Expense model to track costs other than AI tokens (e.g. Server, Software, Payroll)."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class OperatingExpense(Base):
    __tablename__ = "operating_expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(50), nullable=False,
    )  # e.g. "server", "software", "payroll", "marketing"
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    expense_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    tenant = relationship("Tenant", backref="operating_expenses")
