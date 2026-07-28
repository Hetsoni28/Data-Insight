import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv('DATABASE_URL')
engine = create_async_engine(db_url)

async def run():
    async with engine.begin() as conn:
        res = await conn.execute(text('SELECT count(*) FROM users;'))
        print("Users:", res.scalar())
        res = await conn.execute(text('SELECT count(*) FROM tenants;'))
        print("Tenants:", res.scalar())
        res = await conn.execute(text('SELECT count(*) FROM workspaces;'))
        print("Workspaces:", res.scalar())

asyncio.run(run())
