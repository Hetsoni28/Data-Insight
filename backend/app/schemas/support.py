from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.support import TicketStatus, TicketPriority

# -----------------------------------------
# Support Ticket Schemas
# -----------------------------------------


class SupportTicketBase(BaseModel):
    subject: str = Field(..., max_length=255)
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category: Optional[str] = Field(None, max_length=100)
    tags: List[str] = []


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    assigned_to_id: Optional[UUID] = None
    metadata_: Optional[Dict[str, Any]] = Field(None, alias="metadata")


class SupportTicketResponse(SupportTicketBase):
    id: UUID
    tenant_id: UUID
    requester_id: UUID
    assigned_to_id: Optional[UUID]
    status: TicketStatus
    metadata_: Dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True
        populate_by_name = True


# -----------------------------------------
# Platform Incident Schemas
# -----------------------------------------


class PlatformIncidentBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: str
    status: str = Field(
        default="investigating", max_length=50
    )  # investigating, identified, monitoring, resolved
    severity: str = Field(default="minor", max_length=50)  # minor, major, critical


class PlatformIncidentCreate(PlatformIncidentBase):
    pass


class PlatformIncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    severity: Optional[str] = Field(None, max_length=50)


class PlatformIncidentResponse(PlatformIncidentBase):
    id: UUID
    started_at: datetime
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
