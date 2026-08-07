from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional


class InvitationCreate(BaseModel):
    email: EmailStr
    role: str
    tenant_id: Optional[UUID] = None


class InvitationResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    status: str
    tenant_id: Optional[UUID] = None
    tenant_name: Optional[str] = None
    token: Optional[str] = None
    invite_url: Optional[str] = None
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
    email: Optional[str] = None
    role: Optional[str] = None
    org_name: Optional[str] = None
    error: Optional[str] = None
