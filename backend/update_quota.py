import asyncio
from app.db.session import AsyncSessionLocal
from app.models.tenant import Tenant
from sqlalchemy import update

async def main():
    async with AsyncSessionLocal() as db:
        await db.execute(update(Tenant).values(plan='enterprise', max_ai_tokens_per_month=1000000000, current_ai_tokens_used=0))
        await db.commit()
        print('Quota upgraded!')

if __name__ == "__main__":
    asyncio.run(main())
