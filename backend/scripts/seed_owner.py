"""
seed_owner.py
=============
Creates the single platform OWNER account from environment variables.

Usage:
    cd backend
    $env:PYTHONPATH="."; .venv\\Scripts\\python scripts\\seed_owner.py

Requirements:
    - OWNER_EMAIL must be set in .env
    - OWNER_PASSWORD must be set in .env

Idempotent: Running this script multiple times is safe — it does nothing
if the owner already exists.
"""
import asyncio
import sys
from pathlib import Path

# Ensure app is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from loguru import logger
from app.db.session import AsyncSessionLocal
from app.core.config import settings
from app.repositories.user import UserRepository


async def seed_owner() -> None:
    if not settings.OWNER_EMAIL or not settings.OWNER_PASSWORD:
        logger.error(
            "OWNER_EMAIL and OWNER_PASSWORD must be set in .env before running this script."
        )
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        repo = UserRepository(session)

        existing = await repo.get_by_email(settings.OWNER_EMAIL)
        if existing:
            if existing.is_owner:
                logger.success(
                    f"[Seed] Owner account already exists: {settings.OWNER_EMAIL} — nothing to do."
                )
            else:
                # Promote existing account to owner (safety net)
                existing.is_owner = True
                existing.role = "owner"
                existing.is_email_verified = True
                existing.is_active = True
                existing.is_superuser = True
                await session.commit()
                logger.success(
                    f"[Seed] Existing account promoted to OWNER: {settings.OWNER_EMAIL}"
                )
            return

        owner = await repo.create_owner(
            email=settings.OWNER_EMAIL,
            password=settings.OWNER_PASSWORD,
            full_name="Het Soni",
        )
        await session.commit()

        logger.success(
            f"[Seed] OWNER account created successfully!\n"
            f"  Email:    {owner.email}\n"
            f"  Role:     {owner.role}\n"
            f"  is_owner: {owner.is_owner}\n"
            f"\n  You can now log in at http://localhost:3000/login"
        )


if __name__ == "__main__":
    asyncio.run(seed_owner())
