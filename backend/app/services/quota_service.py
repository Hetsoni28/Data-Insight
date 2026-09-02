"""Enterprise Quota Enforcement & Real-Time Usage Tracking Service.

Tracks and enforces storage, AI token budgets, and user seat allocations
with multi-tier caching (Redis + PostgreSQL) for ultra-fast, zero-overhead validation.
"""

from __future__ import annotations

import uuid
from typing import Any

from loguru import logger
from redis.asyncio import Redis
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ResourceNotFoundException,
    StorageQuotaExceededException,
    TenantQuotaExceededException,
)
from app.models.tenant import Tenant
from app.models.user import User


class QuotaService:
    def __init__(self, session: AsyncSession, redis: Redis | None = None):
        self.session = session
        self.redis = redis

    async def get_tenant_record(self, tenant_id: uuid.UUID) -> Tenant:
        """Fetch tenant record or raise ResourceNotFoundException."""
        stmt = select(Tenant).where(Tenant.id == tenant_id, Tenant.is_deleted == False)
        result = await self.session.execute(stmt)
        tenant = result.scalars().first()
        if not tenant:
            raise ResourceNotFoundException("Tenant", str(tenant_id))
        return tenant

    # ─── Storage Quota ────────────────────────────────────────────────────────
    async def check_storage_quota(
        self, tenant_id: uuid.UUID, additional_bytes: int = 0,
    ) -> bool:
        """Verify if tenant has sufficient storage capacity.
        Raises StorageQuotaExceededException if limit would be breached.
        """
        tenant = await self.get_tenant_record(tenant_id)
        if tenant.max_storage_gb is None or tenant.max_storage_gb == 0:
            return True  # Unlimited
        max_bytes = int(tenant.max_storage_gb) * 1024 * 1024 * 1024
        current_bytes = tenant.current_storage_bytes or 0
        projected_bytes = current_bytes + additional_bytes

        if projected_bytes > max_bytes:
            current_mb = round(current_bytes / (1024 * 1024), 2)
            max_mb = round(max_bytes / (1024 * 1024), 2)
            logger.warning(
                f"[Quota] Tenant {tenant_id} exceeded storage quota: "
                f"{current_mb}MB + {round(additional_bytes / (1024 * 1024), 2)}MB > {max_mb}MB",
            )
            raise StorageQuotaExceededException(
                message=f"Storage limit of {tenant.max_storage_gb} GB exceeded. Upgrade your plan to upload larger datasets.",
                current_storage_mb=current_mb,
                max_storage_mb=max_mb,
            )
        return True

    async def consume_storage(self, tenant_id: uuid.UUID, bytes_added: int) -> int:
        """Atomically record storage consumption."""
        if bytes_added <= 0:
            return 0

        # Update in PostgreSQL
        stmt = (
            update(Tenant)
            .where(Tenant.id == tenant_id)
            .values(current_storage_bytes=Tenant.current_storage_bytes + bytes_added)
            .returning(Tenant.current_storage_bytes)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        new_total = result.scalar_one()

        # Invalidate/update Redis cache if available
        if self.redis:
            try:
                await self.redis.set(
                    f"tenant:{tenant_id}:storage_bytes", new_total, ex=3600,
                )
            except Exception as e:
                logger.debug(f"[Quota] Redis storage cache update skipped: {e}")

        return new_total

    async def release_storage(self, tenant_id: uuid.UUID, bytes_removed: int) -> int:
        """Release storage capacity upon dataset deletion."""
        if bytes_removed <= 0:
            return 0

        tenant = await self.get_tenant_record(tenant_id)
        current = tenant.current_storage_bytes or 0
        new_total = max(0, current - bytes_removed)

        stmt = (
            update(Tenant)
            .where(Tenant.id == tenant_id)
            .values(current_storage_bytes=new_total)
        )
        await self.session.execute(stmt)
        await self.session.commit()

        if self.redis:
            try:
                await self.redis.set(
                    f"tenant:{tenant_id}:storage_bytes", new_total, ex=3600,
                )
            except Exception as e:
                logger.debug(f"[Quota] Redis storage cache update skipped: {e}")

        return new_total

    # ─── AI Token Quota ───────────────────────────────────────────────────────
    async def check_ai_quota(
        self, tenant_id: uuid.UUID, estimated_tokens: int = 1000,
    ) -> bool:
        """Verify tenant has remaining monthly AI tokens.
        Raises TenantQuotaExceededException if budget is exhausted.
        """
        tenant = await self.get_tenant_record(tenant_id)
        max_tokens = tenant.max_ai_tokens_per_month
        used_tokens = tenant.current_ai_tokens_used or 0

        if max_tokens is None:  # Unlimited plan (enterprise/custom)
            return True

        if used_tokens + estimated_tokens > max_tokens:
            logger.warning(
                f"[Quota] Tenant {tenant_id} exceeded AI token budget: "
                f"{used_tokens} + {estimated_tokens} > {max_tokens}",
            )
            raise TenantQuotaExceededException(
                message=f"Monthly AI token budget of {max_tokens:,} tokens reached for {tenant.name}. Upgrade your plan to increase limits.",
                resource_type="ai_tokens",
                current_usage=used_tokens,
                max_limit=max_tokens,
                plan_name=tenant.plan,
            )
        return True

    async def consume_ai_tokens(self, tenant_id: uuid.UUID, tokens_used: int) -> int:
        """Record consumed AI tokens."""
        if tokens_used <= 0:
            return 0

        stmt = (
            update(Tenant)
            .where(Tenant.id == tenant_id)
            .values(current_ai_tokens_used=Tenant.current_ai_tokens_used + tokens_used)
            .returning(Tenant.current_ai_tokens_used)
        )
        result = await self.session.execute(stmt)
        await self.session.commit()
        new_total = result.scalar_one()

        if self.redis:
            try:
                await self.redis.set(
                    f"tenant:{tenant_id}:ai_tokens_used", new_total, ex=3600,
                )
            except Exception as e:
                logger.debug(f"[Quota] Redis AI token cache update skipped: {e}")

        return new_total

    # ─── User Seat Quota ──────────────────────────────────────────────────────
    async def check_user_seats(self, tenant_id: uuid.UUID) -> bool:
        """Verify tenant has available user seats before inviting/creating new member.
        Raises TenantQuotaExceededException if seat capacity is reached.
        """
        tenant = await self.get_tenant_record(tenant_id)
        max_users = tenant.max_users

        if max_users is None:
            return True  # Unlimited seats

        # Count active users for this tenant
        count_stmt = (
            select(func.count())
            .select_from(User)
            .where(
                User.tenant_id == tenant_id,
                User.is_active == True,
                User.is_owner == False,  # Platform owner does not consume tenant seats
            )
        )
        active_count = (await self.session.execute(count_stmt)).scalar_one()

        if active_count >= max_users:
            logger.warning(
                f"[Quota] Tenant {tenant_id} reached seat limit: {active_count} >= {max_users}",
            )
            raise TenantQuotaExceededException(
                message=f"User seat limit of {max_users} members reached for {tenant.name}. Upgrade your plan to invite more team members.",
                resource_type="user_seats",
                current_usage=active_count,
                max_limit=max_users,
                plan_name=tenant.plan,
            )
        return True

    # ─── Full Usage Analytics Summary ─────────────────────────────────────────
    async def get_usage_summary(self, tenant_id: uuid.UUID) -> dict[str, Any]:
        """Comprehensive usage breakdown with percentage metrics and plan limits."""
        tenant = await self.get_tenant_record(tenant_id)

        # Storage calculations
        used_bytes = tenant.current_storage_bytes or 0
        max_bytes = int(tenant.max_storage_gb) * 1024 * 1024 * 1024
        storage_pct = round((used_bytes / max_bytes * 100), 2) if max_bytes > 0 else 0.0

        # AI Token calculations
        used_tokens = tenant.current_ai_tokens_used or 0
        max_tokens = tenant.max_ai_tokens_per_month
        tokens_pct = (
            round((used_tokens / max_tokens * 100), 2) if max_tokens > 0 else 0.0
        )

        # User seats count
        count_stmt = (
            select(func.count())
            .select_from(User)
            .where(
                User.tenant_id == tenant_id,
                User.is_active == True,
                User.is_owner == False,
            )
        )
        active_users = (await self.session.execute(count_stmt)).scalar_one()
        max_users = tenant.max_users
        users_pct = round((active_users / max_users * 100), 2) if max_users > 0 else 0.0

        return {
            "tenant_id": str(tenant.id),
            "tenant_name": tenant.name,
            "slug": tenant.slug,
            "plan": tenant.plan,
            "db_connection_type": tenant.db_connection_type,
            "has_dedicated_db": tenant.db_connection_type == "dedicated"
            and bool(tenant.dedicated_db_url),
            "is_suspended": tenant.is_suspended,
            "suspension_reason": tenant.suspension_reason,
            "storage": {
                "used_bytes": used_bytes,
                "used_mb": round(used_bytes / (1024 * 1024), 2),
                "used_gb": round(used_bytes / (1024 * 1024 * 1024), 3),
                "max_gb": tenant.max_storage_gb,
                "percentage": storage_pct,
                "is_near_limit": storage_pct >= 85.0,
                "is_exceeded": storage_pct >= 100.0,
            },
            "ai_tokens": {
                "used": used_tokens,
                "max": max_tokens,
                "remaining": max(0, max_tokens - used_tokens),
                "percentage": tokens_pct,
                "is_near_limit": tokens_pct >= 85.0,
                "is_exceeded": tokens_pct >= 100.0,
                "resets_at": (
                    tenant.quota_reset_at.isoformat() if tenant.quota_reset_at else None
                ),
            },
            "users": {
                "active_count": active_users,
                "max_seats": max_users,
                "remaining_seats": max(0, max_users - active_users),
                "percentage": users_pct,
                "is_at_limit": active_users >= max_users,
            },
        }
