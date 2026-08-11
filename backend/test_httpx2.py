import asyncio
from httpx import AsyncClient
from app.main import app
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token

async def test_app():
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.email == 'hetprajaapti10@gmail.com'))).scalar_one()
        token = create_access_token(user.id, "access", user.token_version)
    
    # Simulate frontend sending "undefined"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Tenant-ID": "undefined"
    }
    
    endpoints = [
        "/api/v1/manager-dashboard/overview",
        "/api/v1/manager-dashboard/kpis",
        "/api/v1/manager-dashboard/charts",
        "/api/v1/manager-dashboard/datasets",
        "/api/v1/manager-dashboard/reports",
        "/api/v1/manager-dashboard/activity",
    ]
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        for ep in endpoints:
            response = await ac.get(ep, headers=headers)
            print(f"{ep}: {response.status_code}")
            if response.status_code != 200:
                print(f"Error: {response.text}")

asyncio.run(test_app())
