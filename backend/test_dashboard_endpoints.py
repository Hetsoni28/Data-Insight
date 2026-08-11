import asyncio
import httpx
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token

async def test_app():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == "hetprajaapti10@gmail.com"))
        user = result.scalar_one_or_none()
        if not user:
            print("User not found")
            return
        token = create_access_token(user.id, user.role)

    endpoints = [
        "/api/v1/workspaces",
        "/api/v1/manager-dashboard/overview",
        "/api/v1/manager-dashboard/kpis",
        "/api/v1/manager-dashboard/charts",
        "/api/v1/manager-dashboard/datasets",
        "/api/v1/manager-dashboard/reports",
        "/api/v1/manager-dashboard/activity",
    ]

    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        for endpoint in endpoints:
            print(f"Testing {endpoint}...")
            resp = await client.get(
                endpoint,
                headers={"Authorization": f"Bearer {token}", "X-Tenant-ID": str(user.tenant_id)}
            )
            print(f"Status: {resp.status_code}")
            if resp.status_code != 200:
                print(f"Response: {resp.text}")

asyncio.run(test_app())
