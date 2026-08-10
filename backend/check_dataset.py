import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, name, status, profile FROM datasets WHERE name LIKE '%churnguard%' ORDER BY created_at DESC LIMIT 1;"))
        row = res.fetchone()
        if row:
            print(f'Dataset ID: {row[0]}, Name: {row[1]}, Status: {row[2]}, Has Profile: {bool(row[3])}')
        else:
            print('No dataset found')

asyncio.run(main())
