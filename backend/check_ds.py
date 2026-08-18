import asyncio
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT id, name, file_path FROM datasets LIMIT 2"))
        for row in res.fetchall():
            print('ID:', row[0], 'Name:', row[1])

asyncio.run(main())
