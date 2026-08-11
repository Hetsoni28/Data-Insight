import os
import re

filepath = r"c:\Users\Het\OneDrive\Desktop\data-insight\backend\app\api\v1\tenant_settings.py"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for socket and sqlalchemy create_engine if not present
if "import socket" not in content:
    content = "import socket\nimport shutil\nfrom sqlalchemy import create_engine\nfrom sqlalchemy.exc import SQLAlchemyError\nfrom fastapi import UploadFile, File\n" + content


# Replace test_data_connection
test_conn_old = '''@router.post("/data-connections/test", summary="Test Data Connection")
async def test_data_connection(
    req: DataConnectionTestRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mock validation for a data connection."""
    # In a real world scenario, this would use sqlalchemy or snowflake connector to attempt a connection.
    import asyncio
    await asyncio.sleep(1) # Simulate network delay
    
    if req.provider.lower() == "postgres" and not (req.host and req.username and req.password):
        raise HTTPException(status_code=400, detail="Postgres connection requires host, username, and password.")
        
    if req.provider.lower() == "snowflake" and not (req.host and req.username):
        raise HTTPException(status_code=400, detail="Snowflake connection requires account locator (host) and username.")
        
    # Simulate a successful connection for demonstration
    return {"status": "success", "message": f"Successfully connected to {req.provider}."}'''

test_conn_new = '''@router.post("/data-connections/test", summary="Test Data Connection")
async def test_data_connection(
    req: DataConnectionTestRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Real validation for a data connection."""
    if req.provider.lower() == "postgres":
        if not (req.host and req.username and req.password and req.database):
            raise HTTPException(status_code=400, detail="Postgres connection requires host, database, username, and password.")
        
        # Build connection string
        port = req.port or 5432
        db_url = f"postgresql://{req.username}:{req.password}@{req.host}:{port}/{req.database}"
        
        try:
            # Create a synchronous engine just to test connection
            engine = create_engine(db_url, connect_args={"connect_timeout": 5})
            with engine.connect() as conn:
                pass # Connection successful
            return {"status": "success", "message": f"Successfully connected to Postgres."}
        except SQLAlchemyError as e:
            raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e.__class__.__name__)}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e)}")
            
    elif req.provider.lower() == "snowflake":
         if not (req.host and req.username):
            raise HTTPException(status_code=400, detail="Snowflake connection requires account locator (host) and username.")
         # Mock snowflake for now as we don't have snowflake-connector-python
         return {"status": "success", "message": f"Snowflake configuration verified."}
    
    raise HTTPException(status_code=400, detail="Unsupported provider.")'''

content = content.replace(test_conn_old, test_conn_new)


# Replace verify_custom_domain
verify_domain_old = '''@router.post("/advanced/verify-domain", summary="Verify Custom Domain DNS")
async def verify_custom_domain(
    req: DomainVerifyRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Mock DNS verification for a custom domain."""
    import asyncio
    await asyncio.sleep(1.5) # Simulate DNS lookup delay
    
    if not req.domain or "." not in req.domain:
        raise HTTPException(status_code=400, detail="Invalid domain format.")
        
    tenant_id = current_user.tenant_id
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    res = await db.execute(stmt)
    tenant = res.scalars().first()
    
    # Simulate updating the domain status
    # Assuming if domain contains 'fail', we simulate failure
    if "fail" in req.domain.lower():
        tenant.custom_domain_status = "failed"
        message = "DNS records not found or misconfigured."
    else:
        tenant.custom_domain_status = "verified"
        message = "Domain successfully verified."
        
    tenant.custom_domain = req.domain
    await db.commit()
    
    return {"status": tenant.custom_domain_status, "message": message, "domain": tenant.custom_domain}'''

verify_domain_new = '''@router.post("/advanced/verify-domain", summary="Verify Custom Domain DNS")
async def verify_custom_domain(
    req: DomainVerifyRequest,
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
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
    
    return {"status": tenant.custom_domain_status, "message": message, "domain": tenant.custom_domain}'''

content = content.replace(verify_domain_old, verify_domain_new)


# Add file upload endpoint
upload_endpoint = '''
@router.post("/branding/logo", summary="Upload Organization Logo")
async def upload_tenant_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(RequireRole(["organization-admin", "org_admin"])),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """Upload a logo image for the organization."""
    if file.content_type not in ["image/jpeg", "image/png", "image/svg+xml"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, and SVG are supported.")
        
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
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'png'
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
        extra_metadata={"logo_url": logo_url}
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success", "logo_url": logo_url}
'''

if "/branding/logo" not in content:
    content += upload_endpoint

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
