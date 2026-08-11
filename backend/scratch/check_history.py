import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal

async def check():
    async with AsyncSessionLocal() as session:
        # Get user id
        res = await session.execute(text("SELECT id FROM users WHERE email='hetprajapati10@gmail.com'"))
        user = res.fetchone()
        if not user:
            print("User not found.")
            return
            
        user_id = user[0]
        # Get latest login history
        stmt = text("SELECT success, failure_reason, created_at FROM login_history WHERE user_id=:uid ORDER BY created_at DESC LIMIT 3")
        res = await session.execute(stmt, {"uid": user_id})
        history = res.fetchall()
        print(f"Login history for {user_id}:")
        for h in history:
            print(f"- Success: {h[0]}, Reason: {h[1]}, Time: {h[2]}")

if __name__ == "__main__":
    asyncio.run(check())
