from fastapi import APIRouter, Depends, HTTPException, Header, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import hashlib
import uuid
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreateResponse
from app.core.exceptions import ResourceNotFoundException

router = APIRouter(prefix="/users/me/api-keys", tags=["API Keys"])


def generate_api_key(prefix: str = "sk_live_"):
    raw_key = f"{prefix}{secrets.token_urlsafe(32)}"
    hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
    return raw_key, hashed_key


@router.get("", response_model=list[ApiKeyResponse], summary="List my API keys")
async def list_api_keys(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ApiKey)
        .where(ApiKey.user_id == current_user.id)
        .order_by(ApiKey.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=ApiKeyCreateResponse, summary="Create a new API key")
async def create_api_key(
    body: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Phase 5: Quota Enforcement
    from app.services.entitlements import can_use_feature, BillingFeature
    from app.models.tenant import Tenant
    from sqlalchemy import select
    from app.core.exceptions import ForbiddenException

    if not current_user.tenant_id:
        raise ForbiddenException("Organization required to create API keys.")

    tenant = await db.scalar(select(Tenant).where(Tenant.id == current_user.tenant_id))
    if not can_use_feature(tenant, BillingFeature.API_ACCESS):
        raise HTTPException(
            status_code=403,
            detail="Developer API access is not included in your organization's plan.",
        )

    raw_key, hashed_key = generate_api_key()

    new_key = ApiKey(
        user_id=current_user.id,
        name=body.name,
        prefix="sk_live_",
        hashed_key=hashed_key,
        is_active=True,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    # We must return the raw_key this one time!
    return ApiKeyCreateResponse(
        id=new_key.id,
        name=new_key.name,
        prefix=new_key.prefix,
        is_active=new_key.is_active,
        expires_at=new_key.expires_at,
        last_used_at=new_key.last_used_at,
        created_at=new_key.created_at,
        raw_key=raw_key,
    )


@router.delete("/{key_id}", summary="Revoke an API key")
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(ApiKey).where(ApiKey.id == key_id, ApiKey.user_id == current_user.id)
    result = await db.execute(stmt)
    api_key = result.scalars().first()

    if not api_key:
        raise ResourceNotFoundException("API Key not found.")

    await db.delete(api_key)
    await db.commit()
    return {"message": "API Key revoked successfully."}
