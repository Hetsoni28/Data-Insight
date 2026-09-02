from datetime import datetime

from pydantic import BaseModel


class TeamMember(BaseModel):
    id: str
    full_name: str
    email: str
    avatar_url: str | None
    employee_id: str | None
    department: str | None
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
    description: str | None
    permissions: dict
    is_system: bool
    created_at: datetime


class DepartmentItem(BaseModel):
    id: str
    name: str
    description: str | None
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
    email: str | None


class AuditLogItemDetailed(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: str | None
    severity: str
    module: str
    ip_address: str | None
    status: str
    created_at: datetime
    extra_metadata: dict | None
    actor: AuditLogActor


class ActiveSessionItem(BaseModel):
    id: str
    user_name: str
    user_email: str
    device_name: str | None
    os: str | None
    browser: str | None
    location: str | None
    ip_address: str | None
    last_active_at: datetime | None
    created_at: datetime
