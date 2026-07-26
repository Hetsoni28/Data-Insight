"""Report model — AI-generated Excel/PDF reports."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class ReportStatus:
    queued = "queued"
    generating = "generating"
    review = "review"
    approved = "approved"
    rejected = "rejected"
    ready = "ready"
    error = "error"


class ReportType:
    excel = "excel"
    pdf = "pdf"
    both = "both"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    report_type: Mapped[str] = mapped_column(String(20), default=ReportType.excel, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=ReportStatus.queued, nullable=False, index=True)

    # Generation config — what the user requested
    generation_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # AI blueprint — what Claude designed (filled during pipeline)
    ai_blueprint: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Output
    output_url: Mapped[str | None] = mapped_column(Text, nullable=True)   # Supabase Storage signed URL
    output_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Progress tracking (0-100)
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Approval workflow
    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approval_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Token usage for this report
    ai_tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="reports", lazy="noload")  # type: ignore[name-defined]
    dataset: Mapped["Dataset"] = relationship("Dataset", back_populates="reports", lazy="noload")  # type: ignore[name-defined]
