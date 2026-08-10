import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import json

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.begin() as conn:
        # Find the original dataset profile
        res_orig = await conn.execute(text("SELECT id, profile FROM datasets WHERE name = 'churnguard_customers_2026-07-16' AND profile IS NOT NULL LIMIT 1;"))
        orig = res_orig.fetchone()
        
        if orig:
            profile_json = json.dumps(orig[1])
            # Update all datasets that lack a profile but have the same original filename
            await conn.execute(text("UPDATE datasets SET profile = :p WHERE name LIKE '%churnguard_customers_2026-07-16 (AI Generated)%' AND profile IS NULL"), {"p": profile_json})
            print("Fixed dataset profile")
        else:
            print("Original profile not found")

asyncio.run(main())
