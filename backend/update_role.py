import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def update_users():
    async with AsyncSessionLocal() as session:
        await session.execute(text("UPDATE users SET role = 'owner'"))
        await session.commit()
        print('Users updated to owner')

asyncio.run(update_users())
