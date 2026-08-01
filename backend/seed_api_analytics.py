import asyncio
import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Import models
from app.db.session import Base
from app.models.api_gateway import ApiRequestLog, OAuthClient, ApiRateLimit, ApiIntegration
from app.models.api_key import ApiKey
from app.models.workspace import Workspace

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def seed_api_gateway_data():
    print("Seeding API Gateway Data...")
    async with AsyncSessionLocal() as session:
        # Get a workspace to attach things to
        from sqlalchemy import select
        workspace_result = await session.execute(select(Workspace).limit(1))
        workspace = workspace_result.scalars().first()
        
        if not workspace:
            print("No workspace found. Please create a user/workspace first.")
            return

        print(f"Using Workspace ID: {workspace.id}")

        # 1. Create Integrations
        integrations = [
            ApiIntegration(provider="stripe", is_active=True, health_status="healthy", last_sync_at=datetime.now(timezone.utc)),
            ApiIntegration(provider="openai", is_active=True, health_status="healthy", last_sync_at=datetime.now(timezone.utc)),
            ApiIntegration(provider="supabase", is_active=True, health_status="healthy", last_sync_at=datetime.now(timezone.utc)),
            ApiIntegration(provider="github", is_active=False, health_status="unknown"),
        ]
        session.add_all(integrations)

        # 2. Create Rate Limits
        rate_limits = [
            ApiRateLimit(workspace_id=None, requests_per_minute=1000, burst_capacity=2000, monthly_quota=10000000), # Global
            ApiRateLimit(workspace_id=workspace.id, requests_per_minute=100, burst_capacity=200, monthly_quota=500000, current_period_usage=125430)
        ]
        session.add_all(rate_limits)

        # 3. Create OAuth Clients
        clients = [
            OAuthClient(
                workspace_id=workspace.id, 
                client_name="Zapier Integration", 
                client_id="client_" + str(uuid.uuid4())[:8], 
                client_secret_hash="hash",
                redirect_uris=["https://zapier.com/callback"],
                scopes=["read:datasets", "write:reports"],
                usage_count=4520,
                last_used_at=datetime.now(timezone.utc) - timedelta(hours=2)
            ),
            OAuthClient(
                workspace_id=workspace.id, 
                client_name="Internal Mobile App", 
                client_id="client_" + str(uuid.uuid4())[:8], 
                client_secret_hash="hash",
                redirect_uris=["data-insight://auth"],
                scopes=["*"],
                usage_count=120500,
                last_used_at=datetime.now(timezone.utc) - timedelta(minutes=5)
            )
        ]
        session.add_all(clients)

        # 4. Generate API Keys (if none exist, we'll create some mock ones, but we should just use the workspace_id for logs)
        key_result = await session.execute(select(ApiKey).filter_by(user_id=workspace.created_by_id))
        api_keys = key_result.scalars().all()
        api_key_id = api_keys[0].id if api_keys else None

        # 5. Generate API Request Logs (last 30 days)
        print("Generating 5000 API Request Logs (this may take a moment)...")
        logs = []
        now = datetime.now(timezone.utc)
        
        endpoints = [
            "/api/v1/datasets/upload",
            "/api/v1/reports/generate",
            "/api/v1/analytics/query",
            "/api/v1/users/me",
            "/api/v1/workspaces/current"
        ]
        
        methods = ["GET", "POST", "PUT"]
        statuses = [200, 200, 200, 200, 200, 201, 201, 400, 401, 403, 404, 429, 500]
        countries = ["US", "US", "US", "GB", "DE", "IN", "JP", "CA", "AU"]
        
        for i in range(5000):
            # Time distribution: more recent = more dense
            days_ago = random.uniform(0, 30)
            log_time = now - timedelta(days=days_ago)
            
            # Latency distribution (mostly 50-200ms, some spikes)
            if random.random() < 0.95:
                latency = int(random.gauss(100, 30))
            else:
                latency = int(random.gauss(800, 200)) # Spikes
                
            latency = max(10, latency)
            
            status = random.choice(statuses)
            
            logs.append(ApiRequestLog(
                workspace_id=workspace.id,
                api_key_id=api_key_id,
                endpoint=random.choice(endpoints),
                method=random.choice(methods),
                status_code=status,
                latency_ms=latency,
                payload_size_bytes=random.randint(500, 50000),
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                country=random.choice(countries),
                user_agent="Mozilla/5.0 DataInsight-SDK/1.0",
                version="v1",
                created_at=log_time
            ))
            
        # Batch insert
        session.add_all(logs)
        await session.commit()
        print("Successfully seeded API Gateway Data!")

if __name__ == "__main__":
    asyncio.run(seed_api_gateway_data())
