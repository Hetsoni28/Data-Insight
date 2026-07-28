import uuid
from typing import Literal
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    # "individual" → auto-assigned viewer role
    # "organization" → auto-assigned org_admin role after onboarding
    account_type: Literal["individual", "organization"] = "individual"
    # For organization registrations, the org name is passed here
    org_name: str | None = None


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Alias used in endpoint responses — includes all RBAC fields
class UserResponse(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID | None
    role: str
    account_type: str
    avatar_url: str | None
    is_active: bool
    is_superuser: bool
    is_owner: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
