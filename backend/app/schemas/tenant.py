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
    domain: str | None = Field(None, max_length=255)
    industry: str | None = Field(None, max_length=100)
    timezone: str | None = Field(None, max_length=50)
    currency: str | None = Field(None, max_length=10)
    white_label_config: dict | None = None
    sso_config: dict | None = None
    custom_domain: str | None = Field(None, max_length=255)


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
