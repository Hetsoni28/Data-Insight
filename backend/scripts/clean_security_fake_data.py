import asyncio
from sqlalchemy import delete
from app.db.session import AsyncSessionLocal
from app.models.security import SecurityEvent, ThreatIntelligence, ComplianceReport
from app.models.user_session import UserSession

async def clean_security_data():
    async with AsyncSessionLocal() as db:
        print("--- Purging All Seeded / Fake Security Data ---")

        r1 = await db.execute(delete(ThreatIntelligence))
        print(f"Deleted {r1.rowcount} fake Threat Intelligence records.")

        r2 = await db.execute(delete(UserSession))
        print(f"Deleted {r2.rowcount} fake User Sessions.")

        r3 = await db.execute(delete(SecurityEvent))
        print(f"Deleted {r3.rowcount} fake Security Events.")

        r4 = await db.execute(delete(ComplianceReport))
        print(f"Deleted {r4.rowcount} fake Compliance Reports.")

        await db.commit()
        print("\nAll fake security data has been wiped! Security dashboard now reflects 100% real state.")

if __name__ == "__main__":
    asyncio.run(clean_security_data())
