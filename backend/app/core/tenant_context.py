"""Enterprise Tenant Context & Asynchronous Execution Scope.

Provides thread-safe and async-task-safe tenant isolation using Python contextvars.
Allows repositories, services, dynamic database routers, and background Celery tasks
to resolve the active tenant context transparently without manual parameter propagation.
"""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager, contextmanager
from contextvars import ContextVar, Token
from dataclasses import dataclass, field

from app.core.exceptions import ForbiddenException


@dataclass(frozen=True)
class TenantContext:
    """Immutable snapshot of the active request / task tenant context."""

    tenant_id: uuid.UUID | None = None
    tenant_slug: str | None = None
    tenant_name: str | None = None
    tenant_plan: str = "starter"
    db_connection_type: str = "shared"  # "shared" | "dedicated"
    dedicated_db_url: str | None = None
    user_id: uuid.UUID | None = None
    user_role: str | None = None
    is_owner: bool = False
    is_superadmin: bool = False
    metadata: dict = field(default_factory=dict)

    @property
    def is_authenticated(self) -> bool:
        return self.user_id is not None or self.tenant_id is not None

    @property
    def has_dedicated_db(self) -> bool:
        return self.db_connection_type == "dedicated" and bool(self.dedicated_db_url)

    @property
    def is_enterprise_plan(self) -> bool:
        return self.tenant_plan in ("enterprise", "custom")


# ─── ContextVar Storage ────────────────────────────────────────────────────────
_current_tenant_ctx: ContextVar[TenantContext | None] = ContextVar(
    "current_tenant_ctx", default=None,
)


def get_tenant_context() -> TenantContext | None:
    """Retrieve the current TenantContext from the active async context."""
    return _current_tenant_ctx.get()


def set_tenant_context(ctx: TenantContext) -> Token:
    """Set the TenantContext for the current execution flow. Returns a reset Token."""
    return _current_tenant_ctx.set(ctx)


def reset_tenant_context(token: Token) -> None:
    """Reset the TenantContext using a previously saved Token."""
    _current_tenant_ctx.reset(token)


def get_current_tenant_id() -> uuid.UUID | None:
    """Convenience getter returning the active tenant_id or None."""
    ctx = get_tenant_context()
    return ctx.tenant_id if ctx else None


def require_tenant_id() -> uuid.UUID:
    """Return the active tenant_id or raise ForbiddenException if no tenant is bound."""
    tenant_id = get_current_tenant_id()
    if not tenant_id:
        raise ForbiddenException(
            "Active tenant context is required for this operation.",
        )
    return tenant_id


@asynccontextmanager
async def tenant_scope(
    ctx_or_id: TenantContext | uuid.UUID | str | None = None,
    **kwargs,
) -> AsyncGenerator[TenantContext, None]:
    """Asynchronous context manager to bind a TenantContext to the current execution scope.
    Accepts either an existing TenantContext object or keyword arguments.
    """
    if isinstance(ctx_or_id, TenantContext):
        ctx = ctx_or_id
    else:
        tenant_id = ctx_or_id
        tid = (
            uuid.UUID(str(tenant_id))
            if tenant_id and isinstance(tenant_id, (str, uuid.UUID))
            else None
        )
        user_id = kwargs.get("user_id")
        uid = (
            uuid.UUID(str(user_id))
            if user_id and isinstance(user_id, (str, uuid.UUID))
            else None
        )

        ctx = TenantContext(
            tenant_id=tid,
            tenant_slug=kwargs.get("tenant_slug"),
            tenant_name=kwargs.get("tenant_name"),
            tenant_plan=kwargs.get("tenant_plan", "starter"),
            db_connection_type=kwargs.get("db_connection_type", "shared"),
            dedicated_db_url=kwargs.get("dedicated_db_url"),
            user_id=uid,
            user_role=kwargs.get("user_role"),
            is_owner=kwargs.get("is_owner", False),
            is_superadmin=kwargs.get("is_superadmin", False),
            metadata=kwargs.get("metadata", {}),
        )

    token = set_tenant_context(ctx)
    try:
        yield ctx
    finally:
        reset_tenant_context(token)


# Alias for backward compatibility
async_tenant_scope = tenant_scope


@contextmanager
def sync_tenant_scope(
    tenant_id: uuid.UUID | str | None = None,
    tenant_slug: str | None = None,
    tenant_name: str | None = None,
    tenant_plan: str = "starter",
    db_connection_type: str = "shared",
    dedicated_db_url: str | None = None,
    user_id: uuid.UUID | str | None = None,
    user_role: str | None = None,
    is_owner: bool = False,
    is_superadmin: bool = False,
    metadata: dict | None = None,
):
    """Synchronous context manager for Celery workers and batch jobs."""
    tid = (
        uuid.UUID(str(tenant_id))
        if tenant_id and isinstance(tenant_id, (str, uuid.UUID))
        else None
    )
    uid = (
        uuid.UUID(str(user_id))
        if user_id and isinstance(user_id, (str, uuid.UUID))
        else None
    )

    ctx = TenantContext(
        tenant_id=tid,
        tenant_slug=tenant_slug,
        tenant_name=tenant_name,
        tenant_plan=tenant_plan,
        db_connection_type=db_connection_type,
        dedicated_db_url=dedicated_db_url,
        user_id=uid,
        user_role=user_role,
        is_owner=is_owner,
        is_superadmin=is_superadmin,
        metadata=metadata or {},
    )
    token = set_tenant_context(ctx)
    try:
        yield ctx
    finally:
        reset_tenant_context(token)
