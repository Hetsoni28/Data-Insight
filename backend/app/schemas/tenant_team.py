from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel
import uuid

class TeamMember(BaseModel):
    id: str
    full_name: str
    email: str
    avatar_url: Optional[str]
    employee_id: Optional[str]
    department: Optional[str]
    role: str
    status: str
    created_at: datetime
    active_sessions: int

class TeamStatsResponse(BaseModel):
    total_members: int
    total_admins: int
    pending_invitations: int
    online_now: int

class RoleItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: dict
    is_system: bool
    created_at: datetime

class DepartmentItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: datetime

class InvitationItem(BaseModel):
    id: str
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

class AuditLogActor(BaseModel):
    name: str
    email: Optional[str]

class AuditLogItemDetailed(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    severity: str
    module: str
    ip_address: Optional[str]
    status: str
    created_at: datetime
    extra_metadata: Optional[dict]
    actor: AuditLogActor

class ActiveSessionItem(BaseModel):
    id: str
    user_name: str
    user_email: str
    device_name: Optional[str]
    os: Optional[str]
    browser: Optional[str]
    location: Optional[str]
    ip_address: Optional[str]
    last_active_at: Optional[datetime]
    created_at: datetime

