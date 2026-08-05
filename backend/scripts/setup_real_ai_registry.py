import asyncio
from decimal import Decimal
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.ai_ops import (
    AIProvider,
    AIModel,
    AIRoutingRule,
    AIPromptTemplate,
    AIUsageLog,
    ProviderStatus,
    ModelType,
)
from app.core.config import settings

async def setup_real_ai_registry():
    async with AsyncSessionLocal() as db:
        print("--- Configuring Real AI Providers & Real Models ---")

        # 1. Clean old provider and routing records
        await db.execute(delete(AIUsageLog))
        await db.execute(delete(AIRoutingRule))
        await db.execute(delete(AIPromptTemplate))
        await db.execute(delete(AIModel))
        await db.execute(delete(AIProvider))
        await db.commit()

        # 2. Add only real providers configured in environment
        openai_status = ProviderStatus.ONLINE if settings.OPENAI_API_KEY else ProviderStatus.OFFLINE
        gemini_status = ProviderStatus.ONLINE if settings.GEMINI_API_KEY else ProviderStatus.OFFLINE

        providers = [
            AIProvider(
                name="OpenAI",
                base_url="https://api.openai.com/v1",
                status=openai_status,
                health_score=100.0 if openai_status == ProviderStatus.ONLINE else 0.0,
                latency_ms=0,
                is_active=bool(settings.OPENAI_API_KEY),
                environment="production"
            ),
            AIProvider(
                name="Google Gemini",
                base_url="https://generativelanguage.googleapis.com",
                status=gemini_status,
                health_score=100.0 if gemini_status == ProviderStatus.ONLINE else 0.0,
                latency_ms=0,
                is_active=bool(settings.GEMINI_API_KEY),
                environment="production"
            ),
        ]
        db.add_all(providers)
        await db.commit()

        for p in providers:
            await db.refresh(p)
        provider_map = {p.name: p for p in providers}

        # 3. Add real active models for each configured provider
        models = [
            # OpenAI Models
            AIModel(
                provider_id=provider_map["OpenAI"].id,
                name="Gemini 3.5 Flash",
                model_id_string="gemini-3.5-flash",
                type=ModelType.CHAT,
                context_window=128000,
                input_cost_per_1k=Decimal("0.005000"),
                output_cost_per_1k=Decimal("0.015000"),
                quality_score=95.5,
                is_active=True
            ),
            AIModel(
                provider_id=provider_map["OpenAI"].id,
                name="Gemini 3.5 Flash",
                model_id_string="gemini-3.5-flash",
                type=ModelType.CHAT,
                context_window=128000,
                input_cost_per_1k=Decimal("0.000150"),
                output_cost_per_1k=Decimal("0.000600"),
                quality_score=85.0,
                is_active=True
            ),
            AIModel(
                provider_id=provider_map["OpenAI"].id,
                name="text-embedding-3-large",
                model_id_string="text-embedding-3-large",
                type=ModelType.EMBEDDING,
                context_window=8191,
                input_cost_per_1k=Decimal("0.000130"),
                output_cost_per_1k=Decimal("0.000000"),
                quality_score=90.0,
                is_active=True
            ),
            # Google Gemini Models
            AIModel(
                provider_id=provider_map["Google Gemini"].id,
                name="Gemini 1.5 Pro",
                model_id_string="gemini-1.5-pro",
                type=ModelType.CHAT,
                context_window=2000000,
                input_cost_per_1k=Decimal("0.003500"),
                output_cost_per_1k=Decimal("0.010500"),
                quality_score=94.0,
                is_active=True
            ),
            AIModel(
                provider_id=provider_map["Google Gemini"].id,
                name="Gemini 3.5 Flash",
                model_id_string="gemini-3.5-flash",
                type=ModelType.CHAT,
                context_window=1000000,
                input_cost_per_1k=Decimal("0.000075"),
                output_cost_per_1k=Decimal("0.000300"),
                quality_score=88.0,
                is_active=True
            ),
        ]
        db.add_all(models)
        await db.commit()

        for m in models:
            await db.refresh(m)
        model_map = {m.name: m for m in models}

        # 4. Add real routing rules using actual configured models
        rules = [
            AIRoutingRule(
                task_type="default_chat",
                primary_model_id=model_map["Gemini 3.5 Flash"].id,
                fallback_model_id=model_map["Gemini 3.5 Flash"].id,
                timeout_ms=30000,
                retry_count=3,
                is_active=True
            ),
            AIRoutingRule(
                task_type="excel_generation",
                primary_model_id=model_map["Gemini 3.5 Flash"].id,
                fallback_model_id=model_map["Gemini 1.5 Pro"].id,
                timeout_ms=30000,
                retry_count=3,
                is_active=True
            ),
            AIRoutingRule(
                task_type="complex_reasoning",
                primary_model_id=model_map["Gemini 3.5 Flash"].id,
                fallback_model_id=model_map["Gemini 1.5 Pro"].id,
                timeout_ms=30000,
                retry_count=3,
                is_active=True
            ),
            AIRoutingRule(
                task_type="fast_embeddings",
                primary_model_id=model_map["text-embedding-3-large"].id,
                fallback_model_id=None,
                timeout_ms=30000,
                retry_count=3,
                is_active=True
            ),
        ]
        db.add_all(rules)

        # 5. Real prompt templates
        prompts = [
            AIPromptTemplate(
                name="Excel Report Generator",
                version=1,
                system_prompt="You are an enterprise AI data analyst for Data Insight.",
                user_prompt_template="Generate executive summary and structured analysis for {dataset_name} covering {metrics}.",
                variables=["dataset_name", "metrics"],
                is_active=True
            ),
            AIPromptTemplate(
                name="Data Cleaning Copilot",
                version=1,
                system_prompt="You are a data validation expert specializing in tabular data normalization.",
                user_prompt_template="Analyze dataset schema and detect anomalies or null patterns for: {data}",
                variables=["data"],
                is_active=True
            ),
        ]
        db.add_all(prompts)
        await db.commit()

        print("Real AI Providers, Models, and Smart Routing configured successfully!")

if __name__ == "__main__":
    asyncio.run(setup_real_ai_registry())
