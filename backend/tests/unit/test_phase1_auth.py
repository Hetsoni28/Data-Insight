"""Comprehensive Unit Tests for Phase 1 Enterprise Authentication & Security.

Tests:
1. MFAService: Secret gen, QR data URL, TOTP verification, Backup recovery code hashing & consumption
2. Account Lockout: 5 failed attempts trigger 15-minute lock
3. MFA Two-Step Login Challenge
4. Refresh Token Rotation (RTR) & Reuse Attack Detection
5. Token Versioning: Session Revocation & Global Logout
"""

import pytest
import pyotp
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock

from app.services.mfa import MFAService
from app.services.auth import AuthService
from app.core.security import get_password_hash, create_access_token, hash_token
from app.models.user import User
from app.models.auth import RefreshToken, LoginHistory
from app.models.user_session import UserSession
from app.core.exceptions import UnauthorizedException, ValidationException


# ── 1. MFA Service Unit Tests ────────────────────────────────────────────────

def test_mfa_service_totp_flow():
    """Test TOTP secret generation, URI construction, and 6-digit verification."""
    secret = MFAService.generate_totp_secret()
    assert secret is not None
    assert len(secret) == 32

    # Verify URI
    uri = MFAService.get_totp_uri(secret, email="ceo@enterprise.com", issuer="Data Insight")
    assert "otpauth://totp/" in uri
    assert "ceo%40enterprise.com" in uri or "ceo@enterprise.com" in uri

    # Verify QR Code image base64
    qr_data = MFAService.generate_qr_code_base64(uri)
    assert qr_data.startswith("data:image/png;base64,")

    # Generate current valid code
    totp = pyotp.TOTP(secret)
    valid_code = totp.now()

    assert MFAService.verify_totp_code(secret, valid_code) is True
    assert MFAService.verify_totp_code(secret, "000000") is False
    assert MFAService.verify_totp_code(secret, "invalid") is False


def test_mfa_recovery_codes_flow():
    """Test 10 emergency recovery codes generation, hashing, and single-use consumption."""
    codes = MFAService.generate_recovery_codes(count=10)
    assert len(codes) == 10
    assert len(set(codes)) == 10  # All unique

    hashed_codes = [MFAService.hash_code(c) for c in codes]
    assert len(hashed_codes) == 10

    test_code = codes[0]
    # Verify and consume the first code
    consumed, remaining = MFAService.verify_and_consume_recovery_code(hashed_codes, test_code)
    assert consumed is True
    assert len(remaining) == 9
    assert MFAService.hash_code(test_code) not in remaining

    # Second attempt with the SAME code must fail (single-use)
    consumed_again, remaining_again = MFAService.verify_and_consume_recovery_code(remaining, test_code)
    assert consumed_again is False
    assert len(remaining_again) == 9


# ── 2. Account Lockout & Brute-Force Protection Tests ─────────────────────────

@pytest.mark.asyncio
async def test_brute_force_lockout_after_5_failed_attempts(test_db):
    """Ensure 5 consecutive failed passwords lock the account for 15 minutes."""
    mock_redis = AsyncMock()
    auth_service = AuthService(test_db, mock_redis)

    # Create active verified user
    test_user = User(
        email="test_lockout@enterprise.com",
        hashed_password=get_password_hash("CorrectPassword123!"),
        full_name="Lockout Test",
        role="viewer",
        is_active=True,
        is_email_verified=True,
        account_type="individual",
        failed_login_attempts=0,
        token_version=1,
    )
    test_db.add(test_user)
    await test_db.commit()
    await test_db.refresh(test_user)

    # Attempt 1 to 4: Wrong password -> Increments failed_login_attempts
    for attempt in range(1, 5):
        with pytest.raises(UnauthorizedException) as exc_info:
            await auth_service.authenticate("test_lockout@enterprise.com", "WrongPassword!")
        assert f"{5 - attempt} attempt(s) remaining" in str(exc_info.value)

    await test_db.refresh(test_user)
    assert test_user.failed_login_attempts == 4
    assert test_user.locked_until is None

    # Attempt 5: Triggers 15-minute lock
    with pytest.raises(UnauthorizedException) as exc_info:
        await auth_service.authenticate("test_lockout@enterprise.com", "WrongPassword!")
    assert "locked for 15 minutes" in str(exc_info.value)

    await test_db.refresh(test_user)
    assert test_user.failed_login_attempts == 5
    assert test_user.locked_until is not None
    locked_val = test_user.locked_until if test_user.locked_until.tzinfo else test_user.locked_until.replace(tzinfo=timezone.utc)
    assert locked_val > datetime.now(timezone.utc)

    # Attempt 6 (Even with CORRECT password): Blocked by active lock
    with pytest.raises(UnauthorizedException) as exc_info:
        await auth_service.authenticate("test_lockout@enterprise.com", "CorrectPassword123!")
    assert "Account is temporarily locked" in str(exc_info.value)


# ── 3. MFA 2-Step Login Challenge Tests ──────────────────────────────────────

@pytest.mark.asyncio
async def test_mfa_login_flow(test_db):
    """Test password auth -> mfa_required -> verify_mfa_login -> full tokens."""
    mock_redis = AsyncMock()
    auth_service = AuthService(test_db, mock_redis)

    secret = MFAService.generate_totp_secret()
    recovery_plain = MFAService.generate_recovery_codes(5)
    recovery_hashed = [MFAService.hash_code(c) for c in recovery_plain]

    user = User(
        email="mfa_user@enterprise.com",
        hashed_password=get_password_hash("SecureMFA123!"),
        full_name="MFA User",
        role="org_admin",
        is_active=True,
        is_email_verified=True,
        account_type="organization",
        mfa_enabled=True,
        mfa_secret=secret,
        mfa_recovery_codes=recovery_hashed,
        token_version=1,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)

    # Step 1: Login with password -> returns mfa_required + challenge token
    step1_res = await auth_service.authenticate("mfa_user@enterprise.com", "SecureMFA123!")
    assert step1_res["mfa_required"] is True
    assert "mfa_token" in step1_res
    mfa_token = step1_res["mfa_token"]

    # Step 2: Validate with TOTP code
    totp = pyotp.TOTP(secret)
    valid_totp = totp.now()

    step2_res = await auth_service.verify_mfa_login(mfa_token=mfa_token, code=valid_totp)
    assert step2_res["mfa_required"] is False
    assert "access_token" in step2_res
    assert "refresh_token" in step2_res
    assert step2_res["user"].email == "mfa_user@enterprise.com"


# ── 4. Refresh Token Rotation (RTR) & Reuse Attack Detection ─────────────────

@pytest.mark.asyncio
async def test_refresh_token_rotation_and_reuse_detection(test_db):
    """
    Test that refreshing rotates the token, and replaying a used token
    triggers a security alert that revokes all sessions globally.
    """
    mock_redis = AsyncMock()
    auth_service = AuthService(test_db, mock_redis)

    user = User(
        email="rtr_user@enterprise.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="RTR User",
        role="viewer",
        is_active=True,
        is_email_verified=True,
        account_type="individual",
        token_version=1,
    )
    test_db.add(user)
    await test_db.commit()

    # Initial login
    login_res = await auth_service.authenticate("rtr_user@enterprise.com", "Password123!")
    original_refresh = login_res["refresh_token"]
    assert original_refresh is not None

    # Step 1: Legitimate Refresh -> Returns new tokens and revokes original_refresh
    rotated_res = await auth_service.rotate_refresh_token(original_refresh)
    new_refresh = rotated_res["refresh_token"]
    assert new_refresh != original_refresh

    # Step 2: Malicious / Replay Attack (Re-submitting the revoked original_refresh)
    with pytest.raises(UnauthorizedException) as exc_info:
        await auth_service.rotate_refresh_token(original_refresh)
    assert "Security alert: Token reuse detected" in str(exc_info.value)

    # Verify that token_version was incremented, killing all user sessions!
    await test_db.refresh(user)
    assert user.token_version == 2


# ── 5. Session Revocation & Global Logout ──────────────────────────────────────

@pytest.mark.asyncio
async def test_session_management_and_global_logout(test_db):
    """Test listing active sessions, single revocation, and global logout."""
    mock_redis = AsyncMock()
    auth_service = AuthService(test_db, mock_redis)

    user = User(
        email="session_user@enterprise.com",
        hashed_password=get_password_hash("Password123!"),
        full_name="Session User",
        role="viewer",
        is_active=True,
        is_email_verified=True,
        account_type="individual",
        token_version=1,
    )
    test_db.add(user)
    await test_db.commit()

    # Login to create session 1
    res1 = await auth_service.authenticate("session_user@enterprise.com", "Password123!", user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    # Login to create session 2
    res2 = await auth_service.authenticate("session_user@enterprise.com", "Password123!", user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")

    sessions = await auth_service.list_user_sessions(user)
    assert len(sessions) == 2

    # Revoke single session
    session_to_revoke = uuid.UUID(sessions[0]["id"])
    revoked = await auth_service.revoke_session(user, session_to_revoke)
    assert revoked is True

    remaining_sessions = await auth_service.list_user_sessions(user)
    assert len(remaining_sessions) == 1

    # Global logout / Revoke all sessions
    await auth_service.revoke_all_sessions(user)
    await test_db.refresh(user)
    assert user.token_version == 2

    active_after_global = await auth_service.list_user_sessions(user)
    assert len(active_after_global) == 0
