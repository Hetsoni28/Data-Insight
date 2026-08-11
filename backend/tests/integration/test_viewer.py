import pytest
import uuid
from httpx import AsyncClient
from jose import jwt
from datetime import datetime, timezone

from app.core.config import settings
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.models.report import Report, ReportStatus, ReportType
from app.models.dataset import Dataset, DatasetStatus

def create_auth_headers(user_id: str) -> dict:
    token = jwt.encode({"sub": user_id, "role": "viewer"}, settings.SECRET_KEY, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_viewer_dashboard_overview_success(client: AsyncClient, test_db):
    # 1. Create a tenant
    tenant = Tenant(name="Test Tenant", slug="test-tenant")
    test_db.add(tenant)
    await test_db.flush()

    # 2. Create a viewer user
    user = User(
        email="viewer@test.com",
        full_name="Test Viewer",
        hashed_password="...",
        role=UserRole.viewer,
        tenant_id=tenant.id,
        is_active=True
    )
    test_db.add(user)
    await test_db.flush()

    # 3. Create a workspace
    workspace = Workspace(
        tenant_id=tenant.id,
        created_by_id=user.id,
        name="Engineering Workspace",
        slug="eng-ws"
    )
    test_db.add(workspace)
    await test_db.commit()

    # Get dashboard overview
    headers = create_auth_headers(str(user.id))
    response = await client.get(
        f"/api/v1/viewer/dashboard?workspace_id={workspace.id}",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert "welcome" in data
    assert "kpis" in data
    assert data["welcome"]["role"] == "Viewer"
    assert data["welcome"]["workspace_name"] == "Engineering Workspace"


@pytest.mark.asyncio
async def test_viewer_reports_list(client: AsyncClient, test_db):
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
    await test_db.flush()

    workspace = Workspace(
        tenant_id=tenant.id,
        created_by_id=user.id,
        name="Engineering Workspace",
        slug="eng-ws"
    )
    test_db.add(workspace)
    await test_db.flush()

    # Seed a dataset first
    dataset = Dataset(
        workspace_id=workspace.id,
        tenant_id=tenant.id,
        name="Engineering Metrics",
        status=DatasetStatus.ready,
        uploaded_by_id=user.id,
        file_type="csv",
        file_url="http://test/file.csv",
        original_filename="file.csv"
    )
    test_db.add(dataset)
    await test_db.flush()

    # Seed a report
    report = Report(
        tenant_id=tenant.id,
        workspace_id=workspace.id,
        dataset_id=dataset.id,
        created_by_id=user.id,
        title="Weekly Status",
        report_type=ReportType.pdf,
        status=ReportStatus.ready
    )
    test_db.add(report)
    await test_db.commit()

    headers = create_auth_headers(str(user.id))
    response = await client.get(
        f"/api/v1/viewer/reports?workspace_id={workspace.id}",
        headers=headers
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Weekly Status"


@pytest.mark.asyncio
async def test_viewer_bookmarks_toggle(client: AsyncClient, test_db):
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
    await test_db.flush()

    workspace = Workspace(
        tenant_id=tenant.id,
        created_by_id=user.id,
        name="Engineering Workspace",
        slug="eng-ws"
    )
    test_db.add(workspace)
    await test_db.flush()

    # Seed a dataset first
    dataset = Dataset(
        workspace_id=workspace.id,
        tenant_id=tenant.id,
        name="Engineering Metrics",
        status=DatasetStatus.ready,
        uploaded_by_id=user.id,
        file_type="csv",
        file_url="http://test/file.csv",
        original_filename="file.csv"
    )
    test_db.add(dataset)
    await test_db.flush()

    # Seed a report
    report = Report(
        tenant_id=tenant.id,
        workspace_id=workspace.id,
        dataset_id=dataset.id,
        created_by_id=user.id,
        title="Interactive Dashboard Report",
        report_type=ReportType.excel,
        status=ReportStatus.ready
    )
    test_db.add(report)
    await test_db.commit()

    headers = create_auth_headers(str(user.id))
    # Toggle bookmark on
    response = await client.post(
        "/api/v1/viewer/bookmarks/toggle",
        json={"report_id": str(report.id)},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_bookmarked"] is True

    # List bookmarks
    response = await client.get("/api/v1/viewer/bookmarks", headers=headers)
    assert response.status_code == 200
    bookmarks = response.json()
    assert str(report.id) in bookmarks


@pytest.mark.asyncio
async def test_viewer_ai_chat_general(client: AsyncClient, test_db):
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
    await test_db.flush()

    workspace = Workspace(
        tenant_id=tenant.id,
        created_by_id=user.id,
        name="Engineering Workspace",
        slug="eng-ws"
    )
    test_db.add(workspace)
    await test_db.flush()

    # Seed a dataset so context logic resolves
    dataset = Dataset(
        workspace_id=workspace.id,
        tenant_id=tenant.id,
        name="Engineering Metrics",
        status=DatasetStatus.ready,
        uploaded_by_id=user.id,
        file_type="csv",
        file_url="http://test/file.csv",
        original_filename="file.csv"
    )
    test_db.add(dataset)
    await test_db.commit()

    headers = create_auth_headers(str(user.id))
    response = await client.post(
        "/api/v1/viewer/ai/chat",
        json={"question": "Tell me a joke about data analysis."},
        headers=headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "model" in data


@pytest.mark.asyncio
async def test_viewer_non_viewer_access_forbidden(client: AsyncClient, test_db):
    tenant = Tenant(name="Test Tenant", slug="test-tenant")
    test_db.add(tenant)
    await test_db.flush()

    user = User(
        email="admin@test.com",
        full_name="Test Admin",
        hashed_password="...",
        role=UserRole.org_admin,
        tenant_id=tenant.id,
        is_active=True
    )
    test_db.add(user)
    await test_db.commit()

    # Sign token with 'org_admin' role, which is not allowed on /viewer/dashboard
    token = jwt.encode({"sub": str(user.id), "role": "org_admin"}, settings.SECRET_KEY, algorithm="HS256")
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.get(
        f"/api/v1/viewer/dashboard?workspace_id={uuid.uuid4()}",
        headers=headers
    )
    # The endpoint has explicit check: user.role == UserRole.viewer
    assert response.status_code == 403
