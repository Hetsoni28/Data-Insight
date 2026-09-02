import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NotificationBase(BaseModel):
    title: str
    message: str
    category: str
    priority: str = "Medium"
    type: str | None = None
    status: str = "Unread"
    metadata_json: dict[str, Any] | None = None
    action_url: str | None = None
    icon: str | None = None


class NotificationCreate(NotificationBase):
    tenant_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None


class NotificationUpdate(BaseModel):
    is_read: bool | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None


class NotificationResponse(NotificationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    is_read: bool
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationStatsResponse(BaseModel):
    total: int
    unread: int
    critical: int
    security: int
    ai: int
    billing: int
    system: int
    organization: int
