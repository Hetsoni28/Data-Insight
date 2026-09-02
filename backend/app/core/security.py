import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import jwt

from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def hash_token(token: str) -> str:
    """Cryptographically hash a session or refresh token with SHA-256 for DB lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_secure_token(length: int = 48) -> str:
    """Generate a high-entropy URL-safe token."""
    return secrets.token_urlsafe(length)


def create_access_token(
    subject: str | Any,
    role: str,
    tenant_id: str | None = None,
    token_version: int = 1,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a short-lived JWT access token with tenant_id and token_version."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "tenant_id": str(tenant_id) if tenant_id else None,
        "token_version": token_version,
        "type": "access",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def create_refresh_token(
    subject: str | Any,
    token_version: int = 1,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a long-lived rotating refresh token (default 30 days)."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=30)

    # Add random jti (JWT ID) to guarantee unique refresh token string on every generation
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "token_version": token_version,
        "type": "refresh",
        "jti": secrets.token_hex(16),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def create_mfa_token(
    subject: str | Any,
    expires_delta: timedelta | None = None,
) -> str:
    """Generate a short-lived temporary token (5 minutes) for TOTP challenge step."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=5)

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "mfa_pending",
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT token signature and expiration."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
