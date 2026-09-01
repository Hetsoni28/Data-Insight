import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres:postgres@localhost:5432/data_insight')
    async with AsyncSession(engine) as session:
        res = await session.execute(text('SELECT amount, status, invoice_date FROM invoices'))
        print(res.fetchall())

asyncio.run(main())
