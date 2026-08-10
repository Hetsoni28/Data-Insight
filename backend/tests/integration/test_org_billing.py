import pytest
import uuid
import json
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant, PlanType
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.billing_activity import BillingActivity
from app.main import app
from app.api.deps import get_current_active_tenant_user
from app.core.security import get_password_hash

pytestmark = pytest.mark.asyncio

async def create_test_tenant_and_user(test_db: AsyncSession, suffix: str):
    tenant = Tenant(id=uuid.uuid4(), name=f"Org {suffix}", slug=f"org-{suffix}", plan=PlanType.professional)
    test_db.add(tenant)
    await test_db.flush()
    
    user = User(
        id=uuid.uuid4(),
        email=f"admin_{suffix}@test.com",
        hashed_password=get_password_hash("password"),
        tenant_id=tenant.id,
        role="org_admin",
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(tenant)
    await test_db.refresh(user)
    return tenant, user

async def test_get_billing_summary(client: AsyncClient, test_db: AsyncSession):
    tenant, user = await create_test_tenant_and_user(test_db, "summary")
    
    app.dependency_overrides[get_current_active_tenant_user] = lambda: user
    
    res = await client.get("/api/v1/org/billing/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["plan"] == "professional"
    assert data["mrr"] == 12500.0
    assert data["currency"] == "USD"
    
    app.dependency_overrides.clear()

async def test_get_billing_usage(client: AsyncClient, test_db: AsyncSession):
    tenant, user = await create_test_tenant_and_user(test_db, "usage")
    
    app.dependency_overrides[get_current_active_tenant_user] = lambda: user
    
    res = await client.get("/api/v1/org/billing/usage")
    assert res.status_code == 200
    data = res.json()
    # Check that 6 meters exist
    assert "members" in data
    assert "storage" in data
    assert "aiTokens" in data
    assert "datasets" in data
    assert "reports" in data
    assert "dashboards" in data
    
    assert data["members"]["limit"] == 25 # professional limit
    
    app.dependency_overrides.clear()

async def test_get_billing_invoices_idor(client: AsyncClient, test_db: AsyncSession):
    tenant1, user1 = await create_test_tenant_and_user(test_db, "idor1")
    tenant2, user2 = await create_test_tenant_and_user(test_db, "idor2")
    
    # Create invoice for tenant 1
    inv1 = Invoice(id=uuid.uuid4(), tenant_id=tenant1.id, stripe_invoice_id="in_111", amount=999, currency="usd", status=InvoiceStatus.paid, pdf_url="https://stripe.com/receipt1")
    # Create invoice for tenant 2
    inv2 = Invoice(id=uuid.uuid4(), tenant_id=tenant2.id, stripe_invoice_id="in_222", amount=15000, currency="usd", status=InvoiceStatus.paid, pdf_url="https://stripe.com/receipt2")
    
    test_db.add(inv1)
    test_db.add(inv2)
    await test_db.commit()
    
    app.dependency_overrides[get_current_active_tenant_user] = lambda: user1
    
    res = await client.get("/api/v1/org/billing/invoices")
    assert res.status_code == 200
    data = res.json()
    
    assert data["total"] == 1
    assert data["items"][0]["stripeInvoiceId"] == "in_111"
    
    # Try to access tenant 2's invoice directly
    res_direct = await client.get(f"/api/v1/org/billing/invoices/{inv2.id}")
    assert res_direct.status_code == 404
    
    app.dependency_overrides.clear()
