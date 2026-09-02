import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    key: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    environment: Mapped[str] = mapped_column(
        String(50), default="production", nullable=False,
    )
    tags: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
    )  # Categorization like 'ai', 'billing'

    # Relationships
    rollouts = relationship(
        "FeatureRollout", back_populates="flag", cascade="all, delete-orphan",
    )
    experiments = relationship(
        "FeatureExperiment", back_populates="flag", cascade="all, delete-orphan",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class FeatureRollout(Base):
    __tablename__ = "feature_rollouts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    flag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feature_flags.id", ondelete="CASCADE"),
    )

    rollout_percentage: Mapped[int] = mapped_column(Integer, default=0)  # 0 to 100
    target_roles: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
    )  # ['owner', 'admin']
    target_organizations: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
    )  # ['org1_id', 'org2_id']

    flag = relationship("FeatureFlag", back_populates="rollouts")


class FeatureExperiment(Base):
    __tablename__ = "feature_experiments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    flag_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("feature_flags.id", ondelete="CASCADE"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    traffic_allocation: Mapped[int] = mapped_column(Integer, default=50)  # Traffic %
    variation_a_success: Mapped[int] = mapped_column(Integer, default=0)
    variation_b_success: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[str] = mapped_column(
        String(50), default="running",
    )  # running, completed

    flag = relationship("FeatureFlag", back_populates="experiments")
