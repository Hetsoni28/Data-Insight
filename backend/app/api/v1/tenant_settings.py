from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any
import uuid

from app.api.deps import get_db, get_current_active_tenant_user, RequireRole
from app.models.user import User
from app.models.tenant import Tenant
from app.models.audit_log import AuditLog
from app.schemas.tenant import TenantResponse, TenantUpdateRequest
from pydantic import BaseModel

router = APIRouter()

class TenantBrandingUpdateRequest(BaseModel):
    logo_url: str | None = None
    white_label_config: dict | None = None

@router.get("/profile", response_model=TenantResponse, summary="Get Organization Profile")
async def get_tenant_profile(
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get the organization's current profile settings."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return tenant

@router.patch("/profile", response_model=TenantResponse, summary="Update Organization Profile")
async def update_tenant_profile(
    req: TenantUpdateRequest,
    request: Request,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update the organization's profile settings."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # Update allowed fields
    if req.name is not None:
        tenant.name = req.name
    if req.domain is not None:
        tenant.domain = req.domain
    if req.industry is not None:
        tenant.industry = req.industry
    if req.timezone is not None:
        tenant.timezone = req.timezone
    if req.currency is not None:
        tenant.currency = req.currency
        
    # Create audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="tenant.profile.updated",
        resource_type="tenant",
        resource_id=str(tenant.id),
        extra_metadata={"updates": req.model_dump(exclude_unset=True)},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(tenant)
    return tenant

@router.get("/branding", summary="Get Organization Branding")
async def get_tenant_branding(
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Get the organization's branding configurations."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    return {
        "logo_url": tenant.logo_url,
        "white_label_config": tenant.white_label_config or {}
    }

@router.patch("/branding", summary="Update Organization Branding")
async def update_tenant_branding(
    req: TenantBrandingUpdateRequest,
    request: Request,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Update the organization's branding configurations."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    if req.logo_url is not None:
        tenant.logo_url = req.logo_url
    if req.white_label_config is not None:
        tenant.white_label_config = req.white_label_config
        
    # Create audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="tenant.branding.updated",
        resource_type="tenant",
        resource_id=str(tenant.id),
        extra_metadata={"updates": req.model_dump(exclude_unset=True)},
        ip_address=request.client.host if request.client else "127.0.0.1"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(tenant)
    
    return {
        "logo_url": tenant.logo_url,
        "white_label_config": tenant.white_label_config or {}
    }
