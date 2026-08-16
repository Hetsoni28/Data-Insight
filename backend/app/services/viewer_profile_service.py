"""ViewerProfileService — all business logic for the Viewer's personal account center.

Every method resolves identity server-side. tenant_id and user_id are NEVER
trusted from the request body.
"""

import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from sqlalchemy import select, and_, func, desc, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.models.user_profile import UserProfile
from app.models.user_session import UserSession
from app.models.auth import LoginHistory
from app.models.audit_log import AuditLog
from app.models.tenant import Tenant
from app.services.audit_service import AuditService
from app.core.exceptions import ForbiddenException, ResourceNotFoundException, ValidationException


class ViewerProfileService:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Helpers ───────────────────────────────────────────────────────────

    def _ensure_viewer(self, user: User):
        if user.role != UserRole.viewer:
            raise ForbiddenException("Only viewers can access the viewer profile center.")

    async def _get_or_create_profile(self, user: User) -> UserProfile:
        stmt = select(UserProfile).where(UserProfile.user_id == user.id)
        res = await self.session.execute(stmt)
        profile = res.scalars().first()
        if not profile:
            profile = UserProfile(user_id=user.id)
            self.session.add(profile)
            await self.session.flush()
        return profile

    async def _get_tenant(self, tenant_id: uuid.UUID) -> Optional[Tenant]:
        if not tenant_id:
            return None
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        res = await self.session.execute(stmt)
        return res.scalars().first()

    def _calc_security_score(self, user: User, active_sessions: int) -> int:
        score = 30  # Base
        if user.is_email_verified:
            score += 20
        if user.mfa_enabled:
            score += 25
        if active_sessions < 5:
            score += 15
        score += 10  # Password assumed strong
        return min(score, 100)

    def _calc_profile_completion(self, user: User, profile: Optional[UserProfile]) -> int:
        score = 0
        if user.full_name:
            score += 20
        if user.avatar_url:
            score += 10
        if profile:
            if profile.job_title:
                score += 20
            if profile.department:
                score += 15
            if profile.short_bio:
                score += 10
            if profile.phone:
                score += 10
            if profile.country or profile.city:
                score += 15
        return min(score, 100)

    # ─── Get Full Profile ──────────────────────────────────────────────────

    async def get_profile(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)
        profile = await self._get_or_create_profile(actor)
        tenant = await self._get_tenant(actor.tenant_id)

        active_sessions = await self.session.scalar(
            select(func.count()).where(
                and_(UserSession.user_id == actor.id, UserSession.is_active == True)
            )
        ) or 0

        # Last login
        last_login_stmt = select(LoginHistory).where(
            and_(LoginHistory.user_id == actor.id, LoginHistory.success == True)
        ).order_by(desc(LoginHistory.created_at)).limit(1)
        last_login_res = await self.session.execute(last_login_stmt)
        last_login = last_login_res.scalars().first()

        account_status = "active"
        if not actor.is_active:
            account_status = "deactivated"
        if actor.locked_until and actor.locked_until > datetime.now(timezone.utc):
            account_status = "locked"

        return {
            "id": actor.id,
            "email": actor.email,
            "full_name": actor.full_name,
            "avatar_url": actor.avatar_url,
            "organization_name": tenant.name if tenant else None,
            "organization_logo": tenant.logo_url if tenant else None,
            "department": profile.department or actor.department,
            "job_title": profile.job_title,
            "role": actor.role,
            "account_type": actor.account_type,
            "account_status": account_status,
            "member_since": actor.created_at,
            "last_active": last_login.created_at if last_login else actor.updated_at,
            "phone": profile.phone or actor.phone,
            "location": profile.city or actor.location,
            "short_bio": profile.short_bio,
            "is_email_verified": actor.is_email_verified,
            "mfa_enabled": actor.mfa_enabled,
            "security_score": self._calc_security_score(actor, active_sessions),
            "profile_completion": self._calc_profile_completion(actor, profile),
        }

    # ─── Update Profile ────────────────────────────────────────────────────

    async def update_profile(self, actor: User, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_viewer(actor)
        profile = await self._get_or_create_profile(actor)

        # Update User-level fields
        if "full_name" in data and data["full_name"] is not None:
            actor.full_name = data["full_name"]

        # Update Profile-level fields
        profile_fields = ["phone", "location", "job_title", "department", "short_bio"]
        for field in profile_fields:
            if field in data and data[field] is not None:
                if field == "location":
                    profile.city = data[field]
                else:
                    setattr(profile, field, data[field])

        self.session.add(actor)
        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.profile.updated",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )

        return await self.get_profile(actor)

    # ─── Security Overview ─────────────────────────────────────────────────

    async def get_security_overview(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        active_sessions = await self.session.scalar(
            select(func.count()).where(
                and_(UserSession.user_id == actor.id, UserSession.is_active == True)
            )
        ) or 0

        last_login_stmt = select(LoginHistory).where(
            and_(LoginHistory.user_id == actor.id, LoginHistory.success == True)
        ).order_by(desc(LoginHistory.created_at)).limit(1)
        last_login_res = await self.session.execute(last_login_stmt)
        last_login = last_login_res.scalars().first()

        return {
            "password_last_changed": "Not available",
            "mfa_enabled": actor.mfa_enabled,
            "active_sessions_count": active_sessions,
            "failed_login_attempts": actor.failed_login_attempts,
            "last_login": last_login.created_at if last_login else None,
            "security_score": self._calc_security_score(actor, active_sessions),
            "is_email_verified": actor.is_email_verified,
        }

    # ─── Change Password ───────────────────────────────────────────────────

    async def change_password(self, actor: User, current_password: str, new_password: str) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        from app.core.security import verify_password, get_password_hash
        if not verify_password(current_password, actor.hashed_password):
            raise ValidationException("Current password is incorrect.")

        actor.hashed_password = get_password_hash(new_password)
        actor.token_version += 1  # Invalidate all existing sessions/tokens

        self.session.add(actor)
        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.password.changed",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )

        return {"success": True, "message": "Password changed successfully. You may need to log in again on other devices."}

    # ─── Sessions ──────────────────────────────────────────────────────────

    async def get_sessions(self, actor: User, current_token_hash: Optional[str] = None):
        self._ensure_viewer(actor)

        stmt = select(UserSession).where(
            and_(UserSession.user_id == actor.id, UserSession.is_active == True)
        ).order_by(desc(UserSession.last_active_at))

        res = await self.session.execute(stmt)
        sessions = res.scalars().all()

        result = []
        for i, s in enumerate(sessions):
            is_current = False
            if current_token_hash and s.token_hash == current_token_hash:
                is_current = True
            elif not current_token_hash:
                is_current = (i == 0)

            result.append({
                "id": s.id,
                "device_name": s.device_name,
                "os": s.os,
                "browser": s.browser,
                "location": s.location,
                "ip_address": s.ip_address,
                "is_active": s.is_active,
                "is_current": is_current,
                "last_active_at": s.last_active_at,
                "created_at": s.created_at,
            })
        return result

    async def revoke_session(self, actor: User, session_id: uuid.UUID):
        self._ensure_viewer(actor)

        stmt = select(UserSession).where(
            and_(UserSession.id == session_id, UserSession.user_id == actor.id)
        )
        res = await self.session.execute(stmt)
        session = res.scalars().first()
        if not session:
            raise ResourceNotFoundException("Session", str(session_id))

        session.is_active = False
        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.session.revoked",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_type="session",
            resource_id=str(session_id),
        )
        return {"status": "success", "message": "Session revoked."}

    async def revoke_all_sessions(self, actor: User, current_token_hash: Optional[str] = None):
        self._ensure_viewer(actor)

        stmt = select(UserSession).where(
            and_(UserSession.user_id == actor.id, UserSession.is_active == True)
        ).order_by(desc(UserSession.last_active_at))
        res = await self.session.execute(stmt)
        sessions = res.scalars().all()

        for s in sessions:
            if current_token_hash and s.token_hash == current_token_hash:
                continue
            s.is_active = False

        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.sessions.revoked_all",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )
        return {"status": "success", "message": "All other sessions revoked."}

    # ─── Login History ─────────────────────────────────────────────────────

    async def get_login_history(self, actor: User, page: int = 1, size: int = 20):
        self._ensure_viewer(actor)

        total = await self.session.scalar(
            select(func.count()).where(LoginHistory.user_id == actor.id)
        ) or 0

        offset = (page - 1) * size
        stmt = select(LoginHistory).where(
            LoginHistory.user_id == actor.id
        ).order_by(desc(LoginHistory.created_at)).offset(offset).limit(size)

        res = await self.session.execute(stmt)
        entries = res.scalars().all()

        return {
            "entries": entries,
            "total": total,
            "page": page,
            "size": size,
        }

    # ─── Notification Preferences ──────────────────────────────────────────

    async def get_notification_preferences(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)
        prefs = actor.notification_preferences or {}
        return {
            "email_notifications": prefs.get("email_notifications", True),
            "push_notifications": prefs.get("push_notifications", True),
            "report_ready": prefs.get("report_ready", True),
            "dataset_updated": prefs.get("dataset_updated", True),
            "dashboard_shared": prefs.get("dashboard_shared", True),
            "ai_generation_complete": prefs.get("ai_generation_complete", True),
            "security_alerts": True,  # Always true — enforced by policy
            "organization_announcements": prefs.get("organization_announcements", True),
        }

    async def update_notification_preferences(self, actor: User, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        prefs = actor.notification_preferences or {}
        allowed = [
            "email_notifications", "push_notifications", "report_ready",
            "dataset_updated", "dashboard_shared", "ai_generation_complete",
            "organization_announcements"
        ]
        for key in allowed:
            if key in data:
                prefs[key] = bool(data[key])

        # security_alerts is always True — cannot be disabled
        prefs["security_alerts"] = True

        actor.notification_preferences = prefs
        self.session.add(actor)
        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.notifications.updated",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )
        return await self.get_notification_preferences(actor)

    # ─── Preferences (Appearance, Language, AI) ────────────────────────────

    async def get_preferences(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)
        profile = await self._get_or_create_profile(actor)

        prefs = profile.preferences or {}
        defaults = {
            "theme": "system",
            "density": "comfortable",
            "reduced_motion": False,
            "high_contrast": False,
            "language": profile.language or "en",
            "timezone": profile.timezone or "UTC",
            "date_format": "MM/DD/YYYY",
            "time_format": "12h",
            "number_format": "en-US",
            "currency_display": "USD",
            "ai_response_style": "balanced",
            "ai_preferred_language": "en",
            "ai_show_suggestions": True,
            "ai_show_explanations": True,
            "ai_streaming": True,
            "ai_conversation_history": True,
        }
        return {**defaults, **prefs}

    async def update_preferences(self, actor: User, data: Dict[str, Any]) -> Dict[str, Any]:
        self._ensure_viewer(actor)
        profile = await self._get_or_create_profile(actor)

        prefs = profile.preferences or {}
        prefs.update(data)
        profile.preferences = prefs

        # Sync language/timezone to dedicated columns too
        if "language" in data:
            profile.language = data["language"]
        if "timezone" in data:
            profile.timezone = data["timezone"]

        self.session.add(profile)
        await self.session.commit()

        await AuditService.log(
            self.session,
            "viewer.preferences.updated",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )
        return await self.get_preferences(actor)

    # ─── Activity ──────────────────────────────────────────────────────────

    async def get_activity(self, actor: User, page: int = 1, size: int = 20) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        total = await self.session.scalar(
            select(func.count()).where(AuditLog.user_id == actor.id)
        ) or 0

        offset = (page - 1) * size
        stmt = select(AuditLog).where(
            AuditLog.user_id == actor.id
        ).order_by(desc(AuditLog.created_at)).offset(offset).limit(size)
        res = await self.session.execute(stmt)
        logs = res.scalars().all()

        entries = []
        for log in logs:
            entries.append({
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": str(log.resource_id) if log.resource_id else None,
                "details": None,
                "created_at": log.created_at
            })
            
        return {
            "entries": entries,
            "total": total,
            "page": page,
            "size": size,
        }

    # ─── Data Export ───────────────────────────────────────────────────────

    async def request_data_export(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        request_id = str(uuid.uuid4())
        await AuditService.log(
            self.session,
            "viewer.data_export.requested",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
            resource_id=request_id,
        )

        return {
            "status": "requested",
            "message": "Your personal data export has been requested. You will be notified when it is ready for download.",
            "request_id": request_id,
        }

    # ─── Account Deletion Request ──────────────────────────────────────────

    async def request_account_deletion(self, actor: User) -> Dict[str, Any]:
        self._ensure_viewer(actor)

        await AuditService.log(
            self.session,
            "viewer.account_deletion.requested",
            tenant_id=actor.tenant_id,
            user_id=actor.id,
        )

        return {
            "status": "pending_approval",
            "message": "Your account deletion request has been submitted. An organization administrator will review your request.",
        }
