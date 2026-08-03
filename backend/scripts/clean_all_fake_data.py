import asyncio
from sqlalchemy import delete, select, func
from app.db.session import AsyncSessionLocal
from app.models.ai_ops import AIUsageLog
from app.models.audit_log import AuditLog
from app.models.api_gateway import ApiRequestLog
from app.models.security import SecurityEvent, ThreatIntelligence, ComplianceReport
from app.models.user_session import UserSession
from app.models.notification import Notification
from app.models.invoice import Invoice
from app.models.billing_activity import BillingActivity
from app.models.storage import StorageActivityLog

async def clean_all_fake_data():
    async with AsyncSessionLocal() as db:
        print("--- Cleaning Fake & Seeded Log Data ---")

        # 1. AI Usage Logs
        r1 = await db.execute(delete(AIUsageLog))
        print(f"Deleted {r1.rowcount} fake/seeded AI Usage Logs.")

        # 2. Audit Logs
        r2 = await db.execute(delete(AuditLog))
        print(f"Deleted {r2.rowcount} seeded Audit Logs.")

        # 3. API Gateway Logs
        r3 = await db.execute(delete(ApiRequestLog))
        print(f"Deleted {r3.rowcount} seeded API Request Logs.")

        # 4. Security Events, Threats, Sessions, and Compliance
        r4 = await db.execute(delete(SecurityEvent))
        print(f"Deleted {r4.rowcount} seeded Security Events.")

        r4_t = await db.execute(delete(ThreatIntelligence))
        print(f"Deleted {r4_t.rowcount} seeded Threat Intelligence records.")

        r4_s = await db.execute(delete(UserSession))
        print(f"Deleted {r4_s.rowcount} seeded User Sessions.")

        r4_c = await db.execute(delete(ComplianceReport))
        print(f"Deleted {r4_c.rowcount} seeded Compliance Reports.")

        # 5. Seeded Notifications
        r5 = await db.execute(delete(Notification))
        print(f"Deleted {r5.rowcount} seeded Notifications.")

        # 6. Seeded Billing Activity & Invoices
        r6 = await db.execute(delete(BillingActivity))
        print(f"Deleted {r6.rowcount} seeded Billing Activities.")

        r7 = await db.execute(delete(StorageActivityLog))
        print(f"Deleted {r7.rowcount} seeded Storage Activity Logs.")

        await db.commit()
        print("\nAll fake and simulated logs removed successfully! Only real data will now be recorded and displayed.")

if __name__ == "__main__":
    asyncio.run(clean_all_fake_data())
