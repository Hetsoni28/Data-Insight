from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, or_
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import uuid

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.tenant_role import TenantRole
from app.models.tenant_department import TenantDepartment
from app.models.user_session import UserSession
from app.models.invitation import Invitation, InvitationStatus
from app.models.audit_log import AuditLog
from pydantic import BaseModel, EmailStr
import secrets

router = APIRouter()

@router.get("/", summary="Get Team Members")
async def get_team_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        if not tenant_id:
            raise HTTPException(status_code=403, detail="User does not belong to an organization")

        # Fetch users with active session info
        users_stmt = select(User).where(User.tenant_id == tenant_id, User.is_active == True).offset(skip).limit(limit)
        result = await db.execute(users_stmt)
        users = result.scalars().all()
    
        # We will enrich this data with active sessions or last login
        members = []
        for u in users:
            # Get active session count
            session_stmt = select(func.count(UserSession.id)).where(UserSession.user_id == u.id, UserSession.is_active == True)
            session_res = await db.execute(session_stmt)
            active_sessions = session_res.scalar() or 0
        
            members.append({
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "avatar_url": u.avatar_url,
                "employee_id": u.employee_id,
                "department": u.department,
                "role": u.role,
                "status": "Active" if u.is_active else "Suspended",
                "created_at": u.created_at,
                "active_sessions": active_sessions
            })
        
        return {
            "status": "success",
            "data": members
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.get("/stats", summary="Get Team Stats")
async def get_team_stats(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    if not tenant_id:
        raise HTTPException(status_code=403, detail="User does not belong to an organization")

    # Total members
    total_stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id)
    total_res = await db.execute(total_stmt)
    total_members = total_res.scalar() or 0
    
    # Admins
    admin_stmt = select(func.count(User.id)).where(User.tenant_id == tenant_id, User.role == UserRole.org_admin)
    admin_res = await db.execute(admin_stmt)
    total_admins = admin_res.scalar() or 0
    
    # Pending invites
    invite_stmt = select(func.count(Invitation.id)).where(Invitation.tenant_id == tenant_id, Invitation.status == InvitationStatus.PENDING)
    invite_res = await db.execute(invite_stmt)
    pending_invites = invite_res.scalar() or 0
    
    # Online members (sessions updated in last 10 mins)
    ten_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=10)
    online_stmt = select(func.count(func.distinct(UserSession.user_id))).join(User, UserSession.user_id == User.id).where(
        User.tenant_id == tenant_id, 
        UserSession.last_active_at >= ten_mins_ago
    )
    online_res = await db.execute(online_stmt)
    online_members = online_res.scalar() or 0
    
    return {
        "status": "success",
        "data": {
            "total_members": total_members,
            "total_admins": total_admins,
            "pending_invitations": pending_invites,
            "online_now": online_members
        }
    }

@router.get("/roles", summary="Get Organization Roles")
async def get_team_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        # Fetch custom roles
        stmt = select(TenantRole).where(TenantRole.tenant_id == tenant_id).offset(skip).limit(limit)
        result = await db.execute(stmt)
        roles = result.scalars().all()
    
        return {
            "status": "success",
            "data": [
                {
                    "id": str(r.id),
                    "name": r.name,
                    "description": r.description,
                    "permissions": r.permissions,
                    "is_system": r.is_system,
                    "created_at": r.created_at
                } for r in roles
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.get("/departments", summary="Get Organization Departments")
async def get_team_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    stmt = select(TenantDepartment).where(TenantDepartment.tenant_id == tenant_id).offset(skip).limit(limit)
    result = await db.execute(stmt)
    departments = result.scalars().all()
    
    return {
        "status": "success",
        "data": [
            {
                "id": str(d.id),
                "name": d.name,
                "description": d.description,
                "created_at": d.created_at
            } for d in departments
        ]
    }
class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str

@router.get("/invitations", summary="Get Organization Invitations")
async def get_team_invitations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        from app.core.config import settings
        tenant_id = current_user.tenant_id
        stmt = select(Invitation).where(Invitation.tenant_id == tenant_id).order_by(desc(Invitation.created_at)).offset(skip).limit(limit)
        result = await db.execute(stmt)
        invitations = result.scalars().all()
    
        return {
            "status": "success",
            "data": [
                {
                    "id": str(i.id),
                    "email": i.email,
                    "role": i.role,
                    "status": i.status.value if hasattr(i.status, "value") else str(i.status),
                    "token": i.token,
                    "invite_url": f"{settings.FRONTEND_URL}/invite/{i.token}",
                    "expires_at": i.expires_at,
                    "created_at": i.created_at
                } for i in invitations
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.post("/invitations", summary="Invite a New Member", dependencies=[Depends(RequireRole(["org_admin"]))])
async def invite_team_member(
    req: InviteMemberRequest,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    from app.core.config import settings
    from app.services import email as email_service
    
    # Phase 5: Quota Enforcement
    from app.services.entitlements import check_quota, BillingResource, get_usage
    from app.models.tenant import Tenant
    
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    usage = await get_usage(tenant, db)
    quota = check_quota(tenant, usage, BillingResource.USERS)
    if not quota.allowed:
        raise HTTPException(status_code=402, detail="User seat limit exceeded for your organization's plan.")
        
    
    clean_email = req.email.strip().lower()

    # Check if user already exists
    stmt = select(User).where(User.tenant_id == tenant_id, User.email == clean_email)
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="User already exists in this organization")
        
    token = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    
    # Check for existing pending invite
    existing_invite_stmt = select(Invitation).where(
        Invitation.tenant_id == tenant_id,
        Invitation.email == clean_email,
        Invitation.status == InvitationStatus.PENDING
    )
    existing_invite = (await db.execute(existing_invite_stmt)).scalars().first()

    if existing_invite:
        existing_invite.token = token
        existing_invite.role = req.role
        existing_invite.expires_at = expires
        existing_invite.updated_at = datetime.now(timezone.utc)
        invitation = existing_invite
    else:
        invitation = Invitation(
            email=clean_email,
            tenant_id=tenant_id,
            role=req.role,
            token=token,
            status=InvitationStatus.PENDING,
            expires_at=expires
        )
        db.add(invitation)
    
    # Audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="team.invite",
        resource_type="invitation",
        ip_address=request.client.host if request.client else "127.0.0.1",
        extra_metadata={"invited_email": clean_email, "role": req.role}
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(invitation)
    
    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"
    inviter_name = current_user.full_name or current_user.email
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    org_name = tenant.name if tenant else "Organization"

    try:
        await email_service.send_team_invite(
            to_email=clean_email,
            invited_by=inviter_name,
            org_name=org_name,
            invite_url=invite_url,
        )
    except Exception:
        pass
    
    return {
        "status": "success",
        "message": "Invitation sent successfully",
        "data": {
            "id": str(invitation.id),
            "email": invitation.email,
            "role": invitation.role,
            "status": invitation.status.value if hasattr(invitation.status, "value") else str(invitation.status),
            "token": invitation.token,
            "invite_url": invite_url,
            "expires_at": invitation.expires_at,
            "created_at": invitation.created_at
        }
    }

@router.post("/invitations/{invitation_id}/resend", summary="Resend an Invitation", dependencies=[Depends(RequireRole(["org_admin"]))])
async def resend_team_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    from app.core.config import settings
    from app.services import email as email_service

    tenant_id = current_user.tenant_id
    stmt = select(Invitation).where(Invitation.id == invitation_id, Invitation.tenant_id == tenant_id)
    res = await db.execute(stmt)
    inv = res.scalars().first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    token = secrets.token_urlsafe(32)
    inv.token = token
    inv.status = InvitationStatus.PENDING
    inv.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    inv.updated_at = datetime.now(timezone.utc)

    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="team.invite.resend",
        resource_type="invitation",
        resource_id=str(inv.id),
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)

    await db.commit()
    await db.refresh(inv)

    invite_url = f"{settings.FRONTEND_URL}/invite/{token}"
    inviter_name = current_user.full_name or current_user.email
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    org_name = tenant.name if tenant else "Organization"

    try:
        await email_service.send_team_invite(
            to_email=inv.email,
            invited_by=inviter_name,
            org_name=org_name,
            invite_url=invite_url,
        )
    except Exception:
        pass

    return {
        "status": "success",
        "message": "Invitation resent successfully",
        "data": {
            "id": str(inv.id),
            "email": inv.email,
            "role": inv.role,
            "status": inv.status.value if hasattr(inv.status, "value") else str(inv.status),
            "token": inv.token,
            "invite_url": invite_url,
            "expires_at": inv.expires_at
        }
    }

@router.patch("/invitations/{invitation_id}/revoke", summary="Revoke an Invitation", dependencies=[Depends(RequireRole(["org_admin"]))])
async def revoke_team_invitation(
    invitation_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
        stmt = select(Invitation).where(Invitation.id == invitation_id, Invitation.tenant_id == tenant_id)
        res = await db.execute(stmt)
        inv = res.scalars().first()
    
        if not inv:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        inv.status = InvitationStatus.REVOKED
        inv.updated_at = datetime.now(timezone.utc)
    
        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=current_user.id,
            action="team.invite.revoke",
            resource_type="invitation",
            resource_id=str(inv.id),
            ip_address=request.client.host if request.client else "127.0.0.1"
        )
        db.add(audit)
    
        await db.commit()
        return {"status": "success", "message": "Invitation revoked"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

@router.get("/audit-logs", summary="Get Security & Audit Logs", dependencies=[Depends(RequireRole(["org_admin"]))])
async def get_team_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    tenant_id = current_user.tenant_id
    
    # Join with User to get the actor's email/name
    stmt = select(AuditLog, User).outerjoin(User, AuditLog.user_id == User.id).where(AuditLog.tenant_id == tenant_id).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    
    logs = []
    for log, user in result:
        logs.append({
            "id": str(log.id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "severity": log.severity,
            "module": log.module,
            "ip_address": log.ip_address,
            "status": log.status,
            "created_at": log.created_at,
            "extra_metadata": log.extra_metadata,
            "actor": {
                "name": user.full_name if user else "System",
                "email": user.email if user else None
            }
        })
        
    count_stmt = select(func.count(AuditLog.id)).where(AuditLog.tenant_id == tenant_id)
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0
    
    return {"status": "success", "data": logs, "total": total}

@router.get("/active-sessions", summary="Get Active Sessions", dependencies=[Depends(RequireRole(["org_admin"]))])
async def get_team_active_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        tenant_id = current_user.tenant_id
    
        # Active sessions in the last 24h
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        stmt = select(UserSession, User).join(User, UserSession.user_id == User.id).where(
            User.tenant_id == tenant_id,
            UserSession.is_active == True,
            UserSession.last_active_at >= twenty_four_hours_ago
        ).order_by(desc(UserSession.last_active_at)).offset(skip).limit(limit)
    
        result = await db.execute(stmt)
    
        sessions = []
        for session, user in result:
            sessions.append({
                "id": str(session.id),
                "user_name": user.full_name,
                "user_email": user.email,
                "device_name": session.device_name,
                "os": session.os,
                "browser": session.browser,
                "location": session.location,
                "ip_address": session.ip_address,
                "last_active_at": session.last_active_at,
                "created_at": session.created_at
            })
        
        count_stmt = select(func.count(UserSession.id)).join(User, UserSession.user_id == User.id).where(
            User.tenant_id == tenant_id,
            UserSession.is_active == True,
            UserSession.last_active_at >= twenty_four_hours_ago
        )
        total_res = await db.execute(count_stmt)
        total = total_res.scalar() or 0
        
        return {"status": "success", "data": sessions, "total": total}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
