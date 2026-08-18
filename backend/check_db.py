import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in res.fetchall()]
        print('Tables:', tables)
        
        if 'report_bookmarks' in tables:
            print('SUCCESS: report_bookmarks is in the database!')
        else:
            print('ERROR: report_bookmarks is NOT in the database!')

asyncio.run(main())
