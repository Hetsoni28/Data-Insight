"""TenantService — business logic for organization management."""

import re
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tenant import Tenant, PlanType
from app.models.user import User, UserRole
from app.repositories.tenant import TenantRepository
from app.repositories.user import UserRepository
from app.repositories.audit_log import AuditLogRepository
from app.services.notification_service import NotificationService
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
        if not owner.is_owner and owner.tenant_id:
            raise ConflictException("You already belong to an organization.")

        # Generate unique slug
        base_slug = _slugify(name)
        slug = base_slug
        counter = 1
        while await self.tenant_repo.get_by_slug(slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        tenant = await self.tenant_repo.create(name=name, slug=slug, plan=plan)

        # Assign the creating user as org_admin only if they are not the platform superadmin/owner
        if not owner.is_owner:
            owner.tenant_id = tenant.id
            owner.role = UserRole.org_admin
            await self.user_repo.save(owner)

        await self.audit_repo.log(
            "tenant.create",
            tenant_id=tenant.id,
            actor_id=owner.id,
            metadata_json={"plan": plan},
        )

        # Notify the platform owner
        await NotificationService.create_notification(
            session=self.session,
            title="New Organization Created",
            message=f"{owner.full_name or owner.email} created a new organization: '{tenant.name}'.",
            category="Organization",
            priority="Medium",
            notif_type="org.created",
            icon="building",
        )

        await self.session.commit()
        await self.session.refresh(tenant)
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
