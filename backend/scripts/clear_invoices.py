import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

async def main():
    db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/data_insight")
    if "localhost" in db_url or "127.0.0.1" in db_url:
        db_url = db_url.replace("localhost", "host.docker.internal").replace("127.0.0.1", "host.docker.internal")
    
    engine = create_async_engine(db_url)
    async with AsyncSession(engine) as session:
        # Delete dummy invoices
        await session.execute(text("DELETE FROM invoices;"))
        await session.commit()
        print("Deleted all dummy invoices from the database.")

if __name__ == "__main__":
    asyncio.run(main())
