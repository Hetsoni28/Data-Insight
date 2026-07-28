import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def show():
    async with AsyncSessionLocal() as s:
        res = await s.execute(text("SELECT email, role, tenant_id FROM users;"))
        users = res.fetchall()
        print("USERS:", users)

if __name__ == "__main__":
    asyncio.run(show())
