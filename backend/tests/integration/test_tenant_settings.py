import pytest
import uuid
from httpx import AsyncClient
from app.models.tenant import Tenant
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.api.deps import get_current_active_tenant_user

@pytest.mark.asyncio
async def test_get_tenant_profile(client: AsyncClient, test_db: AsyncSession):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant", industry="Retail", timezone="UTC", currency="USD")
    test_db.add(tenant)
    user = User(id=uuid.uuid4(), email="admin@test.com", hashed_password="test", tenant_id=tenant.id, role="organization-admin", is_active=True)
    test_db.add(user)
    await test_db.commit()

    app.dependency_overrides[get_current_active_tenant_user] = lambda: user

    response = await client.get("/api/v1/tenant-settings/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Tenant"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_update_tenant_profile(client: AsyncClient, test_db: AsyncSession):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant2", industry="Retail", timezone="UTC", currency="USD")
    test_db.add(tenant)
    user = User(id=uuid.uuid4(), email="admin2@test.com", hashed_password="test", tenant_id=tenant.id, role="organization-admin", is_active=True)
    test_db.add(user)
    await test_db.commit()

    app.dependency_overrides[get_current_active_tenant_user] = lambda: user

    payload = {
        "name": "Updated Org Name",
        "industry": "Technology"
    }
    response = await client.patch("/api/v1/tenant-settings/profile", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Org Name"
    assert data["industry"] == "Technology"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_get_tenant_branding(client: AsyncClient, test_db: AsyncSession):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant3", logo_url="logo.png", white_label_config={"primary_color": "#000"}, timezone="UTC", currency="USD")
    test_db.add(tenant)
    user = User(id=uuid.uuid4(), email="admin3@test.com", hashed_password="test", tenant_id=tenant.id, role="organization-admin", is_active=True)
    test_db.add(user)
    await test_db.commit()

    app.dependency_overrides[get_current_active_tenant_user] = lambda: user

    response = await client.get("/api/v1/tenant-settings/branding")
    assert response.status_code == 200
    data = response.json()
    assert data["logo_url"] == "logo.png"
    
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_update_tenant_branding(client: AsyncClient, test_db: AsyncSession):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant4", timezone="UTC", currency="USD")
    test_db.add(tenant)
    user = User(id=uuid.uuid4(), email="admin4@test.com", hashed_password="test", tenant_id=tenant.id, role="organization-admin", is_active=True)
    test_db.add(user)
    await test_db.commit()

    app.dependency_overrides[get_current_active_tenant_user] = lambda: user

    payload = {
        "logo_url": "https://example.com/logo.png",
        "white_label_config": {"primary_color": "#10B981"}
    }
    response = await client.patch("/api/v1/tenant-settings/branding", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["logo_url"] == "https://example.com/logo.png"
    assert data["white_label_config"]["primary_color"] == "#10B981"
    
    app.dependency_overrides.clear()
