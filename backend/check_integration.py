import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT * FROM integration_connections LIMIT 1"))
        for row in result:
            print(row)
asyncio.run(check())
