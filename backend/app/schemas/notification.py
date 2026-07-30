import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict, Any, List

class NotificationBase(BaseModel):
    title: str
    message: str
    category: str
    priority: str = "Medium"
    type: Optional[str] = None
    status: str = "Unread"
    metadata_json: Optional[Dict[str, Any]] = None
    action_url: Optional[str] = None
    icon: Optional[str] = None

class NotificationCreate(NotificationBase):
    tenant_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

class NotificationResponse(NotificationBase):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
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
