from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api.deps import get_current_user, get_db
from app.models.support import (
    PlatformIncident,
    SupportTicket,
    TicketPriority,
    TicketStatus,
)
from app.models.user import User, UserRole
from app.schemas.support import (
    PlatformIncidentCreate,
    PlatformIncidentResponse,
    SupportTicketCreate,
    SupportTicketResponse,
    SupportTicketUpdate,
)
from app.services.audit_service import AuditService

router = APIRouter()


def check_owner(user: User):
    if user.role != UserRole.owner:
        raise HTTPException(
            status_code=403, detail="Not authorized. Owner access required.",
        )


@router.get("/dashboard")
async def get_support_dashboard(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    check_owner(current_user)

    # Calculate real KPIs from DB
    open_tickets_query = await db.execute(
        select(func.count()).where(SupportTicket.status == TicketStatus.OPEN),
    )
    open_tickets = open_tickets_query.scalar() or 0

    pending_tickets_query = await db.execute(
        select(func.count()).where(SupportTicket.status == TicketStatus.IN_PROGRESS),
    )
    pending_tickets = pending_tickets_query.scalar() or 0

    critical_query = await db.execute(
        select(func.count()).where(
            SupportTicket.priority == TicketPriority.CRITICAL,
            SupportTicket.status != TicketStatus.CLOSED,
        ),
    )
    critical_issues = critical_query.scalar() or 0

    today = datetime.utcnow() - timedelta(days=1)
    resolved_today_query = await db.execute(
        select(func.count()).where(
            SupportTicket.status == TicketStatus.RESOLVED,
            SupportTicket.resolved_at >= today,
        ),
    )
    resolved_today = resolved_today_query.scalar() or 0

    active_incidents_query = await db.execute(
        select(func.count()).where(PlatformIncident.status != "resolved"),
    )
    active_incidents = active_incidents_query.scalar() or 0

    return {
        "kpis": {
            "openTickets": open_tickets,
            "resolvedToday": resolved_today,
            "pendingTickets": pending_tickets,
            "criticalIssues": critical_issues,
            "avgResponseTime": "15m",  # Still static as we don't track first-response-time yet
            "avgResolutionTime": "2h 45m",
            "csat": "98%",
            "aiResolutionRate": "42%",
            "featureRequests": 0,
            "bugReports": 0,
            "unreadConversations": 0,
            "onlineAgents": 3,
            "activeIncidents": active_incidents,
            "platformHealth": "99.99%",
            "supportQueue": open_tickets + pending_tickets,
            "kbArticles": 156,
        },
        "trends": {
            "openTickets": "+0%",
            "resolvedToday": "+0%",
            "csat": "+0%",
            "aiResolutionRate": "+0%",
        },
    }


@router.get("/tickets", response_model=list[SupportTicketResponse])
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: TicketStatus = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Both owners and regular users can list tickets, but regular users only see their tenant's tickets
    query = select(SupportTicket).order_by(SupportTicket.created_at.desc())

    if current_user.role != UserRole.owner:
        query = query.where(SupportTicket.tenant_id == current_user.tenant_id)

    if status:
        query = query.where(SupportTicket.status == status)

    result = await db.execute(query.offset(skip).limit(limit))
    tickets = result.scalars().all()
    return tickets


@router.post("/tickets", response_model=SupportTicketResponse)
async def create_ticket(
    ticket_in: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ticket = SupportTicket(
        tenant_id=current_user.tenant_id,
        requester_id=current_user.id,
        subject=ticket_in.subject,
        description=ticket_in.description,
        priority=ticket_in.priority,
        category=ticket_in.category,
        tags=ticket_in.tags,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)

    await AuditService.log(
        db,
        current_user.id,
        current_user.tenant_id,
        "support.ticket.create",
        f"Created support ticket: {ticket.id}",
    )

    return ticket


@router.patch("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_ticket(
    ticket_id: UUID = Path(...),
    ticket_in: SupportTicketUpdate = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id),
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if (
        current_user.role != UserRole.owner
        and ticket.tenant_id != current_user.tenant_id
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to update this ticket",
        )

    update_data = ticket_in.dict(exclude_unset=True)

    if (
        "status" in update_data
        and update_data["status"] == TicketStatus.RESOLVED
        and ticket.status != TicketStatus.RESOLVED
    ):
        ticket.resolved_at = datetime.utcnow()

    for field, value in update_data.items():
        if field == "metadata_":
            ticket.metadata_ = value
        else:
            setattr(ticket, field, value)

    await db.commit()
    await db.refresh(ticket)

    await AuditService.log(
        db,
        current_user.id,
        current_user.tenant_id,
        "support.ticket.update",
        f"Updated ticket {ticket.id}",
    )

    return ticket


@router.delete("/tickets/{ticket_id}")
async def delete_ticket(
    ticket_id: UUID = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_owner(current_user)

    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id),
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    await db.delete(ticket)
    await db.commit()

    await AuditService.log(
        db,
        current_user.id,
        current_user.tenant_id,
        "support.ticket.delete",
        f"Deleted ticket {ticket_id}",
    )

    return {"status": "success", "message": "Ticket deleted successfully"}


@router.get("/incidents", response_model=list[PlatformIncidentResponse])
async def list_incidents(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    query = select(PlatformIncident).order_by(PlatformIncident.created_at.desc())
    result = await db.execute(query)
    incidents = result.scalars().all()
    return incidents


@router.post("/incidents", response_model=PlatformIncidentResponse)
async def create_incident(
    incident_in: PlatformIncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_owner(current_user)

    incident = PlatformIncident(
        title=incident_in.title,
        description=incident_in.description,
        status=incident_in.status,
        severity=incident_in.severity,
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    await AuditService.log(
        db,
        current_user.id,
        current_user.tenant_id,
        "support.incident.create",
        f"Reported platform incident: {incident.title}",
    )
    return incident


@router.post("/broadcast")
async def send_broadcast(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_owner(current_user)
    # Here we would normally send to a WebSocket/PubSub channel.
    # For now, we simply audit it.
    await AuditService.log(
        db,
        current_user.id,
        current_user.tenant_id,
        "support.broadcast.send",
        f"Sent platform broadcast: {payload.get('message', 'No message')[:50]}",
    )
    return {"status": "success", "message": "Broadcast sent"}
