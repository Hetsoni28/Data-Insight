import asyncio
from app.db.session import AsyncSessionLocal
from app.repositories.user import UserRepository
from sqlalchemy import select
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        user = result.scalars().first()
        print(f"User ID: {user.id}")
        print(f"Preferences before: {user.notification_preferences}")
        
        existing = user.notification_preferences or {}
        # Make a copy so SQLAlchemy detects the change!
        new_prefs = dict(existing)
        new_prefs.update({"email_notifications": False})
        user.notification_preferences = new_prefs
        
        await session.commit()
        
        result = await session.execute(select(User).limit(1))
        user2 = result.scalars().first()
        print(f"Preferences after: {user2.notification_preferences}")

if __name__ == "__main__":
    asyncio.run(main())
