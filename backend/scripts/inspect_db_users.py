import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.workspace import Workspace

async def inspect():
    async with AsyncSessionLocal() as session:
        users = (await session.execute(select(User))).scalars().all()
        print("=== USERS ===")
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | TenantID: {u.tenant_id} | is_active: {u.is_active} | is_owner: {u.is_owner} | is_superuser: {u.is_superuser}")

        tenants = (await session.execute(select(Tenant))).scalars().all()
        print("\n=== TENANTS ===")
        for t in tenants:
            print(f"ID: {t.id} | Name: {t.name} | Slug: {t.slug} | Plan: {t.plan} | is_active: {t.is_active}")

        workspaces = (await session.execute(select(Workspace))).scalars().all()
        print("\n=== WORKSPACES ===")
        for w in workspaces:
            print(f"ID: {w.id} | Name: {w.name} | TenantID: {w.tenant_id}")

if __name__ == "__main__":
    asyncio.run(inspect())
