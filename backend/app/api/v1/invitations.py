import uuid
from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets

from app.api.deps import get_db, RequireRole, get_current_user
from app.models.user import User, UserRole
from app.models.invitation import Invitation, InvitationStatus
from app.schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    AcceptInvitationRequest,
)
from app.core.exceptions import (
    ForbiddenException,
    ConflictException,
    ResourceNotFoundException,
    ValidationException,
)
from app.core.config import settings
from app.services import email as email_service

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.post("", response_model=InvitationResponse)
async def create_invitation(
    body: InvitationCreate,
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])),
    db: AsyncSession = Depends(get_db),
):
    """Create and send an invitation to a user to join the organization."""
    # Managers can only invite Analysts and Viewers
    if current_user.role == UserRole.manager and body.role not in [
        UserRole.analyst,
        UserRole.viewer,
    ]:
        raise ForbiddenException("Managers can only invite Analysts or Viewers.")

    target_tenant_id = current_user.tenant_id
    if not target_tenant_id and current_user.role == UserRole.owner:
        from app.models.tenant import Tenant
        first_tenant = await db.scalar(select(Tenant).order_by(Tenant.created_at.asc()))
        if first_tenant:
            target_tenant_id = first_tenant.id

    # Check if user already exists (globally)
    stmt = select(User).where(User.email == body.email)
    existing_user = (await db.execute(stmt)).scalars().first()

    if existing_user:
        if target_tenant_id and existing_user.tenant_id == target_tenant_id:
            raise ConflictException("User is already a member of this organization.")
        # User exists in another org — they cannot accept this invite due to global email uniqueness
        raise ConflictException(
            "A user with this email already has an account. They must contact support to transfer organizations."
        )

    # Get the inviting user's full name (or email as fallback)
    inviter_name = current_user.full_name or current_user.email

    # Get the organization name from the tenant
    from app.models.tenant import Tenant
    tenant = await db.scalar(select(Tenant).where(Tenant.id == target_tenant_id)) if target_tenant_id else None
    org_name = tenant.name if tenant else "Data Insight Platform"

    # Generate a secure URL-safe token
    token = secrets.token_urlsafe(32)

    invitation = Invitation(
        email=body.email,
        tenant_id=target_tenant_id,
        role=body.role,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # Build the accept URL — matches the frontend /invite/[token] route
    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"

    # Send the invitation email (non-blocking — failure won't crash the request)
    await email_service.send_team_invite(
        to_email=body.email,
        invited_by=inviter_name,
        org_name=org_name,
        invite_url=invite_url,
    )

    return invitation


@router.get("", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])),
    db: AsyncSession = Depends(get_db),
):
    """List pending invitations for the organization."""
    if current_user.role == UserRole.owner and not current_user.tenant_id:
        stmt = select(Invitation).where(Invitation.status == InvitationStatus.PENDING)
    else:
        stmt = select(Invitation).where(
            Invitation.tenant_id == current_user.tenant_id,
            Invitation.status == InvitationStatus.PENDING,
        )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/{invitation_id}", status_code=204)
async def revoke_invitation(
    invitation_id: uuid.UUID,
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a pending invitation."""
    if current_user.role == UserRole.owner and not current_user.tenant_id:
        stmt = select(Invitation).where(Invitation.id == invitation_id)
    else:
        stmt = select(Invitation).where(
            Invitation.id == invitation_id, Invitation.tenant_id == current_user.tenant_id
        )
    invitation = (await db.execute(stmt)).scalars().first()

    if not invitation:
        raise ResourceNotFoundException("Invitation not found.")

    invitation.status = InvitationStatus.REVOKED
    await db.commit()
