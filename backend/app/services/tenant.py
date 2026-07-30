"""TenantService — business logic for organization management."""

import re
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant, PlanType
from app.models.user import User, UserRole
from app.repositories.tenant import TenantRepository
from app.repositories.user import UserRepository
from app.repositories.audit_log import AuditLogRepository
from app.core.exceptions import (
    ConflictException,
    ResourceNotFoundException,
    ForbiddenException,
)


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:50]


class TenantService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.tenant_repo = TenantRepository(session)
        self.user_repo = UserRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def create_tenant(
        self,
        name: str,
        owner: User,
        plan: PlanType = PlanType.starter,
    ) -> Tenant:
        """Create a new tenant organization and assign the owner."""
        if owner.tenant_id:
            raise ConflictException("You already belong to an organization.")

        # Generate unique slug
        base_slug = _slugify(name)
        slug = base_slug
        counter = 1
        while await self.tenant_repo.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        tenant = await self.tenant_repo.create(name=name, slug=slug, plan=plan)

        # Assign the creating user as org_admin
        # GUARD: Never downgrade the platform OWNER role
        owner.tenant_id = tenant.id
        if not owner.is_owner:
            owner.role = UserRole.org_admin
        await self.user_repo.save(owner)

        await self.audit_repo.log(
            "tenant.create",
            tenant_id=tenant.id,
            user_id=owner.id,
            resource_type="tenant",
            resource_id=str(tenant.id),
        )
        return tenant

    async def get_tenant(self, tenant_id: uuid.UUID) -> Tenant:
        tenant = await self.tenant_repo.get_by_id(tenant_id)
        if not tenant or tenant.is_deleted:
            raise ResourceNotFoundException("Organization", str(tenant_id))
        return tenant

    async def update_tenant(self, tenant: Tenant, updates: dict, actor: User) -> Tenant:
        allowed = {
            "name",
            "logo_url",
            "industry",
            "timezone",
            "currency",
            "domain",
            "white_label_config",
        }
        for field, value in updates.items():
            if field in allowed:
                setattr(tenant, field, value)
        await self.tenant_repo.save(tenant)
        await self.audit_repo.log(
            "tenant.update",
            tenant_id=tenant.id,
            user_id=actor.id,
            resource_type="tenant",
            resource_id=str(tenant.id),
        )
        return tenant
