import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant

async def fix_tenant():
    async with AsyncSessionLocal() as db:
        email = "hetprajapati10@gmail.com"
        
        # Get first tenant
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalars().first()
        
        if not tenant:
            print("Creating default tenant...")
            tenant = Tenant(name="Default Org", slug="default-org")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)
            
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            print(f"Setting tenant_id {tenant.id} for user {email}")
            user.tenant_id = tenant.id
            await db.commit()
            print("Done!")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(fix_tenant())
