import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WebhookBase(BaseModel):
    name: str
    url: str
    events: list[str]


class WebhookCreate(WebhookBase):
    pass


class WebhookUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    events: list[str] | None = None
    is_active: bool | None = None


class WebhookResponse(WebhookBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    is_active: bool
    created_at: datetime
    last_triggered_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
