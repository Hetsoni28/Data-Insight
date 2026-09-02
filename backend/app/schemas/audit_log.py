import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    user_id: uuid.UUID | None = None
    action: str
    resource_type: str | None = None
    resource_id: str | None = None
    actor_user_id: uuid.UUID | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    extra_metadata: dict[str, Any] | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
