import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.core.config import settings
from app.db.session import Base
from app.models.integration import IntegrationConnection, IntegrationLog, AutomationWorkflow
from app.models.webhook import Webhook

# Need to ensure all models are imported before creating tables
from app.models.user import User
from app.models.tenant import Tenant
import app.models.__init__

async def seed_integrations():
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Creating Integration tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        print("Cleaning existing integration data...")
        await db.execute(text("TRUNCATE TABLE integration_logs CASCADE"))
        await db.execute(text("TRUNCATE TABLE integration_connections CASCADE"))
        await db.execute(text("TRUNCATE TABLE automation_workflows CASCADE"))
        await db.commit()

        # Get a tenant to attach webhooks to
        result = await db.execute(text("SELECT id FROM tenants LIMIT 1"))
        tenant_id_row = result.first()
        tenant_id = tenant_id_row[0] if tenant_id_row else uuid.uuid4()

        # 1. Seed Integrations
        print("Seeding Integrations...")
        providers = [
            {"name": "AWS Production Account", "provider": "AWS", "category": "Cloud", "auth_type": "IAM_Role", "status": "online", "health": 100.0, "latency": 15},
            {"name": "Azure Integration Services", "provider": "Azure", "category": "Cloud", "auth_type": "OAuth2", "status": "online", "health": 98.5, "latency": 45},
            {"name": "Stripe Global", "provider": "Stripe", "category": "Payment", "auth_type": "API_Key", "status": "online", "health": 100.0, "latency": 120},
            {"name": "Salesforce CRM Sync", "provider": "Salesforce", "category": "CRM", "auth_type": "OAuth2", "status": "degraded", "health": 82.4, "latency": 450},
            {"name": "OpenAI Core", "provider": "OpenAI", "category": "AI", "auth_type": "API_Key", "status": "online", "health": 99.9, "latency": 320},
            {"name": "Anthropic Claude", "provider": "Anthropic", "category": "AI", "auth_type": "API_Key", "status": "online", "health": 99.5, "latency": 410},
            {"name": "Snowflake Data Warehouse", "provider": "Snowflake", "category": "Analytics", "auth_type": "OAuth2", "status": "online", "health": 100.0, "latency": 210},
            {"name": "Supabase Postgres", "provider": "Supabase", "category": "Database", "auth_type": "API_Key", "status": "online", "health": 99.9, "latency": 40},
            {"name": "Datadog APM", "provider": "Datadog", "category": "Monitoring", "auth_type": "API_Key", "status": "online", "health": 100.0, "latency": 15},
            {"name": "GitHub Actions Sync", "provider": "GitHub", "category": "Developer Tools", "auth_type": "OAuth2", "status": "offline", "health": 60.5, "latency": 0},
            {"name": "Resend Transactional", "provider": "Resend", "category": "Email", "auth_type": "API_Key", "status": "online", "health": 99.9, "latency": 80},
            {"name": "PostHog Product Analytics", "provider": "PostHog", "category": "Analytics", "auth_type": "API_Key", "status": "online", "health": 100.0, "latency": 95},
        ]
        
        connections = []
        for p in providers:
            conn = IntegrationConnection(
                name=p["name"],
                provider=p["provider"],
                category=p["category"],
                auth_type=p["auth_type"],
                status=p["status"],
                health_score=p["health"],
                latency_ms=p["latency"],
                error_rate=random.uniform(0, 0.05) if p["status"] == "online" else random.uniform(0.1, 0.5),
                last_sync_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 60))
            )
            connections.append(conn)
            db.add(conn)
            
        await db.flush()
        
        # 2. Seed Logs
        print("Seeding Integration Logs...")
        logs = []
        for i in range(500):
            conn = random.choice(connections)
            status_code = 200 if random.random() > conn.error_rate else random.choice([400, 401, 403, 429, 500, 503])
            log = IntegrationLog(
                integration_id=conn.id,
                request_method=random.choice(["GET", "POST", "PUT", "DELETE"]),
                endpoint=f"/api/v1/{conn.category.lower()}/{random.choice(['sync', 'update', 'query', 'status'])}",
                status_code=status_code,
                latency_ms=random.randint(max(10, conn.latency_ms - 50), conn.latency_ms + 200),
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 720))
            )
            logs.append(log)
            
        db.add_all(logs)
        
        # 3. Seed Workflows
        print("Seeding Automation Workflows...")
        workflows = [
            {"name": "New User Onboarding", "type": "event", "success": 99.5},
            {"name": "Nightly Data Sync -> Snowflake", "type": "schedule", "success": 100.0},
            {"name": "Failed Payment Alert to Slack", "type": "webhook", "success": 98.2},
            {"name": "AI Request Fallback Router", "type": "event", "success": 99.9},
            {"name": "Salesforce Lead Enrichment", "type": "webhook", "success": 89.5},
        ]
        
        for w in workflows:
            wf = AutomationWorkflow(
                name=w["name"],
                description=f"Automated workflow for {w['name']}",
                trigger_type=w["type"],
                trigger_config={"schedule": "0 0 * * *"} if w["type"] == "schedule" else {"event": "user.created"},
                actions=[{"type": "api_call", "provider": "Slack"}, {"type": "email", "provider": "Resend"}],
                status="active" if w["success"] > 90 else "error",
                success_rate=w["success"],
                execution_count=random.randint(1000, 50000),
                last_executed_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 1440))
            )
            db.add(wf)

        # 4. Seed Webhooks
        print("Seeding Webhooks...")
        await db.execute(text("TRUNCATE TABLE webhooks CASCADE"))
        webhook_data = [
            {"name": "Stripe Charge Failed", "url": "https://api.stripe.com/v1/webhooks"},
            {"name": "GitHub Push Events", "url": "https://api.github.com/webhooks"},
            {"name": "Salesforce Opportunity Updated", "url": "https://company.my.salesforce.com/services/apexrest/webhook"},
            {"name": "Supabase Auth Hooks", "url": "https://project.supabase.co/functions/v1/auth"}
        ]
        
        for wd in webhook_data:
            wh = Webhook(
                tenant_id=tenant_id,
                name=wd["name"],
                url=wd["url"],
                secret="whsec_" + uuid.uuid4().hex[:24],
                events=["*"],
                is_active=True,
                last_triggered_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 120))
            )
            db.add(wh)

        await db.commit()
        print("Integration seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_integrations())
