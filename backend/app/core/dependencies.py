# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.db.session import get_async_session

security = HTTPBearer()


async def get_db() -> AsyncSession:
    """
    Dependency: Injects a scoped async database session.
    Session is automatically closed after the request completes.
    """
    async with get_async_session() as session:
        yield session


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Dependency: Validates JWT and returns the current authenticated user context.
    Raises UnauthorizedException if the token is missing, expired, or invalid.

    Returns a dict with: user_id, tenant_id, email, role
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise UnauthorizedException("Your session has expired. Please log in again.")

    if payload.get("type") != "access":
        raise UnauthorizedException("Invalid token type.")

    user_id = payload.get("sub")
    tenant_id = payload.get("tenant_id")

    if not user_id or not tenant_id:
        raise UnauthorizedException("Invalid authentication token.")

    return {
        "user_id": user_id,
        "tenant_id": tenant_id,
        "email": payload.get("email"),
        "role": payload.get("role", "member"),
    }


async def get_current_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency: Ensures the current user is an Admin or Owner.
    Used to protect admin-only endpoints.
    """
    if current_user["role"] not in ("admin", "owner"):
        raise ForbiddenException("Admin access required for this action.")
    return current_user


async def get_current_owner(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency: Ensures the current user is an Owner.
    Used to protect Owner-only endpoints (e.g., delete organization, billing).
    """
    if current_user["role"] != "owner":
        raise ForbiddenException("Owner access required for this action.")
    return current_user


async def get_super_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency: Ensures the current user is a Super Admin (platform operator).
    Used to protect the /admin super panel endpoints.
    """
    if current_user.get("is_super_admin") is not True:
        raise ForbiddenException("Super admin access required.")
    return current_user
