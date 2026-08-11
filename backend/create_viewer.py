import asyncio
import uuid
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.core.security import get_password_hash

async def create_viewer():
    async with AsyncSessionLocal() as db:
        # First, make sure we have a tenant
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalars().first()
        
        if not tenant:
            print("No tenant found. Creating a default tenant...")
            tenant = Tenant(name="Default Org", slug="default-org")
            db.add(tenant)
            await db.commit()
            await db.refresh(tenant)

        email = "hetprajaapti10@gmail.com"
        password = "12345678"
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print(f"User {email} already exists. Updating role to viewer and setting password...")
            user.role = UserRole.viewer
            user.hashed_password = get_password_hash(password)
            user.tenant_id = tenant.id
        else:
            print(f"Creating new user {email} as viewer...")
            user = User(
                email=email,
                hashed_password=get_password_hash(password),
                full_name="Het Prajapati (Viewer)",
                role=UserRole.viewer,
                tenant_id=tenant.id,
                is_active=True,
                is_email_verified=True
            )
            db.add(user)
            
        await db.commit()
        print("Success! You can now log in with:")
        print(f"Email: {email}")
        print(f"Password: {password}")

if __name__ == "__main__":
    asyncio.run(create_viewer())
