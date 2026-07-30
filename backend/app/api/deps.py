"""FastAPI dependency injection — auth, DB session, Redis, current user."""

from typing import AsyncGenerator
from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from jose import jwt, JWTError

from app.db.session import AsyncSessionLocal
from app.db.redis import get_redis_pool
from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.models.user import User
from app.repositories.user import UserRepository


# ─── Redis ────────────────────────────────────────────────────────────────────
async def get_redis() -> AsyncGenerator[Redis, None]:
    """Yield a Redis connection. Falls back gracefully if Redis is unavailable."""
    try:
        pool = await get_redis_pool()
        redis_client = Redis(connection_pool=pool)
    except Exception:
        from loguru import logger

        logger.warning("[Redis] Not available — using in-memory OTP fallback")
        redis_client = Redis.from_url("redis://localhost:6379/0")

    try:
        yield redis_client
    finally:
        await redis_client.aclose()


# ─── DB Session ───────────────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ─── Current User ─────────────────────────────────────────────────────────────
async def get_current_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Decodes the Bearer JWT and returns the authenticated User.
    Raises UnauthorizedException if token is missing, invalid, or user not found.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("No authentication token provided.")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise UnauthorizedException("Invalid token payload.")
    except JWTError:
        raise UnauthorizedException("Token is invalid or has expired.")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found.")
    if not user.is_active:
        raise UnauthorizedException("Your account has been deactivated.")

    return user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Requires the user to be a platform super-admin."""
    if not current_user.is_superuser:
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException("Super-admin access required.")
    return current_user


async def get_current_active_tenant_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Requires the user to belong to a tenant (i.e. be fully onboarded)."""
    if not current_user.tenant_id:
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException(
            "You must belong to an organization to access this resource."
        )
    return current_user


class RequireRole:
    """
    Dependency that enforces RBAC.
    Checks if the user's role is within the allowed roles.
    The platform OWNER always passes — they have unrestricted access.
    """

    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self, current_user: User = Depends(get_current_active_tenant_user)
    ) -> User:
        # Platform OWNER bypasses all role checks
        if current_user.is_owner:
            return current_user
        if current_user.role not in self.allowed_roles:
            from app.core.exceptions import ForbiddenException

            raise ForbiddenException(
                "You do not have permission to perform this action."
            )
        return current_user
