import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def update_role():
    async with AsyncSessionLocal() as session:
        await session.execute(text("UPDATE users SET role = 'manager' WHERE email = 'het10092004@gmail.com'"))
        await session.commit()
        print('User updated to manager')

asyncio.run(update_role())
