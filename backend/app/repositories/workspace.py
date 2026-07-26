"""WorkspaceRepository — tenant-scoped workspace queries."""
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.workspace import Workspace
from app.repositories.base import BaseRepository


class WorkspaceRepository(BaseRepository[Workspace]):
    def __init__(self, session: AsyncSession):
        super().__init__(Workspace, session)

    async def get_tenant_workspaces(self, tenant_id: uuid.UUID) -> List[Workspace]:
        stmt = (
            select(Workspace)
            .where(Workspace.tenant_id == tenant_id, Workspace.is_deleted == False)
            .order_by(Workspace.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_slug(self, tenant_id: uuid.UUID, slug: str) -> Optional[Workspace]:
        stmt = select(Workspace).where(
            Workspace.tenant_id == tenant_id,
            Workspace.slug == slug,
            Workspace.is_deleted == False,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_tenant_workspace(self, tenant_id: uuid.UUID, workspace_id: uuid.UUID) -> Optional[Workspace]:
        """Get a workspace only if it belongs to the given tenant."""
        stmt = select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.tenant_id == tenant_id,
            Workspace.is_deleted == False,
        )
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def create(
        self,
        tenant_id: uuid.UUID,
        created_by_id: uuid.UUID,
        name: str,
        slug: str,
        **kwargs,
    ) -> Workspace:
        workspace = Workspace(
            tenant_id=tenant_id,
            created_by_id=created_by_id,
            name=name,
            slug=slug,
            **kwargs,
        )
        return await self.save(workspace)

    async def soft_delete(self, workspace: Workspace) -> Workspace:
        workspace.is_deleted = True
        workspace.deleted_at = datetime.now(timezone.utc)
        return await self.save(workspace)
