from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str

class InvitationResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: str
    status: str
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class AcceptInvitationRequest(BaseModel):
    token: str
    full_name: str
    password: str
