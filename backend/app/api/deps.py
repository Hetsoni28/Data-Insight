"""FastAPI dependency injection — auth, DB session, Redis, current user."""

from typing import AsyncGenerator
from contextlib import asynccontextmanager
from fastapi import Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from jose import jwt, JWTError

from app.db.session import AsyncSessionLocal as SharedAsyncSessionLocal
from app.db.router import db_router
from app.core.tenant_context import get_tenant_context, TenantContext, get_current_tenant_id
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


# ─── DB Sessions (Dynamic Routing) ────────────────────────────────────────────
async def get_shared_db() -> AsyncGenerator[AsyncSession, None]:
    """Provides a scoped AsyncSession directly to the shared master database."""
    async with SharedAsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a scoped AsyncSession dynamically routed
    to either the shared database or dedicated tenant database.
    """
    ctx = get_tenant_context()
    if ctx and ctx.has_dedicated_db:
        session_factory = await db_router.get_sessionmaker_for_tenant(
            tenant_id=ctx.tenant_id, dedicated_url=ctx.dedicated_db_url
        )
    else:
        session_factory = SharedAsyncSessionLocal

    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def get_tenant_db(
    request: Request,
) -> AsyncGenerator[AsyncSession, None]:
    """
    Explicit tenant-routed DB session. Ensures tenant context is present and routes appropriately.
    """
    ctx = get_tenant_context()
    tenant_id = ctx.tenant_id if ctx else getattr(request.state, "tenant_id", None)
    dedicated_url = ctx.dedicated_db_url if ctx else None
    session_factory = await db_router.get_sessionmaker_for_tenant(
        tenant_id=tenant_id, dedicated_url=dedicated_url
    )
    async with session_factory() as session:
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
        token_type: str | None = payload.get("type", "access")
        token_version: int = payload.get("token_version", 1)
        if not user_id:
            raise UnauthorizedException("Invalid token payload.")
        if token_type != "access":
            raise UnauthorizedException("Invalid token type for API access.")
    except JWTError:
        raise UnauthorizedException("Token is invalid or has expired.")

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found.")
    if not user.is_active:
        raise UnauthorizedException("Your account has been deactivated.")

    # Validate token version for instant global session revocation
    if getattr(user, "token_version", 1) != token_version:
        raise UnauthorizedException(
            "Session has expired or was revoked. Please log in again."
        )

    # Check brute-force account lockout
    if getattr(user, "locked_until", None):
        from datetime import datetime, timezone
        now_utc = datetime.now(timezone.utc)
        if user.locked_until > now_utc:
            remaining_mins = max(1, int((user.locked_until - now_utc).total_seconds() / 60))
            raise UnauthorizedException(
                f"Account is temporarily locked. Please try again in {remaining_mins} minute(s)."
            )

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
get_current_manager = RequireRole(["manager", "org_admin", "owner"])
get_current_viewer = RequireRole(["viewer"])

# ─── Permission-Based RBAC ────────────────────────────────────────────────────
ROLE_PERMISSIONS = {
    "org_admin": [
        "DATASET_VIEW", "DATASET_QUERY", "DATASET_ANALYZE", "DATASET_AI_EXCEL", "DATASET_CREATE_REPORT", "DATASET_CREATE_DASHBOARD", "DATASET_DELETE", "DATASET_EXPORT", "DATASET_UPLOAD",
        "REPORT_VIEW", "REPORT_CREATE", "REPORT_EDIT", "REPORT_DELETE", "REPORT_EXPORT", "REPORT_PUBLISH", "REPORT_SHARE", "REPORT_SCHEDULE", "REPORT_AI"
    ],
    "manager":   [
        "DATASET_VIEW", "DATASET_QUERY", "DATASET_ANALYZE", "DATASET_AI_EXCEL", "DATASET_CREATE_REPORT", "DATASET_CREATE_DASHBOARD", "DATASET_DELETE_OWN", "DATASET_EXPORT", "DATASET_UPLOAD",
        "REPORT_VIEW", "REPORT_CREATE", "REPORT_EDIT", "REPORT_DELETE", "REPORT_EXPORT", "REPORT_PUBLISH", "REPORT_SHARE", "REPORT_SCHEDULE", "REPORT_AI"
    ],
    "analyst":   [
        "DATASET_VIEW", "DATASET_QUERY", "DATASET_ANALYZE", "DATASET_AI_EXCEL", "DATASET_CREATE_REPORT", "DATASET_CREATE_DASHBOARD", "DATASET_DELETE_OWN", "DATASET_UPLOAD",
        "REPORT_VIEW", "REPORT_CREATE", "REPORT_EDIT", "REPORT_DELETE_OWN", "REPORT_EXPORT", "REPORT_PUBLISH", "REPORT_SHARE", "REPORT_SCHEDULE", "REPORT_AI"
    ],
    "viewer":    [
        "DATASET_VIEW", "DATASET_QUERY",
        "REPORT_VIEW", "REPORT_EXPORT"
    ]
}

class RequirePermission:
    """
    Dependency that enforces fine-grained permissions based on the user's role.
    """
    def __init__(self, permission: str):
        self.permission = permission

    async def __call__(
        self, current_user: User = Depends(get_current_active_tenant_user)
    ) -> User:
        if current_user.is_owner:
            return current_user
            
        user_perms = ROLE_PERMISSIONS.get(current_user.role, [])
        if self.permission not in user_perms:
            from app.core.exceptions import ForbiddenException
            raise ForbiddenException(
                f"You do not have the required permission ({self.permission}) to perform this action."
            )
        return current_user



# ─── Workspace Dependencies ───────────────────────────────────────────────────
async def get_workspace_id_header(
    x_workspace_id: str | None = Header(default=None, alias="x-workspace-id")
) -> str | None:
    """Extracts the optional x-workspace-id header from requests."""
    return x_workspace_id


async def get_current_workspace(
    workspace_id: str | None = Depends(get_workspace_id_header),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validates that the workspace exists and belongs to the current user's tenant.
    Returns the Workspace object or raises Forbidden/Not Found.
    """
    if not workspace_id:
        return None
        
    import uuid
    try:
        ws_uuid = uuid.UUID(workspace_id)
    except ValueError:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Invalid workspace ID format.")
        
    from sqlalchemy import select
    from app.models.workspace import Workspace
    from app.core.exceptions import ForbiddenException, ResourceNotFoundException

    stmt = select(Workspace).where(Workspace.id == ws_uuid, Workspace.is_deleted == False)
    workspace = (await db.execute(stmt)).scalar_one_or_none()
    
    if not workspace:
        raise ResourceNotFoundException("Workspace not found.")
        
    if workspace.tenant_id != current_user.tenant_id:
        raise ForbiddenException("You do not have access to this workspace.")
        
    return workspace
