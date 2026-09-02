import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ApiKeyBase(BaseModel):
    name: str


class ApiKeyCreate(ApiKeyBase):
    pass


class ApiKeyResponse(ApiKeyBase):
    id: uuid.UUID
    prefix: str
    is_active: bool
    expires_at: datetime | None
    last_used_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApiKeyCreateResponse(ApiKeyResponse):
    raw_key: str  # Only returned once upon creation!
