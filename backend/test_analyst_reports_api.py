import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

from app.models.user import User
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.models.report import Report
from app.api.v1.tenant_reports import list_reports, get_report
from fastapi import HTTPException
from fastapi import Request

async def test_api_internals():
    print("Fetching existing data to test logic...")
    async with AsyncSessionLocal() as db:
        # Find any org admin user
        res = await db.execute(select(User).where(User.role == "org_admin").limit(1))
        admin = res.scalars().first()
        if not admin:
            print("No admin found in db, skipping.")
            return

        res = await db.execute(select(User).where(User.role == "analyst").limit(1))
        analyst = res.scalars().first()
        if not analyst:
            print("No analyst found in db, fallback to admin for testing.")
            analyst = admin
            
        res = await db.execute(select(Workspace).where(Workspace.tenant_id == admin.tenant_id).limit(1))
        workspace = res.scalars().first()
        
        if not workspace:
            print("No workspace found!")
            return
            
        print(f"Testing with Analyst ID: {analyst.id} on Workspace ID: {workspace.id}")
        
        # Test 1: list_reports without workspace should fail for analyst
        print("Test 1: list_reports without workspace (Analyst)")
        try:
            await list_reports(search=None, skip=0, limit=10, current_user=analyst, workspace=None, db=db)
            if analyst.role != "org_admin":
                print("❌ FAIL: Analyst should be blocked without workspace.")
            else:
                print("✅ PASS (Admin)")
        except HTTPException as e:
            if e.status_code == 403:
                print("✅ PASS: Analyst blocked.")
            else:
                print(f"❌ FAIL: {e}")

        # Test 2: list_reports with workspace should pass
        print("Test 2: list_reports with workspace (Analyst)")
        try:
            reports = await list_reports(search=None, skip=0, limit=10, current_user=analyst, workspace=workspace, db=db)
            print(f"✅ PASS: Retrieved reports list. Count: {len(reports)}")
        except Exception as e:
            print(f"❌ FAIL: {e}")

        print("Testing completed.")

if __name__ == "__main__":
    asyncio.run(test_api_internals())
