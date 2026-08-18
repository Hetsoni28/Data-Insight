import asyncio
import json
from app.db.session import engine
from sqlalchemy import text

async def main():
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT profile FROM datasets LIMIT 1"))
        for row in res.fetchall():
            print(json.dumps(row[0]['columns'], indent=2))

asyncio.run(main())
