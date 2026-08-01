import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.core.config import settings
from app.db.session import Base
from app.models.audit_log import AuditLog

import app.models.__init__

async def seed_audit():
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Recreating AuditLog table to apply new enterprise fields...")
    async with engine.begin() as conn:
        # Drop and recreate just audit_logs
        await conn.run_sync(Base.metadata.tables['audit_logs'].drop, checkfirst=True)
        await conn.run_sync(Base.metadata.tables['audit_logs'].create)

    async with async_session() as db:
        print("Seeding Enterprise Audit Logs...")
        
        modules = ['authentication', 'api', 'ai', 'billing', 'storage', 'integration', 'security']
        actions = {
            'authentication': ['user.login.success', 'user.login.failed', 'user.mfa.setup', 'user.logout', 'session.revoked'],
            'api': ['api_key.created', 'api_key.revoked', 'rate_limit.exceeded', 'request.blocked'],
            'ai': ['model.inference', 'prompt.injected', 'token_limit.exceeded'],
            'billing': ['invoice.paid', 'invoice.failed', 'subscription.upgraded'],
            'storage': ['file.uploaded', 'file.deleted', 'bucket.created'],
            'integration': ['webhook.fired', 'connection.established', 'sync.failed'],
            'security': ['firewall.blocked', 'ip.blacklisted', 'threat.detected']
        }
        
        for i in range(1000):
            mod = random.choice(modules)
            act = random.choice(actions[mod])
            
            severity = 'info'
            status = 'success'
            
            if 'failed' in act or 'exceeded' in act or 'blocked' in act or 'injected' in act:
                status = 'failure'
                severity = 'critical' if 'injected' in act or 'threat' in act else 'warning'
                
            correlation_id = uuid.uuid4().hex if random.random() > 0.5 else None
                
            log = AuditLog(
                action=act,
                module=mod,
                severity=severity,
                status=status,
                ip_address=f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
                correlation_id=correlation_id,
                old_value={"state": "active"} if random.random() > 0.8 else None,
                new_value={"state": "inactive"} if random.random() > 0.8 else None,
                created_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 43200)) # up to 30 days ago
            )
            db.add(log)

        await db.commit()
        print("Audit seeding completed successfully! Generated 1,000 enterprise logs.")

if __name__ == "__main__":
    asyncio.run(seed_audit())
