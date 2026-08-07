"""Unit and Integration Tests for Phase 4: Multi-Provider LLM Router, NL-to-SQL, & AI Pipeline."""

import pytest
import pytest_asyncio
import uuid
import polars as pl
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.db.session import get_async_session
from app.services.ai.base import LLMResponse
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.router import LLMRouter
from app.services.ai.nl_sql_agent import NLSQLAgent
from app.services.ai.narrative_generator import NarrativeGenerator
from app.services.ai_service import AIService
from app.models.user import User, UserRole
from app.models.tenant import Tenant, PlanType
from app.models.ai_token_usage import AITokenUsage
from app.core.security import create_access_token


@pytest.fixture
def sample_df():
    """A realistic multi-dimensional sales dataset for NL-to-SQL and profiling."""
    return pl.DataFrame({
        "region": ["North", "South", "East", "West", "North", "South", "East", "West"],
        "category": ["Electronics", "Electronics", "Furniture", "Furniture", "Clothing", "Clothing", "Electronics", "Furniture"],
        "sales": [1200.0, 1500.0, 800.0, 950.0, 450.0, 600.0, 2100.0, 1100.0],
        "quantity": [4, 5, 2, 3, 6, 8, 7, 4],
        "profit": [300.0, 450.0, 120.0, 190.0, 90.0, 150.0, 620.0, 240.0],
    })


@pytest.fixture
def sample_profile():
    """Sample Phase 3 dataset profile structure."""
    return {
        "overview": {
            "row_count": 8,
            "column_count": 5,
            "memory_size_mb": 0.01,
            "duplicate_rows": 0,
        },
        "quality_score": {
            "overall_score": 98.5,
            "grade": "A",
            "completeness_score": 100.0,
            "uniqueness_score": 100.0,
        },
        "columns": {
            "region": {"inferred_type": "string", "null_percentage": 0.0, "unique_count": 4, "statistics": {}},
            "category": {"inferred_type": "string", "null_percentage": 0.0, "unique_count": 3, "statistics": {}},
            "sales": {"inferred_type": "float", "null_percentage": 0.0, "unique_count": 8, "statistics": {"mean": 1087.5, "min": 450.0, "max": 2100.0}},
            "profit": {"inferred_type": "float", "null_percentage": 0.0, "unique_count": 8, "statistics": {"mean": 270.0, "min": 90.0, "max": 620.0}},
        },
        "correlations": {
            "significant_correlations": [
                {"col1": "sales", "col2": "profit", "correlation": 0.98, "strength": "very strong positive"}
            ]
        }
    }


@pytest_asyncio.fixture
async def test_tenant(test_db):
    """Seed test tenant in the in-memory SQLite DB."""
    tenant = Tenant(
        name="AI Analytics Corp",
        slug="ai-corp",
        plan=PlanType.professional,
        max_ai_tokens_per_month=100_000,
        current_ai_tokens_used=0,
        is_active=True,
    )
    test_db.add(tenant)
    await test_db.commit()
    await test_db.refresh(tenant)
    return tenant


@pytest_asyncio.fixture
async def test_user(test_db, test_tenant):
    """Seed test active user in the in-memory SQLite DB."""
    user = User(
        email="analyst@aicorp.com",
        tenant_id=test_tenant.id,
        role=UserRole.analyst,
        is_active=True,
        hashed_password="hashed_secret_password",
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


# ==============================================================================
# 1. Groq Provider Tests
# ==============================================================================
class TestGroqProvider:
    def test_provider_initialization(self):
        provider = GroqProvider(api_key="gsk_test_key_12345")
        assert provider.is_available() is True
        assert provider.provider_name == "groq"
        assert "llama-3.3-70b-versatile" in provider.PRICING

    def test_cost_calculation(self):
        provider = GroqProvider(api_key="gsk_test_key_12345")
        # 1,000,000 prompt tokens @ $0.59 + 1,000,000 completion tokens @ $0.79 = $1.38
        cost = provider.calculate_cost("llama-3.3-70b-versatile", 1_000_000, 1_000_000)
        assert cost == 1.38

    @pytest.mark.asyncio
    async def test_groq_generate_mock(self):
        provider = GroqProvider(api_key="gsk_test_key_12345")
        
        mock_choice = MagicMock()
        mock_choice.message.content = "Groq analytical response."
        mock_resp = MagicMock()
        mock_resp.choices = [mock_choice]
        mock_resp.usage.prompt_tokens = 50
        mock_resp.usage.completion_tokens = 25
        mock_resp.usage.total_tokens = 75

        with patch.object(provider._get_client().chat.completions, "create", new_callable=AsyncMock, return_value=mock_resp):
            res = await provider.generate(prompt="Analyze revenue")
            assert res.content == "Groq analytical response."
            assert res.prompt_tokens == 50
            assert res.completion_tokens == 25
            assert res.total_tokens == 75
            assert res.provider == "groq"
            assert res.cost_usd > 0


# ==============================================================================
# 2. Gemini Provider Tests
# ==============================================================================
class TestGeminiProvider:
    def test_gemini_initialization(self):
        provider = GeminiProvider(api_key="test_gemini_key")
        assert provider.is_available() is True
        assert provider.provider_name == "gemini"
        assert "gemini-2.0-flash" in provider.PRICING

    def test_gemini_cost_calculation(self):
        provider = GeminiProvider(api_key="test_gemini_key")
        # gemini-2.0-flash: 0.10 prompt, 0.40 completion
        cost = provider.calculate_cost("gemini-2.0-flash", 1_000_000, 1_000_000)
        assert cost == 0.50


# ==============================================================================
# 3. LLM Router & Failover Tests
# ==============================================================================
class TestLLMRouter:
    def test_list_available_providers(self):
        router = LLMRouter(groq_api_key="gsk_test", gemini_api_key="gem_test")
        providers = router.list_available_providers()
        assert len(providers) == 2
        names = [p["name"] for p in providers]
        assert "groq" in names
        assert "gemini" in names

    @pytest.mark.asyncio
    async def test_router_failover_when_primary_fails(self):
        router = LLMRouter(groq_api_key="gsk_test", gemini_api_key="gem_test")

        # Mock Groq to fail with RateLimitError
        async def fail_groq(*args, **kwargs):
            raise Exception("Groq 429 Rate Limit Exceeded")

        # Mock Gemini to succeed
        gemini_response = LLMResponse(
            content="Gemini fallback response",
            prompt_tokens=40,
            completion_tokens=20,
            total_tokens=60,
            cost_usd=0.00001,
            latency_ms=150.0,
            provider="gemini",
            model="gemini-2.0-flash",
        )

        with patch.object(router.groq_provider, "generate", side_effect=fail_groq), \
             patch.object(router.gemini_provider, "generate", new_callable=AsyncMock, return_value=gemini_response):
            
            res = await router.generate(prompt="What is the trend?", task_type="chat")
            assert res.content == "Gemini fallback response"
            assert res.provider == "gemini"


# ==============================================================================
# 4. NL-to-SQL Agent Tests (with Real DuckDB Execution)
# ==============================================================================
class TestNLSQLAgent:
    @pytest.mark.asyncio
    async def test_nl_sql_agent_execution(self, sample_df):
        router = LLMRouter(groq_api_key="gsk_test", gemini_api_key="gem_test")
        agent = NLSQLAgent(router)

        # 1. Mock SQL generation to return valid DuckDB SQL
        sql_gen_resp = LLMResponse(
            content='{"sql": "SELECT category, SUM(sales) AS total_sales FROM data GROUP BY category ORDER BY total_sales DESC", "explanation": "Aggregates sales by category"}',
            prompt_tokens=100,
            completion_tokens=40,
            total_tokens=140,
            cost_usd=0.0001,
            latency_ms=80.0,
            provider="groq",
            model="llama-3.3-70b-versatile",
        )

        # 2. Mock Synthesis response
        synthesis_resp = LLMResponse(
            content="**Electronics** generated the highest sales with a total of $4,800.00.",
            prompt_tokens=120,
            completion_tokens=30,
            total_tokens=150,
            cost_usd=0.0001,
            latency_ms=90.0,
            provider="groq",
            model="llama-3.3-70b-versatile",
        )

        with patch.object(router, "generate", side_effect=[sql_gen_resp, synthesis_resp]):
            schema_info = {"region": "String", "category": "String", "sales": "Float64", "quantity": "Int64", "profit": "Float64"}
            result = await agent.answer_question(
                question="Which category has highest sales?",
                df=sample_df,
                schema_info=schema_info,
            )

            assert "Electronics" in result["answer"]
            assert result["generated_sql"].startswith("SELECT category")
            assert result["query_result"]["total_rows"] == 3
            assert result["query_result"]["columns"] == ["category", "total_sales"]
            # Verify the top category is indeed Electronics with 4800.0
            assert result["query_result"]["rows"][0][0] == "Electronics"
            assert result["query_result"]["rows"][0][1] == 4800.0


# ==============================================================================
# 5. Narrative Generator Tests
# ==============================================================================
class TestNarrativeGenerator:
    @pytest.mark.asyncio
    async def test_narrative_generator_structure(self, sample_profile):
        router = LLMRouter(groq_api_key="gsk_test", gemini_api_key="gem_test")
        narrative_gen = NarrativeGenerator(router)

        mock_narrative_json = {
            "executive_summary": "The sales dataset shows robust health with strong correlation between revenue and profitability.",
            "key_drivers": [{"title": "Sales Volume", "description": "High concentration in Electronics."}],
            "correlation_insights": [{"variables": ["sales", "profit"], "correlation": 0.98, "interpretation": "Direct profit linearity."}],
            "anomalies_and_risks": [],
            "growth_opportunities": [{"title": "Expand Furniture Segment", "impact": "HIGH", "detail": "Untapped potential in West region."}],
            "strategic_recommendations": [{"priority": 1, "action": "Increase inventory for top-tier electronics", "rationale": "High sales velocity."}]
        }

        mock_response = LLMResponse(
            content=str(mock_narrative_json).replace("'", '"'),
            prompt_tokens=300,
            completion_tokens=200,
            total_tokens=500,
            cost_usd=0.0005,
            latency_ms=250.0,
            provider="gemini",
            model="gemini-2.0-flash",
        )

        with patch.object(router, "generate", new_callable=AsyncMock, return_value=mock_response):
            result = await narrative_gen.generate_narrative(
                dataset_name="Q3_Sales.csv",
                profile=sample_profile,
            )

            assert result["dataset_name"] == "Q3_Sales.csv"
            assert "executive_summary" in result["report"]
            assert len(result["report"]["strategic_recommendations"]) == 1
            assert result["provider"] == "gemini"
            assert result["total_tokens"] == 500


# ==============================================================================
# 6. AIService Integration Tests
# ==============================================================================
class TestAIService:
    @pytest.mark.asyncio
    async def test_ai_service_copilot_chat(self, test_db, test_tenant, test_user):
        ai_svc = AIService(test_db)

        mock_llm_resp = LLMResponse(
            content="Total profit margins are performing above benchmark at 24.8%.",
            prompt_tokens=80,
            completion_tokens=25,
            total_tokens=105,
            cost_usd=0.00007,
            latency_ms=110.0,
            provider="groq",
            model="llama-3.3-70b-versatile",
        )

        with patch.object(ai_svc.router, "generate", new_callable=AsyncMock, return_value=mock_llm_resp):
            res = await ai_svc.copilot_chat(
                question="How are our profit margins?",
                actor=test_user,
            )

            assert "Total profit margins" in res["answer"]
            assert res["provider"] == "groq"
            assert res["total_tokens"] == 105

    @pytest.mark.asyncio
    async def test_ai_service_copilot_chat_stream(self, test_db, test_tenant, test_user):
        ai_svc = AIService(test_db)

        async def mock_stream(*args, **kwargs):
            chunks = ["Here ", "is ", "your ", "data ", "insight."]
            for c in chunks:
                yield c

        with patch.object(ai_svc.router, "generate_stream", side_effect=mock_stream):
            collected = []
            async for token in ai_svc.copilot_chat_stream(
                question="Give me a quick update",
                actor=test_user,
            ):
                collected.append(token)

            full_text = "".join(collected)
            assert full_text == "Here is your data insight."


# ==============================================================================
# 7. AI REST Endpoints Integration Tests
# ==============================================================================
class TestAIEndpoints:
    @pytest.mark.asyncio
    async def test_get_providers_endpoint(self, test_db, test_user):
        from app.api.deps import get_current_active_tenant_user, get_db

        async def override_get_db():
            yield test_db

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_active_tenant_user] = lambda: test_user

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            res = await client.get(
                "/api/v1/ai/providers",
                headers={"Authorization": "Bearer fake_token"},
            )
            assert res.status_code == 200
            data = res.json()
            assert "providers" in data
            assert len(data["providers"]) >= 2
            assert data["active_default"] == "groq"

        app.dependency_overrides.clear()

    @pytest.mark.asyncio
    async def test_copilot_chat_endpoint(self, test_db, test_user):
        from app.api.deps import get_current_active_tenant_user, get_db

        async def override_get_db():
            yield test_db

        app.dependency_overrides[get_db] = override_get_db
        app.dependency_overrides[get_current_active_tenant_user] = lambda: test_user

        mock_resp = {
            "answer": "Revenue is up 18% QoQ.",
            "provider": "groq",
            "model": "llama-3.3-70b-versatile",
            "prompt_tokens": 50,
            "completion_tokens": 20,
            "total_tokens": 70,
            "cost_usd": 0.00005,
            "latency_ms": 120.0,
        }

        with patch("app.services.ai_service.AIService.copilot_chat", new_callable=AsyncMock, return_value=mock_resp):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                res = await client.post(
                    "/api/v1/ai/chat",
                    headers={"Authorization": "Bearer fake_token"},
                    json={"question": "What is our revenue growth?"},
                )
                assert res.status_code == 200
                data = res.json()
                assert data["answer"] == "Revenue is up 18% QoQ."
                assert data["provider"] == "groq"

        app.dependency_overrides.clear()
