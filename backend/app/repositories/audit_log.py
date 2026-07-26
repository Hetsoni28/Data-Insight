"""AuditLogRepository — append-only audit trail."""
import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.audit_log import AuditLog
from app.repositories.base import BaseRepository


class AuditLogRepository(BaseRepository[AuditLog]):
    def __init__(self, session: AsyncSession):
        super().__init__(AuditLog, session)

    async def log(
        self,
        action: str,
        *,
        tenant_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        actor_user_id: uuid.UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        extra_metadata: dict | None = None,
        status: str = "success",
    ) -> AuditLog:
        entry = AuditLog(
            action=action,
            tenant_id=tenant_id,
            user_id=user_id,
            actor_user_id=actor_user_id,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            ip_address=ip_address,
            user_agent=user_agent,
            extra_metadata=extra_metadata,
            status=status,
        )
        return await self.save(entry)

    async def get_tenant_logs(
        self,
        tenant_id: uuid.UUID,
        action: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.tenant_id == tenant_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if action:
            stmt = stmt.where(AuditLog.action == action)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
