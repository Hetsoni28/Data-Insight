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
        # This will delete all rows in the tenants and users tables, allowing you to register a fresh new account.
        # It does NOT delete the tables themselves.
        await conn.execute(text('DELETE FROM users;'))
        await conn.execute(text('DELETE FROM tenants CASCADE;'))
    print('All users and organizations have been deleted successfully. You can now register a new one.')

asyncio.run(run())
