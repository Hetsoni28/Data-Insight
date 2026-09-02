import uuid
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import secrets

from app.api.deps import get_db, RequireRole, get_current_user
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.invitation import Invitation, InvitationStatus
from app.models.audit_log import AuditLog
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


def _to_response(
    inv: Invitation, tenant_name: Optional[str] = None
) -> InvitationResponse:
    invite_url = f"{settings.FRONTEND_URL}/invite/{inv.token}"
    return InvitationResponse(
        id=inv.id,
        email=inv.email,
        role=inv.role,
        status=inv.status.value if hasattr(inv.status, "value") else str(inv.status),
        tenant_id=inv.tenant_id,
        tenant_name=tenant_name
        or (inv.tenant.name if getattr(inv, "tenant", None) else "Organization"),
        token=inv.token,
        invite_url=invite_url,
        expires_at=inv.expires_at,
        created_at=inv.created_at,
    )


@router.post("", response_model=InvitationResponse)
async def create_invitation(
    body: InvitationCreate,
    request: Request,
    current_user: User = Depends(
        RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Create and send an invitation to a user to join the organization."""
    # Managers can only invite Analysts and Viewers
    if current_user.role == UserRole.manager and body.role not in [
        UserRole.analyst,
        UserRole.viewer,
    ]:
        raise ForbiddenException("Managers can only invite Analysts or Viewers.")

    # Determine target tenant
    target_tenant_id = current_user.tenant_id
    if current_user.role == UserRole.owner:
        if body.tenant_id:
            target_tenant_id = body.tenant_id
        elif not target_tenant_id:
            first_tenant = await db.scalar(
                select(Tenant).order_by(Tenant.created_at.asc())
            )
            if first_tenant:
                target_tenant_id = first_tenant.id

    if not target_tenant_id:
        raise ValidationException("Please select an organization for this invitation.")

    # Fetch tenant
    tenant = await db.scalar(select(Tenant).where(Tenant.id == target_tenant_id))
    if not tenant:
        raise ResourceNotFoundException("Selected organization not found.")
    org_name = tenant.name

    # Enforce seat limits for target organization
    from app.services.quota_service import QuotaService

    quota_svc = QuotaService(db)
    await quota_svc.check_user_seats(target_tenant_id)

    clean_email = body.email.strip().lower()

    # Check if user already exists (globally)
    stmt = select(User).where(User.email == clean_email)
    existing_user = (await db.execute(stmt)).scalars().first()

    if existing_user:
        if existing_user.tenant_id == target_tenant_id:
            raise ConflictException(
                "User is already an active member of this organization."
            )
        raise ConflictException(
            "A user with this email already has an account in another organization."
        )

    # Check if there is already an active/pending invitation for this email in this tenant
    existing_invite_stmt = select(Invitation).where(
        Invitation.tenant_id == target_tenant_id,
        Invitation.email == clean_email,
        Invitation.status == InvitationStatus.PENDING,
    )
    existing_invite = (await db.execute(existing_invite_stmt)).scalars().first()

    # Generate secure token
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)

    if existing_invite:
        # Renew existing pending invite
        existing_invite.token = token
        existing_invite.role = body.role
        existing_invite.expires_at = expires
        existing_invite.updated_at = datetime.now(timezone.utc)
        invitation = existing_invite
    else:
        invitation = Invitation(
            email=clean_email,
            tenant_id=target_tenant_id,
            role=body.role,
            token=token,
            status=InvitationStatus.PENDING,
            expires_at=expires,
        )
        db.add(invitation)

    # Audit log
    audit = AuditLog(
        tenant_id=target_tenant_id,
        user_id=current_user.id,
        action="team.invite.create",
        resource_type="invitation",
        ip_address=request.client.host if request.client else "127.0.0.1",
        extra_metadata={
            "invited_email": clean_email,
            "role": body.role,
            "org_name": org_name,
        },
    )
    db.add(audit)

    await db.commit()
    await db.refresh(invitation)

    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"
    inviter_name = current_user.full_name or current_user.email

    # Dispatch branded HTML email (non-blocking)
    try:
        await email_service.send_team_invite(
            to_email=clean_email,
            invited_by=inviter_name,
            org_name=org_name,
            invite_url=invite_url,
        )
    except Exception:
        pass

    return _to_response(invitation, tenant_name=org_name)


@router.get("", response_model=List[InvitationResponse])
async def list_invitations(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(
        RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])
    ),
    db: AsyncSession = Depends(get_db),
):
    """List invitations for the current organization or platform-wide for Owner."""
    if current_user.role == UserRole.owner and not current_user.tenant_id:
        stmt = select(Invitation, Tenant.name).outerjoin(
            Tenant, Invitation.tenant_id == Tenant.id
        )
        if status_filter:
            stmt = stmt.where(Invitation.status == status_filter)
        stmt = stmt.order_by(desc(Invitation.created_at))
    else:
        stmt = (
            select(Invitation, Tenant.name)
            .outerjoin(Tenant, Invitation.tenant_id == Tenant.id)
            .where(Invitation.tenant_id == current_user.tenant_id)
        )
        if status_filter:
            stmt = stmt.where(Invitation.status == status_filter)
        stmt = stmt.order_by(desc(Invitation.created_at))

    result = await db.execute(stmt)
    rows = result.all()

    invitations_list = []
    for inv, t_name in rows:
        invitations_list.append(_to_response(inv, tenant_name=t_name))

    return invitations_list


@router.post("/{invitation_id}/resend", response_model=InvitationResponse)
async def resend_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(
        RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Renew expiration by 7 days, generate fresh token, resend invite email, and return new link."""
    if current_user.role == UserRole.owner and not current_user.tenant_id:
        stmt = (
            select(Invitation, Tenant.name)
            .outerjoin(Tenant, Invitation.tenant_id == Tenant.id)
            .where(Invitation.id == invitation_id)
        )
    else:
        stmt = (
            select(Invitation, Tenant.name)
            .outerjoin(Tenant, Invitation.tenant_id == Tenant.id)
            .where(
                Invitation.id == invitation_id,
                Invitation.tenant_id == current_user.tenant_id,
            )
        )

    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise ResourceNotFoundException("Invitation not found.")

    inv, t_name = row
    org_name = t_name or "Organization"

    # Reset token & extend 7 days
    token = secrets.token_urlsafe(32)
    inv.token = token
    inv.status = InvitationStatus.PENDING
    inv.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    inv.updated_at = datetime.now(timezone.utc)

    # Audit log
    audit = AuditLog(
        tenant_id=inv.tenant_id,
        user_id=current_user.id,
        action="team.invite.resend",
        resource_type="invitation",
        resource_id=str(inv.id),
        ip_address=request.client.host if request.client else "127.0.0.1",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(inv)

    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"
    inviter_name = current_user.full_name or current_user.email

    try:
        await email_service.send_team_invite(
            to_email=inv.email,
            invited_by=inviter_name,
            org_name=org_name,
            invite_url=invite_url,
        )
    except Exception:
        pass

    return _to_response(inv, tenant_name=org_name)


@router.patch("/{invitation_id}/revoke")
@router.delete("/{invitation_id}")
async def revoke_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(
        RequireRole([UserRole.org_admin, UserRole.manager, UserRole.owner])
    ),
    db: AsyncSession = Depends(get_db),
):
    """Revoke an active invitation."""
    if current_user.role == UserRole.owner and not current_user.tenant_id:
        stmt = select(Invitation).where(Invitation.id == invitation_id)
    else:
        stmt = select(Invitation).where(
            Invitation.id == invitation_id,
            Invitation.tenant_id == current_user.tenant_id,
        )

    invitation = (await db.execute(stmt)).scalars().first()
    if not invitation:
        raise ResourceNotFoundException("Invitation not found.")

    invitation.status = InvitationStatus.REVOKED
    invitation.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        tenant_id=invitation.tenant_id,
        user_id=current_user.id,
        action="team.invite.revoke",
        resource_type="invitation",
        resource_id=str(invitation.id),
        ip_address=request.client.host if request.client else "127.0.0.1",
    )
    db.add(audit)

    await db.commit()
    return {"status": "success", "message": "Invitation revoked successfully."}
