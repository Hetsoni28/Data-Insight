import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User

async def check_role():
    async with AsyncSessionLocal() as db:
        email = "hetprajapati10@gmail.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            print(f"User {email} role in DB is: '{user.role}'")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(check_role())
