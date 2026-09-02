from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str
    tenant_id: UUID | None = None


class InvitationResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    status: str
    tenant_id: UUID | None = None
    tenant_name: str | None = None
    token: str | None = None
    invite_url: str | None = None
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class AcceptInvitationRequest(BaseModel):
    token: str
    full_name: str
    password: str


class ValidateInviteResponse(BaseModel):
    valid: bool
    email: str | None = None
    role: str | None = None
    org_name: str | None = None
    error: str | None = None
