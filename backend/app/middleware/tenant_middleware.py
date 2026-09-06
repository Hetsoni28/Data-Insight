"""Enterprise Tenant Middleware — Resolves and binds TenantContext for every request."""

import json
import uuid
from typing import Any

from fastapi import Request, Response
from jose import JWTError, jwt
from redis.asyncio import Redis
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.tenant_context import (
    TenantContext,
    reset_tenant_context,
    set_tenant_context,
)
from app.db.redis import get_redis_pool
from app.db.session import AsyncSessionLocal
from app.models.tenant import Tenant

# Public or system routes that bypass tenant resolution
EXCLUDED_PREFIXES = (
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
    "/metrics",
    "/static",
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/verify-email",
    "/api/v1/auth/mfa/verify",
    "/api/v1/auth/mfa/recovery",
    "/api/v1/billing/webhook",
)


class TenantMiddleware(BaseHTTPMiddleware):
    """Fast ASGI HTTP Middleware resolving tenant from:
    1. JWT access token claim (tenant_id)
    2. Subdomain / Custom Domain in Host header
    3. Gateway headers (X-Tenant-ID / X-Tenant-Slug)
    Binds TenantContext to async contextvars and request.state.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Bypass static and auth handshake routes, and CORS OPTIONS preflights
        if request.method == "OPTIONS" or any(path.startswith(prefix) for prefix in EXCLUDED_PREFIXES):
            return await call_next(request)

        tenant_id_str: str | None = None
        user_id_str: str | None = None
        user_role: str | None = None
        is_owner: bool = False
        is_superuser: bool = False

        # 1. Inspect Authorization Bearer token
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()
            try:
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=["HS256"],
                    options={
                        "verify_exp": False,
                    },  # Let get_current_user handle strict expiry
                )
                user_id_str = payload.get("sub")
                tenant_id_str = payload.get("tenant_id")
                user_role = payload.get("role")
                is_owner = payload.get("is_owner", False) or user_role == "owner"
                is_superuser = payload.get("is_superuser", False) or is_owner
            except JWTError:
                pass

        # 2. Inspect internal gateway headers fallback
        if not tenant_id_str:
            tenant_id_str = request.headers.get("X-Tenant-ID")

        # 3. Inspect Host header (custom domain or subdomain routing)
        tenant_slug: str | None = request.headers.get("X-Tenant-Slug")
        if not tenant_id_str and not tenant_slug:
            host = request.headers.get("host", "").split(":")[0].lower()
            if host and host not in (
                "localhost",
                "127.0.0.1",
                "0.0.0.0",
                "backend",
                "frontend",
            ):
                # Check for subdomain e.g. acme.datainsight.com
                parts = host.split(".")
                if len(parts) >= 3 and parts[0] not in ("www", "api", "app"):
                    tenant_slug = parts[0]

        tenant_data: dict[str, Any] | None = None
        try:
            tenant_uuid = uuid.UUID(tenant_id_str) if tenant_id_str else None
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "BAD_REQUEST",
                    "message": "Invalid X-Tenant-ID format",
                },
            )

        if tenant_uuid or tenant_slug:
            tenant_data = await self._resolve_tenant(tenant_uuid, tenant_slug)

        # Check tenant suspension status
        if tenant_data and tenant_data.get("is_suspended") and not is_owner:
            # Allow billing, support, and logout routes for suspended tenants
            allowed_suspended_routes = (
                "/api/v1/billing",
                "/api/v1/support",
                "/api/v1/auth/logout",
            )
            if not any(path.startswith(p) for p in allowed_suspended_routes):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "TENANT_SUSPENDED",
                        "message": tenant_data.get("suspension_reason")
                        or "Your organization has been suspended. Please update billing or contact support.",
                        "code": "DI-BE-TENANT-403",
                    },
                )

        # Build context
        try:
            ctx = TenantContext(
                tenant_id=uuid.UUID(tenant_data["id"]) if tenant_data else tenant_uuid,
                tenant_slug=tenant_data.get("slug") if tenant_data else tenant_slug,
                tenant_name=tenant_data.get("name") if tenant_data else None,
                tenant_plan=(
                    tenant_data.get("plan", "starter") if tenant_data else "starter"
                ),
                db_connection_type=(
                    tenant_data.get("db_connection_type", "shared")
                    if tenant_data
                    else "shared"
                ),
                dedicated_db_url=(
                    tenant_data.get("dedicated_db_url") if tenant_data else None
                ),
                user_id=uuid.UUID(user_id_str) if user_id_str else None,
                user_role=user_role,
                is_owner=is_owner,
                is_superadmin=is_superuser,
            )
        except ValueError:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "BAD_REQUEST",
                    "message": "Invalid UUID format in context",
                },
            )

        request.state.tenant = tenant_data
        request.state.tenant_id = ctx.tenant_id
        request.state.tenant_context = ctx

        token_ctx = set_tenant_context(ctx)
        try:
            response = await call_next(request)
            if ctx.tenant_id:
                response.headers["X-Tenant-ID"] = str(ctx.tenant_id)
            return response
        finally:
            reset_tenant_context(token_ctx)

    async def _resolve_tenant(
        self, tenant_id: uuid.UUID | None, tenant_slug: str | None,
    ) -> dict[str, Any] | None:
        """Resolve tenant metadata with 60s Redis cache to maintain sub-millisecond overhead."""
        cache_key = (
            f"tenant:meta:id:{tenant_id}"
            if tenant_id
            else f"tenant:meta:slug:{tenant_slug}"
        )

        # 1. Try Redis cache
        try:
            pool = await get_redis_pool()
            redis = Redis(connection_pool=pool)
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            redis = None

        # 2. Query Database
        async with AsyncSessionLocal() as session:
            stmt = select(Tenant).where(Tenant.is_deleted == False)
            if tenant_id:
                stmt = stmt.where(Tenant.id == tenant_id)
            elif tenant_slug:
                stmt = stmt.where(
                    (Tenant.slug == tenant_slug) | (Tenant.custom_domain == tenant_slug),
                )

            result = await session.execute(stmt)
            tenant = result.scalars().first()

            if not tenant:
                return None

            data = {
                "id": str(tenant.id),
                "name": tenant.name,
                "slug": tenant.slug,
                "plan": tenant.plan,
                "db_connection_type": tenant.db_connection_type,
                "dedicated_db_url": tenant.dedicated_db_url,
                "max_storage_gb": tenant.max_storage_gb,
                "max_ai_tokens_per_month": tenant.max_ai_tokens_per_month,
                "max_users": tenant.max_users,
                "is_suspended": tenant.is_suspended,
                "suspension_reason": tenant.suspension_reason,
            }

            # Cache in Redis for 60 seconds
            if redis:
                try:
                    await redis.set(cache_key, json.dumps(data), ex=60)
                except Exception:
                    pass

            return data
