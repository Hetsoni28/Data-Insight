import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.core.security import create_access_token
from sqlalchemy import select

async def run_full_api_audit():
    print("=" * 80)
    print("      DATA INSIGHT 100% PRODUCTION-GRADE BACKEND API AUDIT SUITE")
    print("=" * 80)
    
    # 1. Fetch Owner User and Workspace for testing
    async with AsyncSessionLocal() as db:
        users = (await db.execute(select(User))).scalars().all()
        owner_user = next((u for u in users if u.is_owner or u.is_superuser), users[0] if users else None)
        workspaces = (await db.execute(select(Workspace))).scalars().all()
        ws_id = str(workspaces[0].id) if workspaces else str(uuid.uuid4())
        
    print(f"[*] Authenticated as Platform Owner: {owner_user.email}")
    print(f"[*] Active Test Workspace ID:        {ws_id}")
    print("-" * 80)
    
    owner_token = create_access_token(
        subject=str(owner_user.id),
        role=owner_user.role,
        tenant_id=str(owner_user.tenant_id) if owner_user.tenant_id else None
    ) if owner_user else ""
    
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    
    test_endpoints = [
        # Health & System
        ("GET", "/health", {}),
        ("GET", "/api/v1/auth/me", owner_headers),
        ("GET", "/api/v1/users/me", owner_headers),
        
        # Admin Management (Platform Owners)
        ("GET", "/api/v1/admin/tenants", owner_headers),
        ("GET", "/api/v1/admin/users", owner_headers),
        ("GET", "/api/v1/admin/kpis", owner_headers),
        ("GET", "/api/v1/admin/usage-trends", owner_headers),
        ("GET", "/api/v1/admin/audit-logs", owner_headers),
        ("GET", "/api/v1/admin/tenants/analytics", owner_headers),
        ("GET", "/api/v1/admin/revenue", owner_headers),
        ("GET", "/api/v1/admin/monitoring", owner_headers),
        ("GET", "/api/v1/admin/subscriptions", owner_headers),
        
        # Owner Subscriptions & Billing
        ("GET", "/api/v1/owner/subscriptions/kpis", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/revenue-trends", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/organizations", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/invoices", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/analytics/ai-costs", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/analytics/forecast", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/analytics/health", owner_headers),
        ("GET", "/api/v1/owner/subscriptions/activity", owner_headers),
        
        # Owner AI & Telemetry
        ("GET", "/api/v1/owner/ai/overview", owner_headers),
        ("GET", "/api/v1/owner/ai/providers", owner_headers),
        ("GET", "/api/v1/owner/ai/models", owner_headers),
        ("GET", "/api/v1/owner/ai/routing", owner_headers),
        ("GET", "/api/v1/owner/ai/usage/timeseries", owner_headers),
        ("GET", "/api/v1/owner/ai/trends", owner_headers),
        ("GET", "/api/v1/owner/ai/organizations", owner_headers),
        ("GET", "/api/v1/owner/ai/activity", owner_headers),
        
        # Owner Analytics Command Center
        ("GET", "/api/v1/owner/analytics/overview", owner_headers),
        ("GET", "/api/v1/owner/analytics/ai-summary", owner_headers),
        ("GET", "/api/v1/owner/analytics/revenue", owner_headers),
        ("GET", "/api/v1/owner/analytics/users", owner_headers),
        ("GET", "/api/v1/owner/analytics/forecast", owner_headers),
        ("GET", "/api/v1/owner/analytics/anomalies", owner_headers),
        ("GET", "/api/v1/owner/analytics/health", owner_headers),
        
        # Owner Security & SOC
        ("GET", "/api/v1/owner/security/overview", owner_headers),
        ("GET", "/api/v1/owner/security/events", owner_headers),
        ("GET", "/api/v1/owner/security/threats", owner_headers),
        ("GET", "/api/v1/owner/security/compliance", owner_headers),
        
        # Owner Integrations Hub
        ("GET", "/api/v1/owner/integrations/overview", owner_headers),
        ("GET", "/api/v1/owner/integrations/connected", owner_headers),
        ("GET", "/api/v1/owner/integrations/webhooks", owner_headers),
        ("GET", "/api/v1/owner/integrations/workflows", owner_headers),
        ("GET", "/api/v1/owner/integrations/logs", owner_headers),
        
        # Owner Audit Command Center
        ("GET", "/api/v1/owner/audit/overview", owner_headers),
        ("GET", "/api/v1/owner/audit/events", owner_headers),
        
        # Owner Feature Flags
        ("GET", "/api/v1/owner/features", owner_headers),
        ("GET", "/api/v1/owner/features/rollouts", owner_headers),
        
        # Owner Storage & S3 Buckets
        ("GET", "/api/v1/owner/storage/overview", owner_headers),
        ("GET", "/api/v1/owner/storage/buckets", owner_headers),
        ("GET", "/api/v1/owner/storage/files", owner_headers),
        
        # Tenant Workspaces, Datasets, Reports
        ("GET", "/api/v1/workspaces", owner_headers),
        ("GET", f"/api/v1/datasets?workspace_id={ws_id}", owner_headers),
        ("GET", f"/api/v1/reports?workspace_id={ws_id}", owner_headers),
        ("GET", "/api/v1/notifications", owner_headers),
        
        # Support & Incident Center
        ("GET", "/api/v1/support/dashboard", owner_headers),
        ("GET", "/api/v1/support/tickets", owner_headers),
        ("GET", "/api/v1/support/incidents", owner_headers),
    ]
    
    transport = ASGITransport(app=app)
    results = []
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        for method, path, headers in test_endpoints:
            try:
                resp = await ac.get(path, headers=headers)
                status = resp.status_code
                status_flag = "[PASS 200 OK]" if status == 200 else f"[FAIL {status}]"
                results.append((status_flag, method, path, status))
                print(f"{status_flag:<15} {method:<4} {path:<55} | Status: {status}")
            except Exception as e:
                err_flag = "[EXCEPTION]   "
                results.append((err_flag, method, path, 500))
                print(f"{err_flag:<15} {method:<4} {path:<55} | Exception: {e}")

    print("=" * 80)
    all_passed = all(r[0].startswith("[PASS") for r in results)
    pass_count = sum(1 for r in results if r[0].startswith("[PASS"))
    print(f"TOTAL ENDPOINTS TESTED : {len(results)}")
    print(f"PASSED                 : {pass_count} / {len(results)} ({round(pass_count/len(results)*100, 1)}%)")
    print(f"OVERALL BACKEND HEALTH : {'100% CLEAN - ALL ENDPOINTS OPERATIONAL' if all_passed else 'ATTENTION NEEDED'}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_full_api_audit())
