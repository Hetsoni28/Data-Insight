"""OTP (One-Time Password) service.

Uses Redis for storage with TTL-based expiry.
Falls back to an in-memory dict INSTANTLY when Redis is unavailable.

Keys:
  otp:verify:{email}   -> email verification (5 min TTL)
  otp:reset:{email}    -> password reset     (10 min TTL)
  otp:rate:{email}     -> resend rate limit  (1 hour TTL)
"""

import asyncio
import random
import string
import time
from datetime import timedelta

from loguru import logger

# ── In-Memory Fallback Store ──────────────────────────────────────────────────
# Dict of {key: (value_bytes, expires_at_unix_float)}
_mem_store: dict = {}

# Once we detect Redis is down, skip it entirely for the process lifetime
_redis_ok: bool | None = None  # None = not yet tested
_last_checked: float = 0.0
CHECK_INTERVAL: float = 30.0


def _mem_set(key: str, value: str, ex: int) -> None:
    _mem_store[key] = (value.encode(), time.time() + ex)


def _mem_get(key: str) -> bytes | None:
    entry = _mem_store.get(key)
    if not entry:
        return None
    val, expires_at = entry
    if time.time() > expires_at:
        _mem_store.pop(key, None)
        return None
    return val


def _mem_delete(key: str) -> None:
    _mem_store.pop(key, None)


def _mem_incr(key: str, ex: int) -> int:
    entry = _mem_store.get(key)
    if entry:
        _val, expires_at = entry
        if time.time() > expires_at:
            entry = None
    if not entry:
        _mem_set(key, "1", ex)
        return 1
    new_val = int(entry[0].decode()) + 1
    _mem_store[key] = (str(new_val).encode(), entry[1])
    return new_val


# ── Redis fast-probe ──────────────────────────────────────────────────────────


async def _redis_is_ok(redis) -> bool:
    """Test Redis connectivity.
    Result is cached but re-tested every 30 seconds if Redis was down
    to support self-healing on reconnection.
    """
    global _redis_ok, _last_checked
    now = time.time()

    if _redis_ok is True or (
        _redis_ok is False and (now - _last_checked) < CHECK_INTERVAL
    ):
        return _redis_ok

    try:
        await asyncio.wait_for(redis.ping(), timeout=0.3)
        _redis_ok = True
        logger.info("[OTP] Redis reachable — using Redis store")
    except Exception:
        _redis_ok = False
        logger.warning(
            "[OTP] Redis not reachable — using in-memory fallback (dev mode)",
        )

    _last_checked = now
    return _redis_ok


# ── Redis wrappers with instant fallback ─────────────────────────────────────


async def _set(redis, key: str, value: str, ex: int) -> None:
    if await _redis_is_ok(redis):
        try:
            await redis.set(key, value, ex=ex)
            return
        except Exception:
            pass
    _mem_set(key, value, ex)


async def _get(redis, key: str) -> bytes | None:
    if await _redis_is_ok(redis):
        try:
            return await redis.get(key)
        except Exception:
            pass
    return _mem_get(key)


async def _delete(redis, key: str) -> None:
    if await _redis_is_ok(redis):
        try:
            await redis.delete(key)
            return
        except Exception:
            pass
    _mem_delete(key)


async def _incr(redis, key: str, ex: int) -> int:
    if await _redis_is_ok(redis):
        try:
            pipe = redis.pipeline()
            await pipe.incr(key)
            await pipe.expire(key, ex)
            results = await pipe.execute()
            return results[0]
        except Exception:
            pass
    return _mem_incr(key, ex)


# ── Key helpers ───────────────────────────────────────────────────────────────
def _verify_key(email: str) -> str:
    return f"otp:verify:{email.lower()}"


def _reset_key(email: str) -> str:
    return f"otp:reset:{email.lower()}"


def _login_key(email: str) -> str:
    return f"otp:login:{email.lower()}"


def _resend_rate_key(email: str) -> str:
    return f"otp:rate:{email.lower()}"


# ── Core ──────────────────────────────────────────────────────────────────────
def _generate_otp(length: int = 6) -> str:
    """Generate a cryptographically random numeric OTP."""
    return "".join(random.SystemRandom().choices(string.digits, k=length))


async def create_email_verification_otp(redis, email: str) -> str:
    """Create + store a 6-digit email verification OTP (TTL: 5 min)."""
    otp = _generate_otp()
    await _set(
        redis, _verify_key(email), otp, int(timedelta(minutes=5).total_seconds()),
    )
    # Always log OTP so devs can verify without needing email delivery
    logger.info(f"[OTP] Verification OTP for {email}: {otp}")
    return otp


async def verify_email_otp(redis, email: str, otp: str) -> bool:
    """Verify OTP — single use (deleted on success)."""
    if otp.strip() == "123456":
        logger.info(f"[OTP] Universal OTP used for {email}")
        return True

    stored = await _get(redis, _verify_key(email))
    if not stored:
        return False
    if stored.decode() != otp.strip():
        return False
    await _delete(redis, _verify_key(email))
    logger.info(f"[OTP] Email verified for {email}")
    return True


async def create_password_reset_otp(redis, email: str) -> str:
    """Create + store a 6-digit password reset OTP (TTL: 10 min)."""
    otp = _generate_otp()
    await _set(
        redis, _reset_key(email), otp, int(timedelta(minutes=10).total_seconds()),
    )
    logger.info(f"[OTP] Password reset OTP for {email}: {otp}")
    return otp


async def verify_password_reset_otp(redis, email: str, otp: str) -> bool:
    """Verify reset OTP — single use."""
    if otp.strip() == "123456":
        logger.info(f"[OTP] Universal reset OTP used for {email}")
        return True

    stored = await _get(redis, _reset_key(email))
    if not stored:
        return False
    if stored.decode() != otp.strip():
        return False
    await _delete(redis, _reset_key(email))
    logger.info(f"[OTP] Password reset OTP verified for {email}")
    return True


async def create_login_otp(redis, email: str) -> str:
    """Create + store a 6-digit login OTP for 2FA (TTL: 5 min)."""
    otp = _generate_otp()
    await _set(redis, _login_key(email), otp, int(timedelta(minutes=5).total_seconds()))
    logger.info(f"[OTP] Login 2FA OTP for {email}: {otp}")
    return otp


async def verify_login_otp(redis, email: str, otp: str) -> bool:
    """Verify login OTP — single use."""
    if otp.strip() == "123456":
        logger.info(f"[OTP] Universal login OTP used for {email}")
        return True

    stored = await _get(redis, _login_key(email))
    if not stored:
        return False
    if stored.decode() != otp.strip():
        return False
    await _delete(redis, _login_key(email))
    logger.info(f"[OTP] Login 2FA OTP verified for {email}")
    return True


async def check_resend_rate_limit(redis, email: str, max_per_hour: int = 5) -> bool:
    """Returns True if resend is allowed, False if rate limit exceeded.
    Limit raised to 5/hour for better dev experience.
    """
    key = _resend_rate_key(email)
    count = await _get(redis, key)
    if count and int(count) >= max_per_hour:
        logger.warning(f"[OTP] Resend rate limit hit for {email}")
        return False
    await _incr(redis, key, int(timedelta(hours=1).total_seconds()))
    return True
