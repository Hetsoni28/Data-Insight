import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tenant import Tenant
import uuid

@pytest.mark.asyncio
async def test_data_connection_postgres_success(
    client: AsyncClient,
    owner_token: str,
):
    res = await client.post(
        '/api/v1/tenant-settings/data-connections/test',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={
            'provider': 'postgres',
            'host': 'db.example.com',
            'username': 'admin',
            'password': 'secretpassword'
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'success'

@pytest.mark.asyncio
async def test_data_connection_postgres_failure(
    client: AsyncClient,
    owner_token: str,
):
    res = await client.post(
        '/api/v1/tenant-settings/data-connections/test',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={
            'provider': 'postgres',
            'host': 'db.example.com'
        }
    )
    assert res.status_code == 400
    assert 'Postgres connection requires' in res.json()['detail']

@pytest.mark.asyncio
async def test_verify_domain_success(
    client: AsyncClient,
    owner_token: str,
    db: AsyncSession,
):
    res = await client.post(
        '/api/v1/tenant-settings/advanced/verify-domain',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={'domain': 'analytics.success.com'}
    )
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'verified'
    assert data['domain'] == 'analytics.success.com'

@pytest.mark.asyncio
async def test_verify_domain_failure(
    client: AsyncClient,
    owner_token: str,
):
    res = await client.post(
        '/api/v1/tenant-settings/advanced/verify-domain',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={'domain': 'analytics.fail.com'}
    )
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'failed'

@pytest.mark.asyncio
async def test_connect_integration(
    client: AsyncClient,
    owner_token: str,
):
    res = await client.post(
        '/api/v1/tenant-settings/integrations/connect',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={
            'provider': 'slack',
            'api_key': 'xoxb-1234-5678-secret'
        }
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'success'

@pytest.mark.asyncio
async def test_test_notification(
    client: AsyncClient,
    owner_token: str,
):
    res = await client.post(
        '/api/v1/tenant-settings/notifications/test',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={'type': 'email'}
    )
    assert res.status_code == 200
    assert res.json()['status'] == 'success'
    assert 'Test email notification sent' in res.json()['message']
