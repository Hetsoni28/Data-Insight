import pytest
import uuid
from httpx import AsyncClient
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.models.dataset import Dataset
from app.models.user import User
from app.models.tenant_role import TenantRole
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import patch

@pytest.mark.asyncio
async def test_generate_excel_report_task_dispatch(client: AsyncClient, test_db: AsyncSession):
    # Setup mock user, tenant, workspace, dataset
    tenant = Tenant(id=uuid.uuid4(), name="Test Tenant", slug="test-tenant")
    test_db.add(tenant)
    
    workspace = Workspace(id=uuid.uuid4(), tenant_id=tenant.id, name="Test Workspace", slug="test-ws")
    test_db.add(workspace)
    
    dataset = Dataset(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        workspace_id=workspace.id,
        name="Test Dataset",
        file_type="csv",
        file_url="http://test.com/test.csv",
        original_filename="test.csv"
    )
    test_db.add(dataset)
    
    user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="test@example.com", hashed_password="test", is_active=True)
    test_db.add(user)
    
    role = TenantRole(id=uuid.uuid4(), tenant_id=tenant.id, name="org_admin")
    test_db.add(role)
    
    await test_db.commit()

    # We mock the get_current_active_tenant_user dependency
    from app.api.deps import get_current_active_tenant_user
    from app.main import app
    
    app.dependency_overrides[get_current_active_tenant_user] = lambda: user
    
    # Mock the celery task
    with patch("app.api.v1.tenant_reports.generate_excel_report_task.delay") as mock_delay:
        response = await client.post(
            "/api/v1/tenant-reports/generate",
            json={
                "dataset_id": str(dataset.id),
                "title": "My Excel Report",
                "report_type": "excel",
                "report_category": "excel"
            },
            headers={"x-workspace-id": str(workspace.id)}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        
        # Verify the celery task was called with the report ID
        assert mock_delay.called
        assert len(mock_delay.call_args[0]) == 1 # called with report_id
