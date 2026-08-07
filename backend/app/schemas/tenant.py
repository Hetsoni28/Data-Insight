"""Pydantic schemas for Tenant (organization) requests/responses, DB routing, and quotas."""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


PLAN_TYPES = ["starter", "professional", "enterprise", "custom"]
DB_CONNECTION_TYPES = ["shared", "dedicated"]


class TenantCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    plan: str = "starter"


class TenantUpdateRequest(BaseModel):
    name: str | None = Field(None, max_length=255)
    domain: str | None = Field(None, max_length=255)
    industry: str | None = Field(None, max_length=100)
    timezone: str | None = Field(None, max_length=50)
    currency: str | None = Field(None, max_length=10)
    white_label_config: dict | None = None
    sso_config: dict | None = None
    custom_domain: str | None = Field(None, max_length=255)
    db_connection_type: str | None = Field(None, pattern="^(shared|dedicated)$")
    dedicated_db_url: str | None = None


class TenantDatabaseConfigRequest(BaseModel):
    db_connection_type: str = Field(..., pattern="^(shared|dedicated)$")
    dedicated_db_url: Optional[str] = Field(None, description="PostgreSQL async connection string")


class DatabaseConnectionTestRequest(BaseModel):
    db_url: str = Field(..., description="PostgreSQL connection string to test")


class DatabaseConnectionTestResponse(BaseModel):
    success: bool
    latency_ms: float
    message: str
    error: Optional[str] = None


class StorageUsageBreakdown(BaseModel):
    used_bytes: int
    used_mb: float
    used_gb: float
    max_gb: int
    percentage: float
    is_near_limit: bool
    is_exceeded: bool


class AITokenUsageBreakdown(BaseModel):
    used: int
    max: int
    remaining: int
    percentage: float
    is_near_limit: bool
    is_exceeded: bool
    resets_at: Optional[str] = None


class UserSeatUsageBreakdown(BaseModel):
    active_count: int
    max_seats: int
    remaining_seats: int
    percentage: float
    is_at_limit: bool


class TenantUsageResponse(BaseModel):
    tenant_id: str
    tenant_name: str
    slug: str
    plan: str
    db_connection_type: str
    has_dedicated_db: bool
    is_suspended: bool
    suspension_reason: Optional[str] = None
    storage: StorageUsageBreakdown
    ai_tokens: AITokenUsageBreakdown
    users: UserSeatUsageBreakdown


class TenantResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    domain: str | None
    logo_url: str | None
    industry: str | None
    timezone: str
    currency: str
    db_connection_type: str = "shared"
    dedicated_db_url: str | None = None
    max_users: int
    max_storage_gb: int
    max_ai_tokens_per_month: int
    current_storage_bytes: int = 0
    current_ai_tokens_used: int = 0
    is_active: bool
    is_suspended: bool = False
    suspension_reason: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
