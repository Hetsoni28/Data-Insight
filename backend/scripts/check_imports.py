import time
import sys

def t_import(mod):
    t0 = time.time()
    __import__(mod)
    print(f"Import {mod}: {time.time() - t0:.2f}s", flush=True)

modules = [
    "app.core.config",
    "app.core.exceptions",
    "app.db.session",
    "app.core.rate_limit",
    "app.worker.celery_app",
    "app.api.v1.auth",
    "app.api.v1.users",
    "app.api.v1.tenants",
    "app.api.v1.workspaces",
    "app.api.v1.datasets",
    "app.api.v1.reports",
    "app.api.v1.ai",
    "app.api.v1.admin",
    "app.api.v1.billing",
    "app.api.v1.invitations",
    "app.api.v1.api_keys",
    "app.api.v1.webhooks",
    "app.api.v1.profile",
    "app.api.v1.notifications",
    "app.api.v1.support",
    "app.api.v1.owner_billing",
    "app.api.v1.owner_ai",
    "app.api.v1.owner_analytics",
    "app.api.v1.owner_api_gateway",
    "app.api.v1.owner_storage",
    "app.api.v1.owner_integrations",
    "app.api.v1.owner_security",
    "app.api.v1.owner_audit",
    "app.api.v1.owner_features",
    "app.api.v1.router",
    "app.main",
]

for m in modules:
    t_import(m)
