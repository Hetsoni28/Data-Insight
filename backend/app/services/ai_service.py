"""AIService — multi-provider orchestration (Groq + Gemini), token tracking, and analytical agents."""

from __future__ import annotations

import uuid
import json
import logging
from typing import Optional, List, Dict, Any, AsyncIterator
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.ai_token_usage import AITokenUsage
from app.core.config import settings
from app.core.exceptions import AIServiceException, ResourceNotFoundException
from app.services.ai.router import LLMRouter
from app.services.ai.nl_sql_agent import NLSQLAgent
from app.services.ai.narrative_generator import NarrativeGenerator
from app.services.quota_service import QuotaService

logger = logging.getLogger(__name__)

MAX_HISTORY = 10

_MASTER_PERSONA = """You are an elite Business Intelligence Principal and Chief AI Analytics Officer.
You combine the computational rigor of DuckDB and Polars with the strategic advisory of top-tier strategy consultants.

Core Operating Guidelines:
1. Ground every claim directly on verified data. Never invent fake columns or hallucinate unsupported statistics.
2. Structure insights with executive clarity: Highlight key numbers, variance, trends, and business impact.
3. Provide actionable next steps for stakeholders (CEOs, CFOs, Operations Leaders).
"""


def _sanitize_prompt(text: str) -> str:
    """Strip dangerous characters or excessive whitespace from prompts."""
    return " ".join((text or "").strip().split())


class AIService:
    """Unified service for AI multi-provider routing, Copilot interactions, NL-to-SQL, and report generation."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.router = LLMRouter(
            groq_api_key=settings.GROQ_API_KEY,
            gemini_api_key=settings.GEMINI_API_KEY,
        )
        self.nl_sql_agent = NLSQLAgent(self.router)
        self.narrative_generator = NarrativeGenerator(self.router)

    async def _track_tokens(
        self,
        tenant_id: uuid.UUID,
        user_id: Optional[uuid.UUID],
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        feature: str,
        cost_usd: float = 0.0,
        latency_ms: float = 0.0,
        report_id: Optional[uuid.UUID] = None,
        dataset_id: Optional[uuid.UUID] = None,
    ) -> None:
        """Record token consumption in DB and consume tenant quota."""
        total_tokens = prompt_tokens + completion_tokens

        usage = AITokenUsage(
            tenant_id=tenant_id,
            user_id=user_id,
            feature=feature,
            model=f"{provider}:{model}",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            status_code=200,
            report_id=report_id,
            dataset_id=dataset_id,
        )
        self.session.add(usage)
        await self.session.flush()

        quota_svc = QuotaService(self.session)
        await quota_svc.consume_ai_tokens(tenant_id, total_tokens)

    def list_providers(self) -> List[Dict[str, Any]]:
        """List all available LLM providers and supported models."""
        return self.router.list_available_providers()

    async def copilot_chat(
        self,
        question: str,
        dataset_id: Optional[uuid.UUID] = None,
        actor: Optional[User] = None,
        history: Optional[List[Dict[str, str]]] = None,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Interactive Copilot chat grounded in dataset profiling and context."""
        tenant_id = actor.tenant_id if actor else None
        user_id = actor.id if actor else None

        if tenant_id:
            quota_svc = QuotaService(self.session)
            await quota_svc.check_ai_quota(tenant_id, estimated_tokens=1000)

        dataset_context = ""
        if dataset_id and tenant_id:
            from app.repositories.dataset import DatasetRepository
            ds_repo = DatasetRepository(self.session)
            dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
            if dataset and dataset.profile:
                columns_meta = {
                    k: {"type": v.get("inferred_type") or v.get("type"), "null_pct": v.get("null_percentage") or v.get("null_pct")}
                    for k, v in dataset.profile.get("columns", {}).items()
                }
                profile_summary = {
                    "dataset_name": dataset.name,
                    "row_count": dataset.profile.get("overview", {}).get("row_count") or dataset.row_count,
                    "column_count": dataset.profile.get("overview", {}).get("column_count") or dataset.column_count,
                    "columns": columns_meta,
                    "quality_score": dataset.profile.get("quality_score", {}),
                }
                dataset_context = f"\n\nDATASET CONTEXT:\n{json.dumps(profile_summary, indent=2, default=str)}\n"

        clean_question = _sanitize_prompt(question)

        prompt_lines = [f"{_MASTER_PERSONA}"]
        if dataset_context:
            prompt_lines.append(dataset_context)

        if history:
            prompt_lines.append("\nCONVERSATION HISTORY:")
            for turn in history[-MAX_HISTORY:]:
                role = turn.get("role", "user").capitalize()
                content = turn.get("content", "")
                prompt_lines.append(f"{role}: {content}")

        prompt_lines.append(f"\nUser Question: {clean_question}\nAnalyst:")
        full_prompt = "\n".join(prompt_lines)

        response = await self.router.generate(
            prompt=full_prompt,
            task_type="chat",
            preferred_provider=preferred_provider,
            temperature=0.3,
            max_tokens=2048,
        )

        if tenant_id:
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=user_id,
                provider=response.provider,
                model=response.model,
                prompt_tokens=response.prompt_tokens,
                completion_tokens=response.completion_tokens,
                feature="copilot_chat",
                cost_usd=response.cost_usd,
                latency_ms=response.latency_ms,
                dataset_id=dataset_id,
            )

        return {
            "answer": response.content,
            "provider": response.provider,
            "model": response.model,
            "prompt_tokens": response.prompt_tokens,
            "completion_tokens": response.completion_tokens,
            "total_tokens": response.total_tokens,
            "cost_usd": response.cost_usd,
            "latency_ms": response.latency_ms,
        }

    async def copilot_chat_stream(
        self,
        question: str,
        dataset_id: Optional[uuid.UUID] = None,
        actor: Optional[User] = None,
        history: Optional[List[Dict[str, str]]] = None,
        preferred_provider: Optional[str] = None,
    ) -> AsyncIterator[str]:
        """Stream interactive Copilot responses word-by-word via SSE."""
        tenant_id = actor.tenant_id if actor else None
        if tenant_id:
            quota_svc = QuotaService(self.session)
            await quota_svc.check_ai_quota(tenant_id, estimated_tokens=1000)

        dataset_context = ""
        if dataset_id and tenant_id:
            from app.repositories.dataset import DatasetRepository
            ds_repo = DatasetRepository(self.session)
            dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
            if dataset and dataset.profile:
                dataset_context = f"\n\nDATASET CONTEXT:\n{json.dumps(dataset.profile.get('overview', {}), indent=2, default=str)}\n"

        clean_question = _sanitize_prompt(question)
        prompt = f"{_MASTER_PERSONA}\n{dataset_context}\nUser Question: {clean_question}\nAnalyst:"

        async for chunk in self.router.generate_stream(
            prompt=prompt,
            task_type="chat",
            preferred_provider=preferred_provider,
            temperature=0.3,
            max_tokens=2048,
        ):
            yield chunk

    async def nl_query(
        self,
        question: str,
        dataset_id: uuid.UUID,
        actor: User,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute Natural Language to DuckDB SQL query against tenant dataset."""
        tenant_id = actor.tenant_id
        if tenant_id:
            quota_svc = QuotaService(self.session)
            await quota_svc.check_ai_quota(tenant_id, estimated_tokens=1500)

        from app.repositories.dataset import DatasetRepository
        ds_repo = DatasetRepository(self.session)
        dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
        if not dataset:
            raise ResourceNotFoundException("Dataset", str(dataset_id))

        # Load dataframe using PolarsEngine
        from app.services.ingestion.polars_engine import PolarsEngine
        df = PolarsEngine.read_file(dataset.file_path, file_type=dataset.file_type)

        schema_info = {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        preview_rows = df.head(3).to_dicts()

        result = await self.nl_sql_agent.answer_question(
            question=question,
            df=df,
            schema_info=schema_info,
            preview_rows=preview_rows,
            preferred_provider=preferred_provider,
        )

        if tenant_id:
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=actor.id,
                provider=result["provider"],
                model=result["model"],
                prompt_tokens=result["prompt_tokens"],
                completion_tokens=result["completion_tokens"],
                feature="nl_sql_query",
                cost_usd=result["cost_usd"],
                latency_ms=result["latency_ms"],
                dataset_id=dataset_id,
            )

        return result

    async def generate_narrative(
        self,
        dataset_id: uuid.UUID,
        actor: User,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate comprehensive 5-tier business narrative report from dataset profiling."""
        tenant_id = actor.tenant_id
        if tenant_id:
            quota_svc = QuotaService(self.session)
            await quota_svc.check_ai_quota(tenant_id, estimated_tokens=3000)

        from app.repositories.dataset import DatasetRepository
        ds_repo = DatasetRepository(self.session)
        dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
        if not dataset:
            raise ResourceNotFoundException("Dataset", str(dataset_id))

        if not dataset.profile:
            raise AIServiceException("Dataset must be profiled before generating narrative analysis.")

        result = await self.narrative_generator.generate_narrative(
            dataset_name=dataset.name,
            profile=dataset.profile,
            correlations=dataset.profile.get("correlations"),
            preferred_provider=preferred_provider,
        )

        if tenant_id:
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=actor.id,
                provider=result["provider"],
                model=result["model"],
                prompt_tokens=result["prompt_tokens"],
                completion_tokens=result["completion_tokens"],
                feature="report_narrative",
                cost_usd=result["cost_usd"],
                latency_ms=result["latency_ms"],
                dataset_id=dataset_id,
            )

        return result

    async def generate_blueprint(
        self,
        dataset_summary: str,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        dataset_id: uuid.UUID,
        preferred_provider: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate BI report blueprint layout and sheet architecture."""
        prompt = f"""{_MASTER_PERSONA}
MISSION: ENTERPRISE BI WORKBOOK BLUEPRINT GENERATION
DATASET PROFILE:
{dataset_summary}

Generate the executive workbook blueprint in valid JSON."""

        response = await self.router.generate(
            prompt=prompt,
            task_type="deep_report",
            preferred_provider=preferred_provider,
            temperature=0.2,
            json_mode=True,
        )

        try:
            blueprint = json.loads(response.content)
        except Exception:
            blueprint = {
                "domain": "General Business Analytics",
                "domain_short": "general",
                "detected_kpis": [],
                "recommended_charts": [],
                "pivot_tables": [],
            }

        await self._track_tokens(
            tenant_id=tenant_id,
            user_id=user_id,
            provider=response.provider,
            model=response.model,
            prompt_tokens=response.prompt_tokens,
            completion_tokens=response.completion_tokens,
            feature="report_blueprint",
            cost_usd=response.cost_usd,
            latency_ms=response.latency_ms,
            report_id=report_id,
            dataset_id=dataset_id,
        )

        return blueprint
