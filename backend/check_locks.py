import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT pid, query, state FROM pg_stat_activity WHERE state != 'idle'"))
        for row in result:
            print(row)
asyncio.run(check())
