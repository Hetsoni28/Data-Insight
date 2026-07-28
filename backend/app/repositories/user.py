from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, UserRole, AccountType
from app.schemas.user import UserCreate
from app.core.security import get_password_hash
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(self, user_in: UserCreate) -> User:
        # Auto-assign role based on account_type
        # individual → viewer (can be elevated later via invitation)
        # organization → viewer for now; org_admin assigned after org creation in onboarding
        role = UserRole.viewer
        account_type = getattr(user_in, "account_type", AccountType.individual)

        db_user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=get_password_hash(user_in.password),
            role=role,
            account_type=account_type,
            is_owner=False,
        )
        return await self.save(db_user)

    async def create_owner(
        self,
        email: str,
        password: str,
        full_name: str | None = None,
    ) -> User:
        """
        Create the single platform OWNER account.
        Sets is_owner=True, role=owner, bypasses email verification.
        Should only be called from seed_owner.py.
        """
        db_user = User(
            email=email,
            full_name=full_name or "Platform Owner",
            hashed_password=get_password_hash(password),
            role=UserRole.owner,
            account_type=AccountType.individual,
            is_owner=True,
            is_email_verified=True,
            is_active=True,
            is_superuser=True,
        )
        return await self.save(db_user)
