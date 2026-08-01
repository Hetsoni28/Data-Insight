import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Boolean, JSON, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.session import Base

class SecurityEvent(Base):
    """Granular tracking of suspicious activity and SOC telemetry."""
    __tablename__ = "security_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True) 
    # e.g., failed_login, prompt_injection, rate_limit_exceeded, suspicious_token
    severity: Mapped[str] = mapped_column(String(50), nullable=False) # low, medium, high, critical
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    actor: Mapped[str | None] = mapped_column(String(255), nullable=True) # user email, api key id, or 'anonymous'
    metadata_: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)
    
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)


class ThreatIntelligence(Base):
    """Tracking of blocked IPs, brute force origins, and bot signatures."""
    __tablename__ = "threat_intelligence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    indicator_value: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True) # e.g. 192.168.1.1
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False) # IP, UserAgent, Domain
    threat_type: Mapped[str] = mapped_column(String(100), nullable=False) # BruteForce, Botnet, Malware
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    reputation_score: Mapped[int] = mapped_column(Integer, default=0) # 0-100 (higher is worse)
    
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=True)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class ComplianceReport(Base):
    """Tracks current compliance standing for various frameworks."""
    __tablename__ = "compliance_reports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    framework: Mapped[str] = mapped_column(String(100), nullable=False, unique=True) # SOC2, GDPR, HIPAA, ISO27001
    status: Mapped[str] = mapped_column(String(50), nullable=False) # compliant, warning, critical, unaudited
    score: Mapped[float] = mapped_column(Float, default=100.0)
    controls_passed: Mapped[int] = mapped_column(Integer, default=0)
    controls_failed: Mapped[int] = mapped_column(Integer, default=0)
    
    last_audit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_audit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
