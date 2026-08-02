import asyncio
import asyncpg
from app.core.config import settings

async def main():
    conn = await asyncpg.connect(settings.DATABASE_URL.replace("+asyncpg", ""))
    await conn.execute("DROP SCHEMA public CASCADE")
    await conn.execute("CREATE SCHEMA public")
    print("Schema reset complete.")
    await conn.close()

asyncio.run(main())
