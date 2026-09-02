import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    actor_user_id: Optional[uuid.UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
