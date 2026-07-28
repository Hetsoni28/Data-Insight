"""Tenant (organization) management endpoints."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, get_current_active_tenant_user
from app.models.user import User, UserRole
from app.schemas.tenant import TenantCreateRequest, TenantUpdateRequest, TenantResponse
from app.services.tenant import TenantService
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/tenants", tags=["Tenants"])


@router.post("", response_model=TenantResponse, status_code=201, summary="Create a new organization")
async def create_tenant(
    body: TenantCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    return await svc.create_tenant(name=body.name, owner=current_user, plan=body.plan)


@router.get("/me", response_model=TenantResponse, summary="Get my organization details")
async def get_my_tenant(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    return await svc.get_tenant(current_user.tenant_id)


from app.api.deps import RequireRole

@router.patch("/me", response_model=TenantResponse, summary="Update my organization")
async def update_my_tenant(
    body: TenantUpdateRequest,
    current_user: User = Depends(RequireRole(["super_admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
):
    svc = TenantService(db)
    tenant = await svc.get_tenant(current_user.tenant_id)
    return await svc.update_tenant(tenant, body.model_dump(exclude_none=True), actor=current_user)
