import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class ProviderStatus(str, enum.Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False, unique=True)
    logo_url = Column(String, nullable=True)
    base_url = Column(String, nullable=False)
    api_key_secret = Column(
        String, nullable=True,
    )  # Will store standard string for MVP, can upgrade to Fernet later
    status = Column(Enum(ProviderStatus), default=ProviderStatus.ONLINE)
    health_score = Column(Float, default=100.0)
    latency_ms = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    environment = Column(String, default="production")
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    models = relationship(
        "AIModel", back_populates="provider", cascade="all, delete-orphan",
    )


class ModelType(str, enum.Enum):
    CHAT = "chat"
    REASONING = "reasoning"
    EMBEDDING = "embedding"
    VISION = "vision"
    IMAGE_GEN = "image_generation"
    SPEECH_TO_TEXT = "speech_to_text"
    TEXT_TO_SPEECH = "text_to_speech"
    OCR = "ocr"
    FORECASTING = "forecasting"


class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String, index=True, nullable=False)
    model_id_string = Column(String, nullable=False)  # e.g. "gpt-4o"
    type = Column(Enum(ModelType), default=ModelType.CHAT)
    context_window = Column(Integer, nullable=False)  # e.g. 128000
    input_cost_per_1k = Column(Numeric(10, 6), nullable=False)  # Cost in USD
    output_cost_per_1k = Column(Numeric(10, 6), nullable=False)  # Cost in USD
    quality_score = Column(Float, default=0.0)  # 0 to 100 benchmark score
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )

    provider = relationship("AIProvider", back_populates="models")
    routing_rules_primary = relationship(
        "AIRoutingRule",
        foreign_keys="AIRoutingRule.primary_model_id",
        back_populates="primary_model",
    )
    routing_rules_fallback = relationship(
        "AIRoutingRule",
        foreign_keys="AIRoutingRule.fallback_model_id",
        back_populates="fallback_model",
    )


class AIRoutingRule(Base):
    __tablename__ = "ai_routing_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    task_type = Column(
        String, nullable=False, unique=True,
    )  # e.g., 'default_chat', 'excel_generation', 'vision_tasks'
    primary_model_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_models.id", ondelete="SET NULL"),
        nullable=True,
    )
    fallback_model_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_models.id", ondelete="SET NULL"),
        nullable=True,
    )
    timeout_ms = Column(Integer, default=30000)
    retry_count = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    primary_model = relationship(
        "AIModel",
        foreign_keys=[primary_model_id],
        back_populates="routing_rules_primary",
    )
    fallback_model = relationship(
        "AIModel",
        foreign_keys=[fallback_model_id],
        back_populates="routing_rules_fallback",
    )


class AIPromptTemplate(Base):
    __tablename__ = "ai_prompt_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, unique=True)  # e.g. "excel_generation_v1"
    version = Column(Integer, default=1)
    system_prompt = Column(Text, nullable=False)
    user_prompt_template = Column(Text, nullable=False)
    variables = Column(JSONB, default=list)  # List of expected variable names
    is_active = Column(Boolean, default=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False,
    )
    model_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_models.id", ondelete="SET NULL"),
        nullable=True,
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("ai_providers.id", ondelete="SET NULL"),
        nullable=True,
    )
    task_type = Column(String, nullable=True)
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    tokens_total = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 6), default=Decimal("0.000000"))
    latency_ms = Column(Integer, default=0)
    status_code = Column(Integer, default=200)  # 200, 429, 500 etc
    error_message = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True,
    )
