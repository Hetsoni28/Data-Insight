import pytest
import json
from unittest.mock import patch, MagicMock

from app.services.billing import handle_webhook
from app.models.stripe_event import StripeEvent
from app.models.tenant import PlanType

# Using pytest-asyncio to test async functions
pytestmark = pytest.mark.asyncio

@patch("stripe.Webhook.construct_event")
@patch("app.core.config.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
async def test_handle_webhook_idempotency(mock_construct_event):
    # Mock the DB session
    mock_db = MagicMock()
    
    # Simulate DB returning an existing event (meaning we already processed it)
    mock_existing_event = StripeEvent(stripe_event_id="evt_test_123")
    
    # Create an async mock for scalar
    async def mock_scalar(*args, **kwargs):
        return mock_existing_event
        
    mock_db.scalar = mock_scalar
    
    # Mock the Stripe event construction
    mock_construct_event.return_value = {
        "id": "evt_test_123",
        "type": "checkout.session.completed",
        "data": {"object": {}}
    }
    
    # Run the webhook handler
    result = await handle_webhook(b'{}', "t=test_signature", mock_db)
    
    # Ensure it was skipped due to idempotency
    assert result["status"] == "already_processed"
    
    # Ensure no database commits happened
    mock_db.commit.assert_not_called()

@patch("stripe.Webhook.construct_event")
@patch("app.core.config.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
async def test_handle_webhook_checkout_completed(mock_construct_event):
    mock_db = MagicMock()
    
    # Simulate no existing event (so it processes)
    async def mock_scalar(*args, **kwargs):
        return None
        
    mock_db.scalar = mock_scalar
    
    # We also need to mock the async commit
    async def mock_commit():
        pass
    mock_db.commit = mock_commit
    
    # Mock the Tenant Repo to return a fake tenant
    mock_tenant = MagicMock()
    mock_tenant.plan = PlanType.starter
    
    async def mock_get_by_id(*args, **kwargs):
        return mock_tenant
        
    async def mock_save(*args, **kwargs):
        pass
        
    # We patch the TenantRepository class inside handle_webhook
    with patch("app.repositories.tenant.TenantRepository") as MockRepo:
        repo_instance = MockRepo.return_value
        repo_instance.get_by_id = mock_get_by_id
        repo_instance.save = mock_save
        
        # Mock Stripe event
        mock_construct_event.return_value = {
            "id": "evt_test_456",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "customer": "cus_123",
                    "subscription": "sub_456",
                    "metadata": {
                        "tenant_id": "uuid-here",
                        "plan": "enterprise"
                    }
                }
            }
        }
        
        result = await handle_webhook(b'{"id": "evt_test_456"}', "t=test_signature", mock_db)
        
        assert result["status"] == "processed"
        assert result["event"] == "checkout.session.completed"
        
        # Ensure the tenant was updated correctly
        assert mock_tenant.plan == PlanType.enterprise
        assert mock_tenant.stripe_customer_id == "cus_123"
        assert mock_tenant.stripe_subscription_id == "sub_456"
        
        # Ensure the new StripeEvent was added to DB
        mock_db.add.assert_called_once()

@patch("stripe.Webhook.construct_event")
@patch("app.core.config.settings.STRIPE_WEBHOOK_SECRET", "whsec_test")
async def test_handle_webhook_invoice_paid(mock_construct_event):
    mock_db = MagicMock()
    
    async def mock_scalar(stmt, *args, **kwargs):
        # We need to simulate idempotency returning None, then Tenant returning mock_tenant, then Invoice returning None
        stmt_str = str(stmt)
        if "stripe_events" in stmt_str:
            return None
        if "tenants" in stmt_str:
            mock_tenant = MagicMock()
            mock_tenant.id = "tenant_123"
            mock_tenant.name = "Test Org"
            return mock_tenant
        if "invoices" in stmt_str:
            return None
        return None
        
    mock_db.scalar = mock_scalar
    
    async def mock_commit():
        pass
    mock_db.commit = mock_commit
    
    # Mock Stripe event for invoice.paid
    mock_construct_event.return_value = {
        "id": "evt_test_789",
        "type": "invoice.paid",
        "data": {
            "object": {
                "id": "in_123",
                "customer": "cus_123",
                "subscription": "sub_456",
                "total": 1500000, # $15,000
                "currency": "usd",
                "invoice_pdf": "https://stripe.com/pdf",
                "period_start": 1672531200,
                "period_end": 1675209600,
                "billing_reason": "subscription_cycle"
            }
        }
    }
    
    result = await handle_webhook(b'{"id": "evt_test_789"}', "t=test_signature", mock_db)
    
    assert result["status"] == "processed"
    assert result["event"] == "invoice.paid"
    
    # Check that BillingActivity, and StripeEvent were added to DB
    # Add is called for:
    # 1. BillingActivity (invoice_paid)
    # 2. StripeEvent
    assert mock_db.add.call_count == 2
