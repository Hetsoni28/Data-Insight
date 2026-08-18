import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT file_url FROM datasets LIMIT 2"))
        for row in res.fetchall():
            print('URL:', row[0])

asyncio.run(main())
