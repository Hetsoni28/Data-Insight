import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.worker.tasks.dataset_tasks import _profile_dataset
from unittest.mock import MagicMock

async def main():
    engine = create_async_engine('postgresql+asyncpg://postgres.gnwoqiiqgenqtgrrdkvr:QTxvzhlfzPV181D4@aws-1-ap-south-1.pooler.supabase.com:5432/postgres')
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id FROM datasets WHERE name = 'churnguard_customers_2026-07-16';"))
        row = res.fetchone()
        
    if row:
        orig_id = row[0]
        print(f"Profiling dataset {orig_id}...")
        task_mock = MagicMock()
        await _profile_dataset(task_mock, str(orig_id))
        print("Done profiling.")
        
        # Now we need to copy it to the AI Generated one
        async with engine.begin() as conn:
            res_orig = await conn.execute(text("SELECT profile FROM datasets WHERE id = :id"), {"id": orig_id})
            profile_json = res_orig.fetchone()[0]
            
            import json
            profile_str = json.dumps(profile_json)
            await conn.execute(text("UPDATE datasets SET profile = :p WHERE name LIKE '%churnguard_customers_2026-07-16 (AI Generated)%'"), {"p": profile_str})
            print("Copied profile to AI dataset.")
            
    else:
        print("Not found")
            
asyncio.run(main())
