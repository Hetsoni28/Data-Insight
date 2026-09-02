import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


# =======================
# User Profile Schemas
# =======================
class UserProfileBase(BaseModel):
    phone: str | None = None
    alternate_email: str | None = None
    birth_date: date | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    timezone: str | None = "UTC"
    language: str | None = "en"
    short_bio: str | None = None

    company_name: str | None = None
    job_title: str | None = None
    department: str | None = None
    industry: str | None = None
    website: str | None = None
    linkedin_url: str | None = None
    github_url: str | None = None
    twitter_url: str | None = None
    portfolio_url: str | None = None
    experience_years: int | None = None

    preferences: dict[str, Any] | None = None
    security_settings: dict[str, Any] | None = None


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =======================
# User Activity Schemas
# =======================
class UserActivityResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action: str
    module: str
    metadata_json: dict[str, Any] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =======================
# User Session Schemas
# =======================
class UserSessionResponse(BaseModel):
    id: uuid.UUID
    device_name: str | None = None
    os: str | None = None
    browser: str | None = None
    location: str | None = None
    ip_address: str | None = None
    is_active: bool
    last_active_at: datetime
    created_at: datetime

    # Indicate if this is the current session
    is_current: bool = False

    model_config = ConfigDict(from_attributes=True)


# =======================
# Profile Stats Schema
# =======================
class ProfileStatsResponse(BaseModel):
    organizations_created: int
    users_managed: int
    reports_generated: int
    datasets_uploaded: int
    ai_requests: int
    api_calls: int
    storage_used_mb: int
    profile_completion_percentage: int
    security_score: int


class FullProfileResponse(BaseModel):
    user: Any  # Dict from user schema
    profile: UserProfileResponse | None = None
    stats: ProfileStatsResponse
