import asyncio
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import Base
from app.models.feature_flag import FeatureFlag, FeatureRollout, FeatureExperiment

import app.models.__init__

async def seed_features():
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Recreating Feature Flag tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.tables['feature_experiments'].drop, checkfirst=True)
        await conn.run_sync(Base.metadata.tables['feature_rollouts'].drop, checkfirst=True)
        await conn.run_sync(Base.metadata.tables['feature_flags'].drop, checkfirst=True)
        
        await conn.run_sync(Base.metadata.tables['feature_flags'].create)
        await conn.run_sync(Base.metadata.tables['feature_rollouts'].create)
        await conn.run_sync(Base.metadata.tables['feature_experiments'].create)

    async with async_session() as db:
        print("Seeding Enterprise Feature Flags...")
        
        flags_data = [
            # Global Flags
            {"key": "ai_excel_generator", "name": "AI Excel Generator", "desc": "Generates complex Excel spreadsheets using AI", "enabled": True, "env": "production", "tags": {"module": "ai"}},
            {"key": "public_api_v2", "name": "Public API V2", "desc": "New high-performance public API endpoints", "enabled": True, "env": "production", "tags": {"module": "api"}},
            {"key": "advanced_forecasting", "name": "Advanced Time-Series Forecasting", "desc": "Proprietary forecasting models", "enabled": False, "env": "production", "tags": {"module": "ai"}},
            {"key": "realtime_collaboration", "name": "Realtime Dashboard Collaboration", "desc": "Multiplayer editing for dashboards", "enabled": True, "env": "production", "tags": {"module": "collaboration"}},
            {"key": "dark_mode_v2", "name": "Dark Mode V2", "desc": "Refined dark mode color palette", "enabled": False, "env": "production", "tags": {"module": "ui"}},
            {"key": "slack_integration", "name": "Slack Integration", "desc": "Send alerts and reports to Slack", "enabled": True, "env": "production", "tags": {"module": "integration"}},
            
            # Rollouts
            {"key": "canary_new_billing", "name": "Stripe V2 Billing System", "desc": "New Stripe checkout and billing engine", "enabled": True, "env": "production", "tags": {"module": "billing"}},
            {"key": "role_based_dashboards", "name": "Role-Based Dashboards", "desc": "Custom dashboards per RBAC role", "enabled": True, "env": "production", "tags": {"module": "ui"}},
            
            # Experiments
            {"key": "onboarding_flow_v2", "name": "New User Onboarding", "desc": "Streamlined onboarding flow", "enabled": True, "env": "production", "tags": {"module": "growth"}},
        ]
        
        flag_objects = {}
        
        for data in flags_data:
            flag = FeatureFlag(
                id=uuid.uuid4(),
                key=data["key"],
                name=data["name"],
                description=data["desc"],
                is_enabled=data["enabled"],
                environment=data["env"],
                tags=data["tags"]
            )
            db.add(flag)
            flag_objects[data["key"]] = flag
            
        await db.flush() # flush to get IDs

        # Seed Rollouts
        rollouts = [
            FeatureRollout(flag_id=flag_objects["canary_new_billing"].id, rollout_percentage=10, target_roles={"roles": ["owner"]}, target_organizations=None),
            FeatureRollout(flag_id=flag_objects["role_based_dashboards"].id, rollout_percentage=50, target_roles=None, target_organizations=None),
            FeatureRollout(flag_id=flag_objects["advanced_forecasting"].id, rollout_percentage=0, target_roles=None, target_organizations=None),
        ]
        for r in rollouts:
            db.add(r)
            
        # Seed Experiments
        experiments = [
            FeatureExperiment(
                flag_id=flag_objects["onboarding_flow_v2"].id,
                name="Onboarding Conversion Test",
                traffic_allocation=50,
                variation_a_success=1420,
                variation_b_success=1650,
                status="running"
            ),
            FeatureExperiment(
                flag_id=flag_objects["dark_mode_v2"].id,
                name="Dark Mode Contrast Test",
                traffic_allocation=20,
                variation_a_success=500,
                variation_b_success=520,
                status="completed"
            )
        ]
        for e in experiments:
            db.add(e)

        await db.commit()
        print("Feature seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_features())
