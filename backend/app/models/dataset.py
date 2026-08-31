"""Dataset model — uploaded data files with profiling results."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
    BigInteger,
    Integer,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base


class DatasetStatus:
    uploading = "uploading"
    profiling = "profiling"
    ready = "ready"
    error = "error"


class DatasetFileType:
    csv = "csv"
    xlsx = "xlsx"
    json = "json"
    parquet = "parquet"
    tsv = "tsv"


class Dataset(Base):
    __tablename__ = "datasets"
    __table_args__ = (
        Index("ix_tenant_workspace_dataset", "tenant_id", "workspace_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workspaces.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    uploaded_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[str] = mapped_column(Text, nullable=False)  # Supabase Storage URL
    excel_url: Mapped[str | None] = mapped_column(String, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)

    status: Mapped[str] = mapped_column(
        String(50), default=DatasetStatus.uploading, nullable=False, index=True
    )
    celery_task_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Profiling results (populated by Celery task)
    row_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    column_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    profile: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # Full Pandas profile JSON
    data_quality_score: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )  # 0-100

    # Versioning
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    parent_dataset_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="datasets", lazy="noload")  # type: ignore[name-defined]
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="dataset", lazy="noload")  # type: ignore[name-defined]
