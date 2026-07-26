"""
OTP (One-Time Password) service.

Uses Redis for storage with TTL-based expiry.
Keys:
  otp:verify:{email}       → email verification (5 min TTL)
  otp:reset:{email}        → password reset     (10 min TTL)
  otp:rate:{email}         → resend rate limit  (1 hour TTL, int counter)
  otp:login:{ip}           → login rate limit   (15 min TTL, int counter)
"""
import random
import string
from datetime import timedelta
from redis.asyncio import Redis
from loguru import logger


# ── Key helpers ───────────────────────────────────────────────────────────────
def _verify_key(email: str) -> str:
    return f"otp:verify:{email.lower()}"


def _reset_key(email: str) -> str:
    return f"otp:reset:{email.lower()}"


def _resend_rate_key(email: str) -> str:
    return f"otp:rate:{email.lower()}"


# ── Core ──────────────────────────────────────────────────────────────────────
def _generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return "".join(random.SystemRandom().choices(string.digits, k=length))


async def create_email_verification_otp(redis: Redis, email: str) -> str:
    """
    Create + store a 6-digit email verification OTP.
    TTL: 5 minutes.
    Returns the OTP (caller sends it via email).
    """
    otp = _generate_otp()
    key = _verify_key(email)
    await redis.set(key, otp, ex=int(timedelta(minutes=5).total_seconds()))
    logger.info(f"[OTP] Verification OTP created for {email}")
    return otp


async def verify_email_otp(redis: Redis, email: str, otp: str) -> bool:
    """
    Verify a submitted OTP against the stored value.
    Deletes the key after successful verification (single use).
    Returns True if valid, False if invalid or expired.
    """
    key = _verify_key(email)
    stored = await redis.get(key)
    if not stored:
        return False
    if stored.decode() != otp.strip():
        return False
    await redis.delete(key)
    logger.info(f"[OTP] Email verified for {email}")
    return True


async def create_password_reset_otp(redis: Redis, email: str) -> str:
    """
    Create + store a 6-digit password reset OTP.
    TTL: 10 minutes.
    """
    otp = _generate_otp()
    key = _reset_key(email)
    await redis.set(key, otp, ex=int(timedelta(minutes=10).total_seconds()))
    logger.info(f"[OTP] Password reset OTP created for {email}")
    return otp


async def verify_password_reset_otp(redis: Redis, email: str, otp: str) -> bool:
    """Verify reset OTP (single use)."""
    key = _reset_key(email)
    stored = await redis.get(key)
    if not stored:
        return False
    if stored.decode() != otp.strip():
        return False
    await redis.delete(key)
    logger.info(f"[OTP] Password reset OTP verified for {email}")
    return True


async def check_resend_rate_limit(redis: Redis, email: str, max_per_hour: int = 3) -> bool:
    """
    Returns True if resend is allowed, False if rate limit exceeded.
    Increments counter per email per hour.
    """
    key = _resend_rate_key(email)
    count = await redis.get(key)
    if count and int(count) >= max_per_hour:
        logger.warning(f"[OTP] Resend rate limit hit for {email}")
        return False
    pipe = redis.pipeline()
    await pipe.incr(key)
    await pipe.expire(key, int(timedelta(hours=1).total_seconds()))
    await pipe.execute()
    return True
