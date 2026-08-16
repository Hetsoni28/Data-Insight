"""Viewer Profile API Router — personal account center endpoints.

All endpoints enforce viewer-only RBAC. Identity is resolved server-side.
"""

import uuid
import hashlib
from fastapi import APIRouter, Depends, Query, Path, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_tenant_user, get_db
from app.models.user import User, UserRole
from app.core.exceptions import ForbiddenException, ValidationException
from app.services.viewer_profile_service import ViewerProfileService
from app.schemas.viewer_profile import (
    ViewerProfileResponse,
    ViewerProfileUpdateRequest,
    ViewerSecurityOverview,
    ViewerPasswordChangeRequest,
    ViewerPasswordChangeResponse,
    ViewerSessionResponse,
    ViewerLoginHistoryResponse,
    ViewerNotificationPreferences,
    ViewerPreferences,
    ViewerActivityResponse,
    ViewerDataExportResponse,
    ViewerAccountDeletionResponse,
)
from typing import List

router = APIRouter(prefix="/viewer/profile", tags=["Viewer Profile"])


def _ensure_viewer(user: User):
    if user.role != UserRole.viewer:
        raise ForbiddenException("Only viewers can access the viewer profile center.")


def _get_token_hash(request: Request) -> str | None:
    """Extract the current token hash for session identification."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        token = auth.removeprefix("Bearer ").strip()
        return hashlib.sha256(token.encode()).hexdigest()
    return None


# ─── Profile ──────────────────────────────────────────────────────────────────

@router.get("", response_model=ViewerProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_profile(current_user)


@router.patch("", response_model=ViewerProfileResponse)
async def update_profile(
    body: ViewerProfileUpdateRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    data = body.model_dump(exclude_unset=True)
    return await svc.update_profile(current_user, data)


# ─── Security ─────────────────────────────────────────────────────────────────

@router.get("/security", response_model=ViewerSecurityOverview)
async def get_security(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_security_overview(current_user)


@router.post("/password", response_model=ViewerPasswordChangeResponse)
async def change_password(
    body: ViewerPasswordChangeRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    if body.new_password != body.confirm_password:
        raise ValidationException("New password and confirmation do not match.")
    svc = ViewerProfileService(db)
    return await svc.change_password(current_user, body.current_password, body.new_password)


# ─── Sessions ─────────────────────────────────────────────────────────────────

@router.get("/sessions", response_model=List[ViewerSessionResponse])
async def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    token_hash = _get_token_hash(request)
    return await svc.get_sessions(current_user, token_hash)


@router.post("/sessions/{session_id}/revoke")
async def revoke_session(
    session_id: uuid.UUID = Path(...),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.revoke_session(current_user, session_id)


@router.post("/sessions/revoke-all")
async def revoke_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    token_hash = _get_token_hash(request)
    return await svc.revoke_all_sessions(current_user, token_hash)


# ─── Login History ─────────────────────────────────────────────────────────────

@router.get("/login-history", response_model=ViewerLoginHistoryResponse)
async def get_login_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_login_history(current_user, page, size)


# ─── Notification Preferences ──────────────────────────────────────────────────

@router.get("/notifications", response_model=ViewerNotificationPreferences)
async def get_notification_prefs(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_notification_preferences(current_user)


@router.patch("/notifications", response_model=ViewerNotificationPreferences)
async def update_notification_prefs(
    body: ViewerNotificationPreferences,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.update_notification_preferences(current_user, body.model_dump(exclude_unset=True))


# ─── Preferences (Appearance, Language, AI) ────────────────────────────────────

@router.get("/preferences", response_model=ViewerPreferences)
async def get_preferences(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_preferences(current_user)


@router.patch("/preferences", response_model=ViewerPreferences)
async def update_preferences(
    body: ViewerPreferences,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.update_preferences(current_user, body.model_dump(exclude_unset=True))


# ─── Activity ─────────────────────────────────────────────────────────────────

@router.get("/activity", response_model=ViewerActivityResponse)
async def get_activity(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.get_activity(current_user, page=page, size=size)


# ─── Data & Privacy ───────────────────────────────────────────────────────────

@router.post("/data-export", response_model=ViewerDataExportResponse)
async def request_data_export(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.request_data_export(current_user)


@router.post("/delete-request", response_model=ViewerAccountDeletionResponse)
async def request_account_deletion(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_viewer(current_user)
    svc = ViewerProfileService(db)
    return await svc.request_account_deletion(current_user)
