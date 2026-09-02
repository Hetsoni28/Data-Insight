import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ═══════════════════════════════════════════════
# Profile Header / Full Profile
# ═══════════════════════════════════════════════


class ViewerProfileResponse(BaseModel):
    """Full profile response for the viewer header and personal info sections."""

    # Identity
    id: uuid.UUID
    email: str
    full_name: str | None = None
    avatar_url: str | None = None

    # Organization context
    organization_name: str | None = None
    organization_logo: str | None = None
    department: str | None = None
    job_title: str | None = None
    role: str
    account_type: str
    account_status: str  # "active", "locked", "suspended"

    # Timestamps
    member_since: datetime
    last_active: datetime | None = None

    # Personal fields
    phone: str | None = None
    location: str | None = None
    short_bio: str | None = None

    # Security summary
    is_email_verified: bool = False
    mfa_enabled: bool = False
    security_score: int = 0
    profile_completion: int = 0


class ViewerProfileUpdateRequest(BaseModel):
    """Fields the viewer is allowed to edit themselves."""

    full_name: str | None = None
    phone: str | None = None
    location: str | None = None
    job_title: str | None = None
    department: str | None = None
    short_bio: str | None = None


# ═══════════════════════════════════════════════
# Security
# ═══════════════════════════════════════════════


class ViewerSecurityOverview(BaseModel):
    password_last_changed: str | None = "Not available"
    mfa_enabled: bool = False
    active_sessions_count: int = 0
    failed_login_attempts: int = 0
    last_login: datetime | None = None
    security_score: int = 0
    is_email_verified: bool = False


class ViewerPasswordChangeRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class ViewerPasswordChangeResponse(BaseModel):
    success: bool
    message: str


# ═══════════════════════════════════════════════
# Sessions
# ═══════════════════════════════════════════════


class ViewerSessionResponse(BaseModel):
    id: uuid.UUID
    device_name: str | None = None
    os: str | None = None
    browser: str | None = None
    location: str | None = None
    ip_address: str | None = None
    is_active: bool
    is_current: bool = False
    last_active_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════
# Login History
# ═══════════════════════════════════════════════


class ViewerLoginHistoryEntry(BaseModel):
    id: uuid.UUID
    ip_address: str
    browser: str
    os: str
    device: str
    country: str
    city: str
    success: bool
    failure_reason: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ViewerLoginHistoryResponse(BaseModel):
    entries: list[ViewerLoginHistoryEntry]
    total: int
    page: int
    size: int


# ═══════════════════════════════════════════════
# Notification Preferences
# ═══════════════════════════════════════════════


class ViewerNotificationPreferences(BaseModel):
    email_notifications: bool = True
    push_notifications: bool = True
    report_ready: bool = True
    dataset_updated: bool = True
    dashboard_shared: bool = True
    ai_generation_complete: bool = True
    security_alerts: bool = True  # Cannot be disabled by org policy
    organization_announcements: bool = True


# ═══════════════════════════════════════════════
# Appearance, Language, AI Preferences
# ═══════════════════════════════════════════════


class ViewerPreferences(BaseModel):
    """All personal preferences stored in UserProfile.preferences JSON."""

    # Appearance
    theme: str = "system"  # "light", "dark", "system"
    density: str = "comfortable"  # "compact", "comfortable"
    reduced_motion: bool = False
    high_contrast: bool = False

    # Language & Region
    language: str = "en"
    timezone: str = "UTC"
    date_format: str = "MM/DD/YYYY"
    time_format: str = "12h"  # "12h", "24h"
    number_format: str = "en-US"
    currency_display: str = "USD"

    # AI Preferences
    ai_response_style: str = "balanced"  # "concise", "balanced", "detailed"
    ai_preferred_language: str = "en"
    ai_show_suggestions: bool = True
    ai_show_explanations: bool = True
    ai_streaming: bool = True
    ai_conversation_history: bool = True


# ═══════════════════════════════════════════════
# Activity
# ═══════════════════════════════════════════════


class ViewerActivityEntry(BaseModel):
    id: uuid.UUID
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    details: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ViewerActivityResponse(BaseModel):
    entries: list[ViewerActivityEntry]
    total: int


# ═══════════════════════════════════════════════
# Data & Privacy
# ═══════════════════════════════════════════════


class ViewerDataExportResponse(BaseModel):
    status: str  # "requested", "processing", "ready"
    message: str
    request_id: str | None = None


class ViewerAccountDeletionResponse(BaseModel):
    status: str  # "requested", "pending_approval"
    message: str
