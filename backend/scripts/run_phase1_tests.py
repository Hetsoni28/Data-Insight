"""Direct test runner for Phase 1 Enterprise Authentication against live database.

Tests:
1. MFAService: Secret gen, QR data URL, TOTP verification, Backup recovery code hashing & consumption
2. Account Lockout: 5 failed attempts trigger 15-minute lock
3. MFA Two-Step Login Challenge
4. Refresh Token Rotation (RTR) & Reuse Attack Detection
5. Token Versioning: Session Revocation & Global Logout
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
import pyotp
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock

from app.db.session import AsyncSessionLocal
from app.services.mfa import MFAService
from app.services.auth import AuthService
from app.core.security import get_password_hash, hash_token
from app.models.user import User
from app.models.auth import RefreshToken, LoginHistory
from app.models.user_session import UserSession
from app.core.exceptions import UnauthorizedException, ValidationException


async def run_all_tests():
    print("\n" + "=" * 80)
    print("  PHASE 1: ENTERPRISE AUTHENTICATION & SECURITY VERIFICATION SUITE")
    print("=" * 80 + "\n")

    # ── Test 1: MFAService TOTP & QR ──
    print("[1/5] Testing MFAService TOTP & QR Data URL...")
    secret = MFAService.generate_totp_secret()
    assert len(secret) == 32, "Invalid secret length"
    uri = MFAService.get_totp_uri(secret, "admin@enterprise.com", issuer="Data Insight")
    assert "otpauth://totp/" in uri, "Invalid URI"
    qr_data = MFAService.generate_qr_code_base64(uri)
    assert qr_data.startswith("data:image/png;base64,"), "Invalid QR code base64"
    totp = pyotp.TOTP(secret)
    assert MFAService.verify_totp_code(secret, totp.now()) is True, "Failed to verify valid code"
    assert MFAService.verify_totp_code(secret, "999999") is False, "Accepted invalid code"
    print("  [PASSED] MFAService TOTP and QR generation verified.")

    # ── Test 2: Emergency Recovery Codes ──
    print("[2/5] Testing 10 Emergency Recovery Codes (Single-Use Consumption)...")
    codes = MFAService.generate_recovery_codes(10)
    assert len(codes) == 10 and len(set(codes)) == 10, "Recovery codes must be 10 unique strings"
    hashed_codes = [MFAService.hash_code(c) for c in codes]
    consumed, remaining = MFAService.verify_and_consume_recovery_code(hashed_codes, codes[0])
    assert consumed is True and len(remaining) == 9, "Failed to consume first recovery code"
    consumed_again, remaining2 = MFAService.verify_and_consume_recovery_code(remaining, codes[0])
    assert consumed_again is False and len(remaining2) == 9, "Reused recovery code was not rejected"
    print("  [PASSED] Recovery codes generation, hashing, and single-use verified.")

    async with AsyncSessionLocal() as db:
        mock_redis = AsyncMock()
        auth_service = AuthService(db, mock_redis)

        # ── Test 3: Brute-Force Lockout (5 attempts -> 15 min lock) ──
        print("[3/5] Testing Brute-Force Lockout (5 failed attempts -> 15 min lock)...")
        test_email = f"lockout_{uuid.uuid4().hex[:8]}@test.com"
        user = User(
            email=test_email,
            hashed_password=get_password_hash("ValidPass123!"),
            full_name="Lockout Test User",
            role="viewer",
            is_active=True,
            is_email_verified=True,
            account_type="individual",
            failed_login_attempts=0,
            token_version=1,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        for attempt in range(1, 5):
            try:
                await auth_service.authenticate(test_email, "WrongPassword!")
                assert False, "Should have failed"
            except UnauthorizedException as e:
                assert "attempt(s) remaining" in str(e)

        await db.refresh(user)
        assert user.failed_login_attempts == 4, "Failed attempts count mismatch"

        # 5th attempt triggers lock
        try:
            await auth_service.authenticate(test_email, "WrongPassword!")
            assert False, "Should have triggered lock"
        except UnauthorizedException as e:
            assert "locked for 15 minutes" in str(e)

        await db.refresh(user)
        assert user.failed_login_attempts == 5
        assert user.locked_until is not None
        assert user.locked_until > datetime.now(timezone.utc)

        # 6th attempt with CORRECT password is blocked by active lock
        try:
            await auth_service.authenticate(test_email, "ValidPass123!")
            assert False, "Should have been blocked by lock"
        except UnauthorizedException as e:
            assert "Account is temporarily locked" in str(e)
        print("  [PASSED] 5-attempt brute-force protection and 15-minute lock verified.")

        # ── Test 4: MFA 2-Step Login ──
        print("[4/5] Testing MFA Two-Step Challenge & Token Issuance...")
        mfa_email = f"mfa_{uuid.uuid4().hex[:8]}@test.com"
        mfa_secret = MFAService.generate_totp_secret()
        mfa_user = User(
            email=mfa_email,
            hashed_password=get_password_hash("SecretPass123!"),
            full_name="MFA Test User",
            role="org_admin",
            is_active=True,
            is_email_verified=True,
            account_type="organization",
            mfa_enabled=True,
            mfa_secret=mfa_secret,
            mfa_recovery_codes=[MFAService.hash_code("ABCD-1234-EFGH")],
            token_version=1,
        )
        db.add(mfa_user)
        await db.commit()
        await db.refresh(mfa_user)

        step1 = await auth_service.authenticate(mfa_email, "SecretPass123!")
        assert step1["mfa_required"] is True
        assert "mfa_token" in step1
        mfa_token = step1["mfa_token"]

        # Step 2 with valid TOTP
        current_totp = pyotp.TOTP(mfa_secret).now()
        step2 = await auth_service.verify_mfa_login(mfa_token, current_totp)
        assert "access_token" in step2
        assert "refresh_token" in step2
        assert step2["mfa_required"] is False
        print("  [PASSED] MFA dual-step authentication and token issuance verified.")

        # ── Test 5: Refresh Token Rotation & Reuse Attack Detection ──
        print("[5/5] Testing Refresh Token Rotation (RTR) & Reuse Attack Detection...")
        rtr_email = f"rtr_{uuid.uuid4().hex[:8]}@test.com"
        rtr_user = User(
            email=rtr_email,
            hashed_password=get_password_hash("RTRPass123!"),
            full_name="RTR Test User",
            role="viewer",
            is_active=True,
            is_email_verified=True,
            account_type="individual",
            token_version=1,
        )
        db.add(rtr_user)
        await db.commit()

        initial_login = await auth_service.authenticate(rtr_email, "RTRPass123!")
        original_rt = initial_login["refresh_token"]

        # Legitimate rotation
        rotated = await auth_service.rotate_refresh_token(original_rt)
        new_rt = rotated["refresh_token"]
        assert new_rt != original_rt

        # Attack: replay consumed token
        try:
            await auth_service.rotate_refresh_token(original_rt)
            assert False, "Should have detected token reuse attack"
        except UnauthorizedException as e:
            assert "Security alert: Token reuse detected" in str(e)

        await db.refresh(rtr_user)
        assert rtr_user.token_version == 2, "Token version was not incremented to kill sessions"

        # Verify active session listing and revocation
        sessions = await auth_service.list_user_sessions(rtr_user)
        assert len(sessions) == 0, "All sessions should have been marked inactive by reuse alert"
        print("  [PASSED] RTR, Reuse Attack Detection, and Global Session Invalidation verified.")

    print("\n" + "=" * 80)
    print("  ALL 5/5 PHASE 1 ENTERPRISE AUTHENTICATION TESTS PASSED PERFECTLY!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
