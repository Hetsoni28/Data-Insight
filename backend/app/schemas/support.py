from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.support import TicketPriority, TicketStatus

# -----------------------------------------
# Support Ticket Schemas
# -----------------------------------------


class SupportTicketBase(BaseModel):
    subject: str = Field(..., max_length=255)
    description: str
    priority: TicketPriority = TicketPriority.MEDIUM
    category: str | None = Field(None, max_length=100)
    tags: list[str] = []


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    subject: str | None = Field(None, max_length=255)
    description: str | None = None
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category: str | None = Field(None, max_length=100)
    tags: list[str] | None = None
    assigned_to_id: UUID | None = None
    metadata_: dict[str, Any] | None = Field(None, alias="metadata")
    # Allow submitting a CSAT score (1–5) when resolving/closing a ticket
    csat_score: int | None = Field(None, ge=1, le=5)


class SupportTicketResponse(SupportTicketBase):
    id: UUID
    tenant_id: UUID
    requester_id: UUID
    assigned_to_id: UUID | None
    status: TicketStatus
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    first_response_at: datetime | None = None
    csat_score: int | None = None

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
        default="investigating", max_length=50,
    )  # investigating, identified, monitoring, resolved
    severity: str = Field(default="minor", max_length=50)  # minor, major, critical


class PlatformIncidentCreate(PlatformIncidentBase):
    pass


class PlatformIncidentUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    status: str | None = Field(None, max_length=50)
    severity: str | None = Field(None, max_length=50)


class PlatformIncidentResponse(PlatformIncidentBase):
    id: UUID
    started_at: datetime
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
