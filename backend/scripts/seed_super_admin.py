import asyncio
import os
import sys

# Add backend dir to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.repositories.user import UserRepository

async def seed_super_admin():
    email = os.getenv("SUPER_ADMIN_EMAIL", "hetsony143@example.com")
    password = os.getenv("SUPER_ADMIN_PASSWORD", "SuperSecurePassword123!")
    
    async with AsyncSessionLocal() as session:
        repo = UserRepository(session)
        existing_user = await repo.get_by_email(email)
        
        if existing_user:
            print(f"Super admin {email} already exists. Updating role to super_admin.")
            existing_user.role = UserRole.super_admin
            existing_user.is_superuser = True
            existing_user.is_active = True
            existing_user.is_email_verified = True
            await session.commit()
            return
            
        print(f"Creating super admin account for {email}...")
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="Platform Owner",
            role=UserRole.super_admin,
            is_superuser=True,
            is_active=True,
            is_email_verified=True
        )
        session.add(user)
        await session.commit()
        print(f"Successfully created super admin {email}.")

if __name__ == "__main__":
    asyncio.run(seed_super_admin())
