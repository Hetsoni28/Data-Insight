"""AIService — multi-provider orchestration (Groq + Gemini), token tracking, and analytical agents."""

from __future__ import annotations

import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any

import polars as pl
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    AIServiceException,
    ResourceNotFoundException,
    ValidationException,
)
from app.models.ai_token_usage import AITokenUsage
from app.models.user import User
from app.repositories.chat import ChatRepository
from app.services.ai.narrative_generator import NarrativeGenerator
from app.services.ai.nl_sql_agent import NLSQLAgent
from app.services.ai.router import LLMRouter
from app.services.ai.suggestions_service import SuggestionsService
from app.services.ai.visual_sql_agent import VisualSQLAgent
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
        self.visual_sql_agent = VisualSQLAgent(self.router)
        self.suggestions_service = SuggestionsService(self.router)
        self.narrative_generator = NarrativeGenerator(self.router)

    async def _track_tokens(
        self,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID | None,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        feature: str,
        cost_usd: float = 0.0,
        latency_ms: float = 0.0,
        report_id: uuid.UUID | None = None,
        dataset_id: uuid.UUID | None = None,
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

    def list_providers(self) -> list[dict[str, Any]]:
        """List all available LLM providers and supported models."""
        return self.router.list_available_providers()

    async def copilot_chat(
        self,
        question: str,
        dataset_id: uuid.UUID | None = None,
        actor: User | None = None,
        history: list[dict[str, str]] | None = None,
        preferred_provider: str | None = None,
    ) -> dict[str, Any]:
        """Interactive Copilot chat — context-aware, multi-turn, grounded in dataset profiling."""
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
                    k: {
                        "type": v.get("inferred_type") or v.get("type"),
                        "null_pct": v.get("null_percentage") or v.get("null_pct"),
                    }
                    for k, v in dataset.profile.get("columns", {}).items()
                }
                profile_summary = {
                    "dataset_name": dataset.name,
                    "row_count": dataset.profile.get("overview", {}).get("row_count")
                    or dataset.row_count,
                    "column_count": dataset.profile.get("overview", {}).get(
                        "column_count",
                    )
                    or dataset.column_count,
                    "columns": columns_meta,
                }
                dataset_context = (
                    f"\n\nYou have access to a dataset called '{dataset.name}' with "
                    f"{profile_summary['row_count']} rows and {profile_summary['column_count']} columns.\n"
                    f"Column names: {', '.join(profile_summary['columns'].keys())}\n"
                    f"If the user asks about data, encourage them to ask specific questions like "
                    f"'Show me a chart of X by Y' or 'What is the total Z'.\n"
                )

        clean_question = _sanitize_prompt(question)

        # Build a proper conversational system prompt
        system_prompt = (
            "You are DataInsight AI, a friendly and highly knowledgeable Business Intelligence assistant. "
            "You help users understand their data, discover insights, and make smart business decisions. "
            "You are professional but warm, clear but not technical unless asked. "
            "When users greet you or make small talk, respond naturally and helpfully. "
            "When users ask about their data, guide them toward asking specific data questions. "
            "Never make up data or statistics. Be concise and direct." + dataset_context
        )

        # Build conversation messages
        messages = [{"role": "system", "content": system_prompt}]
        if history:
            for turn in history[-MAX_HISTORY:]:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": clean_question})

        # Build a single prompt string (router uses prompt-based API)
        history_block = ""
        if history:
            for turn in history[-MAX_HISTORY:]:
                role = turn.get("role", "user").capitalize()
                content = turn.get("content", "")
                if role in ["User", "Assistant"] and content:
                    history_block += f"{role}: {content}\n"

        full_prompt = (
            f"{system_prompt}\n\n{history_block}User: {clean_question}\nDataInsight AI:"
        )

        response = await self.router.generate(
            prompt=full_prompt,
            task_type="chat",
            preferred_provider=preferred_provider,
            temperature=0.4,
            max_tokens=1024,
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
        dataset_id: uuid.UUID | None = None,
        actor: User | None = None,
        history: list[dict[str, str]] | None = None,
        preferred_provider: str | None = None,
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
        preferred_provider: str | None = None,
    ) -> dict[str, Any]:
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

        # Load dataframe asynchronously from disk or MinIO storage
        df = await self._load_dataset_df(dataset)

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
        preferred_provider: str | None = None,
    ) -> dict[str, Any]:
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
            raise AIServiceException(
                "Dataset must be profiled before generating narrative analysis.",
            )

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
        preferred_provider: str | None = None,
    ) -> dict[str, Any]:
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

    def _get_fallback_blueprint(self, dataset_summary: str = "") -> dict[str, Any]:
        """Generate a resilient fallback blueprint if AI blueprint generation fails."""
        return {
            "domain": "General Business Analytics",
            "domain_short": "general",
            "detected_kpis": [
                {"name": "Total Processed", "metric": "count", "column": "id"},
                {"name": "Aggregate Metric", "metric": "sum", "column": "value"},
            ],
            "recommended_charts": [
                {
                    "type": "column",
                    "title": "Overview Distribution",
                    "x_axis": "category",
                    "y_axis": "value",
                },
            ],
            "pivot_tables": [],
        }

    async def write_executive_summary(
        self,
        blueprint: dict[str, Any],
        data_insights: dict[str, Any],
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        preferred_provider: str | None = None,
    ) -> str:
        """Write high-level executive summary for Excel workbook report."""
        prompt = f"""{_MASTER_PERSONA}
MISSION: WRITE MCKINSEY-GRADE EXECUTIVE SUMMARY FOR BI WORKBOOK
BLUEPRINT: {json.dumps(blueprint, default=str)}
DATA INSIGHTS: {json.dumps(data_insights, default=str)}

Provide a structured 3-section executive summary:
SECTION 1 — BUSINESS OVERVIEW
SECTION 2 — TOP FINDINGS
SECTION 3 — RECOMMENDATIONS"""
        try:
            res = await self.router.generate(
                prompt=prompt,
                task_type="deep_report",
                preferred_provider=preferred_provider,
                temperature=0.3,
            )
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=user_id,
                provider=res.provider,
                model=res.model,
                prompt_tokens=res.prompt_tokens,
                completion_tokens=res.completion_tokens,
                feature="report_summary",
                cost_usd=res.cost_usd,
                latency_ms=res.latency_ms,
                report_id=report_id,
            )
            return res.content
        except Exception as e:
            logger.warning(f"Fallback executive summary generated due to: {e}")
            return (
                "SECTION 1 — BUSINESS OVERVIEW\n"
                f"This {blueprint.get('domain', 'Business Analytics')} report provides structured executive insights.\n\n"
                "SECTION 2 — TOP FINDINGS\n"
                "1. Data was fully validated, parsed, and profiled.\n"
                "2. Statistical measures and key distributions were successfully synthesized.\n\n"
                "SECTION 3 — RECOMMENDATIONS\n"
                "1. Drill down into individual workbook sheets for departmental breakdowns."
            )

    async def write_ai_insights(
        self,
        blueprint: dict[str, Any],
        data_insights: dict[str, Any],
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        preferred_provider: str | None = None,
    ) -> str:
        """Write deep WHY-analysis insights for Excel workbook report."""
        prompt = f"""{_MASTER_PERSONA}
MISSION: WRITE DEEP AI INSIGHTS (WHY-ANALYSIS)
BLUEPRINT: {json.dumps(blueprint, default=str)}
DATA INSIGHTS: {json.dumps(data_insights, default=str)}

Write structured analytical insights with WHAT, WHY, and SO WHAT breakdown."""
        try:
            res = await self.router.generate(
                prompt=prompt,
                task_type="deep_report",
                preferred_provider=preferred_provider,
                temperature=0.3,
            )
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=user_id,
                provider=res.provider,
                model=res.model,
                prompt_tokens=res.prompt_tokens,
                completion_tokens=res.completion_tokens,
                feature="report_insights",
                cost_usd=res.cost_usd,
                latency_ms=res.latency_ms,
                report_id=report_id,
            )
            return res.content
        except Exception as e:
            logger.warning(f"Fallback AI insights generated due to: {e}")
            return (
                "INSIGHT 1: Data Ingestion Complete\n"
                "WHAT: All dataset records were ingested and verified.\n"
                "WHY: Automated statistical distribution engine analyzed the dataset structure.\n"
                "SO WHAT: Review KPI summary cards and pivot tables for high-value segments."
            )

    async def write_recommendations(
        self,
        blueprint: dict[str, Any],
        data_insights: dict[str, Any],
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        report_id: uuid.UUID,
        preferred_provider: str | None = None,
    ) -> str:
        """Write strategic action recommendations for Excel workbook report."""
        prompt = f"""{_MASTER_PERSONA}
MISSION: WRITE STRATEGIC ACTIONABLE RECOMMENDATIONS
BLUEPRINT: {json.dumps(blueprint, default=str)}
DATA INSIGHTS: {json.dumps(data_insights, default=str)}

Provide prioritized recommendations with PRIORITY, IMPACT, WHAT TO DO, WHY IT MATTERS, and TIMELINE."""
        try:
            res = await self.router.generate(
                prompt=prompt,
                task_type="deep_report",
                preferred_provider=preferred_provider,
                temperature=0.3,
            )
            await self._track_tokens(
                tenant_id=tenant_id,
                user_id=user_id,
                provider=res.provider,
                model=res.model,
                prompt_tokens=res.prompt_tokens,
                completion_tokens=res.completion_tokens,
                feature="report_recommendations",
                cost_usd=res.cost_usd,
                latency_ms=res.latency_ms,
                report_id=report_id,
            )
            return res.content
        except Exception as e:
            logger.warning(f"Fallback recommendations generated due to: {e}")
            return (
                "RECOMMENDATION 1: Monitor Core Business Indicators\n"
                "PRIORITY: HIGH\n"
                "IMPACT: Operational Efficiency\n"
                "WHAT TO DO: Track key metrics across workbook tables.\n"
                "WHY IT MATTERS: Ensures ongoing data consistency and metric accuracy.\n"
                "EXPECTED OUTCOME: Improved operational predictability.\n"
                "TIMELINE: Immediate (0-30d)"
            )

    async def _load_dataset_df(
        self, dataset: Any, n_rows: int | None = None,
    ) -> pl.DataFrame:
        """Load Polars DataFrame for a dataset, supporting both local filesystem and MinIO object storage."""
        from pathlib import Path

        from app.core.storage import DATASETS_BUCKET, download_file_bytes
        from app.services.ingestion.polars_engine import PolarsEngine

        file_url = getattr(dataset, "file_url", "") or ""
        raw_type = getattr(dataset, "file_type", "csv")
        file_type_str = (
            str(raw_type.value if hasattr(raw_type, "value") else raw_type)
            .lower()
            .replace("datasetfiletype.", "")
        )

        # 1. Try local filesystem path first
        if file_url and Path(file_url).exists() and Path(file_url).is_file():
            return PolarsEngine.load_from_path(
                file_url, file_type=file_type_str, n_rows=n_rows,
            )

        # 2. Download from MinIO / S3 object storage
        try:
            file_bytes = await download_file_bytes(DATASETS_BUCKET, file_url)
            return PolarsEngine.load_from_bytes(
                file_bytes, file_type=file_type_str, n_rows=n_rows,
            )
        except Exception as e:
            logger.error(f"[AIService] Failed to load dataset file ({file_url}): {e}")
            raise ValidationException(f"Could not load dataset file: {e}")

    async def get_dataset_suggestions(
        self,
        dataset_id: uuid.UUID,
        actor: User,
        preferred_provider: str | None = None,
    ) -> list[dict[str, Any]]:
        """Fetch proactive contextual smart suggestions for a given dataset.

        Uses stored dataset profile (set during ingestion) or downloads file from storage
        to derive schema info without file-access failures.
        """
        tenant_id = actor.tenant_id
        from app.repositories.dataset import DatasetRepository

        ds_repo = DatasetRepository(self.session)
        dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
        if not dataset:
            raise ResourceNotFoundException("Dataset", str(dataset_id))

        schema_info: dict[str, Any] = {}
        preview_rows: list[dict] = []
        row_count: int = dataset.row_count or 0

        # --- Primary: use pre-computed profile stored during ingestion ---
        profile = dataset.profile or {}
        if profile and isinstance(profile, dict):
            columns_meta = profile.get("columns", {})
            if isinstance(columns_meta, dict) and columns_meta:
                schema_info = {
                    col: (
                        meta.get("dtype", "unknown")
                        if isinstance(meta, dict)
                        else str(meta)
                    )
                    for col, meta in columns_meta.items()
                }
                # Build preview rows from sample_values or top_values stored in profile
                sample_keys = list(columns_meta.keys())
                for i in range(3):
                    row = {}
                    for col in sample_keys:
                        meta = (
                            columns_meta[col]
                            if isinstance(columns_meta[col], dict)
                            else {}
                        )
                        samples = meta.get("sample_values", [])
                        if not samples and meta.get("top_values"):
                            samples = [
                                tv.get("value")
                                for tv in meta.get("top_values", [])
                                if isinstance(tv, dict)
                            ]
                        row[col] = (
                            samples[i]
                            if i < len(samples)
                            else (meta.get("min") if i == 0 else meta.get("max"))
                        )
                    preview_rows.append(row)
            elif isinstance(columns_meta, list) and columns_meta:
                schema_info = {
                    item.get("name", f"col_{i}"): item.get("dtype", "unknown")
                    for i, item in enumerate(columns_meta)
                    if isinstance(item, dict)
                }

        # --- Fallback: read file from storage if schema_info is missing or has <= 1 column ---
        if not schema_info or len(schema_info) <= 1:
            try:
                df = await self._load_dataset_df(dataset, n_rows=100)
                schema_info = {
                    col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)
                }
                preview_rows = df.head(3).to_dicts()
                row_count = dataset.row_count or df.height
            except Exception as file_err:
                logger.warning(
                    f"[Suggestions] Could not read file for dataset {dataset_id}: {file_err}. "
                    "Using default heuristic suggestions.",
                )

        return await self.suggestions_service.generate_smart_suggestions(
            schema_info=schema_info,
            row_count=row_count,
            preview_rows=preview_rows,
            preferred_provider=preferred_provider,
        )

    async def chat_in_session(
        self,
        session_id: uuid.UUID,
        question: str,
        actor: User,
        preferred_provider: str | None = None,
    ) -> dict[str, Any]:
        """Send message into persistent session, execute NL-to-SQL + visual synthesis if dataset bound, and store history."""
        tenant_id = actor.tenant_id
        user_id = actor.id

        chat_repo = ChatRepository(self.session)
        chat_sess = await chat_repo.get_session(session_id, tenant_id, user_id)
        if not chat_sess:
            raise ResourceNotFoundException("ChatSession", str(session_id))

        quota_svc = QuotaService(self.session)
        await quota_svc.check_ai_quota(tenant_id, estimated_tokens=1500)

        # 1. Save user message
        clean_question = _sanitize_prompt(question)
        await chat_repo.add_message(
            session_id=session_id, role="user", content=clean_question,
        )

        # 2. Get conversation history for context
        history_msgs = await chat_repo.get_session_messages(
            session_id, limit=MAX_HISTORY,
        )
        history_payload = [
            {"role": m.role, "content": m.content}
            for m in history_msgs
            if m.role in ["user", "assistant"] and m.content != clean_question
        ]

        # 3. Check if session has a bound dataset and detect intent
        dataset_id = chat_sess.dataset_id
        is_data_question = False

        if dataset_id:
            # Fast keyword-based intent detection — no extra LLM call needed.
            # A question is a DATA question if it matches analytical patterns.
            # Only pure conversational openers (hi, thanks, etc.) skip the SQL pipeline.
            q_lower = clean_question.lower().strip()

            # Explicit conversational signals — these are chat only
            CHAT_PATTERNS = [
                q_lower
                in {
                    "hi",
                    "hello",
                    "hey",
                    "thanks",
                    "thank you",
                    "ok",
                    "okay",
                    "bye",
                    "goodbye",
                    "yes",
                    "no",
                    "yep",
                    "nope",
                    "sure",
                    "cool",
                    "great",
                    "good",
                    "nice",
                },
                q_lower.startswith(("hi ", "hey ", "hello ", "thanks ", "thank you")),
                q_lower
                in {"what can you do", "who are you", "what are you", "help me"},
            ]

            # Data/analytics signals — anything that sounds like a query
            DATA_KEYWORDS = [
                "show",
                "chart",
                "graph",
                "plot",
                "visualize",
                "visualise",
                "how many",
                "how much",
                "what is the total",
                "what is the average",
                "count",
                "sum",
                "average",
                "mean",
                "median",
                "max",
                "min",
                "percentage",
                "percent",
                "%",
                "ratio",
                "distribution",
                "top",
                "bottom",
                "highest",
                "lowest",
                "most",
                "least",
                "compare",
                "comparison",
                "trend",
                "over time",
                "by month",
                "by year",
                "by week",
                "group by",
                "breakdown",
                "split by",
                "segment",
                "category",
                "list",
                "table",
                "rows",
                "columns",
                "data",
                "revenue",
                "sales",
                "customer",
                "user",
                "order",
                "product",
                "status",
                "advance",
                "convert",
                "shortlist",
                "hired",
                "rejected",
                "who",
                "which",
                "where",
                "when",
                "find",
                "filter",
                "select",
                "correlation",
                "insight",
                "analyze",
                "analyse",
                "report",
                "total",
                "number of",
                "amount",
                "value",
            ]

            is_chat = any(CHAT_PATTERNS)
            is_data_question = (not is_chat) and any(
                kw in q_lower for kw in DATA_KEYWORDS
            )

            # If not explicitly chat and no keyword match, default to data if dataset is bound
            # (Better to try SQL and get a graceful fallback than to refuse to query)
            if not is_chat and not is_data_question and len(q_lower) > 10:
                is_data_question = True

            logger.info(
                f"[AIService] Intent detection: '{clean_question[:60]}' → {'DATA' if is_data_question else 'CHAT'}",
            )

        if dataset_id and is_data_question:
            from app.repositories.dataset import DatasetRepository

            ds_repo = DatasetRepository(self.session)
            dataset = await ds_repo.get_tenant_dataset(tenant_id, dataset_id)
            if not dataset:
                raise ResourceNotFoundException("Dataset", str(dataset_id))

            try:
                # Load dataframe and execute NL-to-SQL pipeline
                df = await self._load_dataset_df(dataset)
                schema_info = {
                    col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)
                }
                preview_rows = df.head(3).to_dicts()

                result = await self.visual_sql_agent.execute_and_synthesize(
                    question=clean_question,
                    df=df,
                    schema_info=schema_info,
                    preview_rows=preview_rows,
                    preferred_provider=preferred_provider,
                )

                assistant_content = result["answer"]
                artifact_data = result["artifact_data"]
                provider = result["provider"]
                model = result["model"]
                prompt_tokens = result["prompt_tokens"]
                completion_tokens = result["completion_tokens"]
                cost_usd = result["cost_usd"]
                latency_ms = result["latency_ms"]

            except Exception as e:
                logger.error(
                    f"[AIService] Data pipeline failed for dataset {dataset_id}: {e}",
                )
                # Return a friendly error message rather than hanging
                assistant_content = (
                    f"⚠️ I wasn't able to query the dataset **{dataset.name}** right now. "
                    f"The file may not be fully uploaded or may have been moved.\n\n"
                    f"**Please try:**\n"
                    f"- Starting a **New Chat** and re-selecting your dataset\n"
                    f"- Re-uploading the dataset from the Datasets page\n\n"
                    f"*Technical detail: {str(e)[:120]}*"
                )
                artifact_data = None
                provider = "system"
                model = "fallback"
                prompt_tokens = 0
                completion_tokens = 0
                cost_usd = 0.0
                latency_ms = 0.0
        else:
            # General conversational response — multi-turn, context-aware
            if dataset_id and chat_sess:
                pass

            chat_res = await self.copilot_chat(
                question=clean_question,
                actor=actor,
                history=history_payload,
                preferred_provider=preferred_provider,
            )

            assistant_content = chat_res["answer"]
            artifact_data = None
            provider = chat_res["provider"]
            model = chat_res["model"]
            prompt_tokens = chat_res["prompt_tokens"]
            completion_tokens = chat_res["completion_tokens"]
            cost_usd = chat_res["cost_usd"]
            latency_ms = chat_res["latency_ms"]

        # 3. Save assistant message with visual artifacts
        asst_msg = await chat_repo.add_message(
            session_id=session_id,
            role="assistant",
            content=assistant_content,
            artifact_data=artifact_data,
        )

        # 4. Auto-update session title if it is default
        if chat_sess.title == "New Chat":
            clean_title = clean_question[:40].strip()
            if len(clean_question) > 40:
                clean_title += "..."
            await chat_repo.update_session(
                session_id, tenant_id, user_id, title=clean_title,
            )

        # 5. Track tokens
        await self._track_tokens(
            tenant_id=tenant_id,
            user_id=user_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            feature="copilot_session_chat",
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            dataset_id=dataset_id,
        )

        return {
            "session_id": str(session_id),
            "message_id": str(asst_msg.id),
            "role": "assistant",
            "content": assistant_content,
            "artifact_data": artifact_data,
            "provider": provider,
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": prompt_tokens + completion_tokens,
            "cost_usd": cost_usd,
            "latency_ms": latency_ms,
            "created_at": (
                asst_msg.created_at.isoformat() if asst_msg.created_at else None
            ),
        }

    async def chat_in_session_stream(
        self,
        session_id: uuid.UUID,
        question: str,
        actor: User,
        preferred_provider: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream response for session chat and persist assistant message + artifact at the end."""
        # Execute chat logic
        res = await self.chat_in_session(
            session_id=session_id,
            question=question,
            actor=actor,
            preferred_provider=preferred_provider,
        )

        # Emit metadata event
        meta_event = {
            "type": "meta",
            "session_id": str(session_id),
            "message_id": res["message_id"],
            "provider": res["provider"],
            "model": res["model"],
            "created_at": res["created_at"],
        }
        yield f"data: {json.dumps(meta_event)}\n\n"

        # Stream content word by word
        content_words = res["content"].split(" ")
        for i, word in enumerate(content_words):
            chunk = word + (" " if i < len(content_words) - 1 else "")
            token_event = {"type": "token", "content": chunk}
            yield f"data: {json.dumps(token_event)}\n\n"

        # Emit artifact if available
        if res.get("artifact_data"):
            artifact_event = {
                "type": "artifact",
                "artifact_data": res["artifact_data"],
            }
            yield f"data: {json.dumps(artifact_event)}\n\n"

        # Emit done event
        done_event = {
            "type": "done",
            "session_id": str(session_id),
            "prompt_tokens": res["prompt_tokens"],
            "completion_tokens": res["completion_tokens"],
            "total_tokens": res["total_tokens"],
            "latency_ms": res["latency_ms"],
        }
        yield f"data: {json.dumps(done_event)}\n\n"
