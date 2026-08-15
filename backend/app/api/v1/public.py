from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_shared_db
from app.models.tenant import Tenant

router = APIRouter()

@router.get("/tenant-branding")
async def get_tenant_branding(domain: str, db: AsyncSession = Depends(get_shared_db)):
    """
    Public endpoint to fetch a tenant's branding configuration based on their custom domain.
    Used by the frontend middleware/providers to dynamically inject CSS themes before login.
    """
    stmt = select(Tenant).where(Tenant.custom_domain == domain, Tenant.is_deleted == False)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found for this domain")
        
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "slug": tenant.slug,
        "logo_url": tenant.logo_url,
        "white_label_config": tenant.white_label_config or {}
    }
