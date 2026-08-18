import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.main import app
from app.api.deps import get_current_active_tenant_user
from app.models.tenant import Tenant, PlanType
from app.models.user import User, UserRole

pytestmark = pytest.mark.asyncio

async def test_dataset_upload_quota_exceeded(client: AsyncClient, test_db: AsyncSession):
    # Starter tier allows 10 datasets.
    tenant_id = uuid.uuid4()
    test_tenant = Tenant(id=tenant_id, name="Quota Org", slug="quota-org", plan=PlanType.starter)
    test_db.add(test_tenant)
    await test_db.commit()
    
    # Insert 10 datasets to reach the starter limit
    from app.models.dataset import Dataset, DatasetStatus
    from app.models.workspace import Workspace
    
    workspace_id = uuid.uuid4()
    w = Workspace(id=workspace_id, tenant_id=tenant_id, name="Test WS", slug="test-ws")
    test_db.add(w)
    
    for i in range(10):
        d = Dataset(id=uuid.uuid4(), tenant_id=tenant_id, workspace_id=workspace_id, name=f"Existing {i}", status=DatasetStatus.ready, file_type="csv", file_url="s3://fake", file_size_bytes=100, original_filename="test.csv")
        test_db.add(d)
    await test_db.commit()
    
    mock_user = User(id=uuid.uuid4(), email="user@quota.com", role=UserRole.org_admin, tenant_id=tenant_id)
    app.dependency_overrides[get_current_active_tenant_user] = lambda: mock_user
    
    # Attempt to upload 11th
    payload = {
        "name": "New Dataset",
        "file_type": "csv",
        "file_url": "s3://fake",
        "file_size_bytes": 100,
        "original_filename": "test.csv",
        "workspace_id": str(workspace_id)
    }
    
    response = await client.post("/api/v1/tenant-datasets/upload", json=payload)
    assert response.status_code == 402
    assert "Dataset quota exceeded" in response.json()["detail"]
    
    app.dependency_overrides.clear()

async def test_ai_excel_feature_gated(client: AsyncClient, test_db: AsyncSession):
    # Starter plan does not have AI Excel.
    tenant_id = uuid.uuid4()
    test_tenant = Tenant(id=tenant_id, name="Starter Org", slug="starter-org2", plan=PlanType.starter)
    test_db.add(test_tenant)
    await test_db.commit()
    
    mock_user = User(id=uuid.uuid4(), email="admin@free.com", role=UserRole.org_admin, tenant_id=tenant_id)
    app.dependency_overrides[get_current_active_tenant_user] = lambda: mock_user
    
    response = await client.post(f"/api/v1/tenant-datasets/{uuid.uuid4()}/ai-excel")
    assert response.status_code == 403
    assert "AI Excel generation is not included" in response.json()["detail"]
    
    app.dependency_overrides.clear()
