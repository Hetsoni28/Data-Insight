import uuid
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Alias used in endpoint responses — includes new fields
class UserResponse(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID | None
    role: str
    avatar_url: str | None
    is_active: bool
    is_superuser: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
