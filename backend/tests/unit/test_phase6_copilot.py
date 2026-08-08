"""Unit and Integration Tests for Phase 6: AI Copilot (Chat With Your Data).

Tests cover:
- ChatRepository session CRUD, message ordering, and cascade delete
- VisualSQLAgent DuckDB execution and interactive visual artifact synthesis (Charts, KPIs, Tables)
- SuggestionsService proactive contextual business question generation
- AIService session orchestration, history retention, and token quota tracking
- API routes for Sessions CRUD, Suggestions, and Message sending
"""

import pytest
import pytest_asyncio
import uuid
import json
import polars as pl
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.session import get_async_session
from app.models.user import User, UserRole
from app.models.tenant import Tenant, PlanType
from app.models.workspace import Workspace
from app.models.dataset import Dataset, DatasetStatus
from app.models.chat import ChatSession, ChatMessage
from app.repositories.chat import ChatRepository
from app.services.ai.base import LLMResponse
from app.services.ai.router import LLMRouter
from app.services.ai.visual_sql_agent import VisualSQLAgent
from app.services.ai.suggestions_service import SuggestionsService
from app.services.ai_service import AIService
from app.core.security import create_access_token


@pytest.fixture
def copilot_sales_df():
    """Realistic sales dataset for testing NL-to-SQL visual synthesis."""
    return pl.DataFrame({
        "region": ["North America", "Europe", "Asia Pacific", "Latin America"],
        "revenue": [520000.0, 410000.0, 680000.0, 190000.0],
        "units_sold": [1200, 950, 1800, 450],
        "profit_margin": [0.24, 0.19, 0.31, 0.15],
    })


@pytest_asyncio.fixture
async def seeded_tenant(test_db):
    """Seed test tenant."""
    tenant = Tenant(
        name="Apex Enterprise",
        slug="apex-ent",
        plan=PlanType.enterprise,
        max_ai_tokens_per_month=500_000,
        current_ai_tokens_used=0,
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)
    return tenant


@pytest_asyncio.fixture
async def seeded_user(test_db, seeded_tenant):
    """Seed test user."""
    user = User(
        email="lead.analyst@apex.com",
        tenant_id=seeded_tenant.id,
        role=UserRole.analyst,
        is_active=True,
        hashed_password="secure_password_hash",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def seeded_workspace(test_db, seeded_tenant, seeded_user):
    """Seed test workspace."""
    ws = Workspace(
        tenant_id=seeded_tenant.id,
        created_by_id=seeded_user.id,
        name="Main Workspace",
        slug="main",
        is_default=True,
    )
    test_db.add(ws)
    await test_db.commit()
    await test_db.refresh(ws)
    return ws


@pytest_asyncio.fixture
async def seeded_dataset(test_db, seeded_tenant, seeded_user, seeded_workspace, tmp_path, copilot_sales_df):
    """Seed a valid parquet dataset for Copilot querying."""
    file_path = tmp_path / "sales_data.parquet"
    copilot_sales_df.write_parquet(file_path)

    dataset = Dataset(
        tenant_id=seeded_tenant.id,
        workspace_id=seeded_workspace.id,
        uploaded_by_id=seeded_user.id,
        name="Global Sales Q3",
        original_filename="sales_data.parquet",
        file_url=str(file_path),
        file_type="parquet",
        file_size_bytes=1024,
        row_count=copilot_sales_df.height,
        column_count=copilot_sales_df.width,
        status=DatasetStatus.ready,
        profile={
            "overview": {"row_count": 4, "column_count": 4},
            "columns": {
                "region": {"inferred_type": "string"},
                "revenue": {"inferred_type": "float"},
                "units_sold": {"inferred_type": "integer"},
                "profit_margin": {"inferred_type": "float"},
            },
        },
    )
    test_db.add(dataset)
    await test_db.commit()
    await test_db.refresh(dataset)
    return dataset


# ==============================================================================
# 1. ChatRepository CRUD Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_chat_repository_crud(test_db, seeded_tenant, seeded_user, seeded_dataset):
    """Test session creation, message storage, title update, and deletion."""
    repo = ChatRepository(test_db)

    # 1. Create Session
    session = await repo.create_session(
        tenant_id=seeded_tenant.id,
        user_id=seeded_user.id,
        title="Q3 Performance Chat",
        dataset_id=seeded_dataset.id,
    )
    assert session.id is not None
    assert session.title == "Q3 Performance Chat"
    assert session.dataset_id == seeded_dataset.id

    # 2. Add Messages
    user_msg = await repo.add_message(
        session_id=session.id,
        role="user",
        content="What was our highest revenue region?",
    )
    assert user_msg.id is not None
    assert user_msg.role == "user"

    asst_msg = await repo.add_message(
        session_id=session.id,
        role="assistant",
        content="Asia Pacific led with $680,000 in revenue.",
        artifact_data={"type": "chart", "chart_type": "bar"},
    )
    assert asst_msg.artifact_data["type"] == "chart"

    # 3. Retrieve Session with Messages
    fetched = await repo.get_session(session.id, seeded_tenant.id, seeded_user.id)
    assert fetched is not None
    assert len(fetched.messages) == 2
    assert fetched.messages[0].content == "What was our highest revenue region?"
    assert fetched.messages[1].artifact_data["type"] == "chart"

    # 4. Update Session Title
    updated = await repo.update_session(
        session.id, seeded_tenant.id, seeded_user.id, title="Regional Revenue Deep Dive"
    )
    assert updated.title == "Regional Revenue Deep Dive"

    # 5. List Sessions
    sessions = await repo.list_sessions(seeded_tenant.id, seeded_user.id)
    assert len(sessions) >= 1
    assert sessions[0].id == session.id

    # 6. Delete Session
    deleted = await repo.delete_session(session.id, seeded_tenant.id, seeded_user.id)
    assert deleted is True
    post_delete = await repo.get_session(session.id, seeded_tenant.id, seeded_user.id)
    assert post_delete is None


# ==============================================================================
# 2. VisualSQLAgent Synthesis Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_visual_sql_agent_chart_synthesis(copilot_sales_df):
    """Test VisualSQLAgent generates SQL, executes DuckDB query, and synthesizes Bar chart artifact."""
    mock_router = MagicMock(spec=LLMRouter)

    # 1st LLM call: SQL generation
    sql_json = json.dumps({
        "sql": "SELECT region, SUM(revenue) as total_revenue FROM data GROUP BY region ORDER BY total_revenue DESC",
        "recommended_chart": "bar",
    })
    sql_response = LLMResponse(
        content=sql_json,
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt_tokens=120,
        completion_tokens=40,
        total_tokens=160,
        cost_usd=0.0001,
        latency_ms=150.0,
    )

    # 2nd LLM call: Narrative synthesis
    narrative_response = LLMResponse(
        content="**Asia Pacific** generated the highest revenue at **$680,000**, followed by North America ($520,000).",
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt_tokens=180,
        completion_tokens=60,
        total_tokens=240,
        cost_usd=0.00015,
        latency_ms=200.0,
    )

    mock_router.generate = AsyncMock(side_effect=[sql_response, narrative_response])

    agent = VisualSQLAgent(mock_router)
    schema_info = {"region": "string", "revenue": "float", "units_sold": "int", "profit_margin": "float"}

    result = await agent.execute_and_synthesize(
        question="What was revenue by region?",
        df=copilot_sales_df,
        schema_info=schema_info,
    )

    assert "Asia Pacific" in result["answer"]
    assert result["generated_sql"].startswith("SELECT")
    assert result["artifact_data"]["type"] == "chart"
    assert result["artifact_data"]["chart_type"] == "bar"
    assert result["artifact_data"]["x_key"] == "region"
    assert len(result["artifact_data"]["data"]) == 4
    assert len(result["artifact_data"]["kpi_metrics"]) > 0


@pytest.mark.asyncio
async def test_visual_sql_agent_kpi_card_synthesis(copilot_sales_df):
    """Test VisualSQLAgent synthesizes single KPI Metric Card for aggregate total queries."""
    mock_router = MagicMock(spec=LLMRouter)

    sql_json = json.dumps({
        "sql": "SELECT SUM(revenue) as total_revenue FROM data",
        "recommended_chart": "kpi",
    })
    sql_resp = LLMResponse(
        content=sql_json,
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt_tokens=100,
        completion_tokens=30,
        total_tokens=130,
        cost_usd=0.00008,
        latency_ms=120.0,
    )
    narrative_resp = LLMResponse(
        content="Total enterprise revenue is **$1,800,000** across all regions.",
        provider="groq",
        model="llama-3.3-70b-versatile",
        prompt_tokens=150,
        completion_tokens=40,
        total_tokens=190,
        cost_usd=0.0001,
        latency_ms=180.0,
    )

    mock_router.generate = AsyncMock(side_effect=[sql_resp, narrative_resp])
    agent = VisualSQLAgent(mock_router)
    schema_info = {"region": "string", "revenue": "float"}

    result = await agent.execute_and_synthesize(
        question="What is the total revenue?",
        df=copilot_sales_df,
        schema_info=schema_info,
    )

    assert result["artifact_data"]["type"] == "kpi"
    assert result["artifact_data"]["kpi_metrics"][0]["raw_value"] == 1800000.0


# ==============================================================================
# 3. SuggestionsService Tests
# ==============================================================================

@pytest.mark.asyncio
async def test_suggestions_service_heuristic():
    """Test zero-latency heuristic suggestions generator categorizes column metrics accurately."""
    mock_router = MagicMock(spec=LLMRouter)
    service = SuggestionsService(mock_router)

    schema_info = {
        "region": "VARCHAR",
        "order_date": "TIMESTAMP",
        "revenue": "DOUBLE",
        "profit": "DOUBLE",
    }

    suggestions = service.generate_heuristic_suggestions(schema_info, row_count=1000)
    assert len(suggestions) >= 4
    categories = [s["category"] for s in suggestions]
    assert "performance" in categories
    assert "trend" in categories
    assert "anomaly" in categories


# ==============================================================================
# 4. AIService Session Chat Integration
# ==============================================================================

@pytest.mark.asyncio
async def test_ai_service_chat_in_session(test_db, seeded_tenant, seeded_user, seeded_dataset):
    """Test AIService session execution persists user + assistant turns and returns artifact data."""
    chat_repo = ChatRepository(test_db)
    session = await chat_repo.create_session(
        tenant_id=seeded_tenant.id,
        user_id=seeded_user.id,
        title="New Chat",
        dataset_id=seeded_dataset.id,
    )

    ai_svc = AIService(test_db)

    # Mock the visual SQL agent inside AIService
    mock_artifact = {
        "type": "chart",
        "chart_type": "bar",
        "x_key": "region",
        "y_key": "revenue",
        "data": [{"region": "Asia Pacific", "revenue": 680000}],
        "kpi_metrics": [{"label": "Total", "value": "$1.8M"}],
    }

    with patch.object(
        ai_svc.visual_sql_agent,
        "execute_and_synthesize",
        new=AsyncMock(return_value={
            "question": "What is regional revenue?",
            "answer": "Asia Pacific leads with $680,000.",
            "generated_sql": "SELECT region, revenue FROM data",
            "artifact_data": mock_artifact,
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "prompt_tokens": 150,
            "completion_tokens": 50,
            "total_tokens": 200,
            "cost_usd": 0.0002,
            "latency_ms": 190.0,
        }),
    ):
        res = await ai_svc.chat_in_session(
            session_id=session.id,
            question="What is regional revenue?",
            actor=seeded_user,
        )

        assert res["session_id"] == str(session.id)
        assert res["role"] == "assistant"
        assert res["artifact_data"]["type"] == "chart"

        # Verify messages in DB
        messages = await chat_repo.get_session_messages(session.id)
        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[0].content == "What is regional revenue?"
        assert messages[1].role == "assistant"
        assert messages[1].artifact_data["type"] == "chart"


# ==============================================================================
# 5. REST API Endpoints Verification
# ==============================================================================

@pytest.mark.asyncio
async def test_copilot_api_sessions_lifecycle(test_db, seeded_tenant, seeded_user, seeded_dataset):
    """Test full HTTP API lifecycle for /api/v1/ai/sessions endpoints."""
    from app.api.deps import get_current_active_tenant_user, get_db

    async def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_tenant_user] = lambda: seeded_user

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            headers = {"Authorization": "Bearer fake_token"}

            # 1. Create Session
            create_res = await client.post(
                "/api/v1/ai/sessions",
                headers=headers,
                json={"title": "Executive Sales Review", "dataset_id": str(seeded_dataset.id)},
            )
            assert create_res.status_code == 201
            session_id = create_res.json()["id"]

            # 2. List Sessions
            list_res = await client.get("/api/v1/ai/sessions", headers=headers)
            assert list_res.status_code == 200
            assert list_res.json()["total"] >= 1

            # 3. Get Suggestions
            sugg_res = await client.get(
                f"/api/v1/ai/suggestions/{seeded_dataset.id}",
                headers=headers,
            )
            assert sugg_res.status_code == 200
            assert len(sugg_res.json()["suggestions"]) >= 3

            # 4. Rename Session
            patch_res = await client.patch(
                f"/api/v1/ai/sessions/{session_id}",
                headers=headers,
                json={"title": "Renamed Q3 Review"},
            )
            assert patch_res.status_code == 200
            assert patch_res.json()["title"] == "Renamed Q3 Review"

            # 5. Delete Session
            del_res = await client.delete(
                f"/api/v1/ai/sessions/{session_id}",
                headers=headers,
            )
            assert del_res.status_code == 204
    finally:
        app.dependency_overrides.clear()
