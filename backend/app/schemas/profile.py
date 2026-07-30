import uuid
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime, date
from typing import List, Optional, Dict, Any

# =======================
# User Profile Schemas
# =======================
class UserProfileBase(BaseModel):
    phone: Optional[str] = None
    alternate_email: Optional[str] = None
    birth_date: Optional[date] = None
    country: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    timezone: Optional[str] = "UTC"
    language: Optional[str] = "en"
    short_bio: Optional[str] = None

    company_name: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_years: Optional[int] = None

    preferences: Optional[Dict[str, Any]] = None
    security_settings: Optional[Dict[str, Any]] = None

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
    metadata_json: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# =======================
# User Session Schemas
# =======================
class UserSessionResponse(BaseModel):
    id: uuid.UUID
    device_name: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    location: Optional[str] = None
    ip_address: Optional[str] = None
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
    user: Any # Dict from user schema
    profile: Optional[UserProfileResponse] = None
    stats: ProfileStatsResponse
