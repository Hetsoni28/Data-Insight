import asyncio, sys, json
sys.path.insert(0, '/app')
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def run():
    async with AsyncSessionLocal() as db:
        result = await db.execute(text("SELECT name, profile FROM datasets WHERE name ILIKE '%churn%' ORDER BY created_at DESC LIMIT 1"))
        row = result.fetchone()
        if row:
            print('Dataset:', row[0])
            profile = row[1]
            if profile:
                cols = profile.get('columns', {})
                print(f'Total columns: {len(cols)}')
                for cname, cinfo in list(cols.items())[:15]:
                    print(f'  {cname}: type={cinfo.get("type")}, mean={cinfo.get("mean")}, std={cinfo.get("std")}, sample={cinfo.get("sample_values", [])[:3]}')
            else:
                print('NO PROFILE')
        else:
            print('No dataset found')
            result2 = await db.execute(text("SELECT name, status FROM datasets ORDER BY created_at DESC LIMIT 5"))
            for r in result2.fetchall():
                print(f'  {r[0]} - {r[1]}')

asyncio.run(run())
