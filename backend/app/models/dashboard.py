"""Dashboard model for the Enterprise AI Dashboard Builder."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Dashboard(Base):
    __tablename__ = "dashboards"
    __table_args__ = (
        Index("ix_tenant_workspace_dashboard", "tenant_id", "workspace_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Store the complex layout and widgets directly in a JSONB column
    # This allows flexible drag-and-drop state without complex joins
    layout_json: Mapped[dict | None] = mapped_column(JSON, default=dict)

    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
    )

    # For AI dashboard generation context
    primary_dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Metrics
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", lazy="noload")  # type: ignore[name-defined]
    dataset: Mapped["Dataset"] = relationship("Dataset", lazy="noload")  # type: ignore[name-defined]
    created_by: Mapped["User"] = relationship("User", lazy="noload")  # type: ignore[name-defined]
