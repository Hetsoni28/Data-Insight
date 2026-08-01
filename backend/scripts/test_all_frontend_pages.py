import asyncio
import httpx

FRONTEND_URL = "http://frontend:3000"

OWNER_ROUTES = [
    "/owner/dashboard",
    "/owner/dashboard/ai",
    "/owner/dashboard/ai-providers",
    "/owner/dashboard/ai-usage",
    "/owner/dashboard/analytics",
    "/owner/dashboard/api",
    "/owner/dashboard/audit-logs",
    "/owner/dashboard/datasets",
    "/owner/dashboard/design-system",
    "/owner/dashboard/feature-flags",
    "/owner/dashboard/integrations",
    "/owner/dashboard/monitoring",
    "/owner/dashboard/notifications",
    "/owner/dashboard/organizations",
    "/owner/dashboard/profile",
    "/owner/dashboard/reports",
    "/owner/dashboard/revenue",
    "/owner/dashboard/security",
    "/owner/dashboard/settings",
    "/owner/dashboard/storage",
    "/owner/dashboard/subscriptions",
    "/owner/dashboard/support",
    "/owner/dashboard/users",
]

OTHER_ROUTES = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/onboarding",
    "/verify-email",
    "/organization-admin/dashboard",
    "/manager/dashboard",
    "/analyst/dashboard",
    "/viewer/dashboard",
]

async def test_pages():
    print("=" * 80)
    print("TESTING ALL FRONTEND OWNER & PLATFORM PAGES")
    print("=" * 80)
    
    all_routes = OWNER_ROUTES + OTHER_ROUTES
    passed = 0
    failed = 0
    
    async with httpx.AsyncClient(base_url=FRONTEND_URL, timeout=15.0, follow_redirects=True) as client:
        for route in all_routes:
            try:
                resp = await client.get(route)
                is_ok = resp.status_code in (200, 307, 308)
                status_str = f"PASS {resp.status_code}" if is_ok else f"FAIL {resp.status_code}"
                if is_ok:
                    passed += 1
                else:
                    failed += 1
                print(f"[{status_str:^10}] GET {route:<45}")
            except Exception as e:
                failed += 1
                print(f"[ EXCEPTION] GET {route:<45} | Error: {str(e)}")

    print("=" * 80)
    print(f"TOTAL PAGES TESTED: {len(all_routes)}")
    print(f"PASSED            : {passed} / {len(all_routes)} ({passed/len(all_routes)*100:.1f}%)")
    print(f"FAILED            : {failed}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_pages())
