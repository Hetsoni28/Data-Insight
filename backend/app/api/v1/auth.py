"""Enterprise Authentication Endpoints.

Provides:
- Dual-step login (Password -> TOTP MFA / Recovery Code)
- Refresh Token Rotation (RTR) with Reuse Attack Detection
- Session and Active Device Management (List, Revoke, Logout All)
- MFA Configuration (QR setup, verification, recovery codes, disable)
- Login History Auditing
- Email OTP verification & Password Reset
- Invitation Acceptance
"""

import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.api.deps import get_db, get_redis, get_current_user
from app.models.user import User
from app.models.invitation import Invitation, InvitationStatus
from app.models.tenant import Tenant
from app.models.notification import Notification as NotifModel
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MFALoginRequest,
    MFASetupResponse,
    MFAVerifyRequest,
    MFADisableRequest,
    RefreshTokenRequest,
    UserSessionResponse,
    LoginHistoryResponse,
)
from app.schemas.invitation import AcceptInvitationRequest, ValidateInviteResponse
from app.services.auth import AuthService
from app.core.rate_limit import limiter
from app.core.security import hash_token, get_password_hash

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Additional Request Payload Schemas ────────────────────────────────────────

class RequestAccessPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    requested_role: str


class VerifyEmailPayload(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_must_be_6_digits(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number.")
        return v


class ResendOTPPayload(BaseModel):
    email: EmailStr


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        return v


class MFAEnablePayload(BaseModel):
    secret: str
    code: str = Field(..., min_length=6, max_length=6)
    recovery_codes: List[str]


class MessageResponse(BaseModel):
    message: str


# ── Authentication Routes ─────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login: Authenticate with password. Returns tokens or MFA challenge token.",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    payload: LoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "127.0.0.1")
    user_agent = request.headers.get("user-agent", "")

    result = await auth_service.authenticate(
        email=payload.email,
        password=payload.password,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    if result.get("mfa_required"):
        return LoginResponse(
            mfa_required=True,
            mfa_token=result["mfa_token"],
        )

    user_obj = result.get("user")
    user_resp = UserResponse.model_validate(user_obj) if user_obj else None

    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type="bearer",
        mfa_required=False,
        user=user_resp,
    )


@router.post(
    "/login/mfa",
    response_model=LoginResponse,
    summary="Login Step 2: Validate 6-digit TOTP code or backup recovery code.",
)
@limiter.limit("10/minute")
async def login_mfa(
    request: Request,
    payload: MFALoginRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "127.0.0.1")
    user_agent = request.headers.get("user-agent", "")

    result = await auth_service.verify_mfa_login(
        mfa_token=payload.mfa_token,
        code=payload.code,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    user_obj = result.get("user")
    user_resp = UserResponse.model_validate(user_obj) if user_obj else None

    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type="bearer",
        mfa_required=False,
        user=user_resp,
    )


@router.post(
    "/refresh",
    response_model=LoginResponse,
    summary="Refresh Token Rotation: Issue new Access & Refresh tokens, revoking old ones.",
)
async def refresh_tokens(
    request: Request,
    payload: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "127.0.0.1")
    user_agent = request.headers.get("user-agent", "")

    result = await auth_service.rotate_refresh_token(
        refresh_token_str=payload.refresh_token,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type="bearer",
        mfa_required=False,
    )


# ── Registration & Email Verification ─────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and dispatch email verification OTP",
)
@limiter.limit("10/hour")
async def register(
    request: Request,
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    new_user = await auth_service.register(user_in)
    return new_user


@router.post(
    "/request-access",
    response_model=MessageResponse,
    summary="Submit a request for platform access",
)
@limiter.limit("5/hour")
async def request_access(
    request: Request,
    payload: RequestAccessPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.request_access(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        requested_role=payload.requested_role,
    )
    return MessageResponse(
        message="Your access request has been submitted and is pending approval from the Platform Owner."
    )


@router.post(
    "/verify-email",
    response_model=LoginResponse,
    summary="Verify registration OTP and receive login tokens",
)
async def verify_email(
    payload: VerifyEmailPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    result = await auth_service.verify_email_otp(
        email=payload.email,
        otp=payload.otp,
    )
    user_obj = result.get("user")
    user_resp = UserResponse.model_validate(user_obj) if user_obj else None
    return LoginResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type="bearer",
        mfa_required=False,
        user=user_resp,
    )


@router.post(
    "/resend-otp",
    response_model=MessageResponse,
    summary="Resend registration verification OTP",
)
@limiter.limit("3/hour")
async def resend_otp(
    request: Request,
    payload: ResendOTPPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.resend_verification_otp(email=payload.email)
    return MessageResponse(message="A new verification code has been sent to your email.")


# ── MFA Configuration ────────────────────────────────────────────────────────

@router.post(
    "/mfa/setup",
    response_model=MFASetupResponse,
    summary="Generate TOTP secret, QR code Data URL, and 10 emergency recovery codes",
)
async def setup_mfa(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    return await auth_service.setup_mfa(current_user)


@router.post(
    "/mfa/enable",
    response_model=MessageResponse,
    summary="Confirm 6-digit TOTP code and activate 2FA",
)
async def enable_mfa(
    payload: MFAEnablePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.enable_mfa(
        user=current_user,
        secret=payload.secret,
        code=payload.code,
        recovery_codes=payload.recovery_codes,
    )
    return MessageResponse(message="Two-factor authentication has been successfully enabled.")


@router.post(
    "/mfa/disable",
    response_model=MessageResponse,
    summary="Disable two-factor authentication (requires current password)",
)
async def disable_mfa(
    payload: MFADisableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.disable_mfa(user=current_user, password=payload.password)
    return MessageResponse(message="Two-factor authentication has been disabled.")


# ── Active Sessions & Device Management ──────────────────────────────────────

@router.get(
    "/sessions",
    response_model=List[UserSessionResponse],
    summary="List all active device sessions for authenticated user",
)
async def list_sessions(
    authorization: str | None = Header(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    current_hash = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        current_hash = hash_token(token)

    return await auth_service.list_user_sessions(current_user, current_hash)


@router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
    summary="Revoke a specific device session",
)
async def revoke_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.revoke_session(current_user, session_id)
    return MessageResponse(message="Device session revoked successfully.")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="Terminate all active sessions and refresh tokens globally",
)
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.revoke_all_sessions(current_user)
    return MessageResponse(message="All active sessions have been terminated.")


@router.get(
    "/login-history",
    response_model=List[LoginHistoryResponse],
    summary="Get recent login attempts audit history",
)
async def get_login_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    return await auth_service.list_login_history(current_user)


# ── User Profile, Logout & Password Reset ────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get authenticated user's profile and security status",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout current session",
)
async def logout(
    authorization: str | None = Header(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        t_hash = hash_token(token)
        from app.models.user_session import UserSession
        from sqlalchemy import update
        await db.execute(
            update(UserSession)
            .where(UserSession.token_hash == t_hash, UserSession.user_id == current_user.id)
            .values(is_active=False)
        )
        await db.commit()
    return MessageResponse(message="Logged out successfully.")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset OTP",
)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.request_password_reset(email=payload.email)
    return MessageResponse(message="If an account exists with this email, a reset code has been sent.")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using email OTP",
)
async def reset_password(
    payload: ResetPasswordPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    await auth_service.reset_password_with_otp(
        email=payload.email,
        otp=payload.otp,
        new_password=payload.new_password,
    )
    return MessageResponse(message="Password reset successfully. All sessions have been invalidated.")


# ── Invitation Lifecycle ─────────────────────────────────────────────────────

@router.get(
    "/invite/{token}",
    response_model=ValidateInviteResponse,
    summary="Validate invitation token and return organization details",
)
async def validate_invite(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Invitation).where(Invitation.token == token)
    invitation = (await db.execute(stmt)).scalars().first()

    if not invitation:
        return ValidateInviteResponse(
            valid=False,
            error="This invitation link is invalid or does not exist.",
        )

    if invitation.status == InvitationStatus.ACCEPTED:
        return ValidateInviteResponse(
            valid=False,
            error="This invitation has already been accepted. Please sign in with your credentials.",
        )

    if invitation.status == InvitationStatus.REVOKED:
        return ValidateInviteResponse(
            valid=False,
            error="This invitation has been revoked by an administrator.",
        )

    if invitation.expires_at < datetime.datetime.now(datetime.timezone.utc):
        return ValidateInviteResponse(
            valid=False,
            error="This invitation link has expired. Please request a new invitation.",
        )

    tenant = await db.scalar(select(Tenant).where(Tenant.id == invitation.tenant_id))
    org_name = tenant.name if tenant else "Organization"

    return ValidateInviteResponse(
        valid=True,
        email=invitation.email,
        role=invitation.role,
        org_name=org_name,
        error=None,
    )


@router.post(
    "/accept-invite",
    response_model=LoginResponse,
    summary="Accept invitation and initialize user account",
)
async def accept_invite(
    payload: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    from app.core.exceptions import ResourceNotFoundException, ValidationException, ConflictException

    stmt = select(Invitation).where(
        Invitation.token == payload.token, Invitation.status == InvitationStatus.PENDING
    )
    invitation = (await db.execute(stmt)).scalars().first()

    if not invitation:
        raise ResourceNotFoundException("Invalid or expired invitation token.")

    if invitation.expires_at < datetime.datetime.now(datetime.timezone.utc):
        invitation.status = InvitationStatus.REVOKED
        await db.commit()
        raise ValidationException("Invitation token has expired.")

    stmt_user = select(User).where(User.email == invitation.email)
    existing_user = (await db.execute(stmt_user)).scalars().first()
    if existing_user:
        raise ConflictException("A user with this email already exists.")

    new_user = User(
        email=invitation.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=invitation.role,
        tenant_id=invitation.tenant_id,
        is_active=True,
        is_email_verified=True,
        account_type="organization",
        token_version=1,
    )
    db.add(new_user)
    invitation.status = InvitationStatus.ACCEPTED

    display_name = payload.full_name or invitation.email
    invite_notif = NotifModel(
        title="New User Joined via Invitation",
        message=f"{display_name} ({invitation.email}) has accepted their invitation as {invitation.role}.",
        category="Organization",
        priority="Medium",
        icon="users",
        type="org.invite_accepted",
        tenant_id=invitation.tenant_id,
        user_id=None,
        is_read=False,
        status="Unread",
        is_pinned=False,
        created_at=datetime.datetime.now(datetime.timezone.utc),
    )
    db.add(invite_notif)
    await db.commit()
    await db.refresh(new_user)

    auth_service = AuthService(db, redis)
    tokens = await auth_service._create_tokens_and_session(user=new_user)
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type="bearer",
        mfa_required=False,
        user=UserResponse.model_validate(new_user),
    )
