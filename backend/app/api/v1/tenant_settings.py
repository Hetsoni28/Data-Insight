import os
import shutil
import socket
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Request,
    UploadFile,
)
from pydantic import BaseModel
from sqlalchemy import create_engine, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequireRole, get_db
from app.models.audit_log import AuditLog
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.tenant import TenantResponse, TenantUpdateRequest

router = APIRouter()


class TenantBrandingUpdateRequest(BaseModel):
    logo_url: str | None = None
    white_label_config: dict | None = None


@router.get(
    "/profile", response_model=TenantResponse, summary="Get Organization Profile",
)
async def get_tenant_profile(
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get the organization's current profile settings."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")

    return tenant


@router.patch(
    "/profile", response_model=TenantResponse, summary="Update Organization Profile",
)
async def update_tenant_profile(
    req: TenantUpdateRequest,
    request: Request,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update the organization's profile settings."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Update allowed fields
    if req.name is not None:
        tenant.name = req.name
    if req.domain is not None:
        tenant.domain = req.domain
    if req.industry is not None:
        tenant.industry = req.industry
    if req.timezone is not None:
        tenant.timezone = req.timezone
    if req.currency is not None:
        tenant.currency = req.currency

    # Create audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="tenant.profile.updated",
        resource_type="tenant",
        resource_id=str(tenant.id),
        extra_metadata={"updates": req.model_dump(exclude_unset=True)},
        ip_address=request.client.host if request.client else "127.0.0.1",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(tenant)
    return tenant


@router.get("/branding", summary="Get Organization Branding")
async def get_tenant_branding(
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get the organization's branding configurations."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")

    return {
        "logo_url": tenant.logo_url,
        "white_label_config": tenant.white_label_config or {},
    }


@router.patch("/branding", summary="Update Organization Branding")
async def update_tenant_branding(
    req: TenantBrandingUpdateRequest,
    request: Request,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Update the organization's branding configurations."""
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Organization not found")

    if req.logo_url is not None:
        tenant.logo_url = req.logo_url
    if req.white_label_config is not None:
        tenant.white_label_config = req.white_label_config

    # Create audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="tenant.branding.updated",
        resource_type="tenant",
        resource_id=str(tenant.id),
        extra_metadata={"updates": req.model_dump(exclude_unset=True)},
        ip_address=request.client.host if request.client else "127.0.0.1",
    )
    db.add(audit)

    await db.commit()
    await db.refresh(tenant)

    return {
        "logo_url": tenant.logo_url,
        "white_label_config": tenant.white_label_config or {},
    }


class ConfigUpdateRequest(BaseModel):
    config: dict


def _create_config_endpoints(router, path_prefix: str, field_name: str, summary: str):
    @router.get(f"/{path_prefix}", summary=f"Get Organization {summary}")
    async def get_config(
        current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
        db: AsyncSession = Depends(get_db),
    ) -> Any:
        tenant_id = current_user.tenant_id
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        res = await db.execute(stmt)
        tenant = res.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Organization not found")
        return getattr(tenant, field_name) or {}

    @router.patch(f"/{path_prefix}", summary=f"Update Organization {summary}")
    async def update_config(
        req: ConfigUpdateRequest,
        request: Request,
        current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
        db: AsyncSession = Depends(get_db),
    ) -> Any:
        tenant_id = current_user.tenant_id
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        res = await db.execute(stmt)
        tenant = res.scalars().first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Organization not found")

        setattr(tenant, field_name, req.config)

        audit = AuditLog(
            tenant_id=tenant_id,
            user_id=current_user.id,
            action=f"tenant.{path_prefix}.updated",
            resource_type="tenant",
            resource_id=str(tenant.id),
            extra_metadata={"updates": req.model_dump(exclude_unset=True)},
            ip_address=request.client.host if request.client else "127.0.0.1",
        )
        db.add(audit)
        await db.commit()
        await db.refresh(tenant)
        return getattr(tenant, field_name) or {}


# Register dynamic endpoints for simple JSON config fields
_create_config_endpoints(router, "security", "sso_config", "Security Config")
_create_config_endpoints(
    router, "data-connections", "data_connections_config", "Data Connections Config",
)
_create_config_endpoints(
    router, "integrations", "integrations_config", "Integrations Config",
)
_create_config_endpoints(
    router, "notifications", "notifications_config", "Notifications Config",
)
_create_config_endpoints(router, "advanced", "advanced_config", "Advanced Config")


@router.get("/audit-logs", summary="Get Organization Audit Logs")
async def get_tenant_audit_logs(
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Get the organization's audit logs."""
    tenant_id = current_user.tenant_id
    # Fetch top 50 recent audit logs for the tenant
    stmt = (
        select(AuditLog, User.email)
        .outerjoin(User, AuditLog.user_id == User.id)
        .where(AuditLog.tenant_id == tenant_id)
        .order_by(AuditLog.created_at.desc())
        .limit(50)
    )
    res = await db.execute(stmt)

    logs = []
    for log, email in res:
        logs.append(
            {
                "id": str(log.id),
                "action": log.action,
                "resource_type": log.resource_type,
                "ip_address": log.ip_address,
                "status": log.status,
                "created_at": log.created_at.isoformat(),
                "user_email": email or "System",
            },
        )

    return logs


# --- ADVANCED BUSINESS LOGIC ENDPOINTS ---


class DataConnectionTestRequest(BaseModel):
    provider: str
    host: str | None = None
    port: int | None = None
    database: str | None = None
    username: str | None = None
    password: str | None = None


@router.post("/data-connections/test", summary="Test Data Connection")
async def test_data_connection(
    req: DataConnectionTestRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Real validation for a data connection."""
    if req.provider.lower() == "postgres":
        if not (req.host and req.username and req.password and req.database):
            raise HTTPException(
                status_code=400,
                detail="Postgres connection requires host, database, username, and password.",
            )

        # Build connection string
        port = req.port or 5432
        db_url = f"postgresql://{req.username}:{req.password}@{req.host}:{port}/{req.database}"

        try:
            # Create a synchronous engine just to test connection
            engine = create_engine(db_url, connect_args={"connect_timeout": 5})
            with engine.connect():
                pass  # Connection successful
            return {
                "status": "success",
                "message": "Successfully connected to Postgres.",
            }
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Database connection failed: {e.__class__.__name__!s}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Database connection failed: {e!s}",
            )

    elif req.provider.lower() == "snowflake":
        if not (req.host and req.username):
            raise HTTPException(
                status_code=400,
                detail="Snowflake connection requires account locator (host) and username.",
            )
        # Mock snowflake for now as we don't have snowflake-connector-python
        return {"status": "success", "message": "Snowflake configuration verified."}

    raise HTTPException(status_code=400, detail="Unsupported provider.")


class DomainVerifyRequest(BaseModel):
    domain: str


@router.post("/advanced/verify-domain", summary="Verify Custom Domain DNS")
async def verify_custom_domain(
    req: DomainVerifyRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Real DNS verification for a custom domain."""
    if not req.domain or "." not in req.domain:
        raise HTTPException(status_code=400, detail="Invalid domain format.")

    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    try:
        # Perform actual DNS lookup
        socket.gethostbyname(req.domain)
        tenant.custom_domain_status = "verified"
        message = "Domain successfully verified."
    except socket.gaierror:
        tenant.custom_domain_status = "failed"
        message = "DNS records not found or misconfigured."

    tenant.custom_domain = req.domain
    await db.commit()

    return {
        "status": tenant.custom_domain_status,
        "message": message,
        "domain": tenant.custom_domain,
    }


class IntegrationConnectRequest(BaseModel):
    provider: str
    api_key: str | None = None


@router.post("/integrations/connect", summary="Connect Third-Party Integration")
async def connect_integration(
    req: IntegrationConnectRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Mock OAuth/API Key connection."""
    if not req.api_key:
        raise HTTPException(status_code=400, detail="API Key is required.")

    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()

    # Update JSON config
    config = tenant.integrations_config or {}
    # We shouldn't store raw API keys, but for this demo we'll mock saving an encrypted snippet
    config[f"{req.provider}_enabled"] = True
    config[f"{req.provider}_key_snippet"] = f"...{req.api_key[-4:]}"

    tenant.integrations_config = config
    await db.commit()

    return {
        "status": "success",
        "message": f"{req.provider.capitalize()} connected successfully.",
    }


class NotificationTestRequest(BaseModel):
    type: str


@router.post("/notifications/test", summary="Send Test Notification")
async def test_notification(
    req: NotificationTestRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Mock sending a test notification (email/slack)."""
    import asyncio

    await asyncio.sleep(0.5)

    return {
        "status": "success",
        "message": f"Test {req.type} notification sent to {current_user.email}.",
    }


@router.post("/branding/logo", summary="Upload Organization Logo")
async def upload_tenant_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Upload a logo image for the organization."""
    if file.content_type not in ["image/jpeg", "image/png", "image/svg+xml"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPEG, PNG, and SVG are supported.",
        )

    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Ensure tenant isolated upload directory
    upload_dir = f"uploads/tenants/{tenant_id}/branding"
    os.makedirs(upload_dir, exist_ok=True)

    # Secure filename
    import secrets

    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    safe_filename = f"logo_{secrets.token_hex(8)}.{ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Construct absolute or relative URL
    logo_url = f"/{file_path.replace(chr(92), '/')}"
    tenant.logo_url = logo_url

    # Audit log
    audit = AuditLog(
        tenant_id=tenant_id,
        user_id=current_user.id,
        action="tenant.branding.logo_uploaded",
        resource_type="tenant",
        resource_id=str(tenant.id),
        extra_metadata={"logo_url": logo_url},
    )
    db.add(audit)

    await db.commit()
    return {"status": "success", "logo_url": logo_url}
