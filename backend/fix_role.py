import asyncio
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole

async def fix_role():
    async with AsyncSessionLocal() as db:
        email = "hetprajapati10@gmail.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if user:
            print(f"Updating {email} to org_admin...")
            user.role = UserRole.org_admin
            await db.commit()
            print("Done!")
        else:
            print("User not found.")

if __name__ == "__main__":
    asyncio.run(fix_role())
