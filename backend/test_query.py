import sys
import os
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, text

sys.path.append(os.path.dirname(__file__))
from app.db.session import AsyncSessionLocal
from app.api.v1.owner_analytics import get_revenue_analytics
from app.models.user import User

async def run():
    async with AsyncSessionLocal() as session:
        user = User(role="owner")
        try:
            res = await get_revenue_analytics(session, user)
            print("SUCCESS:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(run())
