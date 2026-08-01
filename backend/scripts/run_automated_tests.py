import asyncio
import io
import json
import traceback
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from app.main import app
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.workspace import Workspace
from app.models.dataset import Dataset
from app.models.report import Report
from app.core.security import create_access_token

async def run_all_tests():
    print("=" * 90)
    print("DATA INSIGHT - BACKEND API AUTOMATED ENDPOINT VERIFICATION SUITE")
    print("=" * 90)

    # 1. Fetch DB Context
    async with AsyncSessionLocal() as session:
        owner_user = (await session.execute(
            select(User).where(User.email == "hetsony143@gmail.com")
        )).scalar_one_or_none()

        org_admin = (await session.execute(
            select(User).where(User.email == "heersoni1341@gmail.com")
        )).scalar_one_or_none()

        # Find workspace for owner tenant & workspace for org_admin tenant
        admin_tenant = (await session.execute(
            select(Tenant).where(Tenant.id == org_admin.tenant_id)
        )).scalar_one_or_none() if org_admin else None

        owner_tenant = (await session.execute(
            select(Tenant).where(Tenant.id == owner_user.tenant_id)
        )).scalar_one_or_none() if owner_user else None

        admin_workspace = (await session.execute(
            select(Workspace).where(Workspace.tenant_id == org_admin.tenant_id)
        )).scalars().first() if org_admin else None

        if not admin_workspace and org_admin:
            # Create a workspace for testing if not existing
            import uuid
            admin_workspace = Workspace(
                id=uuid.uuid4(),
                tenant_id=org_admin.tenant_id,
                name="Primary Analytics Workspace",
                description="Default testing workspace"
            )
            session.add(admin_workspace)
            await session.commit()
            await session.refresh(admin_workspace)

        admin_dataset = (await session.execute(
            select(Dataset).where(Dataset.tenant_id == org_admin.tenant_id)
        )).scalars().first() if org_admin else None

        first_report = (await session.execute(
            select(Report).order_by(Report.created_at.asc())
        )).scalars().first()

    if not owner_user or not org_admin:
        print("ERROR: Test users not found in DB!")
        return

    owner_token = create_access_token(
        subject=str(owner_user.id),
        role=owner_user.role,
        tenant_id=str(owner_user.tenant_id),
        expires_delta=timedelta(hours=2)
    )
    admin_token = create_access_token(
        subject=str(org_admin.id),
        role=org_admin.role,
        tenant_id=str(org_admin.tenant_id),
        expires_delta=timedelta(hours=2)
    )

    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    tenant_id_str = str(owner_tenant.id) if owner_tenant else str(admin_tenant.id)
    workspace_id_str = str(admin_workspace.id) if admin_workspace else ""
    dataset_id_str = str(admin_dataset.id) if admin_dataset else ""
    report_id_str = str(first_report.id) if first_report else ""

    print(f"Context Initialized:")
    print(f"  Owner: {owner_user.email} (Tenant: {owner_user.tenant_id})")
    print(f"  Tenant Admin: {org_admin.email} (Tenant: {org_admin.tenant_id})")
    print(f"  Target Workspace ID: {workspace_id_str}")
    print(f"  Target Dataset ID: {dataset_id_str}")
    print(f"  Target Report ID: {report_id_str}")
    print("=" * 90)

    results = []

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=30.0) as client:

        async def test_endpoint(category, method, path, headers=None, json_body=None, params=None, files=None, data=None, expected_status=None):
            req_kwargs = {}
            if headers:
                req_kwargs["headers"] = headers
            if json_body is not None:
                req_kwargs["json"] = json_body
            if params is not None:
                req_kwargs["params"] = params
            if files is not None:
                req_kwargs["files"] = files
            if data is not None:
                req_kwargs["data"] = data

            start_t = datetime.now()
            try:
                if method.upper() == "GET":
                    resp = await client.get(path, **req_kwargs)
                elif method.upper() == "POST":
                    resp = await client.post(path, **req_kwargs)
                elif method.upper() == "PATCH":
                    resp = await client.patch(path, **req_kwargs)
                elif method.upper() == "DELETE":
                    resp = await client.delete(path, **req_kwargs)
                else:
                    resp = await client.request(method, path, **req_kwargs)

                duration_ms = (datetime.now() - start_t).total_seconds() * 1000
                status_code = resp.status_code

                is_500 = status_code >= 500
                is_pass = False
                if expected_status:
                    is_pass = (status_code in expected_status)
                else:
                    is_pass = (status_code < 400 or status_code in [404, 422, 400, 409] if not is_500 else False)

                detail = ""
                if is_500:
                    detail = f"SERVER ERROR: {resp.text[:300]}"
                elif status_code >= 400:
                    detail = f"Client response ({status_code}): {resp.text[:150]}"

                res_entry = {
                    "category": category,
                    "method": method.upper(),
                    "path": path,
                    "status_code": status_code,
                    "duration_ms": round(duration_ms, 2),
                    "passed": is_pass and not is_500,
                    "is_500": is_500,
                    "detail": detail,
                }
                results.append(res_entry)

                flag = "[PASS]" if res_entry["passed"] else ("[500 FAIL]" if is_500 else f"[INFO {status_code}]")
                print(f"{flag:<12} | {method.upper():<6} | {path:<55} | Status: {status_code} | Time: {res_entry['duration_ms']}ms")
                if is_500:
                    print(f"    >>> ERROR DETAIL: {detail}")

                return resp
            except Exception as e:
                duration_ms = (datetime.now() - start_t).total_seconds() * 1000
                err_tb = traceback.format_exc()
                res_entry = {
                    "category": category,
                    "method": method.upper(),
                    "path": path,
                    "status_code": 500,
                    "duration_ms": round(duration_ms, 2),
                    "passed": False,
                    "is_500": True,
                    "detail": f"EXCEPTION: {str(e)} | TB: {err_tb[-300:]}",
                }
                results.append(res_entry)
                print(f"[EXCEPTION]  | {method.upper():<6} | {path:<55} | Error: {str(e)}")
                return None

        # ─── 1. System & Health ────────────────────────────────────────────────
        print("\n--- 1. System & Health Endpoints ---")
        await test_endpoint("System", "GET", "/health", expected_status=[200])

        # ─── 2. Auth Endpoints ────────────────────────────────────────────────
        print("\n--- 2. Auth Endpoints ---")
        await test_endpoint("Auth", "GET", "/api/v1/auth/me", headers=owner_headers, expected_status=[200])
        await test_endpoint("Auth", "POST", "/api/v1/auth/login", json_body={"email": "nonexistent@test.com", "password": "wrongpassword"}, expected_status=[401])
        await test_endpoint("Auth", "POST", "/api/v1/auth/request-access", json_body={"email": f"tester_{int(datetime.now().timestamp())}@data-insight.ai", "password": "SecurePassword123!", "full_name": "Test User", "requested_role": "Analyst"}, expected_status=[200, 201])
        await test_endpoint("Auth", "POST", "/api/v1/auth/resend-otp", json_body={"email": "hetsony143@gmail.com"}, expected_status=[200, 400, 409, 429])
        await test_endpoint("Auth", "POST", "/api/v1/auth/forgot-password", json_body={"email": "nonexistent_forgot@test.com"}, expected_status=[200, 400, 404])

        # ─── 3. Users Endpoints ───────────────────────────────────────────────
        print("\n--- 3. Users Endpoints ---")
        await test_endpoint("Users", "GET", "/api/v1/users/me", headers=owner_headers, expected_status=[200])
        await test_endpoint("Users", "PATCH", "/api/v1/users/me", headers=owner_headers, json_body={"full_name": "Het Soni Owner"}, expected_status=[200])
        await test_endpoint("Users", "GET", "/api/v1/users/active", headers=owner_headers, expected_status=[200])
        await test_endpoint("Users", "GET", "/api/v1/users/pending", headers=owner_headers, expected_status=[200])

        # ─── 4. Tenants Endpoints ─────────────────────────────────────────────
        print("\n--- 4. Tenants Endpoints ---")
        await test_endpoint("Tenants", "GET", "/api/v1/tenants/me", headers=admin_headers, expected_status=[200])
        await test_endpoint("Tenants", "PATCH", "/api/v1/tenants/me", headers=admin_headers, json_body={"industry": "Retail & Analytics"}, expected_status=[200])

        # ─── 5. Workspaces Endpoints ──────────────────────────────────────────
        print("\n--- 5. Workspaces Endpoints ---")
        await test_endpoint("Workspaces", "GET", "/api/v1/workspaces", headers=admin_headers, expected_status=[200])
        if workspace_id_str:
            await test_endpoint("Workspaces", "GET", f"/api/v1/workspaces/{workspace_id_str}", headers=admin_headers, expected_status=[200])
            await test_endpoint("Workspaces", "GET", f"/api/v1/workspaces/{workspace_id_str}/stats", headers=admin_headers, expected_status=[200])

        # ─── 6. Datasets Endpoints ────────────────────────────────────────────
        print("\n--- 6. Datasets Endpoints ---")
        if workspace_id_str:
            await test_endpoint("Datasets", "GET", "/api/v1/datasets", headers=admin_headers, params={"workspace_id": workspace_id_str}, expected_status=[200])

            # Upload validation / test upload
            csv_content = b"Date,Revenue,Cost,Profit,Region\n2025-01-01,10000,6000,4000,North\n2025-01-02,15000,8000,7000,South\n2025-01-03,20000,11000,9000,East\n2025-01-04,25000,13000,12000,West"
            upload_resp = await test_endpoint(
                "Datasets", "POST", "/api/v1/datasets/upload",
                headers=admin_headers,
                data={"workspace_id": workspace_id_str, "name": "Automated Test Financials", "description": "Synthetic dataset for verification"},
                files={"file": ("test_sales.csv", io.BytesIO(csv_content), "text/csv")},
                expected_status=[200, 202]
            )

            if upload_resp and upload_resp.status_code in [200, 202]:
                up_json = upload_resp.json()
                test_dataset_id = up_json.get("id") or (up_json.get("dataset", {}).get("id") if isinstance(up_json.get("dataset"), dict) else None)
                if test_dataset_id:
                    dataset_id_str = str(test_dataset_id)
                    # Update status to ready for downstream report generation test
                    async with AsyncSessionLocal() as session:
                        import uuid
                        ds_obj = await session.get(Dataset, uuid.UUID(dataset_id_str))
                        if ds_obj:
                            ds_obj.status = "ready"
                            await session.commit()

        if dataset_id_str:
            await test_endpoint("Datasets", "GET", f"/api/v1/datasets/{dataset_id_str}", headers=admin_headers, expected_status=[200])
            await test_endpoint("Datasets", "GET", f"/api/v1/datasets/{dataset_id_str}/download-url", headers=admin_headers, expected_status=[200])

        # ─── 7. Reports Endpoints ─────────────────────────────────────────────
        print("\n--- 7. Reports Endpoints ---")
        if workspace_id_str:
            await test_endpoint("Reports", "GET", "/api/v1/reports", headers=admin_headers, params={"workspace_id": workspace_id_str}, expected_status=[200])
        if dataset_id_str:
            gen_resp = await test_endpoint(
                "Reports", "POST", "/api/v1/reports/generate",
                headers=admin_headers,
                json_body={"dataset_id": dataset_id_str, "title": "Automated Financial Analysis", "report_type": "financial_summary", "generation_config": {}},
                expected_status=[200, 202]
            )
            if gen_resp and gen_resp.status_code in [200, 202]:
                rep_json = gen_resp.json()
                test_report_id = rep_json.get("id") or (rep_json.get("report", {}).get("id") if isinstance(rep_json.get("report"), dict) else None)
                if test_report_id:
                    report_id_str = str(test_report_id)

        if report_id_str:
            await test_endpoint("Reports", "GET", f"/api/v1/reports/{report_id_str}", headers=admin_headers, expected_status=[200, 404])

        # ─── 8. AI Copilot Endpoints ──────────────────────────────────────────
        print("\n--- 8. AI Copilot Endpoints ---")
        if dataset_id_str:
            await test_endpoint("AI", "POST", "/api/v1/ai/chat", headers=admin_headers, json_body={"question": "What are our revenue trends?", "dataset_id": dataset_id_str, "history": []}, expected_status=[200, 502])
            await test_endpoint("AI", "POST", "/api/v1/ai/analyze", headers=admin_headers, json_body={"dataset_id": dataset_id_str, "analysis_type": "general"}, expected_status=[200, 202])

        # ─── 9. Admin Endpoints ───────────────────────────────────────────────
        print("\n--- 9. Admin Endpoints ---")
        await test_endpoint("Admin", "GET", "/api/v1/admin/tenants", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/kpis", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/usage-trends", headers=owner_headers, expected_status=[200])
        if tenant_id_str:
            await test_endpoint("Admin", "GET", f"/api/v1/admin/tenants/{tenant_id_str}/stats", headers=owner_headers, expected_status=[200])
            await test_endpoint("Admin", "GET", f"/api/v1/admin/tenants/{tenant_id_str}/activity", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/audit-logs", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/users", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/tenants/analytics", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/revenue", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/monitoring", headers=owner_headers, expected_status=[200])
        await test_endpoint("Admin", "GET", "/api/v1/admin/subscriptions", headers=owner_headers, expected_status=[200])

        # ─── 10. Owner Subscriptions / Billing ────────────────────────────────
        print("\n--- 10. Owner Subscriptions Endpoints ---")
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/kpis", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/revenue-trends", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/organizations", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/invoices", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/analytics/ai-costs", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/analytics/forecast", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/analytics/health", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Billing", "GET", "/api/v1/owner/subscriptions/activity", headers=owner_headers, expected_status=[200])

        # ─── 11. Owner AI Management ──────────────────────────────────────────
        print("\n--- 11. Owner AI Endpoints ---")
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/providers", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/models", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/routing", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/usage/timeseries", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/trends", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/organizations", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner AI", "GET", "/api/v1/owner/ai/activity", headers=owner_headers, expected_status=[200])

        # ─── 12. Owner Analytics ──────────────────────────────────────────────
        print("\n--- 12. Owner Analytics Endpoints ---")
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/ai-summary", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/revenue", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/users", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/forecast", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/anomalies", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Analytics", "GET", "/api/v1/owner/analytics/health", headers=owner_headers, expected_status=[200])

        # ─── 13. Owner API Gateway ────────────────────────────────────────────
        print("\n--- 13. Owner API Gateway Endpoints ---")
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/usage-trends", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/errors", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/live-requests", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/keys", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/oauth-clients", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/integrations", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner API Gateway", "GET", "/api/v1/owner/api-gateway/security", headers=owner_headers, expected_status=[200])

        # ─── 14. Owner Storage ────────────────────────────────────────────────
        print("\n--- 14. Owner Storage Endpoints ---")
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/analytics", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/organizations", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/buckets", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/files", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/backups", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/activity", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Storage", "GET", "/api/v1/owner/storage/security", headers=owner_headers, expected_status=[200])

        # ─── 15. Owner Integrations ───────────────────────────────────────────
        print("\n--- 15. Owner Integrations Endpoints ---")
        await test_endpoint("Owner Integrations", "GET", "/api/v1/owner/integrations/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Integrations", "GET", "/api/v1/owner/integrations/connected", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Integrations", "GET", "/api/v1/owner/integrations/webhooks", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Integrations", "GET", "/api/v1/owner/integrations/workflows", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Integrations", "GET", "/api/v1/owner/integrations/logs", headers=owner_headers, expected_status=[200])

        # ─── 16. Owner Security ───────────────────────────────────────────────
        print("\n--- 16. Owner Security Endpoints ---")
        await test_endpoint("Owner Security", "GET", "/api/v1/owner/security/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Security", "GET", "/api/v1/owner/security/events", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Security", "GET", "/api/v1/owner/security/threats", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Security", "GET", "/api/v1/owner/security/sessions", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Security", "GET", "/api/v1/owner/security/compliance", headers=owner_headers, expected_status=[200])

        # ─── 17. Owner Audit ──────────────────────────────────────────────────
        print("\n--- 17. Owner Audit Endpoints ---")
        await test_endpoint("Owner Audit", "GET", "/api/v1/owner/audit/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Audit", "GET", "/api/v1/owner/audit/events", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Audit", "GET", "/api/v1/owner/audit/timeline", headers=owner_headers, expected_status=[200])

        # ─── 18. Owner Features ───────────────────────────────────────────────
        print("\n--- 18. Owner Features Endpoints ---")
        await test_endpoint("Owner Features", "GET", "/api/v1/owner/features/overview", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Features", "GET", "/api/v1/owner/features", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Features", "GET", "/api/v1/owner/features/rollouts", headers=owner_headers, expected_status=[200])
        await test_endpoint("Owner Features", "GET", "/api/v1/owner/features/experiments", headers=owner_headers, expected_status=[200])

        # ─── 19. Executive Profile ────────────────────────────────────────────
        print("\n--- 19. Executive Profile Endpoints ---")
        await test_endpoint("Profile", "GET", "/api/v1/profile/me", headers=owner_headers, expected_status=[200])
        await test_endpoint("Profile", "PATCH", "/api/v1/profile/me", headers=owner_headers, json_body={"department": "Engineering Leadership"}, expected_status=[200])
        await test_endpoint("Profile", "GET", "/api/v1/profile/sessions", headers=owner_headers, expected_status=[200])
        await test_endpoint("Profile", "GET", "/api/v1/profile/activity", headers=owner_headers, expected_status=[200])
        await test_endpoint("Profile", "GET", "/api/v1/profile/audit", headers=owner_headers, expected_status=[200])

        # ─── 20. Notifications ────────────────────────────────────────────────
        print("\n--- 20. Notifications Endpoints ---")
        await test_endpoint("Notifications", "GET", "/api/v1/notifications", headers=owner_headers, expected_status=[200])
        await test_endpoint("Notifications", "GET", "/api/v1/notifications/stats", headers=owner_headers, expected_status=[200])

        # ─── 21. Support ──────────────────────────────────────────────────────
        print("\n--- 21. Support Endpoints ---")
        await test_endpoint("Support", "GET", "/api/v1/support/dashboard", headers=owner_headers, expected_status=[200])
        await test_endpoint("Support", "GET", "/api/v1/support/tickets", headers=owner_headers, expected_status=[200])
        await test_endpoint("Support", "GET", "/api/v1/support/incidents", headers=owner_headers, expected_status=[200])

        # ─── 22. Tenant Utilities (API Keys, Webhooks, Invitations) ───────────
        print("\n--- 22. Utilities Endpoints ---")
        await test_endpoint("API Keys", "GET", "/api/v1/users/me/api-keys", headers=admin_headers, expected_status=[200])
        await test_endpoint("Webhooks", "GET", "/api/v1/tenants/me/webhooks", headers=admin_headers, expected_status=[200])
        await test_endpoint("Invitations", "GET", "/api/v1/invitations", headers=admin_headers, expected_status=[200])

    print("\n" + "=" * 90)
    print("FINAL TEST SUITE RUN SUMMARY")
    print("=" * 90)

    total = len(results)
    passed = sum(1 for r in results if r["passed"])
    server_errors = sum(1 for r in results if r["is_500"])
    failed = total - passed

    print(f"Total Endpoints Tested : {total}")
    print(f"Passed Successfully    : {passed}")
    print(f"Failed / Issues        : {failed}")
    print(f"500 Server Errors      : {server_errors}")
    print("=" * 90)

    # Save results to json
    with open("/app/scripts/test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Detailed report saved to /app/scripts/test_results.json")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
