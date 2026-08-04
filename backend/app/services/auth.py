"""
AuthService — register, login, email OTP verification, password reset.

All auth flows:
  register()                → create user + send OTP
  verify_email_otp()        → validate OTP, mark verified, return JWT
  resend_verification_otp() → resend OTP (rate limited)
  authenticate()            → check verified + active, return JWT
  request_password_reset()  → send reset OTP
  reset_password_with_otp() → verify OTP, update password
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from loguru import logger

from app.schemas.user import UserCreate
from app.models.user import User
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
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core import otp as otp_service
from app.services import email as email_service
from app.services.notification_service import NotificationService





class AuthService:
    def __init__(self, session: AsyncSession, redis: Redis):
        self.session = session
        self.redis = redis
        self.user_repo = UserRepository(session)

    # ── Request Access ────────────────────────────────────────────────────────

    async def request_access(
        self, email: str, password: str, full_name: str, requested_role: str
    ) -> User:
        """
        Creates a new user in a Pending Approval state (is_active = False).
        Platform Owner must approve before the user can log in.
        """
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

        # Override default creation values to enforce pending state
        user.is_active = False
        user.is_email_verified = (
            True  # Skip email verification for owner-approved accounts
        )
        user.account_type = "organization"
        user.role = requested_role

        self.session.add(user)

        # Notify the owner: new access request pending approval
        await NotificationService.create_notification(
            session=self.session,
            title="New Access Request",
            message=f"{full_name} ({email}) has requested platform access as {requested_role}. Pending your approval.",
            category="Organization",
            priority="High",
            notif_type="org.access_request",
            icon="users"
        )

        await self.session.commit()
        await self.session.refresh(user)

        logger.info(f"[Auth] Access request submitted for {email} as {requested_role}")
        return user

    # ── Register ────────────────────────────────────────────────────────────

    async def register(self, user_in: UserCreate) -> User:
        """
        Create a new user account.
        Sends a 6-digit OTP to the registered email.
        The user CANNOT log in until they verify their email.

        Security rules:
          - OWNER_EMAIL is permanently blocked from public registration.
          - account_type drives automatic role assignment (viewer for individual,
            viewer initially for organization — elevated to org_admin at onboarding).
        """
        # --- SECURITY: Block owner email from public registration ---
        if (
            settings.OWNER_EMAIL
            and user_in.email.lower() == settings.OWNER_EMAIL.lower()
        ):
            raise ConflictException(
                "This email address is reserved. Please use a different email."
            )

        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            if existing.is_email_verified:
                raise ConflictException("An account with this email already exists.")

            # The user registered before but didn't verify.
            # Update their details in case they changed them, and resend OTP.
            existing.hashed_password = get_password_hash(user_in.password)
            if user_in.full_name:
                existing.full_name = user_in.full_name
            await self.session.commit()
            new_user = existing
        else:
            new_user = await self.user_repo.create(user_in)

        # Generate and send OTP
        verification_otp = await otp_service.create_email_verification_otp(
            self.redis, new_user.email
        )
        logger.info(
            f"[Auth] New user registered: {new_user.email} | OTP: {verification_otp}"
        )

        await email_service.send_email_verification(
            to_email=new_user.email,
            full_name=new_user.full_name,
            otp=verification_otp,
        )

        return new_user

    # ── Verify Email ─────────────────────────────────────────────────────────

    async def verify_email_otp(self, email: str, otp: str) -> str:
        """
        Validate the OTP submitted by the user.
        On success: marks email as verified + returns JWT access token.
        """
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ResourceNotFoundException("User not found.")

        if user.is_email_verified:
            # Already verified — just return a token
            return create_access_token(subject=str(user.id))

        valid = await otp_service.verify_email_otp(self.redis, email, otp)
        if not valid:
            raise ValidationException("Invalid or expired verification code.")

        # Mark verified
        user.is_email_verified = True

        # Notify the owner about this new verified user joining the platform
        await NotificationService.create_notification(
            session=self.session,
            title="New User Verified",
            message=f"{user.full_name} ({user.email}) has completed registration and verified their email.",
            category="Organization",
            priority="Medium",
            notif_type="org.user_joined",
            icon="users"
        )

        await self.session.commit()
        await self.session.refresh(user)

        logger.info(f"[Auth] Email verified: {email}")
        return create_access_token(
            subject=str(user.id),
            role=user.role,
            tenant_id=str(user.tenant_id) if user.tenant_id else None,
        )

    # ── Resend OTP ───────────────────────────────────────────────────────────

    async def resend_verification_otp(self, email: str) -> None:
        """
        Resend a new OTP to the email address.
        Rate limited to 3 sends per hour per email.
        """
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Don't reveal whether email exists
            return

        if user.is_email_verified:
            raise ConflictException("Email is already verified.")

        # Rate limit check
        allowed = await otp_service.check_resend_rate_limit(
            self.redis, email, max_per_hour=3
        )
        if not allowed:
            raise ForbiddenException(
                "Too many resend requests. Please wait an hour before requesting a new code."
            )

        new_otp = await otp_service.create_email_verification_otp(self.redis, email)
        logger.info(f"[Auth] Resent verification OTP to {email}")

        await email_service.send_email_verification(
            to_email=email,
            full_name=user.full_name,
            otp=new_otp,
        )

    # ── Login ────────────────────────────────────────────────────────────────

    async def authenticate(self, email: str, password: str) -> dict:
        """
        Authenticate a user with email + password.
        Guards:
          1. User must exist
          2. Password must be correct
          3. Email must be verified
          4. Account must be active
        Returns a JWT access token.
        """
        user = await self.user_repo.get_by_email(email)

        # Use a constant-time check to prevent user enumeration
        if not user:
            # Still run a dummy hash check to prevent timing attacks
            verify_password(
                "dummy",
                "$2b$12$e8uq2Bv2uV7s/F6uQJ2N6e5Fj2z9N3XvK3Ew2yU1K9n.q3gV6Nq0S",
            )
            raise UnauthorizedException("Incorrect email or password.")

        if not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password.")

        if not user.is_email_verified:
            raise ForbiddenException(
                "Please verify your email address before logging in. "
                "Check your inbox for the 6-digit code."
            )

        if not user.is_active:
            raise ForbiddenException(
                "Your account is pending approval by the Platform Owner."
            )

        logger.info(f"[Auth] 2FA Login initiated: {email}")

        login_otp = await otp_service.create_login_otp(self.redis, email)

        await email_service.send_email_verification(
            to_email=email,
            full_name=user.full_name,
            otp=login_otp,
        )

        return {"message": "OTP sent to your email", "requires_2fa": True}

    # ── Verify Login ─────────────────────────────────────────────────────────

    async def verify_login(
        self,
        email: str,
        otp: str,
        password: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str:
        """
        Verify the 2FA OTP to complete login and record genuine user session.
        """
        import hashlib
        from datetime import timedelta
        from app.models.user_session import UserSession

        user = await self.user_repo.get_by_email(email)

        if not user:
            raise UnauthorizedException("Incorrect email or password.")

        if password and not verify_password(password, user.hashed_password):
            raise UnauthorizedException("Incorrect email or password.")

        if not user.is_active:
            raise ForbiddenException(
                "Your account is pending approval by the Platform Owner."
            )

        valid = await otp_service.verify_login_otp(self.redis, email, otp)
        if not valid:
            raise ValidationException("Invalid or expired 2FA code.")

        logger.info(f"[Auth] 2FA Login completed: {email}")
        token = create_access_token(
            subject=str(user.id),
            role=user.role,
            tenant_id=str(user.tenant_id) if user.tenant_id else None,
        )

        # Record genuine UserSession
        try:
            device = "Desktop"
            os_name = "Windows"
            browser_name = "Chrome"
            if user_agent:
                ua = user_agent.lower()
                if "mac" in ua:
                    os_name = "macOS"
                    device = "MacBook"
                elif "android" in ua:
                    os_name = "Android"
                    device = "Android Device"
                elif "iphone" in ua or "ios" in ua:
                    os_name = "iOS"
                    device = "iPhone"
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

            token_hash = hashlib.sha256(token.encode()).hexdigest()
            session = UserSession(
                user_id=user.id,
                token_hash=token_hash,
                device_name=device,
                os=os_name,
                browser=browser_name,
                location="Localhost" if ip_address in ["127.0.0.1", "::1"] else "Remote",
                ip_address=ip_address or "127.0.0.1",
                user_agent=user_agent,
                is_active=True,
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
                last_active_at=datetime.now(timezone.utc),
            )
            self.session.add(session)
            await self.session.commit()
        except Exception as e:
            logger.warning(f"[Auth] Failed to create user session record: {e}")

        return token

    # ── Forgot Password ──────────────────────────────────────────────────────

    async def request_password_reset(self, email: str) -> None:
        """
        Send a password reset OTP.
        Always returns successfully to avoid revealing whether email is registered.
        """
        user = await self.user_repo.get_by_email(email)
        if not user:
            logger.info(f"[Auth] Password reset requested for unknown email: {email}")
            return  # Silent — don't reveal

        reset_otp = await otp_service.create_password_reset_otp(self.redis, email)
        logger.info(f"[Auth] Password reset OTP created for {email}")

        await email_service.send_password_reset(
            to_email=email,
            otp=reset_otp,
        )

    # ── Reset Password ────────────────────────────────────────────────────────

    async def reset_password_with_otp(
        self, email: str, otp: str, new_password: str
    ) -> None:
        """
        Verify the reset OTP and update the user's password.
        Raises ValidationException if OTP is invalid or expired.
        """
        if len(new_password) < 8:
            raise ValidationException("Password must be at least 8 characters.")

        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValidationException("Invalid or expired reset code.")

        valid = await otp_service.verify_password_reset_otp(self.redis, email, otp)
        if not valid:
            raise ValidationException("Invalid or expired reset code.")

        user.hashed_password = get_password_hash(new_password)
        await self.session.commit()

        logger.info(f"[Auth] Password reset complete for {email}")
