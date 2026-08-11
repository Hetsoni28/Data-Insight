import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check_users():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT id, email, role, tenant_id FROM users"))
        for row in result:
            print(dict(row._mapping))

asyncio.run(check_users())
