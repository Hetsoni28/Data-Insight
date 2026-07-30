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
