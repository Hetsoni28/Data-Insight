"""
Authentication endpoints — register, verify-email, login, resend-otp,
forgot-password, reset-password, /me, logout.

Rate limits (applied per IP via SlowAPI):
  POST /auth/login          → 5 requests / 15 minutes
  POST /auth/resend-otp     → 3 requests / hour
  POST /auth/forgot-password→ 3 requests / hour
  POST /auth/register       → 10 requests / hour
"""

from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis
from pydantic import BaseModel, EmailStr, field_validator

from app.api.deps import get_db, get_redis, get_current_user
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse
from app.schemas.token import Token
from app.services.auth import AuthService
from app.core.rate_limit import limiter

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Request / Response Schemas ────────────────────────────────────────────────


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class RequestAccessPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    requested_role: str


class VerifyLoginPayload(BaseModel):
    email: EmailStr
    password: str
    otp: str

    @field_validator("otp")
    @classmethod
    def otp_must_be_6_digits(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP must be a 6-digit number.")
        return v


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


class MessageResponse(BaseModel):
    message: str


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post(
    "/request-access",
    response_model=MessageResponse,
    summary="Submit a request for access to the platform",
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
    response_model=Token,
    summary="Submit the 6-digit email OTP to verify your account",
)
async def verify_email(
    payload: VerifyEmailPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    access_token = await auth_service.verify_email_otp(
        email=payload.email,
        otp=payload.otp,
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post(
    "/resend-otp",
    response_model=MessageResponse,
    summary="Resend the verification OTP (max 3 times per hour)",
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
    return MessageResponse(
        message="A new verification code has been sent to your email."
    )


@router.post(
    "/login",
    response_model=MessageResponse,
    summary="Login step 1: Validate credentials and send 2FA OTP",
)
@limiter.limit("5/15minutes")
async def login(
    request: Request,
    payload: LoginPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    response_data = await auth_service.authenticate(
        email=payload.email,
        password=payload.password,
    )
    return MessageResponse(message=response_data["message"])


@router.post(
    "/verify-login",
    response_model=Token,
    summary="Login step 2: Verify 2FA OTP and issue token",
)
async def verify_login(
    payload: VerifyLoginPayload,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    auth_service = AuthService(db, redis)
    access_token = await auth_service.verify_login(
        email=payload.email,
        password=payload.password,
        otp=payload.otp,
    )
    return Token(access_token=access_token, token_type="bearer")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset OTP (sent to email)",
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
    # Always return success — never reveal if the email exists
    return MessageResponse(
        message="If an account exists with this email, a reset code has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using the OTP from email",
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
    return MessageResponse(message="Password reset successfully. You can now log in.")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get the authenticated user's profile",
)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (client discards token)",
)
async def logout(current_user: User = Depends(get_current_user)):
    # Stateless JWT — client discards token.
    # Future: add token to Redis blacklist for forced invalidation.
    return MessageResponse(message="Logged out successfully.")


@router.post(
    "/refresh-token",
    response_model=Token,
    summary="Get a fresh token with updated DB claims",
)
async def refresh_token(current_user: User = Depends(get_current_user)):
    from app.core.security import create_access_token

    access_token = create_access_token(
        subject=str(current_user.id),
        role=current_user.role,
        tenant_id=str(current_user.tenant_id) if current_user.tenant_id else None,
    )
    return Token(access_token=access_token, token_type="bearer")


from app.schemas.invitation import AcceptInvitationRequest
from app.models.invitation import Invitation, InvitationStatus
from sqlalchemy import select
from app.core.security import create_access_token


@router.post(
    "/accept-invite",
    response_model=Token,
    summary="Accept an invitation using the secure token and create account",
)
async def accept_invite(
    payload: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import (
        ResourceNotFoundException,
        ValidationException,
        ConflictException,
    )
    from app.core.security import get_password_hash

    stmt = select(Invitation).where(
        Invitation.token == payload.token, Invitation.status == InvitationStatus.PENDING
    )
    invitation = (await db.execute(stmt)).scalars().first()

    if not invitation:
        raise ResourceNotFoundException("Invalid or expired invitation token.")

    import datetime

    if invitation.expires_at < datetime.datetime.now(datetime.timezone.utc):
        invitation.status = InvitationStatus.REVOKED
        await db.commit()
        raise ValidationException("Invitation token has expired.")

    # Check if a user with this email already exists
    stmt_user = select(User).where(User.email == invitation.email)
    existing_user = (await db.execute(stmt_user)).scalars().first()
    if existing_user:
        raise ConflictException("A user with this email already exists.")

    # Create the new user
    new_user = User(
        email=invitation.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=invitation.role,
        tenant_id=invitation.tenant_id,
        is_active=True,
        is_email_verified=True,  # Accepting the email invite implies verification
        account_type="organization",  # By definition, they are joining an org
    )

    db.add(new_user)

    # Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED

    await db.commit()
    await db.refresh(new_user)

    # Issue a fresh token
    access_token = create_access_token(
        subject=str(new_user.id),
        role=new_user.role,
        tenant_id=str(new_user.tenant_id) if new_user.tenant_id else None,
    )
    return Token(access_token=access_token, token_type="bearer")
