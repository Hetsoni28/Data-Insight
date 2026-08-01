import uuid
from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
import secrets

router = APIRouter(prefix="/invitations", tags=["Invitations"])


@router.post("", response_model=InvitationResponse)
async def create_invitation(
    body: InvitationCreate,
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager])),
    db: AsyncSession = Depends(get_db),
):
    """Create and send an invitation to a user to join the organization."""
    # Managers can only invite Analysts and Viewers
    if current_user.role == UserRole.manager and body.role not in [
        UserRole.analyst,
        UserRole.viewer,
    ]:
        raise ForbiddenException("Managers can only invite Analysts or Viewers.")

    # Check if user already exists (globally)
    stmt = select(User).where(User.email == body.email)
    existing_user = (await db.execute(stmt)).scalars().first()

    if existing_user:
        if existing_user.tenant_id == current_user.tenant_id:
            raise ConflictException("User is already a member of this organization.")
        # User exists in another org — they cannot accept this invite due to global email uniqueness
        raise ConflictException(
            "A user with this email already has an account. They must contact support to transfer organizations."
        )

    # Generate token
    token = secrets.token_urlsafe(32)

    invitation = Invitation(
        email=body.email,
        tenant_id=current_user.tenant_id,
        role=body.role,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # In a real app, you would send an email here with the token link
    # await email_service.send_invitation_email(body.email, token)

    return invitation


@router.get("", response_model=List[InvitationResponse])
async def list_invitations(
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager])),
    db: AsyncSession = Depends(get_db),
):
    """List pending invitations for the organization."""
    stmt = select(Invitation).where(
        Invitation.tenant_id == current_user.tenant_id,
        Invitation.status == InvitationStatus.PENDING,
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.delete("/{invitation_id}", status_code=204)
async def revoke_invitation(
    invitation_id: uuid.UUID,
    current_user: User = Depends(RequireRole([UserRole.org_admin, UserRole.manager])),
    db: AsyncSession = Depends(get_db),
):
    """Revoke a pending invitation."""
    stmt = select(Invitation).where(
        Invitation.id == invitation_id, Invitation.tenant_id == current_user.tenant_id
    )
    invitation = (await db.execute(stmt)).scalars().first()

    if not invitation:
        raise ResourceNotFoundException("Invitation not found.")

    invitation.status = InvitationStatus.REVOKED
    await db.commit()
