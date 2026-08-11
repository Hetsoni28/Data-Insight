import pytest
import uuid
from httpx import AsyncClient
from app.models.tenant import Tenant
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from app.main import app
from app.api.deps import get_current_user

@pytest.fixture
async def auth_client(client: AsyncClient, test_db: AsyncSession):
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant", industry="Retail", timezone="UTC", currency="USD")
    test_db.add(tenant)
    user = User(id=uuid.uuid4(), email="admin@test.com", hashed_password="test", tenant_id=tenant.id, role="organization-admin", is_active=True)
    test_db.add(user)
    await test_db.commit()

    app.dependency_overrides[get_current_user] = lambda: user
    yield client
    app.dependency_overrides.clear()

@pytest.mark.asyncio
async def test_data_connection_postgres_success(auth_client: AsyncClient):
    res = await auth_client.post(
        '/api/v1/tenant-settings/data-connections/test',
        json={
            'provider': 'postgres',
            'host': 'db.example.com',
            'username': 'admin',
            'password': 'secretpassword'
        }
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'success'

@pytest.mark.asyncio
async def test_data_connection_postgres_failure(auth_client: AsyncClient):
    res = await auth_client.post(
        '/api/v1/tenant-settings/data-connections/test',
        json={
            'provider': 'postgres',
            'host': 'db.example.com'
        }
    )
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_verify_domain_success(auth_client: AsyncClient):
    res = await auth_client.post(
        '/api/v1/tenant-settings/advanced/verify-domain',
        json={'domain': 'analytics.success.com'}
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'verified'

@pytest.mark.asyncio
async def test_connect_integration(auth_client: AsyncClient):
    res = await auth_client.post(
        '/api/v1/tenant-settings/integrations/connect',
        json={
            'provider': 'slack',
            'api_key': 'xoxb-1234'
        }
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'success'

@pytest.mark.asyncio
async def test_test_notification(auth_client: AsyncClient):
    res = await auth_client.post(
        '/api/v1/tenant-settings/notifications/test',
        json={'type': 'email'}
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'success'
