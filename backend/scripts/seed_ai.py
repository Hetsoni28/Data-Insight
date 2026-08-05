import asyncio
import os
import sys
import random
from datetime import datetime, timedelta, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.tenant import Tenant
from app.models.ai_token_usage import AITokenUsage
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Get tenants
        tenants = (await db.execute(select(Tenant))).scalars().all()
        if not tenants:
            print("No tenants found. Run seed_owner.py first.")
            return

        models = [
            ("gemini-3.5-flash", 0.005, 0.015, 200, 400),
            ("claude-3.5-sonnet", 0.003, 0.015, 150, 300),
            ("gemini-1.5-pro", 0.0035, 0.0105, 250, 450),
            ("llama-3-70b-instruct", 0.0007, 0.0009, 100, 200),
            ("text-embedding-3-large", 0.00013, 0.0, 50, 80),
        ]

        features = [
            "chat_copilot",
            "data_extraction",
            "report_generation",
            "sql_generation",
            "anomaly_detection"
        ]

        print("Seeding AI Token Usage...")
        
        now = datetime.now(timezone.utc)
        
        for _ in range(500):
            tenant = random.choice(tenants)
            model_info = random.choice(models)
            feature = random.choice(features)
            
            # Random date within last 30 days
            days_ago = random.randint(0, 30)
            created_at = now - timedelta(days=days_ago, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            prompt_tokens = random.randint(50, 2000)
            completion_tokens = random.randint(10, 1500) if "embedding" not in model_info[0] else 0
            
            cost = (prompt_tokens / 1000) * model_info[1] + (completion_tokens / 1000) * model_info[2]
            
            # Simulate latency
            base_latency = random.randint(model_info[3], model_info[4])
            latency_ms = base_latency + (prompt_tokens + completion_tokens) * 0.1
            
            # Simulate status code
            status_code = 200
            if random.random() < 0.03: # 3% failure rate
                status_code = random.choice([400, 429, 500, 503])
                
            usage = AITokenUsage(
                tenant_id=tenant.id,
                user_id=None,
                feature=feature,
                model=model_info[0],
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                cost_usd=cost,
                latency_ms=latency_ms,
                status_code=status_code
            )
            usage.created_at = created_at
            
            db.add(usage)
            
        await db.commit()
        print("Successfully seeded 500 AI usage records.")

if __name__ == "__main__":
    asyncio.run(main())
