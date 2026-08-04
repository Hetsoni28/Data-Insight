import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.models.notification import Notification

class NotificationService:
    @staticmethod
    async def create_notification(
        session: AsyncSession,
        title: str,
        message: str,
        category: str,
        priority: str = "Medium",
        notif_type: str = None,
        icon: str = None,
        tenant_id: uuid.UUID = None,
        user_id: uuid.UUID = None,
        metadata_json: dict = None,
        action_url: str = None
    ) -> Notification:
        """
        Creates a new notification. If `tenant_id` and `user_id` are both None,
        this becomes a platform-wide notification visible to the platform owner.
        """
        try:
            notif = Notification(
                title=title,
                message=message,
                category=category,
                priority=priority,
                type=notif_type,
                icon=icon,
                tenant_id=tenant_id,
                user_id=user_id,
                metadata_json=metadata_json,
                action_url=action_url,
                is_read=False,
                status="Unread",
                is_pinned=False,
                is_archived=False,
                created_at=datetime.now(timezone.utc),
            )
            session.add(notif)
            # We only flush so we don't prematurely commit the caller's transaction
            await session.flush()
            return notif
        except Exception as exc:
            logger.warning(f"Failed to create notification '{title}': {exc}")
            return None
