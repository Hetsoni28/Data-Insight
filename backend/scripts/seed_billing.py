import asyncio
import uuid
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Adjust path so we can import from app
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db.session import AsyncSessionLocal
from app.models.tenant import Tenant, PlanType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.billing_activity import BillingActivity

async def seed_billing():
    async with AsyncSessionLocal() as db:
        print("Fetching tenants...")
        tenants = (await db.execute(select(Tenant))).scalars().all()
        
        if not tenants:
            print("No tenants found to seed billing data for.")
            return

        now = datetime.now(timezone.utc)
        print(f"Seeding billing data for {len(tenants)} tenants...")

        plan_prices = {
            PlanType.starter: 29.0,
            PlanType.professional: 99.0,
            PlanType.enterprise: 499.0,
            PlanType.custom: 1000.0
        }

        for tenant in tenants:
            # Set MRR and billing cycle
            base_mrr = plan_prices.get(tenant.plan, 29.0)
            
            # Small random variation for some users who have "add-ons"
            addon = random.choice([0, 0, 10, 50, 100])
            tenant.mrr = base_mrr + addon
            tenant.billing_cycle = random.choice(["monthly", "monthly", "monthly", "yearly"])
            
            if tenant.created_at is None:
                tenant.created_at = now - timedelta(days=random.randint(10, 200))
                
            tenant_age_days = (now - tenant.created_at).days
            months_active = max(1, min(12, tenant_age_days // 30))

            # Create Billing Activity for subscription creation
            db.add(BillingActivity(
                tenant_id=tenant.id,
                event_type="subscription_created",
                description=f"Subscribed to {tenant.plan.upper()} plan",
                created_at=tenant.created_at
            ))

            # Generate historical invoices
            for i in range(months_active):
                invoice_date = tenant.created_at + timedelta(days=i*30)
                if invoice_date > now:
                    continue
                
                # Monthly invoice
                amount = tenant.mrr if tenant.billing_cycle == "monthly" else tenant.mrr * 12
                # If yearly, only generate on 1st month or anniversary
                if tenant.billing_cycle == "yearly" and i % 12 != 0:
                    continue

                status = InvoiceStatus.paid
                
                # Maybe the last one is pending or failed if it's very recent
                if (now - invoice_date).days < 3:
                    status = random.choice([InvoiceStatus.paid, InvoiceStatus.pending, InvoiceStatus.failed])

                invoice = Invoice(
                    tenant_id=tenant.id,
                    amount=amount,
                    currency="USD",
                    status=status,
                    billing_reason="subscription_cycle",
                    period_start=invoice_date,
                    period_end=invoice_date + timedelta(days=30 if tenant.billing_cycle == "monthly" else 365),
                    invoice_date=invoice_date,
                    due_date=invoice_date + timedelta(days=7),
                    created_at=invoice_date
                )
                db.add(invoice)

                if status == InvoiceStatus.failed:
                    db.add(BillingActivity(
                        tenant_id=tenant.id,
                        event_type="payment_failed",
                        description=f"Payment of ${amount} failed",
                        created_at=invoice_date + timedelta(days=1)
                    ))
                elif status == InvoiceStatus.paid:
                    db.add(BillingActivity(
                        tenant_id=tenant.id,
                        event_type="payment_received",
                        description=f"Payment of ${amount} received",
                        created_at=invoice_date + timedelta(days=1)
                    ))

        print("Committing to database...")
        await db.commit()
        print("Billing seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_billing())
