import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT id, name FROM workspaces WHERE tenant_id = '28682960-0c5e-4efe-8f32-231a773fb86c'"))
        rows = result.fetchall()
        print(f"Workspaces: {rows}")
        if not rows:
            print("Creating default workspace...")
            await session.execute(text("INSERT INTO workspaces (id, tenant_id, name, slug, is_default, is_deleted, is_active, created_at, updated_at) VALUES (gen_random_uuid(), '28682960-0c5e-4efe-8f32-231a773fb86c', 'Default Workspace', 'default-workspace', true, false, true, NOW(), NOW())"))
            await session.commit()
            print("Created Default Workspace.")

asyncio.run(check())
