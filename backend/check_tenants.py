import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check_tenant():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT id, name FROM tenants"))
        for row in result:
            print(dict(row._mapping))

asyncio.run(check_tenant())
