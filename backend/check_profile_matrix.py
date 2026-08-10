import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT profile FROM datasets WHERE name = 'churnguard_customers_2026-07-16' AND profile IS NOT NULL LIMIT 1;"))
        orig = res.fetchone()
        
        if orig:
            profile = orig[0]
            print(f"Correlation Matrix: {profile.get('correlation_matrix')}")
            print(f"Numerical cols: {profile.get('numerical_columns')}")
            print(f"Profile keys: {profile.keys()}")
        else:
            print("Original profile not found")

asyncio.run(main())
