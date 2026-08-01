import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Integer, BigInteger, Float, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from app.db.session import Base

class BucketType(str, enum.Enum):
    datasets = "datasets"
    reports = "reports"
    exports = "exports"
    ai_generated = "ai_generated"
    images = "images"
    backups = "backups"
    logs = "logs"
    temp = "temp"

class FileCategory(str, enum.Enum):
    document = "document"
    spreadsheet = "spreadsheet"
    image = "image"
    data = "data"
    archive = "archive"
    other = "other"

class BackupStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    restoring = "restoring"

class StorageBucket(Base):
    __tablename__ = "storage_buckets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    bucket_type: Mapped[str] = mapped_column(String(50), default=BucketType.temp)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str] = mapped_column(String(50), default="us-east-1")
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    files: Mapped[list["StorageFile"]] = relationship("StorageFile", back_populates="bucket", lazy="noload")


class StorageFile(Base):
    __tablename__ = "storage_files"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bucket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_buckets.id", ondelete="CASCADE"), index=True)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(Text, nullable=False, index=True) # Full path in storage
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. text/csv, application/pdf
    category: Mapped[str] = mapped_column(String(50), default=FileCategory.other)
    
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True)
    is_malware_scanned: Mapped[bool] = mapped_column(Boolean, default=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0)
    
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)

    bucket: Mapped["StorageBucket"] = relationship("StorageBucket", back_populates="files", lazy="noload")


class StorageBackup(Base):
    __tablename__ = "storage_backups"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), default="full") # full, incremental, snapshot
    status: Mapped[str] = mapped_column(String(50), default=BackupStatus.pending)
    size_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    
    is_automated: Mapped[bool] = mapped_column(Boolean, default=True)
    retention_days: Mapped[int] = mapped_column(Integer, default=30)
    
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class StorageLifecyclePolicy(Base):
    __tablename__ = "storage_lifecycle_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    bucket_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("storage_buckets.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False) # archive, delete, move_to_cold
    target_bucket_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    condition_days: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class StorageActivityLog(Base):
    __tablename__ = "storage_activity_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action: Mapped[str] = mapped_column(String(100), nullable=False) # file.uploaded, file.deleted, backup.created
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False) # file, bucket, backup, quota
    resource_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
