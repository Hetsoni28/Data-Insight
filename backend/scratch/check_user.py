import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT email, role, account_type, is_active FROM users WHERE email='hetprajapati10@gmail.com'"))
        user = result.fetchone()
        print(f"User found: {user}")

if __name__ == "__main__":
    asyncio.run(check())
