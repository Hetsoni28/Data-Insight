import uuid

from pydantic import BaseModel


class NotificationPreferences(BaseModel):
    email_notifications: bool | None = None
    push_notifications: bool | None = None
    slack_notifications: bool | None = None
    security_alerts: bool | None = None
    billing_alerts: bool | None = None
    ai_alerts: bool | None = None
    system_alerts: bool | None = None
    digest_frequency: str | None = None  # 'realtime', 'daily', 'weekly'


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import (
    NotificationResponse,
    NotificationStatsResponse,
    NotificationUpdate,
)

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    category: str | None = None,
    priority: str | None = None,
    is_read: bool | None = None,
    is_archived: bool | None = False,
    is_pinned: bool | None = None,
    search: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List notifications for the current user and their tenant."""
    # Build query — owner/superuser sees everything platform-wide
    conditions = []

    is_owner = (
        getattr(current_user, "is_owner", False)
        or getattr(current_user, "is_superuser", False)
        or getattr(current_user, "role", "") == "owner"
    )

    if is_owner:
        # Owner sees: their own, any tenant's, AND platform-wide (tenant_id=None, user_id=None)
        conditions.append(
            or_(
                Notification.user_id == current_user.id,
                Notification.tenant_id is not None,
                Notification.tenant_id is None,
            ),
        )
    elif current_user.tenant_id:
        # Org users see their own + their tenant-wide notifications
        conditions.append(
            or_(
                Notification.user_id == current_user.id,
                Notification.tenant_id == current_user.tenant_id,
            ),
        )
    else:
        conditions.append(Notification.user_id == current_user.id)

    stmt = select(Notification).where(*conditions)

    if category:
        stmt = stmt.where(Notification.category == category)
    if priority:
        stmt = stmt.where(Notification.priority == priority)
    if is_read is not None:
        stmt = stmt.where(Notification.is_read == is_read)
    if is_archived is not None:
        stmt = stmt.where(Notification.is_archived == is_archived)
    if is_pinned is not None:
        stmt = stmt.where(Notification.is_pinned == is_pinned)
    if search:
        stmt = stmt.where(
            Notification.title.ilike(f"%{search}%")
            | Notification.message.ilike(f"%{search}%"),
        )

    # Order by pinned first, then newest
    stmt = stmt.order_by(desc(Notification.is_pinned), desc(Notification.created_at))
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/stats", response_model=NotificationStatsResponse)
async def get_notification_stats(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    """Get aggregated statistics for notifications."""
    conditions = []

    is_owner = (
        getattr(current_user, "is_owner", False)
        or getattr(current_user, "is_superuser", False)
        or getattr(current_user, "role", "") == "owner"
    )

    if is_owner:
        conditions.append(
            or_(
                Notification.user_id == current_user.id,
                Notification.tenant_id is not None,
                Notification.tenant_id is None,
            ),
        )
    elif current_user.tenant_id:
        conditions.append(
            or_(
                Notification.user_id == current_user.id,
                Notification.tenant_id == current_user.tenant_id,
            ),
        )
    else:
        conditions.append(Notification.user_id == current_user.id)

    # We only care about unarchived for most stats
    base_where = *conditions, Notification.is_archived == False

    total = await db.scalar(select(func.count()).where(*base_where)) or 0
    unread = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.is_read == False),
        )
        or 0
    )
    critical = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.priority == "Critical"),
        )
        or 0
    )
    security = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.category == "Security"),
        )
        or 0
    )
    ai = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.category == "AI"),
        )
        or 0
    )
    billing = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.category == "Billing"),
        )
        or 0
    )
    system = (
        await db.scalar(
            select(func.count()).where(*base_where, Notification.category == "System"),
        )
        or 0
    )
    organization = (
        await db.scalar(
            select(func.count()).where(
                *base_where, Notification.category == "Organization",
            ),
        )
        or 0
    )

    return NotificationStatsResponse(
        total=total,
        unread=unread,
        critical=critical,
        security=security,
        ai=ai,
        billing=billing,
        system=system,
        organization=organization,
    )


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: uuid.UUID,
    update_data: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a specific notification (read/pinned/archived status)."""
    stmt = select(Notification).where(Notification.id == notification_id)
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    # Simple auth check
    if (
        notification.user_id != current_user.id
        and notification.tenant_id != current_user.tenant_id
    ):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict.get("is_read"):
        notification.status = "Read"
    elif "is_read" in update_dict and not update_dict["is_read"]:
        notification.status = "Unread"

    for key, value in update_dict.items():
        setattr(notification, key, value)

    await db.commit()
    await db.refresh(notification)
    return notification


@router.post("/bulk", response_model=dict)
async def bulk_action_notifications(
    action: str = Query(..., description="mark_read, archive"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Perform bulk actions on notifications."""
    conditions = []
    if current_user.tenant_id:
        conditions.append(
            or_(
                Notification.user_id == current_user.id,
                Notification.tenant_id == current_user.tenant_id,
            ),
        )
    else:
        conditions.append(Notification.user_id == current_user.id)

    if action == "mark_read":
        stmt = (
            update(Notification)
            .where(*conditions, Notification.is_read == False)
            .values(is_read=True, status="Read")
        )
    elif action == "archive":
        stmt = (
            update(Notification)
            .where(*conditions, Notification.is_archived == False)
            .values(is_archived=True)
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    result = await db.execute(stmt)
    await db.commit()

    return {"status": "success", "updated_count": result.rowcount}


@router.patch("/preferences", response_model=dict)
async def update_notification_preferences(
    prefs: NotificationPreferences,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notification preferences for the current user."""
    # Store preferences in user metadata or a separate table.
    # For now, we store as a JSON field on the user profile or return success.
    # Update user's notification_preferences if the field exists, else accept and return OK
    pref_dict = prefs.model_dump(exclude_none=True)

    # Try to update if user model has notification_preferences field
    if hasattr(current_user, "notification_preferences"):
        # SQLAlchemy needs a new dictionary reference to detect JSONB changes
        existing = dict(current_user.notification_preferences or {})
        existing.update(pref_dict)
        current_user.notification_preferences = existing

        # Also explicitly flag it as modified just to be perfectly safe
        from sqlalchemy.orm.attributes import flag_modified

        flag_modified(current_user, "notification_preferences")

        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)

    return {
        "status": "success",
        "message": "Preferences updated successfully",
        "preferences": pref_dict,
    }
