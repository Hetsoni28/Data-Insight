import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select, delete
from app.db.session import AsyncSessionLocal
from app.models.ai_ops import AIProvider, AIModel, AIRoutingRule, AIPromptTemplate, AIUsageLog, ProviderStatus, ModelType
from app.models.tenant import Tenant

async def seed_ai_ops():
    async with AsyncSessionLocal() as db:
        print("Cleaning up existing AI Ops data...")
        await db.execute(delete(AIUsageLog))
        await db.execute(delete(AIRoutingRule))
        await db.execute(delete(AIPromptTemplate))
        await db.execute(delete(AIModel))
        await db.execute(delete(AIProvider))
        
        # Get a tenant to attach logs to
        tenant_result = await db.execute(select(Tenant).limit(1))
        tenant = tenant_result.scalar_one_or_none()
        if not tenant:
            print("No tenant found. Please run main seeder first.")
            return

        print("Seeding AI Providers...")
        providers = [
            AIProvider(name="OpenAI", base_url="https://api.openai.com/v1", status=ProviderStatus.ONLINE, health_score=99.9),
            AIProvider(name="Anthropic", base_url="https://api.anthropic.com/v1", status=ProviderStatus.ONLINE, health_score=99.5),
            AIProvider(name="Google Vertex AI", base_url="https://us-central1-aiplatform.googleapis.com", status=ProviderStatus.ONLINE, health_score=100.0),
            AIProvider(name="AWS Bedrock", base_url="https://bedrock-runtime.us-east-1.amazonaws.com", status=ProviderStatus.ONLINE, health_score=98.7),
            AIProvider(name="Groq", base_url="https://api.groq.com/openai/v1", status=ProviderStatus.DEGRADED, health_score=85.0),
        ]
        db.add_all(providers)
        await db.commit()
        
        # Refresh to get IDs
        for p in providers:
            await db.refresh(p)
            
        provider_map = {p.name: p for p in providers}

        print("Seeding AI Models...")
        models = [
            # OpenAI
            AIModel(provider_id=provider_map["OpenAI"].id, name="GPT-4o", model_id_string="gpt-4o", type=ModelType.CHAT, context_window=128000, input_cost_per_1k=0.005, output_cost_per_1k=0.015, quality_score=95.5),
            AIModel(provider_id=provider_map["OpenAI"].id, name="GPT-4o Mini", model_id_string="gpt-4o-mini", type=ModelType.CHAT, context_window=128000, input_cost_per_1k=0.00015, output_cost_per_1k=0.0006, quality_score=85.0),
            AIModel(provider_id=provider_map["OpenAI"].id, name="text-embedding-3-large", model_id_string="text-embedding-3-large", type=ModelType.EMBEDDING, context_window=8191, input_cost_per_1k=0.00013, output_cost_per_1k=0, quality_score=90.0),
            
            # Anthropic
            AIModel(provider_id=provider_map["Anthropic"].id, name="Claude 3.5 Sonnet", model_id_string="claude-3-5-sonnet-20240620", type=ModelType.CHAT, context_window=200000, input_cost_per_1k=0.003, output_cost_per_1k=0.015, quality_score=96.0),
            AIModel(provider_id=provider_map["Anthropic"].id, name="Claude 3 Opus", model_id_string="claude-3-opus-20240229", type=ModelType.REASONING, context_window=200000, input_cost_per_1k=0.015, output_cost_per_1k=0.075, quality_score=97.5),
            
            # Google
            AIModel(provider_id=provider_map["Google Vertex AI"].id, name="Gemini 1.5 Pro", model_id_string="gemini-1.5-pro", type=ModelType.CHAT, context_window=2000000, input_cost_per_1k=0.0035, output_cost_per_1k=0.0105, quality_score=94.0),
            
            # Groq
            AIModel(provider_id=provider_map["Groq"].id, name="Llama 3 70B", model_id_string="llama3-70b-8192", type=ModelType.CHAT, context_window=8192, input_cost_per_1k=0.00059, output_cost_per_1k=0.00079, quality_score=88.0),
        ]
        db.add_all(models)
        await db.commit()
        
        for m in models:
            await db.refresh(m)
            
        model_map = {m.name: m for m in models}

        print("Seeding Routing Rules...")
        rules = [
            AIRoutingRule(task_type="default_chat", primary_model_id=model_map["GPT-4o Mini"].id, fallback_model_id=model_map["Claude 3.5 Sonnet"].id),
            AIRoutingRule(task_type="excel_generation", primary_model_id=model_map["Claude 3.5 Sonnet"].id, fallback_model_id=model_map["GPT-4o"].id),
            AIRoutingRule(task_type="complex_reasoning", primary_model_id=model_map["Claude 3 Opus"].id, fallback_model_id=model_map["GPT-4o"].id),
            AIRoutingRule(task_type="fast_embeddings", primary_model_id=model_map["text-embedding-3-large"].id, fallback_model_id=None),
        ]
        db.add_all(rules)

        print("Seeding Prompt Templates...")
        prompts = [
            AIPromptTemplate(name="Excel Report Generator", version=2, system_prompt="You are a data analyst...", user_prompt_template="Generate a report for {dataset_name} covering {metrics}.", variables=["dataset_name", "metrics"]),
            AIPromptTemplate(name="Data Cleaning Agent", version=1, system_prompt="You are a data cleaner...", user_prompt_template="Clean the following JSON array: {data}", variables=["data"]),
        ]
        db.add_all(prompts)
        await db.commit()

        print("Seeding Usage Logs (Simulating last 30 days)...")
        logs = []
        now = datetime.now(timezone.utc)
        
        # Generate ~1000 logs over 30 days
        for _ in range(1000):
            # Pick a random model (weighted heavily towards chat)
            m = random.choices(models, weights=[30, 40, 10, 20, 5, 15, 10])[0]
            
            # Random time in last 30 days
            days_ago = random.uniform(0, 30)
            log_time = now - timedelta(days=days_ago)
            
            # Tokens
            t_prompt = int(random.gauss(500, 200))
            t_comp = int(random.gauss(200, 100))
            if t_prompt < 10: t_prompt = 10
            if t_comp < 10: t_comp = 10
            
            # Cost calculation
            cost_prompt = (Decimal(t_prompt) / Decimal(1000)) * m.input_cost_per_1k
            cost_comp = (Decimal(t_comp) / Decimal(1000)) * m.output_cost_per_1k
            total_cost = cost_prompt + cost_comp
            
            # Latency (simulated based on model type)
            latency = int(random.gauss(800, 200)) if m.type == ModelType.CHAT else int(random.gauss(300, 50))
            
            # Success/Failure (98% success)
            status_code = 200 if random.random() > 0.02 else random.choice([429, 500, 503])
            
            logs.append(AIUsageLog(
                tenant_id=tenant.id,
                model_id=m.id,
                provider_id=m.provider_id,
                task_type=random.choice(["default_chat", "excel_generation", "fast_embeddings", "classification"]),
                tokens_prompt=t_prompt,
                tokens_completion=t_comp,
                tokens_total=t_prompt + t_comp,
                cost_usd=total_cost,
                latency_ms=latency,
                status_code=status_code,
                created_at=log_time
            ))
            
        db.add_all(logs)
        await db.commit()
        
        print("Done seeding AI Ops!")

if __name__ == "__main__":
    asyncio.run(seed_ai_ops())
