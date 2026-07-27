"""
Billing service — Stripe integration.

Handles:
- Checkout session creation (Starter / Business plans)
- Stripe webhook processing (subscription lifecycle events)
- Customer billing portal (self-service plan management)

Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env to enable.
In development without keys, methods log a warning and return safe stubs.
"""
import asyncio
import stripe
from loguru import logger

from app.core.config import settings
from app.models.tenant import Tenant

# ── Stripe Setup ──────────────────────────────────────────────────────────────
stripe.api_key = settings.STRIPE_SECRET_KEY

# ── Plan → Stripe Price ID mapping ───────────────────────────────────────────
# Create these in your Stripe dashboard under Products → Prices
# then paste the price IDs here.
PLAN_PRICE_IDS: dict[str, str] = {
    "starter":  "price_starter_placeholder",   # $499/month
    "professional": "price_professional_placeholder",  # $999/month
}

PLAN_NAMES: dict[str, str] = {
    "starter":  "Starter",
    "professional": "Professional",
}


# ── Public API ────────────────────────────────────────────────────────────────

async def create_checkout_session(tenant: Tenant, user_email: str, plan: str) -> str:
    """
    Create a Stripe Checkout session for the given plan.
    Returns the Stripe session URL to redirect the user to.
    Raises ValueError for unknown plans.
    """
    if plan not in PLAN_PRICE_IDS:
        raise ValueError(f"Unknown plan '{plan}'. Valid options: {list(PLAN_PRICE_IDS)}")

    if not settings.STRIPE_SECRET_KEY:
        logger.warning(
            f"[Billing] STRIPE_SECRET_KEY not set — returning stub checkout URL "
            f"for tenant={tenant.name} plan={plan}"
        )
        return f"{settings.FRONTEND_URL}/dashboard?billing=stub&plan={plan}"

    try:
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            customer_email=user_email,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": PLAN_PRICE_IDS[plan],
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=f"{settings.FRONTEND_URL}/dashboard?billing=success&plan={plan}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing?billing=cancelled",
            metadata={
                "tenant_id": str(tenant.id),
                "plan": plan,
            },
            subscription_data={
                "metadata": {
                    "tenant_id": str(tenant.id),
                    "plan": plan,
                }
            },
        )
        logger.info(
            f"[Billing] ✅ Checkout session created | tenant={tenant.name} "
            f"plan={plan} session_id={session.id}"
        )
        if not session.url:
            raise RuntimeError("Failed to generate Stripe checkout session URL")
        return session.url
    except stripe.StripeError as exc:
        logger.error(f"[Billing] ❌ Checkout session failed | tenant={tenant.name} | error: {exc}")
        raise


async def get_customer_portal_url(tenant: Tenant, user_email: str) -> str:
    """
    Create a Stripe Customer Portal session so the user can manage
    their subscription, update payment method, or cancel.
    Returns the portal URL.
    """
    if not settings.STRIPE_SECRET_KEY:
        logger.warning("[Billing] STRIPE_SECRET_KEY not set — returning stub portal URL")
        return f"{settings.FRONTEND_URL}/dashboard?billing=portal_stub"

    # Look up or create the Stripe customer for this tenant
    customer_id = await _get_or_create_customer(tenant, user_email)

    try:
        session = await asyncio.to_thread(
            stripe.billing_portal.Session.create,
            customer=customer_id,
            return_url=f"{settings.FRONTEND_URL}/dashboard",
        )
        logger.info(f"[Billing] ✅ Portal session created | tenant={tenant.name}")
        return session.url
    except stripe.StripeError as exc:
        logger.error(f"[Billing] ❌ Portal session failed | tenant={tenant.name} | error: {exc}")
        raise


async def handle_webhook(payload: bytes, sig_header: str) -> dict:
    """
    Verify and process a Stripe webhook event.

    Returns a dict with the processed event type and relevant data.
    Raises stripe.SignatureVerificationError if signature is invalid.

    Important: the FastAPI endpoint MUST pass the RAW request body bytes —
    not the parsed JSON — otherwise signature verification will fail.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning("[Billing] STRIPE_WEBHOOK_SECRET not set — skipping webhook verification")
        return {"status": "webhook_secret_not_configured"}

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET,
        )
    except stripe.SignatureVerificationError as exc:
        logger.error(f"[Billing] ❌ Webhook signature invalid: {exc}")
        raise

    event_type = event["type"]
    logger.info(f"[Billing] 📨 Webhook received: {event_type}")

    # ── Handle relevant events ────────────────────────────────────────────────
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        tenant_id = session.get("metadata", {}).get("tenant_id")
        plan = session.get("metadata", {}).get("plan")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        logger.info(f"[Billing] 💳 Checkout completed | tenant_id={tenant_id} plan={plan}")
        return {
            "event": event_type, 
            "tenant_id": tenant_id, 
            "plan": plan,
            "stripe_customer_id": customer_id,
            "stripe_subscription_id": subscription_id
        }

    elif event_type == "customer.subscription.updated":
        sub = event["data"]["object"]
        tenant_id = sub.get("metadata", {}).get("tenant_id")
        status = sub.get("status")
        logger.info(f"[Billing] 🔄 Subscription updated | tenant_id={tenant_id} status={status}")
        return {"event": event_type, "tenant_id": tenant_id, "status": status}

    elif event_type == "customer.subscription.deleted":
        sub = event["data"]["object"]
        tenant_id = sub.get("metadata", {}).get("tenant_id")
        logger.info(f"[Billing] ❌ Subscription cancelled | tenant_id={tenant_id}")
        return {"event": event_type, "tenant_id": tenant_id, "status": "cancelled"}

    elif event_type == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_email = invoice.get("customer_email")
        logger.warning(f"[Billing] ⚠️ Payment failed | email={customer_email}")
        return {"event": event_type, "customer_email": customer_email}

    # All other events acknowledged but not processed
    return {"event": event_type, "status": "acknowledged"}


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _get_or_create_customer(tenant: Tenant, user_email: str) -> str:
    """
    Look up a Stripe customer by email or create one if they don't exist.
    Returns the Stripe customer ID.
    """
    if tenant.stripe_customer_id:
        return tenant.stripe_customer_id

    # Search for existing customer by email
    customers = await asyncio.to_thread(
        stripe.Customer.list, email=user_email, limit=1
    )
    if customers.data:
        return customers.data[0].id

    # Create a new customer
    customer = await asyncio.to_thread(
        stripe.Customer.create,
        email=user_email,
        name=tenant.name,
        metadata={"tenant_id": str(tenant.id)},
    )
    logger.info(f"[Billing] ✅ Stripe customer created | tenant={tenant.name} id={customer.id}")
    return customer.id
