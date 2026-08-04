import asyncio
from app.db.session import SessionLocal
from app.models.dataset import Dataset
from sqlalchemy import delete

async def clear():
    async with SessionLocal() as db:
        await db.execute(delete(Dataset))
        await db.commit()
        print('Cleared dummy datasets from PostgreSQL')

if __name__ == "__main__":
    asyncio.run(clear())
