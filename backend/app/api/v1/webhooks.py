import secrets
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ForbiddenException, ResourceNotFoundException
from app.models.user import User
from app.models.webhook import Webhook
from app.schemas.webhook import WebhookCreate, WebhookResponse

router = APIRouter(prefix="/tenants/me/webhooks", tags=["Webhooks"])


def require_org_admin(current_user: User = Depends(get_current_user)):
    from app.models.user import UserRole

    if current_user.role not in [UserRole.owner, UserRole.org_admin]:
        raise ForbiddenException("Only Organization Admins can manage webhooks.")
    return current_user


@router.get(
    "", response_model=list[WebhookResponse], summary="List organization webhooks",
)
async def list_webhooks(
    admin: User = Depends(require_org_admin), db: AsyncSession = Depends(get_db),
):
    if not admin.tenant_id:
        return []
    stmt = (
        select(Webhook)
        .where(Webhook.tenant_id == admin.tenant_id)
        .order_by(Webhook.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=WebhookResponse, summary="Create a webhook")
async def create_webhook(
    body: WebhookCreate,
    admin: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    if not admin.tenant_id:
        raise ForbiddenException("User must belong to a tenant to create webhooks.")

    secret = f"whsec_{secrets.token_urlsafe(24)}"

    new_webhook = Webhook(
        tenant_id=admin.tenant_id,
        name=body.name,
        url=body.url,
        secret=secret,
        events=body.events,
        is_active=True,
    )
    db.add(new_webhook)
    await db.commit()
    await db.refresh(new_webhook)
    return new_webhook


@router.delete("/{webhook_id}", summary="Delete a webhook")
async def delete_webhook(
    webhook_id: uuid.UUID,
    admin: User = Depends(require_org_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Webhook).where(
        Webhook.id == webhook_id, Webhook.tenant_id == admin.tenant_id,
    )
    result = await db.execute(stmt)
    webhook = result.scalars().first()

    if not webhook:
        raise ResourceNotFoundException("Webhook not found.")

    await db.delete(webhook)
    await db.commit()
    return {"message": "Webhook deleted successfully."}
