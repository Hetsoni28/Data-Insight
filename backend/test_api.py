import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient(base_url="http://localhost:8000/api/v1") as client:
        # Login
        res = await client.post("/auth/login", data={"username": "owner@data-insight.ai", "password": "Password123"})
        if res.status_code != 200:
            print("Login failed:", res.status_code, res.text)
            return
        
        token = res.json().get("access_token")
        
        # Update prefs
        res2 = await client.patch(
            "/notifications/preferences", 
            json={"email_notifications": False},
            headers={"Authorization": f"Bearer {token}"}
        )
        print("Update prefs status:", res2.status_code)
        print("Update prefs body:", res2.text)

asyncio.run(test_api())
