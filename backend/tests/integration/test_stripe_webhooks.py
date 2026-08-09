import pytest
import time
import json
import hmac
import hashlib
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.tenant import Tenant, PlanType
from app.models.stripe_event import StripeEvent
from app.models.invoice import Invoice, InvoiceStatus
from app.models.billing_activity import BillingActivity
from app.core.config import settings

pytestmark = pytest.mark.asyncio

def generate_stripe_signature(payload: bytes, secret: str) -> str:
    timestamp = int(time.time())
    signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
    signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


async def test_stripe_webhook_checkout_completed(client: AsyncClient, test_db: AsyncSession):
    # Setup a tenant
    tenant = Tenant(name="Test Org Checkout", slug="test-checkout", plan=PlanType.starter)
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    # Prepare webhook payload
    payload = {
        "id": "evt_checkout_123",
        "object": "event",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "customer": "cus_999",
                "subscription": "sub_999",
                "metadata": {
                    "tenant_id": str(tenant.id),
                    "plan": "enterprise"
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")
    
    # Needs to match settings.STRIPE_WEBHOOK_SECRET which is probably empty in tests, 
    # but we can patch it or set it in the environment.
    import os
    from app.core.config import settings
    # Override secret just for this test
    original_secret = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test_secret"
    
    try:
        signature = generate_stripe_signature(payload_bytes, settings.STRIPE_WEBHOOK_SECRET)
        
        response = await client.post(
            "/api/v1/billing/webhook",
            content=payload_bytes,
            headers={"stripe-signature": signature}
        )
        
        assert response.status_code == 200, response.text
        assert response.json()["event"] == "checkout.session.completed"
        assert response.json()["status"] == "processed"
        
        # Verify database state
        await test_db.refresh(tenant)
        assert tenant.plan == "enterprise"
        assert tenant.stripe_customer_id == "cus_999"
        assert tenant.stripe_subscription_id == "sub_999"
        
        # Verify idempotency record
        stmt = select(StripeEvent).where(StripeEvent.stripe_event_id == "evt_checkout_123")
        event_record = await test_db.scalar(stmt)
        assert event_record is not None
        assert event_record.event_type == "checkout.session.completed"
        
    finally:
        settings.STRIPE_WEBHOOK_SECRET = original_secret


async def test_stripe_webhook_idempotency(client: AsyncClient, test_db: AsyncSession):
    # Setup a tenant
    tenant = Tenant(name="Test Org Idempotency", slug="test-idempotency")
    test_db.add(tenant)
    await test_db.commit()
    
    # Pre-insert a stripe event to simulate it was already processed
    existing_event = StripeEvent(
        stripe_event_id="evt_already_processed",
        event_type="checkout.session.completed",
        payload={"id": "evt_already_processed"}
    )
    test_db.add(existing_event)
    await test_db.commit()

    payload_bytes = json.dumps({"id": "evt_already_processed", "object": "event", "type": "checkout.session.completed"}).encode("utf-8")
    
    original_secret = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test_secret"
    
    try:
        signature = generate_stripe_signature(payload_bytes, settings.STRIPE_WEBHOOK_SECRET)
        
        response = await client.post(
            "/api/v1/billing/webhook",
            content=payload_bytes,
            headers={"stripe-signature": signature}
        )
        
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "already_processed"
    finally:
        settings.STRIPE_WEBHOOK_SECRET = original_secret


async def test_stripe_webhook_invoice_lifecycle(client: AsyncClient, test_db: AsyncSession):
    # Setup tenant with an existing Stripe subscription
    tenant = Tenant(
        name="Test Org Invoice", 
        slug="test-invoice", 
        stripe_subscription_id="sub_invoice_777"
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)

    original_secret = settings.STRIPE_WEBHOOK_SECRET
    settings.STRIPE_WEBHOOK_SECRET = "whsec_test_secret"

    try:
        # Step 1: invoice.created (generates draft invoice)
        created_payload = {
            "id": "evt_inv_created",
            "object": "event",
            "type": "invoice.created",
            "data": {
                "object": {
                    "id": "in_777",
                    "subscription": "sub_invoice_777",
                    "total": 1500000, # $15,000 in cents
                    "currency": "usd",
                    "invoice_pdf": "https://stripe.com/pdf_created",
                    "billing_reason": "subscription_cycle"
                }
            }
        }
        created_bytes = json.dumps(created_payload).encode("utf-8")
        sig_created = generate_stripe_signature(created_bytes, settings.STRIPE_WEBHOOK_SECRET)
        
        resp_created = await client.post("/api/v1/billing/webhook", content=created_bytes, headers={"stripe-signature": sig_created})
        assert resp_created.status_code == 200
        
        # Verify invoice is in draft
        stmt = select(Invoice).where(Invoice.stripe_invoice_id == "in_777")
        invoice = await test_db.scalar(stmt)
        assert invoice is not None
        assert invoice.status == InvoiceStatus.draft
        assert invoice.amount == 15000.0
        
        # Step 2: invoice.paid
        paid_payload = {
            "id": "evt_inv_paid",
            "object": "event",
            "type": "invoice.paid",
            "data": {
                "object": {
                    "id": "in_777",
                    "subscription": "sub_invoice_777",
                    "total": 1500000,
                    "currency": "usd",
                    "invoice_pdf": "https://stripe.com/pdf_paid",
                    "billing_reason": "subscription_cycle"
                }
            }
        }
        paid_bytes = json.dumps(paid_payload).encode("utf-8")
        sig_paid = generate_stripe_signature(paid_bytes, settings.STRIPE_WEBHOOK_SECRET)
        
        resp_paid = await client.post("/api/v1/billing/webhook", content=paid_bytes, headers={"stripe-signature": sig_paid})
        assert resp_paid.status_code == 200
        
        # Verify invoice is now paid
        await test_db.refresh(invoice)
        assert invoice.status == InvoiceStatus.paid
        assert invoice.pdf_url == "https://stripe.com/pdf_paid"
        
        # Verify BillingActivity was recorded
        act_stmt = select(BillingActivity).where(BillingActivity.tenant_id == tenant.id)
        activity = await test_db.scalar(act_stmt)
        assert activity is not None
        assert activity.event_type == "invoice_paid"
        
    finally:
        settings.STRIPE_WEBHOOK_SECRET = original_secret
