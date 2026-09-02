"""Enterprise Authentication & Security Models.

Tracks active user sessions, rotating refresh tokens with reuse detection,
and comprehensive login history audit records.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class RefreshToken(Base):
    """Stores hashed rotating refresh tokens with reuse attack detection."""

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
    )
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens", lazy="noload")  # type: ignore[name-defined]


class LoginHistory(Base):
    """Audit log of successful and failed authentication attempts."""

    __tablename__ = "login_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ip_address: Mapped[str] = mapped_column(
        String(45), default="127.0.0.1", nullable=False,
    )
    browser: Mapped[str] = mapped_column(
        String(100), default="Unknown Browser", nullable=False,
    )
    os: Mapped[str] = mapped_column(String(100), default="Unknown OS", nullable=False)
    device: Mapped[str] = mapped_column(String(100), default="Desktop", nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="Unknown", nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Unknown", nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    failure_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", back_populates="login_history", lazy="noload")  # type: ignore[name-defined]
