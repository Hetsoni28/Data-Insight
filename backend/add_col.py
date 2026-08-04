import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def main():
    async with AsyncSessionLocal() as session:
        await session.execute(text("ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{\"email_notifications\": true, \"slack_notifications\": false, \"push_notifications\": true}'::jsonb;"))
        await session.commit()
        print('Added column')

if __name__ == "__main__":
    asyncio.run(main())
