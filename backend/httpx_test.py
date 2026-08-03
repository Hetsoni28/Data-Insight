import asyncio
import httpx
from sqlalchemy import select
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
import json

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).limit(1))
        user = res.scalars().first()
        if not user:
            print("No user found")
            return
            
        print("Using user:", user.email)
        
        # We need to authenticate. Wait, we can just use the AsyncClient with a token, or override the dependency!
        app.dependency_overrides = {}
        
        # We don't even need to override if we just generate a JWT for the user.
        from app.core.security import create_access_token
        from datetime import timedelta
        
        access_token_expires = timedelta(minutes=60)
        access_token = create_access_token(
            subject=user.email,
            role=user.role,
            tenant_id=user.tenant_id,
            expires_delta=access_token_expires
        )
        
        async with httpx.AsyncClient(app=app, base_url="http://test") as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # get workspace
            ws_res = await client.get("/api/v1/owner/workspaces", headers=headers)
            print("Workspaces:", ws_res.status_code, ws_res.text)
            
            if ws_res.status_code == 200 and len(ws_res.json()) > 0:
                ws_id = ws_res.json()[0]["id"]
            else:
                print("Failed to get workspace")
                return
                
            # test chat
            data = {
                "workspace_id": ws_id,
                "message": "hello test",
                "history": "[]"
            }
            # send as form data
            chat_res = await client.post("/api/v1/owner/ai/chat", headers=headers, data=data)
            print("Chat Status:", chat_res.status_code)
            print("Chat Response:", chat_res.text)

asyncio.run(main())
