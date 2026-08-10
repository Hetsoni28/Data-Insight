import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, file_url, file_type FROM datasets WHERE name = 'churnguard_customers_2026-07-16';"))
        row = res.fetchone()
        if row:
            print(f'File URL: {row[1]}, File Type: {row[2]}')
        else:
            print('Not found')
            
asyncio.run(main())
