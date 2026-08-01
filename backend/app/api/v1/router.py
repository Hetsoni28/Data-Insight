from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.tenants import router as tenants_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.reports import router as reports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.admin import router as admin_router
from app.api.v1.billing import router as billing_router
from app.api.v1.invitations import router as invitations_router
from app.api.v1.api_keys import router as api_keys_router
from app.api.v1.webhooks import router as webhooks_router
from app.api.v1.profile import router as profile_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.support import router as support_router
from app.api.v1.owner_billing import router as owner_billing_router
from app.api.v1.owner_ai import router as owner_ai_router
from app.api.v1.owner_analytics import router as owner_analytics_router
from app.api.v1.owner_api_gateway import router as owner_api_gateway_router
from app.api.v1.owner_storage import router as owner_storage_router
from app.api.v1.owner_integrations import router as owner_integrations_router
from app.api.v1.owner_security import router as owner_security_router
from app.api.v1.owner_audit import router as owner_audit_router
from app.api.v1.owner_features import router as owner_features_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(tenants_router)
api_router.include_router(workspaces_router)
api_router.include_router(datasets_router)
api_router.include_router(reports_router)
api_router.include_router(ai_router)
api_router.include_router(admin_router)
api_router.include_router(billing_router)
api_router.include_router(invitations_router)
api_router.include_router(api_keys_router)
api_router.include_router(webhooks_router)
api_router.include_router(profile_router)
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(support_router, prefix="/support", tags=["Support"])
api_router.include_router(owner_billing_router, prefix="/owner/subscriptions", tags=["Owner Billing"])
api_router.include_router(owner_ai_router, prefix="/owner/ai", tags=["Owner AI"])
api_router.include_router(owner_analytics_router, prefix="/owner/analytics", tags=["Owner Analytics"])
api_router.include_router(owner_api_gateway_router)
api_router.include_router(owner_storage_router)
api_router.include_router(owner_integrations_router, prefix="/owner/integrations", tags=["Owner Integrations"])
api_router.include_router(owner_security_router, prefix="/owner/security", tags=["Owner Security"])
api_router.include_router(owner_audit_router, prefix="/owner/audit", tags=["Owner Audit"])
api_router.include_router(owner_features_router, prefix="/owner/features", tags=["Owner Features"])
