"""FastAPI dependency injection — auth, DB session, Redis, current user."""

from typing import AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import Depends, Header, Request
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
    """
    FastAPI dependency that provides a scoped AsyncSession.
    Uses async_sessionmaker context manager directly to avoid the
    'generator didn't stop after athrow()' RuntimeError in Python 3.12+.
    The AsyncSessionLocal context manager handles closing the session on exit.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ─── Current User ─────────────────────────────────────────────────────────────
async def get_current_user(
    request: Request,
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

    # Record or touch real active user session
    try:
        import hashlib
        from datetime import datetime, timezone, timedelta
        from sqlalchemy import select
        from app.models.user_session import UserSession

        token_hash = hashlib.sha256(token.encode()).hexdigest()
        session_stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        existing_session = (await db.execute(session_stmt)).scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if existing_session:
            existing_session.last_active_at = now
            existing_session.is_active = True
        else:
            user_agent = request.headers.get("user-agent", "")
            client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "127.0.0.1")
            if "," in client_ip:
                client_ip = client_ip.split(",")[0].strip()

            device = "Desktop"
            os_name = "Windows"
            browser_name = "Chrome"
            if user_agent:
                ua = user_agent.lower()
                if "mac" in ua:
                    os_name = "macOS"
                    device = "MacBook"
                elif "android" in ua:
                    os_name = "Android"
                    device = "Android Device"
                elif "iphone" in ua or "ios" in ua:
                    os_name = "iOS"
                    device = "iPhone"
                elif "linux" in ua:
                    os_name = "Linux"
                    device = "Linux PC"

                if "edg" in ua:
                    browser_name = "Edge"
                elif "firefox" in ua:
                    browser_name = "Firefox"
                elif "safari" in ua and "chrome" not in ua:
                    browser_name = "Safari"
                elif "chrome" in ua:
                    browser_name = "Chrome"

            new_session = UserSession(
                user_id=user.id,
                token_hash=token_hash,
                device_name=device,
                os=os_name,
                browser=browser_name,
                location="Localhost" if client_ip in ["127.0.0.1", "::1"] else "Remote",
                ip_address=client_ip or "127.0.0.1",
                user_agent=user_agent,
                is_active=True,
                expires_at=now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                last_active_at=now,
            )
            db.add(new_session)
        await db.commit()
    except Exception:
        pass

    return user


async def get_current_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Requires the user to be a platform super-admin or owner."""
    if not (current_user.is_superuser or current_user.is_owner or current_user.role == "owner"):
        from app.core.exceptions import ForbiddenException

        raise ForbiddenException("Super-admin or Owner access required.")
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

get_current_org_admin = RequireRole(["org_admin"])
get_current_editor = RequireRole(["org_admin", "editor"])
