"""Pydantic schemas for Tenant (organization) requests/responses."""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field

# Plan type literals
PLAN_TYPES = ["starter", "professional", "enterprise", "custom"]


class TenantCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    plan: str = "starter"


class TenantUpdateRequest(BaseModel):
    name: str | None = Field(None, max_length=255)
    logo_url: str | None = None
    industry: str | None = None
    timezone: str | None = None
    currency: str | None = None
    domain: str | None = None
    white_label_config: dict | None = None


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
    max_users: int
    max_storage_gb: int
    max_ai_tokens_per_month: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
