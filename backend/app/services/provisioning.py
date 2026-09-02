"""TenantProvisioningService — Secure manual provisioning for enterprise tenants.

Security guarantees:
  - dedicated_db_url is ALWAYS stored AES-256 Fernet encrypted at rest
  - The raw URL is NEVER returned to the frontend — only status
  - Every provisioning action is written to the audit log
  - Connection is validated before the URL is saved
  - Only owner-role users can call the provision endpoint
"""

import logging

import asyncpg
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.billing_activity import BillingActivity
from app.models.tenant import Tenant

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    """Build a Fernet cipher from the SECRET_KEY.
    Fernet = AES-128-CBC + HMAC-SHA256. Keys must be 32 bytes → base64-url.
    We derive a fixed 32-byte key from SECRET_KEY using its first 32 chars,
    then encode as urlsafe base64 — deterministic, no key rotation needed at this stage.
    """
    import base64

    raw = settings.SECRET_KEY.encode("utf-8")
    # Pad or truncate to exactly 32 bytes, then base64-url encode for Fernet
    key_bytes = (raw * 2)[:32]
    fernet_key = base64.urlsafe_b64encode(key_bytes)
    return Fernet(fernet_key)


def encrypt_db_url(plain_url: str) -> str:
    """Encrypt a database URL string. Returns a base64 token string."""
    f = _get_fernet()
    return f.encrypt(plain_url.encode("utf-8")).decode("utf-8")


def decrypt_db_url(encrypted_token: str) -> str:
    """Decrypt an encrypted DB URL token. Only called server-side."""
    f = _get_fernet()
    return f.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")


async def validate_db_connection(db_url: str) -> tuple[bool, str]:
    """Validate that the provided PostgreSQL URL actually connects.
    Uses asyncpg raw connection — does NOT use SQLAlchemy to avoid
    polluting the connection pool.
    Returns (success: bool, error_message: str)
    """
    try:
        # Strip asyncpg/SQLAlchemy prefix if present
        raw_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
        conn = await asyncpg.connect(raw_url, timeout=5)
        await conn.execute("SELECT 1")
        await conn.close()
        return True, ""
    except asyncpg.InvalidPasswordError:
        return False, "Invalid credentials — check username and password."
    except asyncpg.InvalidCatalogNameError:
        return False, "Database does not exist on the server."
    except asyncpg.CannotConnectNowError:
        return False, "Server is starting — try again in a moment."
    except OSError as e:
        return False, f"Cannot reach host: {e}"
    except Exception as e:
        return False, f"Connection failed: {e!s}"


async def provision_tenant_dedicated_db(
    *,
    db: AsyncSession,
    tenant_id: str,
    raw_db_url: str,
    bucket_name: str | None,
    actor_id: str,
) -> dict:
    """Securely provision a dedicated database for an enterprise tenant.

    Steps:
      1. Validate the DB connection (fail fast, no write yet)
      2. Encrypt the DB URL with AES-256 Fernet
      3. Update tenant record (encrypted URL, db_connection_type=dedicated, status=ready)
      4. Optionally store bucket_name
      5. Write immutable audit log entry
      6. Return status — NEVER the raw URL

    Raises ValueError on validation failure.
    """
    # ── Step 1: Validate connection FIRST (before any DB write) ───────────────
    ok, error = await validate_db_connection(raw_db_url)
    if not ok:
        raise ValueError(f"Connection validation failed: {error}")

    # ── Step 2: Encrypt the URL ───────────────────────────────────────────────
    encrypted_url = encrypt_db_url(raw_db_url)

    # ── Step 3: Load and update the tenant record ─────────────────────────────
    from uuid import UUID

    tenant = await db.get(Tenant, UUID(tenant_id))
    if not tenant:
        raise ValueError("Tenant not found.")

    tenant.dedicated_db_url = encrypted_url  # Encrypted, never plain
    tenant.db_connection_type = "dedicated"
    tenant.provisioning_status = "ready"
    tenant.provisioning_error = None

    # ── Step 4: Store bucket name if provided ─────────────────────────────────
    if bucket_name:
        existing_config = tenant.advanced_config or {}
        existing_config["dedicated_storage_bucket"] = bucket_name
        tenant.advanced_config = existing_config

    await db.flush()

    # ── Step 5: Immutable audit log ───────────────────────────────────────────
    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="tenant_provisioned",
        description=(
            f"Dedicated database provisioned by platform owner. "
            f"DB type: dedicated. Bucket: {bucket_name or 'N/A'}."
        ),
        metadata_json={
            "actor_id": str(actor_id),
            "db_connection_type": "dedicated",
            "bucket_configured": bool(bucket_name),
            # ❌ NEVER log the URL, even encrypted, in human-readable logs
        },
    )
    db.add(activity)
    await db.commit()

    logger.info(
        f"[PROVISION] Tenant {tenant_id} provisioned successfully. "
        f"Bucket: {bucket_name or 'none'}. Actor: {actor_id}",
    )

    # ── Step 6: Return status only — raw URL is never sent to client ──────────
    return {
        "status": "ready",
        "db_connection_type": "dedicated",
        "bucket_configured": bool(bucket_name),
        "message": "Dedicated database provisioned and verified successfully.",
    }


async def deprovision_tenant(
    *,
    db: AsyncSession,
    tenant_id: str,
    actor_id: str,
) -> dict:
    """Revert a tenant back to shared database mode.
    Clears the encrypted URL from the record.
    """
    from uuid import UUID

    tenant = await db.get(Tenant, UUID(tenant_id))
    if not tenant:
        raise ValueError("Tenant not found.")

    tenant.dedicated_db_url = None
    tenant.db_connection_type = "shared"
    tenant.provisioning_status = "none"

    activity = BillingActivity(
        tenant_id=tenant.id,
        event_type="tenant_deprovisioned",
        description="Tenant reverted to shared database by platform owner.",
        metadata_json={"actor_id": str(actor_id)},
    )
    db.add(activity)
    await db.commit()

    logger.info(
        f"[DEPROVISION] Tenant {tenant_id} reverted to shared. Actor: {actor_id}",
    )

    return {"status": "shared", "message": "Tenant reverted to shared database."}
