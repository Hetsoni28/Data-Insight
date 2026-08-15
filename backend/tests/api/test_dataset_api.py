import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_analyst_can_list_datasets(client: AsyncClient, token_analyst: str, tenant_id: str):
    """Test that an analyst can view the tenant datasets."""
    response = await client.get(
        "/api/v1/tenant-datasets",
        headers={"Authorization": f"Bearer {token_analyst}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "data" in data

@pytest.mark.asyncio
async def test_viewer_cannot_upload_dataset(client: AsyncClient, token_viewer: str, workspace_id: str):
    """Test that a viewer role is blocked from uploading datasets."""
    payload = {
        "name": "Test Viewer Upload",
        "file_type": "csv",
        "file_url": "s3://fake/path",
        "file_size_bytes": 100,
        "original_filename": "test.csv",
        "workspace_id": workspace_id
    }
    response = await client.post(
        "/api/v1/tenant-datasets/upload",
        json=payload,
        headers={"Authorization": f"Bearer {token_viewer}"}
    )
    assert response.status_code == 403
    assert "permission" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_idor_protection_across_tenants(client: AsyncClient, token_analyst_tenant_a: str, dataset_tenant_b_id: str):
    """Test that a user in Tenant A cannot access a dataset from Tenant B."""
    response = await client.get(
        f"/api/v1/tenant-datasets/{dataset_tenant_b_id}",
        headers={"Authorization": f"Bearer {token_analyst_tenant_a}"}
    )
    assert response.status_code in [403, 404]
