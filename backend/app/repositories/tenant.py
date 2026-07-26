"""TenantRepository — queries for the Tenant model."""
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tenant import Tenant, PlanType
from app.repositories.base import BaseRepository


class TenantRepository(BaseRepository[Tenant]):
    def __init__(self, session: AsyncSession):
        super().__init__(Tenant, session)

    async def get_by_slug(self, slug: str) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.slug == slug, Tenant.is_deleted == False)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_domain(self, domain: str) -> Optional[Tenant]:
        stmt = select(Tenant).where(Tenant.domain == domain, Tenant.is_deleted == False)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(
        self,
        name: str,
        slug: str,
        plan: PlanType = PlanType.starter,
        **kwargs,
    ) -> Tenant:
        plan_limits = {
            PlanType.starter: (5, 5, 100_000),
            PlanType.professional: (20, 25, 500_000),
            PlanType.enterprise: (9999, 999999, 10_000_000),
            PlanType.custom: (9999, 999999, 10_000_000),
        }
        max_users, max_storage_gb, max_tokens = plan_limits[plan]
        tenant = Tenant(
            name=name,
            slug=slug,
            plan=plan,
            max_users=max_users,
            max_storage_gb=max_storage_gb,
            max_ai_tokens_per_month=max_tokens,
            **kwargs,
        )
        return await self.save(tenant)

    async def soft_delete(self, tenant: Tenant) -> Tenant:
        from datetime import datetime, timezone
        tenant.is_deleted = True
        tenant.deleted_at = datetime.now(timezone.utc)
        return await self.save(tenant)
