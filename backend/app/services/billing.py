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
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.tenant import Tenant

# ── Stripe Setup ──────────────────────────────────────────────────────────────
stripe.api_key = settings.STRIPE_SECRET_KEY

# ── Plan → Stripe Price ID mapping ───────────────────────────────────────────
# Create these in your Stripe dashboard under Products → Prices
# then paste the price IDs here.
PLAN_PRICE_IDS: dict[str, str] = {
    "starter": "price_starter_placeholder",  # $499/month
    "professional": "price_professional_placeholder",  # $999/month
    "enterprise": "price_enterprise_placeholder",  # $15,000/month
}

PLAN_NAMES: dict[str, str] = {
    "starter": "Starter",
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
        raise ValueError(
            f"Unknown plan '{plan}'. Valid options: {list(PLAN_PRICE_IDS)}"
        )

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
        logger.error(
            f"[Billing] ❌ Checkout session failed | tenant={tenant.name} | error: {exc}"
        )
        raise


async def create_invoice_checkout_session(tenant: Tenant, user_email: str, invoice) -> str:
    """
    Create a one-off Stripe Checkout session for a specific invoice payment.
    """
    if not settings.STRIPE_SECRET_KEY:
        logger.warning(
            f"[Billing] STRIPE_SECRET_KEY not set — returning stub invoice checkout URL "
            f"for tenant={tenant.name} invoice={invoice.id}"
        )
        return f"{settings.FRONTEND_URL}/organization-admin/dashboard/billing?payment=success&invoice={invoice.id}"

    try:
        amount_cents = int(invoice.amount * 100)
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            customer_email=user_email,
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": (invoice.currency or "usd").lower(),
                        "product_data": {
                            "name": f"Data Insight Enterprise Contract Invoice #{str(invoice.id)[:8].upper()}",
                            "description": f"Dedicated System Rental & Database Infrastructure — {tenant.name}",
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{settings.FRONTEND_URL}/organization-admin/dashboard/billing?payment=success&invoice={invoice.id}",
            cancel_url=f"{settings.FRONTEND_URL}/organization-admin/dashboard/billing?payment=cancelled",
            metadata={
                "tenant_id": str(tenant.id),
                "invoice_id": str(invoice.id),
                "payment_type": "invoice_settlement"
            },
        )
        logger.info(
            f"[Billing] ✅ Invoice payment session created | tenant={tenant.name} "
            f"invoice={invoice.id} session_id={session.id}"
        )
        return session.url or f"{settings.FRONTEND_URL}/organization-admin/dashboard/billing"
    except stripe.StripeError as exc:
        logger.error(
            f"[Billing] ❌ Invoice payment session failed | tenant={tenant.name} | error: {exc}"
        )
        raise


async def get_customer_portal_url(tenant: Tenant, user_email: str) -> str:
    """
    Create a Stripe Customer Portal session so the user can manage
    their subscription, update payment method, or cancel.
    Returns the portal URL.
    """
    if not settings.STRIPE_SECRET_KEY:
        logger.warning(
            "[Billing] STRIPE_SECRET_KEY not set — returning stub portal URL"
        )
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
        logger.error(
            f"[Billing] ❌ Portal session failed | tenant={tenant.name} | error: {exc}"
        )
        raise


async def handle_webhook(payload: bytes, sig_header: str, db: AsyncSession) -> dict:
    """
    Verify and process a Stripe webhook event idempotently.

    Returns a dict with the processed event type and relevant data.
    Raises stripe.SignatureVerificationError if signature is invalid.
    """
    if not settings.STRIPE_WEBHOOK_SECRET:
        logger.warning(
            "[Billing] STRIPE_WEBHOOK_SECRET not set — skipping webhook verification"
        )
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
    stripe_event_id = event["id"]
    logger.info(f"[Billing] 📨 Webhook received: {event_type} ({stripe_event_id})")

    # ── Idempotency Check ─────────────────────────────────────────────────────
    from sqlalchemy import select
    from app.models.stripe_event import StripeEvent
    from app.repositories.tenant import TenantRepository
    from app.models.tenant import PlanType
    import json

    existing_event = await db.scalar(
        select(StripeEvent).where(StripeEvent.stripe_event_id == stripe_event_id)
    )
    if existing_event:
        logger.info(f"[Billing] ⏭️ Webhook {stripe_event_id} already processed. Skipping.")
        return {"event": event_type, "status": "already_processed"}

    # ── Process Relevant Events ───────────────────────────────────────────────
    tenant_repo = TenantRepository(db)
    
    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        if hasattr(session, "to_dict"): session = session.to_dict()
        tenant_id = session.get("metadata", {}).get("tenant_id")
        plan = session.get("metadata", {}).get("plan")
        invoice_id = session.get("metadata", {}).get("invoice_id")
        payment_type = session.get("metadata", {}).get("payment_type")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        
        logger.info(f"[Billing] 💳 Checkout completed | tenant_id={tenant_id} plan={plan} invoice_id={invoice_id}")
        
        if tenant_id:
            tenant = await tenant_repo.get_by_id(tenant_id)
            if tenant:
                if payment_type == "invoice_settlement" and invoice_id:
                    from app.models.invoice import Invoice, InvoiceStatus
                    from app.models.billing_activity import BillingActivity
                    import uuid as _uuid
                    
                    try:
                        inv_uuid = _uuid.UUID(str(invoice_id))
                        inv = await db.scalar(select(Invoice).where(Invoice.id == inv_uuid))
                        if inv:
                            inv.status = InvoiceStatus.paid
                            activity = BillingActivity(
                                tenant_id=tenant.id,
                                event_type="invoice_settled_online",
                                description=f"Invoice #{str(inv.id)[:8].upper()} ({inv.amount} {inv.currency}) paid via Stripe Checkout.",
                                metadata_json={"invoice_id": str(inv.id), "amount": inv.amount, "session_id": session.get("id")}
                            )
                            db.add(activity)
                    except Exception as e:
                        logger.error(f"[Billing] Error updating invoice {invoice_id}: {e}")
                
                if plan:
                    if plan in [p.value for p in PlanType]:
                        tenant.plan = PlanType(plan)
                    elif plan in ["enterprise", "custom"]:
                        tenant.plan = PlanType(plan)
                
                tenant.stripe_customer_id = customer_id or tenant.stripe_customer_id
                tenant.stripe_subscription_id = subscription_id or tenant.stripe_subscription_id
                await tenant_repo.save(tenant)

    elif event_type == "customer.subscription.updated":
        sub = event["data"]["object"]
        if hasattr(sub, "to_dict"): sub = sub.to_dict()
        tenant_id = sub.get("metadata", {}).get("tenant_id")
        status = sub.get("status")
        current_period_end = sub.get("current_period_end")
        cancel_at = sub.get("cancel_at")
        
        logger.info(f"[Billing] 🔄 Subscription updated | tenant_id={tenant_id} status={status}")
        
        if tenant_id:
            tenant = await tenant_repo.get_by_id(tenant_id)
            if tenant:
                tenant.subscription_status = status or "active"
                if current_period_end:
                    tenant.current_period_end = datetime.fromtimestamp(current_period_end, tz=timezone.utc)
                if cancel_at:
                    tenant.cancel_at = datetime.fromtimestamp(cancel_at, tz=timezone.utc)
                else:
                    tenant.cancel_at = None
                if status == "canceled":
                    tenant.plan = PlanType.starter
                await tenant_repo.save(tenant)

    elif event_type == "customer.subscription.deleted":
        sub = event["data"]["object"]
        if hasattr(sub, "to_dict"): sub = sub.to_dict()
        tenant_id = sub.get("metadata", {}).get("tenant_id")
        logger.info(f"[Billing] ❌ Subscription cancelled | tenant_id={tenant_id}")
        
        if tenant_id:
            tenant = await tenant_repo.get_by_id(tenant_id)
            if tenant:
                tenant.plan = PlanType.starter
                tenant.stripe_subscription_id = None
                setattr(tenant, "subscription_status", "canceled")
                await tenant_repo.save(tenant)

    elif event_type.startswith("invoice."):
        invoice = event["data"]["object"]
        if hasattr(invoice, "to_dict"): invoice = invoice.to_dict()
        customer_email = invoice.get("customer_email")
        stripe_invoice_id = invoice.get("id")
        sub_id = invoice.get("subscription")
        amount = invoice.get("total", 0) / 100.0  # Convert cents to dollars
        currency = invoice.get("currency", "usd").upper()
        pdf_url = invoice.get("invoice_pdf")
        period_start = datetime.fromtimestamp(invoice.get("period_start"), tz=timezone.utc) if invoice.get("period_start") else None
        period_end = datetime.fromtimestamp(invoice.get("period_end"), tz=timezone.utc) if invoice.get("period_end") else None
        
        # Try to find tenant by subscription_id or customer_email
        tenant = None
        if sub_id:
            from sqlalchemy import select
            tenant = await db.scalar(select(Tenant).where(Tenant.stripe_subscription_id == sub_id))
        
        if tenant:
            from app.models.invoice import Invoice, InvoiceStatus
            from app.models.billing_activity import BillingActivity
            
            # Find existing invoice
            existing_invoice = await db.scalar(select(Invoice).where(Invoice.stripe_invoice_id == stripe_invoice_id))
            
            if event_type == "invoice.created":
                if not existing_invoice:
                    new_invoice = Invoice(
                        tenant_id=tenant.id,
                        amount=amount,
                        currency=currency,
                        status=InvoiceStatus.draft,
                        stripe_invoice_id=stripe_invoice_id,
                        pdf_url=pdf_url,
                        billing_reason=invoice.get("billing_reason"),
                        period_start=period_start,
                        period_end=period_end
                    )
                    db.add(new_invoice)
                    logger.info(f"[Billing] 📄 Draft Invoice Created | tenant={tenant.name} amount={amount}")
            
            elif event_type == "invoice.finalized":
                if existing_invoice:
                    existing_invoice.status = InvoiceStatus.pending
                    existing_invoice.pdf_url = pdf_url
                    existing_invoice.amount = amount
                else:
                    new_invoice = Invoice(
                        tenant_id=tenant.id, amount=amount, currency=currency,
                        status=InvoiceStatus.pending, stripe_invoice_id=stripe_invoice_id,
                        pdf_url=pdf_url, billing_reason=invoice.get("billing_reason"),
                        period_start=period_start, period_end=period_end
                    )
                    db.add(new_invoice)
                logger.info(f"[Billing] 📄 Invoice Finalized | tenant={tenant.name} amount={amount}")
            
            elif event_type == "invoice.paid":
                if existing_invoice:
                    existing_invoice.status = InvoiceStatus.paid
                    existing_invoice.pdf_url = pdf_url
                
                # Create a billing activity record
                activity = BillingActivity(
                    tenant_id=tenant.id,
                    event_type="invoice_paid",
                    description=f"Invoice {stripe_invoice_id} for {amount} {currency} was successfully paid.",
                    metadata_json={"stripe_invoice_id": stripe_invoice_id, "amount": amount, "currency": currency}
                )
                db.add(activity)
                logger.info(f"[Billing] 💰 Invoice Paid | tenant={tenant.name} amount={amount}")
            
            elif event_type == "invoice.payment_failed":
                if existing_invoice:
                    existing_invoice.status = InvoiceStatus.failed
                
                activity = BillingActivity(
                    tenant_id=tenant.id,
                    event_type="payment_failed",
                    description=f"Payment failed for invoice {stripe_invoice_id} ({amount} {currency}).",
                    metadata_json={"stripe_invoice_id": stripe_invoice_id, "amount": amount}
                )
                db.add(activity)
                logger.warning(f"[Billing] ⚠️ Payment Failed | tenant={tenant.name} amount={amount}")

    elif event_type.startswith("payment_intent."):
        pi = event["data"]["object"]
        if hasattr(pi, "to_dict"): pi = pi.to_dict()
        amount = pi.get("amount", 0) / 100.0
        
        # Payment intents don't always have a subscription easily available in the top level.
        # We rely on invoice events mostly for SaaS billing, but we can log these if we can find the tenant.
        customer_id = pi.get("customer")
        if customer_id:
            from sqlalchemy import select
            tenant = await db.scalar(select(Tenant).where(Tenant.stripe_customer_id == customer_id))
            if tenant:
                from app.models.billing_activity import BillingActivity
                if event_type == "payment_intent.succeeded":
                    activity = BillingActivity(
                        tenant_id=tenant.id,
                        event_type="payment_succeeded",
                        description=f"Payment intent succeeded for {amount}.",
                        metadata_json={"payment_intent_id": pi.get("id"), "amount": amount}
                    )
                    db.add(activity)
                elif event_type == "payment_intent.payment_failed":
                    activity = BillingActivity(
                        tenant_id=tenant.id,
                        event_type="payment_failed",
                        description=f"Payment intent failed for {amount}.",
                        metadata_json={"payment_intent_id": pi.get("id"), "amount": amount}
                    )
                    db.add(activity)

    # ── Record Event for Idempotency ──────────────────────────────────────────
    new_event = StripeEvent(
        stripe_event_id=stripe_event_id,
        event_type=event_type,
        payload=json.loads(payload.decode('utf-8'))
    )
    db.add(new_event)
    await db.commit()

    return {"event": event_type, "status": "processed"}


# ── Internal helpers ──────────────────────────────────────────────────────────


async def _get_or_create_customer(tenant: Tenant, user_email: str) -> str:
    """
    Look up a Stripe customer by email or create one if they don't exist.
    Returns the Stripe customer ID.
    """
    if tenant.stripe_customer_id:
        return tenant.stripe_customer_id

    # Search for existing customer by email
    customers = await asyncio.to_thread(stripe.Customer.list, email=user_email, limit=1)
    if customers.data:
        return customers.data[0].id

    # Create a new customer
    customer = await asyncio.to_thread(
        stripe.Customer.create,
        email=user_email,
        name=tenant.name,
        metadata={"tenant_id": str(tenant.id)},
    )
    logger.info(
        f"[Billing] ✅ Stripe customer created | tenant={tenant.name} id={customer.id}"
    )
    return customer.id
