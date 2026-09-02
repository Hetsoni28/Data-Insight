"""Billing API endpoints.

POST /billing/checkout  → create Stripe checkout session, returns redirect URL
POST /billing/webhook   → Stripe webhook (raw body, no auth required)
GET  /billing/portal    → Stripe customer self-service portal URL
"""

import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from loguru import logger
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.repositories.tenant import TenantRepository
from app.services import billing as billing_service

router = APIRouter(prefix="/billing", tags=["billing"])


# ── Schemas ───────────────────────────────────────────────────────────────────


class CheckoutRequest(BaseModel):
    plan: str  # "starter" | "professional"


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    summary="Create a Stripe checkout session",
    description="Returns a Stripe-hosted checkout URL. Redirect the user to this URL.",
)
async def create_checkout(
    body: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutResponse:
    """Create a Stripe checkout session for the requested plan."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400, detail="User must belong to an organization.",
        )

    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found.")

    try:
        url = await billing_service.create_checkout_session(
            tenant=tenant,
            user_email=current_user.email,
            plan=body.plan,
        )
        return CheckoutResponse(checkout_url=url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except stripe.StripeError as exc:
        logger.error(f"[API /billing/checkout] Stripe error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider error. Please try again.",
        )


@router.get(
    "/portal",
    response_model=PortalResponse,
    summary="Get Stripe billing portal URL",
    description="Returns a Stripe customer portal URL for the current user to manage their subscription.",
)
async def billing_portal(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortalResponse:
    """Create a Stripe customer portal session for the current user."""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=400, detail="User must belong to an organization.",
        )

    tenant_repo = TenantRepository(db)
    tenant = await tenant_repo.get_by_id(current_user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found.")

    try:
        url = await billing_service.get_customer_portal_url(
            tenant=tenant, user_email=current_user.email,
        )

        # If the service created a new Stripe customer, update the Tenant in our DB
        if not tenant.stripe_customer_id:
            from app.services.billing import _get_or_create_customer

            customer_id = await _get_or_create_customer(tenant, current_user.email)
            if tenant.stripe_customer_id != customer_id:
                tenant.stripe_customer_id = customer_id
                await tenant_repo.save(tenant)

        return PortalResponse(portal_url=url)
    except stripe.StripeError as exc:
        logger.error(f"[API /billing/portal] Stripe error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment provider error. Please try again.",
        )


@router.post(
    "/webhook",
    status_code=status.HTTP_200_OK,
    summary="Stripe webhook receiver",
    description=(
        "Stripe calls this endpoint when subscription events occur. "
        "IMPORTANT: Must receive raw body bytes for signature verification — "
        "do NOT apply any body parsing middleware to this route."
    ),
)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Receive and process Stripe webhook events.

    Stripe sends events like:
    - checkout.session.completed
    - customer.subscription.updated
    - customer.subscription.deleted
    - invoice.payment_failed
    """
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing stripe-signature header",
        )

    # ⚠️ Must use raw bytes — do NOT await request.json()
    payload = await request.body()

    try:
        result = await billing_service.handle_webhook(
            payload=payload,
            sig_header=stripe_signature,
            db=db,
        )

        return {"received": True, **result}
    except stripe.SignatureVerificationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Stripe webhook signature.",
        )
    except Exception as exc:
        logger.exception(f"[API /billing/webhook] Unexpected error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed.",
        )
