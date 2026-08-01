import asyncio
import random
from datetime import datetime, timezone, timedelta
from app.db.session import AsyncSessionLocal
from sqlalchemy.future import select
from app.models.tenant import Tenant
from app.models.webhook import Webhook
from app.models.operating_expense import OperatingExpense
from app.models.webhook_delivery import WebhookDeliveryLog

async def seed_new_models():
    async with AsyncSessionLocal() as db:
        # Get all tenants
        result = await db.execute(select(Tenant))
        tenants = result.scalars().all()
        if not tenants:
            print("No tenants found.")
            return
            
        print(f"Found {len(tenants)} tenants. Seeding operating expenses...")
        
        # Seed Operating Expenses for each tenant over the last 6 months
        categories = ["server", "software", "payroll", "marketing"]
        now = datetime.now(timezone.utc)
        
        for tenant in tenants:
            for month_offset in range(6):
                date_val = now - timedelta(days=30 * month_offset)
                
                # Server cost
                db.add(OperatingExpense(
                    tenant_id=tenant.id,
                    category="server",
                    description="AWS Cloud Hosting",
                    amount=round(random.uniform(150.0, 500.0), 2),
                    expense_date=date_val,
                    created_at=date_val
                ))
                
                # Software cost
                db.add(OperatingExpense(
                    tenant_id=tenant.id,
                    category="software",
                    description="SaaS Subscriptions",
                    amount=round(random.uniform(50.0, 200.0), 2),
                    expense_date=date_val,
                    created_at=date_val
                ))
                
        # Get webhooks
        result = await db.execute(select(Webhook))
        webhooks = result.scalars().all()
        print(f"Found {len(webhooks)} webhooks. Seeding delivery logs...")
        
        for webhook in webhooks:
            # Create 10 logs per webhook over last 24h
            for i in range(10):
                date_val = now - timedelta(hours=random.randint(1, 24))
                success = random.random() > 0.1 # 90% success rate
                db.add(WebhookDeliveryLog(
                    webhook_id=webhook.id,
                    tenant_id=webhook.tenant_id,
                    status_code=200 if success else random.choice([400, 500, 502]),
                    success=success,
                    latency_ms=random.randint(50, 400),
                    retry_count=random.randint(0, 3) if not success else 0,
                    error_message=None if success else "Connection Timeout",
                    executed_at=date_val
                ))
                
        await db.commit()
        print("Done seeding new models.")

if __name__ == "__main__":
    asyncio.run(seed_new_models())
