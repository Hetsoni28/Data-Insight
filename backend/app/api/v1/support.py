from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
from uuid import UUID

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.models.support import SupportTicket, PlatformIncident, TicketStatus, TicketPriority

router = APIRouter()

def check_owner(user: User):
    if user.role != UserRole.owner:
        raise HTTPException(status_code=403, detail="Not authorized. Owner access required.")

@router.get("/dashboard")
async def get_support_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    check_owner(current_user)
    
    # Mock data for now since we're building the frontend
    return {
        "kpis": {
            "openTickets": 142,
            "resolvedToday": 45,
            "pendingTickets": 28,
            "criticalIssues": 3,
            "avgResponseTime": "15m",
            "avgResolutionTime": "2h 45m",
            "csat": "98%",
            "aiResolutionRate": "42%",
            "featureRequests": 89,
            "bugReports": 12,
            "unreadConversations": 5,
            "onlineAgents": 8,
            "activeIncidents": 1,
            "platformHealth": "99.99%",
            "supportQueue": 14,
            "kbArticles": 156
        },
        "trends": {
            "openTickets": "+12%",
            "resolvedToday": "+5%",
            "csat": "+1.2%",
            "aiResolutionRate": "+8%"
        }
    }

@router.get("/tickets")
async def list_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: TicketStatus = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_owner(current_user)
    
    query = select(SupportTicket)
    if status:
        query = query.where(SupportTicket.status == status)
        
    result = await db.execute(query.offset(skip).limit(limit))
    tickets = result.scalars().all()
    
    # If empty, return some mock data to help build the frontend grid
    if not tickets:
        return [
            {
                "id": "tkt-001",
                "subject": "Postgres Connection Failing",
                "status": "open",
                "priority": "high",
                "requester": "Sarah Chen",
                "organization": "Acme Corp",
                "category": "Database",
                "assignedTo": "Alex M.",
                "created_at": "2026-07-31T10:00:00Z",
                "sla": "2h remaining"
            },
            {
                "id": "tkt-002",
                "subject": "Cannot invite new users to workspace",
                "status": "in_progress",
                "priority": "medium",
                "requester": "John Doe",
                "organization": "Globex",
                "category": "IAM",
                "assignedTo": "Sarah K.",
                "created_at": "2026-07-31T11:30:00Z",
                "sla": "4h remaining"
            }
        ]
        
    return tickets

@router.get("/incidents")
async def list_incidents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_owner(current_user)
    
    query = select(PlatformIncident).order_by(PlatformIncident.created_at.desc())
    result = await db.execute(query)
    incidents = result.scalars().all()
    
    if not incidents:
        return [
            {
                "id": "inc-100",
                "title": "Degraded performance on API Gateway",
                "status": "investigating",
                "severity": "major",
                "started_at": "2026-07-31T09:00:00Z",
                "affected_services": ["API Gateway", "Auth"],
                "impact": "High latency"
            }
        ]
        
    return incidents
