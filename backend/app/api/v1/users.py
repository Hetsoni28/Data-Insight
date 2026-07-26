"""User profile endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from app.repositories.user import UserRepository
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import ValidationException, UnauthorizedException

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
