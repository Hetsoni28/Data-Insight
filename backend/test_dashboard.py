import asyncio
import urllib.request
import json
from app.db.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.user import User
from app.core.security import create_access_token
from app.core.config import settings

async def test_endpoints():
    try:
        async with AsyncSessionLocal() as session:
            user = (await session.execute(select(User).where(User.email == 'hetprajaapti10@gmail.com'))).scalar_one()
            token = create_access_token(user.id, "access", user.token_version)
            
        headers = {"Authorization": f"Bearer {token}"}
        
        endpoints = [
            "http://localhost:8000/api/v1/manager-dashboard/overview",
            "http://localhost:8000/api/v1/manager-dashboard/kpis",
            "http://localhost:8000/api/v1/manager-dashboard/charts",
            "http://localhost:8000/api/v1/manager-dashboard/datasets",
            "http://localhost:8000/api/v1/manager-dashboard/reports",
            "http://localhost:8000/api/v1/manager-dashboard/activity",
        ]
        
        for url in endpoints:
            req = urllib.request.Request(url, headers=headers)
            try:
                with urllib.request.urlopen(req) as response:
                    print(f"{url} -> {response.status}")
            except urllib.error.HTTPError as e:
                print(f"{url} -> {e.code}")
                print(e.read().decode())
            except Exception as e:
                print(f"{url} -> Error: {e}")
    except Exception as e:
        print(f"Failed completely: {e}")

asyncio.run(test_endpoints())
