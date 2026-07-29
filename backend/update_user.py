import asyncio
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.core.security import get_password_hash
from sqlalchemy import select

async def update_user():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).filter(User.email == 'hetsony143@gmail.com'))
        user = result.scalar_one_or_none()
        if user:
            user.role = 'owner'
            user.hashed_password = get_password_hash('HET@SONI28')
            await session.commit()
            print('User updated to owner with new password successfully.')
        else:
            print('User not found in DB. Creating new user...')
            new_user = User(
                email='hetsony143@gmail.com',
                hashed_password=get_password_hash('HET@SONI28'),
                first_name='Het',
                last_name='Sony',
                role='owner',
                is_active=True
            )
            session.add(new_user)
            await session.commit()
            print('User created successfully.')

asyncio.run(update_user())
