import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        action: str,
        user_id: Optional[uuid.UUID] = None,
        tenant_id: Optional[uuid.UUID] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        actor_user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
    ):
        """
        Logs an action to the audit_logs table.
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
