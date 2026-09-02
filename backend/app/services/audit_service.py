import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        action: str,
        user_id: uuid.UUID | None = None,
        tenant_id: uuid.UUID | None = None,
        resource_type: str | None = None,
        resource_id: str | None = None,
        actor_user_id: uuid.UUID | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
        extra_metadata: dict[str, Any] | None = None,
        status: str = "success",
    ):
        """Logs an action to the audit_logs table.
        """
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            tenant_id=tenant_id,
            resource_type=resource_type,
            resource_id=resource_id,
            actor_user_id=actor_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            extra_metadata=extra_metadata,
            status=status,
        )
        db.add(audit_log)
        # Flush to DB to ensure it's recorded
        await db.flush()
        return audit_log
