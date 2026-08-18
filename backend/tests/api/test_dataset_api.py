import pytest
import uuid
from httpx import AsyncClient
from jose import jwt

from app.core.config import settings
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.models.workspace import Workspace
from app.models.dataset import Dataset, DatasetStatus

def create_auth_headers(user_id: str, role: str = "analyst") -> dict:
    token = jwt.encode({"sub": str(user_id), "role": role}, settings.SECRET_KEY, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_analyst_can_list_datasets(client: AsyncClient, test_db):
    tenant = Tenant(name="Test Tenant", slug="test-tenant")
    test_db.add(tenant)
    await test_db.flush()

    user = User(
        email="analyst@test.com",
        full_name="Test Analyst",
        hashed_password="...",
        role=UserRole.analyst,
        tenant_id=tenant.id,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    headers = create_auth_headers(str(user.id), "analyst")
    response = await client.get(
        "/api/v1/tenant-datasets/",
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or "data" in data or isinstance(data, list) or "total" in data

@pytest.mark.asyncio
async def test_viewer_cannot_upload_dataset(client: AsyncClient, test_db):
    tenant = Tenant(name="Test Tenant", slug="test-tenant")
    test_db.add(tenant)
    await test_db.flush()

    user = User(
        email="viewer@test.com",
        full_name="Test Viewer",
        hashed_password="...",
        role=UserRole.viewer,
        tenant_id=tenant.id,
        is_active=True
    )
    test_db.add(user)
    
    workspace = Workspace(
        tenant_id=tenant.id,
        created_by_id=user.id,
        name="Engineering Workspace",
        slug="eng-ws"
    )
    test_db.add(workspace)
    await test_db.commit()

    payload = {
        "name": "Test Viewer Upload",
        "file_type": "csv",
        "file_url": "s3://fake/path",
        "file_size_bytes": 100,
        "original_filename": "test.csv",
        "workspace_id": str(workspace.id)
    }
    
    headers = create_auth_headers(str(user.id), "viewer")
    response = await client.post(
        "/api/v1/tenant-datasets/upload",
        json=payload,
        headers=headers
    )
    assert response.status_code == 403
    assert "permission" in response.json().get("message", response.json().get("detail", "")).lower()

@pytest.mark.asyncio
async def test_idor_protection_across_tenants(client: AsyncClient, test_db):
    tenant_a = Tenant(name="Tenant A", slug="tenant-a")
    tenant_b = Tenant(name="Tenant B", slug="tenant-b")
    test_db.add_all([tenant_a, tenant_b])
    await test_db.flush()

    user_a = User(
        email="analyst@tenanta.com",
        full_name="Test Analyst A",
        hashed_password="...",
        role=UserRole.analyst,
        tenant_id=tenant_a.id,
        is_active=True
    )
    user_b = User(
        email="analyst@tenantb.com",
        full_name="Test Analyst B",
        hashed_password="...",
        role=UserRole.analyst,
        tenant_id=tenant_b.id,
        is_active=True
    )
    test_db.add_all([user_a, user_b])
    await test_db.flush()

    workspace_b = Workspace(
        tenant_id=tenant_b.id,
        created_by_id=user_b.id,
        name="Workspace B",
        slug="ws-b"
    )
    test_db.add(workspace_b)
    await test_db.flush()

    dataset_b = Dataset(
        workspace_id=workspace_b.id,
        tenant_id=tenant_b.id,
        name="Dataset B",
        status=DatasetStatus.ready,
        uploaded_by_id=user_b.id,
        file_type="csv",
        file_url="http://test/file.csv",
        original_filename="file.csv"
    )
    test_db.add(dataset_b)
    await test_db.commit()

    headers_a = create_auth_headers(str(user_a.id), "analyst")
    response = await client.get(
        f"/api/v1/tenant-datasets/{dataset_b.id}",
        headers=headers_a
    )
    assert response.status_code in [403, 404]
