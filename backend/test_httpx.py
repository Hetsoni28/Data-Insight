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
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/manager-dashboard/overview", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Body: {response.text}")
        
        # If 500, we can temporarily disable the global exception handler in app to see the traceback
        # Actually, httpx with ASGI app might raise the exception directly if we don't use the error handlers, 
        # but let's just trigger it.

asyncio.run(test_app())
