"""User profile endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from app.repositories.user import UserRepository
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import (
    ValidationException,
    UnauthorizedException,
    ForbiddenException,
    ResourceNotFoundException,
)
from sqlalchemy import select

router = APIRouter(prefix="/users", tags=["Users"])


class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(None, max_length=255)
    avatar_url: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserResponse, summary="Update profile")
async def update_me(
    body: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = UserRepository(db)
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    await repo.save(current_user)
    return current_user


@router.post("/me/change-password", summary="Change password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise UnauthorizedException("Current password is incorrect.")
    if len(body.new_password) < 8:
        raise ValidationException("New password must be at least 8 characters.")

    repo = UserRepository(db)
    current_user.hashed_password = get_password_hash(body.new_password)
    await repo.save(current_user)
    return {"message": "Password changed successfully."}


def require_owner(current_user: User = Depends(get_current_user)):
    from app.models.user import UserRole

    if current_user.role != UserRole.owner:
        raise ForbiddenException("Only the Platform Owner can perform this action.")
    return current_user


@router.get(
    "/pending",
    response_model=list[UserResponse],
    summary="List all pending access requests",
)
async def get_pending_users(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    stmt = select(User).where(User.is_active == False).order_by(User.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get(
    "/active",
    response_model=list[UserResponse],
    summary="List all active (approved) users",
)
async def get_active_users(
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    # Don't return the owner in the list, only normal active users
    stmt = (
        select(User)
        .where(User.is_active == True, User.is_owner == False)
        .order_by(User.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post(
    "/{user_id}/approve",
    response_model=UserResponse,
    summary="Approve a user's access request",
)
async def approve_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise ResourceNotFoundException("User not found.")

    if user.is_active:
        raise ValidationException("User is already approved.")

    user.is_active = True
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}/reject", summary="Reject and delete an access request")
async def reject_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise ResourceNotFoundException("User not found.")

    if user.is_active:
        raise ValidationException(
            "Cannot reject an already active user. Use /revoke instead."
        )

    await db.delete(user)
    await db.commit()
    return {"message": "User request rejected."}


@router.delete("/{user_id}/revoke", summary="Revoke an active user's access")
async def revoke_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise ResourceNotFoundException("User not found.")

    if user.is_owner:
        raise ForbiddenException("Cannot revoke the Platform Owner.")

    if not user.is_active:
        raise ValidationException("User is not active.")

    # Hard delete or soft delete. For now, hard delete to match reject
    await db.delete(user)
    await db.commit()
    return {"message": "User access revoked."}


class ChangeRoleRequest(BaseModel):
    role: str = Field(..., description="New role to assign: org_admin, manager, analyst, viewer")


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    summary="Change a user's role (Owner only)",
)
async def change_user_role(
    user_id: str,
    body: ChangeRoleRequest,
    db: AsyncSession = Depends(get_db),
    owner: User = Depends(require_owner),
):
    from app.models.user import UserRole

    # Validate requested role — owner cannot be assigned via this endpoint
    allowed_roles = [UserRole.org_admin, UserRole.manager, UserRole.analyst, UserRole.viewer]
    if body.role not in allowed_roles:
        raise ValidationException(
            f"Invalid role '{body.role}'. Must be one of: {', '.join(allowed_roles)}"
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise ResourceNotFoundException("User not found.")

    if user.is_owner:
        raise ForbiddenException("Cannot change the Platform Owner's role.")

    old_role = user.role
    user.role = body.role
    await db.commit()
    await db.refresh(user)

    return user

