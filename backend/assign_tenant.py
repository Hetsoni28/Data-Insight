import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def assign_tenant():
    async with AsyncSessionLocal() as session:
        await session.execute(text("UPDATE users SET tenant_id = '28682960-0c5e-4efe-8f32-231a773fb86c' WHERE tenant_id IS NULL"))
        await session.commit()
        print('Users assigned to tenant')

asyncio.run(assign_tenant())
