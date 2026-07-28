import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def show():
    async with AsyncSessionLocal() as s:
        res = await s.execute(text("SELECT email, role, is_owner, account_type, tenant_id FROM users ORDER BY created_at;"))
        rows = res.fetchall()
        print("=" * 70)
        print(f"{'EMAIL':<35} {'ROLE':<12} {'OWNER':<7} {'TYPE':<14}")
        print("=" * 70)
        for r in rows:
            print(f"{r[0]:<35} {r[1]:<12} {str(r[2]):<7} {r[3]:<14}")
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(show())
