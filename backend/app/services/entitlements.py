import enum

from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.dashboard import Dashboard
from app.models.dataset import Dataset
from app.models.report import Report
from app.models.tenant import Tenant
from app.models.user import User


class BillingFeature(str, enum.Enum):
    AI_EXCEL = "ai_excel"
    FORECASTING = "forecasting"
    API_ACCESS = "api_access"
    SSO = "sso"
    DEDICATED_DB = "dedicated_db"


class BillingResource(str, enum.Enum):
    USERS = "users"
    STORAGE = "storage"
    AI_TOKENS = "ai_tokens"
    DATASETS = "datasets"
    REPORTS = "reports"
    DASHBOARDS = "dashboards"


class PlanLimits(BaseModel):
    users: int | None  # None means unlimited
    storage_gb: int | None
    ai_tokens: int | None
    datasets: int | None
    reports: int | None
    dashboards: int | None
    features: list[BillingFeature]


# The Single Source of Truth for Plan Configuration
# enterprise = "Dedicated System Rental"
# custom = "Custom Global License"
PLAN_CATALOG = {
    "starter": PlanLimits(
        users=5,
        storage_gb=5,
        ai_tokens=100_000,
        datasets=10,
        reports=20,
        dashboards=10,
        features=[],
    ),
    "professional": PlanLimits(
        users=25,
        storage_gb=50,
        ai_tokens=500_000,
        datasets=50,
        reports=100,
        dashboards=50,
        features=[
            BillingFeature.AI_EXCEL,
            BillingFeature.FORECASTING,
            BillingFeature.API_ACCESS,
        ],
    ),
    "enterprise": PlanLimits(  # The $15,000/mo Dedicated System Rental
        users=None,
        storage_gb=None,
        ai_tokens=None,
        datasets=None,
        reports=None,
        dashboards=None,
        features=[
            BillingFeature.AI_EXCEL,
            BillingFeature.FORECASTING,
            BillingFeature.API_ACCESS,
            BillingFeature.DEDICATED_DB,
        ],
    ),
    "custom": PlanLimits(  # Custom Global License
        users=None,
        storage_gb=None,
        ai_tokens=None,
        datasets=None,
        reports=None,
        dashboards=None,
        features=[
            BillingFeature.AI_EXCEL,
            BillingFeature.FORECASTING,
            BillingFeature.API_ACCESS,
            BillingFeature.SSO,
            BillingFeature.DEDICATED_DB,
        ],
    ),
}


class UsageMap(BaseModel):
    users: int
    storage_gb: float
    ai_tokens: int
    datasets: int
    reports: int
    dashboards: int


def get_plan_limits(plan_name: str) -> PlanLimits:
    """Retrieve the limits associated with a given plan name."""
    # Default to starter if unknown plan is provided
    return PLAN_CATALOG.get(plan_name.lower(), PLAN_CATALOG["starter"])


def get_entitlements(tenant: Tenant) -> dict[str, bool]:
    """Return a mapping of all features and whether the tenant has access to them."""
    limits = get_plan_limits(tenant.plan)
    return {feature.value: (feature in limits.features) for feature in BillingFeature}


async def get_usage(tenant: Tenant, db: AsyncSession) -> UsageMap:
    """Calculate the real-time usage for all tracked resources for a tenant."""
    # Active Users
    users_count = await db.scalar(
        select(func.count(User.id)).where(
            User.tenant_id == tenant.id, User.is_active == True,
        ),
    )

    # Active Datasets
    datasets_count = await db.scalar(
        select(func.count(Dataset.id)).where(
            Dataset.tenant_id == tenant.id, Dataset.is_deleted == False,
        ),
    )

    # Active Reports
    reports_count = await db.scalar(
        select(func.count(Report.id)).where(
            Report.tenant_id == tenant.id, Report.is_deleted == False,
        ),
    )

    # Active Dashboards
    dashboards_count = await db.scalar(
        select(func.count(Dashboard.id)).where(
            Dashboard.tenant_id == tenant.id, Dashboard.is_deleted == False,
        ),
    )

    return UsageMap(
        users=users_count or 0,
        storage_gb=tenant.current_storage_bytes / (1024**3),
        ai_tokens=tenant.current_ai_tokens_used,
        datasets=datasets_count or 0,
        reports=reports_count or 0,
        dashboards=dashboards_count or 0,
    )


def can_use_feature(tenant: Tenant, feature: BillingFeature) -> bool:
    """Check if the tenant's plan includes a specific feature."""
    limits = get_plan_limits(tenant.plan)
    return feature in limits.features


class QuotaResult(BaseModel):
    allowed: bool
    used: float
    limit: int | None
    remaining: float | None
    warning_state: str  # "normal", "warning", "high", "critical", "limit"


def _get_warning_state(used: float, limit: int | None) -> str:
    if limit is None:
        return "normal"
    if limit == 0:
        return "limit"

    pct = used / limit
    if pct >= 1.0:
        return "limit"
    if pct >= 0.95:
        return "critical"
    if pct >= 0.85:
        return "high"
    if pct >= 0.70:
        return "warning"
    return "normal"


def check_quota(
    tenant: Tenant, usage: UsageMap, resource: BillingResource, buffer: int = 1,
) -> QuotaResult:
    """Check if the tenant has enough quota to consume `buffer` more of a specific resource.
    Returns a QuotaResult with allowed flag, limits, and warning state.
    """
    limits = get_plan_limits(tenant.plan)

    # Map resource to usage and limit values
    if resource == BillingResource.USERS:
        current_used = usage.users
        # Add purchased seats to the base plan limits
        plan_limit = limits.users
        limit = (
            plan_limit + (getattr(tenant, "seats_purchased", 0) or 0)
            if plan_limit is not None
            else None
        )
    elif resource == BillingResource.STORAGE:
        current_used = usage.storage_gb
        limit = limits.storage_gb
    elif resource == BillingResource.AI_TOKENS:
        current_used = usage.ai_tokens
        limit = limits.ai_tokens
    elif resource == BillingResource.DATASETS:
        current_used = usage.datasets
        limit = limits.datasets
    elif resource == BillingResource.REPORTS:
        current_used = usage.reports
        limit = limits.reports
    elif resource == BillingResource.DASHBOARDS:
        current_used = usage.dashboards
        limit = limits.dashboards
    else:
        raise ValueError(f"Unknown billing resource: {resource}")

    warning_state = _get_warning_state(current_used, limit)

    if limit is None:
        return QuotaResult(
            allowed=True,
            used=current_used,
            limit=limit,
            remaining=None,
            warning_state=warning_state,
        )

    remaining = max(0, limit - current_used)
    allowed = (current_used + buffer) <= limit

    return QuotaResult(
        allowed=allowed,
        used=current_used,
        limit=limit,
        remaining=remaining,
        warning_state=warning_state,
    )
