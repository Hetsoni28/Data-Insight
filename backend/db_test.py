import asyncio
import json
from app.db.session import async_session
from app.models.user import User
from sqlalchemy import select

async def main():
    async with async_session() as db:
        stmt = select(User).limit(1)
        res = await db.execute(stmt)
        user = res.scalars().first()
        if user:
            print("Found user:", user.email)
        else:
            print("No users found")

asyncio.run(main())
