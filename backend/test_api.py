import asyncio
import httpx
from datetime import timedelta
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import create_access_token
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.role == 'owner').limit(1))
        user = res.scalars().first()
        if not user:
            print("No user found")
            return

        access_token_expires = timedelta(minutes=60)
        access_token = create_access_token(
            subject=user.id, # The ID is usually the subject, let's see. Wait, in auth it's usually id.
            role=user.role,
            tenant_id=user.tenant_id,
            expires_delta=access_token_expires
        )
        
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            ws_res = await client.get("/api/v1/workspaces", headers=headers)
            if ws_res.status_code == 200 and len(ws_res.json()) > 0:
                ws_id = ws_res.json()[0]["id"]
            else:
                print("Failed to get workspace", ws_res.text)
                return
            
            print("Workspace ID:", ws_id)
            
            data = {
                "workspace_id": ws_id,
                "message": "hello",
                "history": "[]"
            }
            
            chat_res = await client.post("/api/v1/owner/ai/chat", headers=headers, data=data)
            print("Chat Status:", chat_res.status_code)
            print("Chat Response:", chat_res.text)

asyncio.run(main())
