import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

from app.core.config import settings
from app.db.session import Base
from app.models.security import SecurityEvent, ThreatIntelligence, ComplianceReport
from app.models.user_session import UserSession
from app.models.user import User

import app.models.__init__

async def seed_security():
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    print("Creating Security tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        print("Cleaning existing security data...")
        await db.execute(text("TRUNCATE TABLE security_events CASCADE"))
        await db.execute(text("TRUNCATE TABLE threat_intelligence CASCADE"))
        await db.execute(text("TRUNCATE TABLE compliance_reports CASCADE"))
        await db.execute(text("TRUNCATE TABLE user_sessions CASCADE"))
        await db.commit()

        # Get a user to attach sessions to
        result = await db.execute(text("SELECT id FROM users LIMIT 1"))
        user_id_row = result.first()
        user_id = user_id_row[0] if user_id_row else uuid.uuid4()

        print("Seeding Compliance Reports...")
        frameworks = [
            {"framework": "SOC 2 Type II", "status": "compliant", "score": 100, "passed": 145, "failed": 0},
            {"framework": "GDPR", "status": "warning", "score": 85, "passed": 85, "failed": 15},
            {"framework": "HIPAA", "status": "compliant", "score": 98, "passed": 240, "failed": 4},
            {"framework": "ISO 27001", "status": "unaudited", "score": 50, "passed": 0, "failed": 0}
        ]
        
        for fw in frameworks:
            cr = ComplianceReport(
                framework=fw["framework"],
                status=fw["status"],
                score=fw["score"],
                controls_passed=fw["passed"],
                controls_failed=fw["failed"],
                last_audit_at=datetime.now(timezone.utc) - timedelta(days=random.randint(10, 180)) if fw["status"] != "unaudited" else None,
                next_audit_at=datetime.now(timezone.utc) + timedelta(days=random.randint(30, 180))
            )
            db.add(cr)
            
        print("Seeding Threat Intelligence...")
        threats = []
        for i in range(20):
            ti = ThreatIntelligence(
                indicator_value=f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
                indicator_type="IP",
                threat_type=random.choice(["BruteForce", "Botnet", "Malware", "DDoS", "Proxy"]),
                country=random.choice(["RU", "CN", "KP", "IR", "BR", "UA", "VN"]),
                reputation_score=random.randint(50, 100),
                is_blocked=True,
                last_seen_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 1440))
            )
            threats.append(ti)
            db.add(ti)

        print("Seeding Security Events...")
        event_types = ["failed_login", "prompt_injection", "rate_limit_exceeded", "suspicious_token", "firewall_block", "impossible_travel"]
        for i in range(250):
            etype = random.choice(event_types)
            severity = "critical" if etype in ["prompt_injection", "impossible_travel"] else random.choice(["low", "medium", "high"])
            evt = SecurityEvent(
                event_type=etype,
                severity=severity,
                ip_address=random.choice([t.indicator_value for t in threats]) if random.random() > 0.5 else "192.168.1.1",
                location="Unknown",
                actor="anonymous" if etype == "failed_login" else f"user_{random.randint(1,100)}",
                metadata_={"reason": "Pattern matched signature"} if severity == "critical" else {},
                resolved=random.random() > 0.8,
                created_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 120))
            )
            db.add(evt)

        print("Seeding Active Sessions...")
        for i in range(15):
            sess = UserSession(
                user_id=user_id,
                token_hash=uuid.uuid4().hex,
                device_name=random.choice(["MacBook Pro", "Windows Desktop", "iPhone 14", "Pixel 7"]),
                os=random.choice(["macOS", "Windows 11", "iOS", "Android"]),
                browser=random.choice(["Chrome", "Safari", "Edge", "Firefox"]),
                location=random.choice(["New York, US", "London, UK", "Tokyo, JP", "Sydney, AU"]),
                ip_address=f"10.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(0,255)}",
                is_active=True,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7),
                last_active_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(1, 60))
            )
            db.add(sess)

        await db.commit()
        print("Security seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_security())
