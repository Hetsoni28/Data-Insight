"""WorkspaceService — business logic for workspace management."""

import re
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ForbiddenException,
    ResourceNotFoundException,
)
from app.models.user import User, UserRole
from app.models.workspace import Workspace
from app.repositories.audit_log import AuditLogRepository
from app.repositories.workspace import WorkspaceRepository


def _slugify(name: str) -> str:
    slug = name.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_-]+", "-", slug)
    return slug[:80]


class WorkspaceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.ws_repo = WorkspaceRepository(session)
        self.audit_repo = AuditLogRepository(session)

    async def create_workspace(
        self,
        name: str,
        actor: User,
        description: str | None = None,
        icon: str | None = None,
        color: str | None = None,
    ) -> Workspace:
        if not actor.tenant_id:
            raise ForbiddenException(
                "You must belong to an organization to create a workspace.",
            )
        # All non-viewer org members can create workspaces during onboarding.
        # viewers (read-only accounts) cannot create workspaces.
        if actor.role not in (
            UserRole.owner,
            UserRole.org_admin,
            UserRole.manager,
            UserRole.analyst,
        ):
            raise ForbiddenException(
                "Your role does not have permission to create workspaces.",
            )

        base_slug = _slugify(name)
        slug = base_slug
        counter = 1
        while await self.ws_repo.get_by_slug(actor.tenant_id, slug):
            slug = f"{base_slug}-{counter}"
            counter += 1

        workspace = await self.ws_repo.create(
            tenant_id=actor.tenant_id,
            created_by_id=actor.id,
            name=name,
            slug=slug,
            description=description,
            icon=icon,
            color=color,
        )
        await self.audit_repo.log(
            "workspace.create",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="workspace",
            resource_id=str(workspace.id),
        )
        return workspace

    async def list_workspaces(self, actor: User) -> list[Workspace]:
        if not actor.tenant_id:
            return []
        return await self.ws_repo.get_tenant_workspaces(actor.tenant_id)

    async def get_workspace(self, workspace_id: uuid.UUID, actor: User) -> Workspace:
        if not actor.tenant_id:
            raise ForbiddenException(
                "You must belong to an organization to access this workspace.",
            )
        ws = await self.ws_repo.get_tenant_workspace(actor.tenant_id, workspace_id)
        if not ws:
            raise ResourceNotFoundException("Workspace", str(workspace_id))
        return ws

    async def update_workspace(
        self, workspace_id: uuid.UUID, updates: dict, actor: User,
    ) -> Workspace:
        ws = await self.get_workspace(workspace_id, actor)
        if actor.role not in (UserRole.owner, UserRole.org_admin):
            raise ForbiddenException("Only Owners and Admins can update workspaces.")
        allowed = {"name", "description", "icon", "color"}
        for field, value in updates.items():
            if field in allowed:
                setattr(ws, field, value)
        await self.ws_repo.save(ws)
        await self.audit_repo.log(
            "workspace.update",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="workspace",
            resource_id=str(ws.id),
        )
        return ws

    async def delete_workspace(self, workspace_id: uuid.UUID, actor: User) -> None:
        ws = await self.get_workspace(workspace_id, actor)
        if actor.role not in (UserRole.owner, UserRole.org_admin):
            raise ForbiddenException("Only Owners and Admins can delete workspaces.")
        if ws.is_default:
            raise ForbiddenException("The default workspace cannot be deleted.")
        await self.ws_repo.soft_delete(ws)
        await self.audit_repo.log(
            "workspace.delete",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="workspace",
            resource_id=str(ws.id),
        )

    async def get_workspace_stats(self, workspace_id: uuid.UUID, actor: User) -> dict:
        await self.get_workspace(workspace_id, actor)
        from sqlalchemy import func, select

        from app.models.dataset import Dataset
        from app.models.report import Report
        from app.models.user import User as UserModel

        # Count datasets
        ds_query = select(func.count(Dataset.id)).where(
            Dataset.workspace_id == workspace_id, Dataset.is_deleted == False,
        )
        ds_count = await self.session.scalar(ds_query) or 0

        # Count reports
        rp_query = select(func.count(Report.id)).where(
            Report.workspace_id == workspace_id, Report.is_deleted == False,
        )
        rp_count = await self.session.scalar(rp_query) or 0

        # Count members (all users in the tenant)
        mem_query = select(func.count(UserModel.id)).where(
            UserModel.tenant_id == actor.tenant_id, UserModel.is_active == True,
        )
        mem_count = await self.session.scalar(mem_query) or 0

        return {
            "datasets_count": ds_count,
            "reports_count": rp_count,
            "ai_analyses_count": rp_count,  # Proxy for now
            "members_count": mem_count,
        }
