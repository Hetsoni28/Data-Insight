import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.begin() as conn:
        await conn.execute(text("UPDATE tenants SET plan = 'enterprise'"))
        print('Upgraded all tenants to enterprise plan')

asyncio.run(main())
