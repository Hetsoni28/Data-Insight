"""Enterprise AuthService.

Implements:
- Brute-force account lockout (5 attempts -> 15 min lock)
- Token Versioning for instant global session revocation
- Multi-Factor Authentication (TOTP 6-digit + 10 emergency backup codes)
- Rotating Refresh Tokens with Token Reuse Attack Detection
- Active Device Session & Login History Audit Tracking
- Password Reset with secure OTP
"""

import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from loguru import logger

from app.schemas.user import UserCreate
from app.models.user import User
from app.models.auth import RefreshToken, LoginHistory
from app.models.user_session import UserSession
from app.models.notification import Notification
from app.repositories.user import UserRepository
from app.core.config import settings
from app.core.exceptions import (
    ConflictException,
    UnauthorizedException,
    ForbiddenException,
    ValidationException,
    ResourceNotFoundException,
)
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    create_mfa_token,
    decode_token,
    hash_token,
)
from app.services.mfa import MFAService
from app.core import otp as otp_service
from app.services import email as email_service
from app.services.notification_service import NotificationService


def parse_client_metadata(user_agent: Optional[str], ip_address: Optional[str]) -> Dict[str, str]:
    """Extract browser, OS, and device information from client headers."""
    client_ip = (ip_address or "127.0.0.1").split(",")[0].strip()
    device = "Desktop"
    os_name = "Windows"
    browser_name = "Chrome"

    if user_agent:
        ua = user_agent.lower()
        if "mac" in ua or "macintosh" in ua:
            os_name = "macOS"
            device = "MacBook"
        elif "android" in ua:
            os_name = "Android"
            device = "Mobile"
        elif "iphone" in ua or "ios" in ua:
            os_name = "iOS"
            device = "iPhone"
        elif "ipad" in ua:
            os_name = "iPadOS"
            device = "iPad"
        elif "linux" in ua:
            os_name = "Linux"
            device = "Linux PC"

        if "edg" in ua:
            browser_name = "Edge"
        elif "firefox" in ua:
            browser_name = "Firefox"
        elif "safari" in ua and "chrome" not in ua:
            browser_name = "Safari"
        elif "chrome" in ua:
            browser_name = "Chrome"

    location = "Localhost" if client_ip in ["127.0.0.1", "::1"] else "Remote"
    return {
        "ip": client_ip,
        "device": device,
        "os": os_name,
        "browser": browser_name,
        "location": location,
        "country": "Local" if location == "Localhost" else "Unknown",
        "city": "Localhost" if location == "Localhost" else "Unknown",
    }


class AuthService:
    def __init__(self, session: AsyncSession, redis: Redis):
        self.session = session
        self.redis = redis
        self.user_repo = UserRepository(session)

    # ── Request Access & Registration ─────────────────────────────────────────

    async def request_access(
        self, email: str, password: str, full_name: str, requested_role: str
    ) -> User:
        """Creates a new user in a Pending Approval state."""
        if settings.OWNER_EMAIL and email.lower() == settings.OWNER_EMAIL.lower():
            raise ConflictException("This email address is reserved.")

        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ConflictException("An account with this email already exists.")

        user = await self.user_repo.create(
            user_in=UserCreate(
                email=email,
                password=password,
                full_name=full_name,
                account_type="organization",
            )
        )

        user.is_active = False
        user.is_email_verified = True
        user.account_type = "organization"
        user.role = requested_role
        user.token_version = 1

        self.session.add(user)

        await NotificationService.create_notification(
            session=self.session,
            title="New Access Request",
            message=f"{full_name} ({email}) has requested platform access as {requested_role}.",
            category="Organization",
            priority="High",
            notif_type="org.access_request",
            icon="users",
        )

        await self.session.commit()
        await self.session.refresh(user)
        logger.info(f"[Auth] Access request submitted for {email} as {requested_role}")
        return user

    async def register(self, user_in: UserCreate) -> User:
        """Create a new user account with email verification OTP."""
        if settings.OWNER_EMAIL and user_in.email.lower() == settings.OWNER_EMAIL.lower():
            raise ConflictException("This email address is reserved.")

        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            if existing.is_email_verified:
                raise ConflictException("An account with this email already exists.")

            existing.hashed_password = get_password_hash(user_in.password)
            if user_in.full_name:
                existing.full_name = user_in.full_name
            await self.session.commit()
            new_user = existing
        else:
            new_user = await self.user_repo.create(user_in)

        new_user.token_version = 1
        self.session.add(new_user)
        await self.session.commit()

        verification_otp = await otp_service.create_email_verification_otp(
            self.redis, new_user.email
        )
        logger.info(f"[Auth] New user registered: {new_user.email} | OTP: {verification_otp}")

        await email_service.send_email_verification(
            to_email=new_user.email,
            full_name=new_user.full_name,
            otp=verification_otp,
        )
        return new_user

    async def verify_email_otp(self, email: str, otp: str) -> Dict[str, Any]:
        """Validate OTP on registration, mark verified, and issue tokens."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ResourceNotFoundException("User not found.")

        if not user.is_email_verified:
            valid = await otp_service.verify_email_otp(self.redis, email, otp)
            if not valid:
                raise ValidationException("Invalid or expired verification code.")
            user.is_email_verified = True
            await self.session.commit()
            await self.session.refresh(user)

        return await self._create_tokens_and_session(user=user)

    async def resend_verification_otp(self, email: str) -> None:
        """Resend OTP with rate limit."""
        user = await self.user_repo.get_by_email(email)
        if not user or user.is_email_verified:
            return

        allowed = await otp_service.check_resend_rate_limit(self.redis, email, max_per_hour=3)
        if not allowed:
            raise ForbiddenException("Too many resend requests. Please wait before requesting a new code.")

        new_otp = await otp_service.create_email_verification_otp(self.redis, email)
        await email_service.send_email_verification(to_email=email, full_name=user.full_name, otp=new_otp)

    # ── Enterprise Authentication & Lockout ──────────────────────────────────

    async def authenticate(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Authenticate user with account lockout & MFA check.
        Returns access/refresh tokens OR mfa_required payload.
        """
        meta = parse_client_metadata(user_agent, ip_address)
        user = await self.user_repo.get_by_email(email)
        now_utc = datetime.now(timezone.utc)

        # 1. User existence check with dummy password verification to prevent timing attacks
        if not user:
            verify_password("dummy", "$2b$12$e8uq2Bv2uV7s/F6uQJ2N6e5Fj2z9N3XvK3Ew2yU1K9n.q3gV6Nq0S")
            raise UnauthorizedException("Incorrect email or password.")

        # 2. Check Account Lockout status
        locked_until_utc = (
            user.locked_until.replace(tzinfo=timezone.utc)
            if user.locked_until and user.locked_until.tzinfo is None
            else user.locked_until
        )
        if locked_until_utc and locked_until_utc > now_utc:
            remaining_mins = max(1, int((locked_until_utc - now_utc).total_seconds() / 60))
            await self._record_login_history(
                user_id=user.id,
                meta=meta,
                success=False,
                failure_reason=f"Account locked until {locked_until_utc.isoformat()}",
            )
            raise UnauthorizedException(
                f"Account is temporarily locked due to excessive failed attempts. Please try again in {remaining_mins} minute(s)."
            )

        # 3. Validate Password
        if not verify_password(password, user.hashed_password):
            user.failed_login_attempts = getattr(user, "failed_login_attempts", 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now_utc + timedelta(minutes=15)
                await self.session.commit()
                await self._record_login_history(
                    user_id=user.id,
                    meta=meta,
                    success=False,
                    failure_reason="5 failed attempts - account locked for 15m",
                )
                raise UnauthorizedException(
                    "Too many failed login attempts. Your account has been locked for 15 minutes."
                )
            else:
                await self.session.commit()
                await self._record_login_history(
                    user_id=user.id,
                    meta=meta,
                    success=False,
                    failure_reason=f"Invalid password (attempt {user.failed_login_attempts}/5)",
                )
                remaining_attempts = 5 - user.failed_login_attempts
                raise UnauthorizedException(
                    f"Incorrect email or password. {remaining_attempts} attempt(s) remaining before lockout."
                )

        # 4. Password is valid -> Reset failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        await self.session.commit()

        if not user.is_email_verified:
            raise ForbiddenException("Please verify your email address before logging in.")

        if not user.is_active:
            raise ForbiddenException("Your account is pending approval by the Platform Owner.")

        # 5. Check if Multi-Factor Authentication (TOTP) is enabled
        if getattr(user, "mfa_enabled", False):
            mfa_token = create_mfa_token(subject=str(user.id))
            logger.info(f"[Auth] MFA challenge required for {email}")
            return {
                "mfa_required": True,
                "mfa_token": mfa_token,
                "user": None,
            }

        # 6. Issue full tokens & establish session
        return await self._create_tokens_and_session(user=user, meta=meta, user_agent=user_agent)

    # ── MFA Challenge Verification ───────────────────────────────────────────

    async def verify_mfa_login(
        self,
        mfa_token: str,
        code: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Validate TOTP 6-digit code or emergency recovery code for 2-step login."""
        try:
            payload = decode_token(mfa_token)
            if payload.get("type") != "mfa_pending":
                raise UnauthorizedException("Invalid MFA token type.")
            user_id = payload.get("sub")
        except Exception:
            raise UnauthorizedException("MFA session expired. Please enter your password again.")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or deactivated.")

        meta = parse_client_metadata(user_agent, ip_address)
        clean_code = code.replace(" ", "").replace("-", "").strip()

        # Check TOTP 6-digit code
        is_valid_totp = False
        if len(clean_code) == 6 and clean_code.isdigit() and user.mfa_secret:
            is_valid_totp = MFAService.verify_totp_code(user.mfa_secret, clean_code)

        if not is_valid_totp:
            # Check single-use emergency backup recovery codes
            consumed, remaining_codes = MFAService.verify_and_consume_recovery_code(
                user.mfa_recovery_codes, code
            )
            if consumed:
                user.mfa_recovery_codes = remaining_codes
                await self.session.commit()
                logger.info(f"[Auth] Emergency recovery code consumed for user {user.email}")
            else:
                await self._record_login_history(
                    user_id=user.id,
                    meta=meta,
                    success=False,
                    failure_reason="Invalid MFA TOTP/Recovery code",
                )
                raise ValidationException("Invalid two-factor authentication code or backup code.")

        logger.info(f"[Auth] MFA login successful for {user.email}")
        return await self._create_tokens_and_session(user=user, meta=meta, user_agent=user_agent)

    # ── Refresh Token Rotation with Reuse Detection ──────────────────────────

    async def rotate_refresh_token(
        self, refresh_token_str: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Validate incoming refresh token, revoke it, and issue a fresh pair.
        Detects token reuse attacks and terminates all user sessions if a revoked token is replayed.
        """
        try:
            payload = decode_token(refresh_token_str)
            if payload.get("type") != "refresh":
                raise UnauthorizedException("Invalid token type.")
            user_id = payload.get("sub")
            token_version = payload.get("token_version", 1)
        except Exception:
            raise UnauthorizedException("Refresh token is invalid or expired.")

        user = await self.user_repo.get_by_id(user_id)
        if not user or not user.is_active:
            raise UnauthorizedException("User not found or inactive.")

        if getattr(user, "token_version", 1) != token_version:
            raise UnauthorizedException("Session has been revoked. Please log in again.")

        incoming_hash = hash_token(refresh_token_str)
        stmt = select(RefreshToken).where(RefreshToken.token_hash == incoming_hash)
        res = await self.session.execute(stmt)
        stored_token = res.scalar_one_or_none()

        # REUSE DETECTION: If token record not found or already revoked -> Compromise detected!
        if not stored_token or stored_token.is_revoked:
            logger.critical(
                f"[Security Alert] Revoked refresh token reuse detected for user {user.email}! Revoking all sessions."
            )
            # Invalidate all active sessions globally by bumping token_version
            user.token_version = getattr(user, "token_version", 1) + 1
            await self.session.execute(
                update(RefreshToken)
                .where(RefreshToken.user_id == user.id)
                .values(is_revoked=True)
            )
            await self.session.execute(
                update(UserSession)
                .where(UserSession.user_id == user.id)
                .values(is_active=False)
            )
            await self.session.commit()
            raise UnauthorizedException(
                "Security alert: Token reuse detected. All active sessions have been revoked for your security."
            )

        # Mark current token as consumed / revoked
        stored_token.is_revoked = True

        # Issue new token pair
        new_access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
            tenant_id=str(user.tenant_id) if user.tenant_id else None,
            token_version=user.token_version,
        )
        new_refresh_token = create_refresh_token(
            subject=str(user.id),
            token_version=user.token_version,
        )

        # Save new refresh token
        new_token_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(new_refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
            is_revoked=False,
        )
        self.session.add(new_token_record)
        await self.session.commit()

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }

    # ── MFA Management (Setup / Enable / Disable) ────────────────────────────

    async def setup_mfa(self, user: User) -> Dict[str, Any]:
        """Generate a new TOTP secret, QR Code data URL, and backup recovery codes."""
        secret = MFAService.generate_totp_secret()
        otpauth_url = MFAService.get_totp_uri(secret, email=user.email)
        qr_code_base64 = MFAService.generate_qr_code_base64(otpauth_url)
        plain_recovery_codes = MFAService.generate_recovery_codes(count=10)

        return {
            "secret": secret,
            "otpauth_url": otpauth_url,
            "qr_code_base64": qr_code_base64,
            "recovery_codes": plain_recovery_codes,
        }

    async def enable_mfa(
        self, user: User, secret: str, code: str, recovery_codes: List[str]
    ) -> bool:
        """Verify the user's first 6-digit TOTP code and enable 2FA on their account."""
        if not MFAService.verify_totp_code(secret, code):
            raise ValidationException("Invalid 6-digit confirmation code. Please try again.")

        hashed_codes = [MFAService.hash_code(rc) for rc in recovery_codes]
        user.mfa_enabled = True
        user.mfa_secret = secret
        user.mfa_recovery_codes = hashed_codes
        await self.session.commit()
        await self.session.refresh(user)

        logger.info(f"[Auth] 2FA enabled for user {user.email}")
        return True

    async def disable_mfa(self, user: User, password: str) -> bool:
        """Verify user password and disable 2FA."""
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect password.")

        user.mfa_enabled = False
        user.mfa_secret = None
        user.mfa_recovery_codes = None
        await self.session.commit()
        await self.session.refresh(user)

        logger.info(f"[Auth] 2FA disabled for user {user.email}")
        return True

    # ── Session & Device Management ──────────────────────────────────────────

    async def list_user_sessions(self, user: User, current_token_hash: Optional[str] = None) -> List[Dict[str, Any]]:
        """List active device sessions for the authenticated user."""
        stmt = (
            select(UserSession)
            .where(UserSession.user_id == user.id, UserSession.is_active == True)
            .order_by(UserSession.last_active_at.desc())
        )
        res = await self.session.execute(stmt)
        sessions = res.scalars().all()

        results = []
        for s in sessions:
            results.append({
                "id": str(s.id),
                "device_name": s.device_name or "Desktop",
                "browser": s.browser or "Chrome",
                "os": s.os or "Windows",
                "ip_address": s.ip_address or "127.0.0.1",
                "country": getattr(s, "country", "Unknown") or "Unknown",
                "city": getattr(s, "city", "Unknown") or "Unknown",
                "is_current": (s.token_hash == current_token_hash) if current_token_hash else False,
                "last_active_at": s.last_active_at,
                "created_at": s.created_at,
            })
        return results

    async def revoke_session(self, user: User, session_id: uuid.UUID) -> bool:
        """Revoke a specific device session."""
        stmt = select(UserSession).where(
            UserSession.id == session_id, UserSession.user_id == user.id
        )
        res = await self.session.execute(stmt)
        sess = res.scalar_one_or_none()
        if not sess:
            raise ResourceNotFoundException("Session not found.")

        sess.is_active = False
        await self.session.commit()
        return True

    async def revoke_all_sessions(self, user: User) -> bool:
        """Revoke all sessions and refresh tokens globally by incrementing token_version."""
        user.token_version = getattr(user, "token_version", 1) + 1
        await self.session.execute(
            update(UserSession)
            .where(UserSession.user_id == user.id)
            .values(is_active=False)
        )
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .values(is_revoked=True)
        )
        await self.session.commit()
        logger.info(f"[Auth] All sessions revoked globally for user {user.email}")
        return True

    async def list_login_history(self, user: User, limit: int = 20) -> List[LoginHistory]:
        """Fetch recent login history audit records."""
        stmt = (
            select(LoginHistory)
            .where(LoginHistory.user_id == user.id)
            .order_by(LoginHistory.created_at.desc())
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        return list(res.scalars().all())

    # ── Password Reset ────────────────────────────────────────────────────────

    async def request_password_reset(self, email: str) -> None:
        """Send password reset OTP."""
        user = await self.user_repo.get_by_email(email)
        if not user:
            return  # Prevent email enumeration

        reset_otp = await otp_service.create_password_reset_otp(self.redis, email)
        await email_service.send_password_reset(to_email=email, otp=reset_otp)

    async def reset_password_with_otp(self, email: str, otp: str, new_password: str) -> None:
        """Verify OTP, update password, and revoke existing sessions for security."""
        if len(new_password) < 8:
            raise ValidationException("Password must be at least 8 characters.")

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValidationException("Invalid or expired reset code.")

        valid = await otp_service.verify_password_reset_otp(self.redis, email, otp)
        if not valid:
            raise ValidationException("Invalid or expired reset code.")

        user.hashed_password = get_password_hash(new_password)
        user.token_version = getattr(user, "token_version", 1) + 1
        await self.session.commit()
        logger.info(f"[Auth] Password reset complete & all sessions invalidated for {email}")

    # ── Internal Helpers ──────────────────────────────────────────────────────

    async def _create_tokens_and_session(
        self,
        user: User,
        meta: Optional[Dict[str, str]] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Helper to create access/refresh token pair, persist session and login history."""
        if not meta:
            meta = parse_client_metadata(user_agent, "127.0.0.1")

        access_token = create_access_token(
            subject=str(user.id),
            role=user.role,
            tenant_id=str(user.tenant_id) if user.tenant_id else None,
            token_version=getattr(user, "token_version", 1),
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            token_version=getattr(user, "token_version", 1),
        )

        now = datetime.now(timezone.utc)
        token_hash_val = hash_token(access_token)

        # 1. Create RefreshToken record
        refresh_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=now + timedelta(days=30),
            is_revoked=False,
        )
        self.session.add(refresh_record)

        # 2. Create UserSession record
        session_record = UserSession(
            user_id=user.id,
            token_hash=token_hash_val,
            device_name=meta.get("device", "Desktop"),
            os=meta.get("os", "Windows"),
            browser=meta.get("browser", "Chrome"),
            location=meta.get("location", "Localhost"),
            country=meta.get("country", "Unknown"),
            city=meta.get("city", "Unknown"),
            ip_address=meta.get("ip", "127.0.0.1"),
            user_agent=user_agent,
            is_active=True,
            expires_at=now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            last_active_at=now,
        )
        self.session.add(session_record)

        # 3. Record Login History (Success)
        await self._record_login_history(user_id=user.id, meta=meta, success=True)

        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "mfa_required": False,
            "mfa_token": None,
            "user": user,
        }

    async def _record_login_history(
        self,
        user_id: uuid.UUID,
        meta: Dict[str, str],
        success: bool,
        failure_reason: Optional[str] = None,
    ) -> None:
        """Internal helper to write an immutable login attempt record."""
        try:
            history = LoginHistory(
                user_id=user_id,
                ip_address=meta.get("ip", "127.0.0.1"),
                browser=meta.get("browser", "Chrome"),
                os=meta.get("os", "Windows"),
                device=meta.get("device", "Desktop"),
                country=meta.get("country", "Unknown"),
                city=meta.get("city", "Unknown"),
                success=success,
                failure_reason=failure_reason,
            )
            self.session.add(history)
            await self.session.commit()
        except Exception as e:
            logger.warning(f"[Auth] Failed to write login history: {e}")
