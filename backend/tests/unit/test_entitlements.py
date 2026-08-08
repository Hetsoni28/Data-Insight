import pytest
from app.services.entitlements import (
    get_plan_limits,
    get_entitlements,
    can_use_feature,
    check_quota,
    BillingFeature,
    BillingResource,
    UsageMap
)

class MockTenant:
    def __init__(self, plan="starter"):
        self.plan = plan
        self.current_storage_bytes = 0
        self.current_ai_tokens_used = 0


def test_get_plan_limits():
    # Test valid plan
    enterprise_limits = get_plan_limits("enterprise")
    assert enterprise_limits.users is None
    assert BillingFeature.DEDICATED_DB in enterprise_limits.features

    # Test invalid plan defaults to starter
    unknown_limits = get_plan_limits("unknown_plan")
    assert unknown_limits.users == 5
    assert BillingFeature.DEDICATED_DB not in unknown_limits.features


def test_get_entitlements():
    tenant = MockTenant(plan="enterprise")
    entitlements = get_entitlements(tenant)
    assert entitlements[BillingFeature.DEDICATED_DB.value] is True
    
    tenant_starter = MockTenant(plan="starter")
    entitlements_starter = get_entitlements(tenant_starter)
    assert entitlements_starter[BillingFeature.DEDICATED_DB.value] is False


def test_can_use_feature():
    tenant = MockTenant(plan="custom")
    assert can_use_feature(tenant, BillingFeature.SSO) is True
    
    tenant_starter = MockTenant(plan="starter")
    assert can_use_feature(tenant_starter, BillingFeature.SSO) is False


def test_check_quota_unlimited():
    tenant = MockTenant(plan="enterprise")
    usage = UsageMap(users=1000, storage_gb=5000, ai_tokens=10_000_000, datasets=1000, reports=1000, dashboards=1000)
    
    # Adding a huge buffer to an unlimited plan should still be allowed
    result = check_quota(tenant, usage, BillingResource.USERS, buffer=500)
    assert result.allowed is True
    assert result.limit is None
    assert result.warning_state == "normal"


def test_check_quota_limited_allowed():
    tenant = MockTenant(plan="starter")
    # Starter limits: users=5
    usage = UsageMap(users=3, storage_gb=0, ai_tokens=0, datasets=0, reports=0, dashboards=0)
    
    result = check_quota(tenant, usage, BillingResource.USERS, buffer=2)
    assert result.allowed is True
    assert result.limit == 5
    # 3 + 2 = 5 -> allowed. But the warning state is based on CURRENT usage (3/5 = 60% = normal)
    assert result.warning_state == "normal"


def test_check_quota_limited_rejected():
    tenant = MockTenant(plan="starter")
    # Starter limits: users=5
    usage = UsageMap(users=5, storage_gb=0, ai_tokens=0, datasets=0, reports=0, dashboards=0)
    
    result = check_quota(tenant, usage, BillingResource.USERS, buffer=1)
    assert result.allowed is False
    assert result.limit == 5
    assert result.warning_state == "limit"


def test_warning_states():
    tenant = MockTenant(plan="starter")
    
    # 70% threshold -> warning
    # AI tokens limit: 100,000
    usage = UsageMap(users=0, storage_gb=0, ai_tokens=75_000, datasets=0, reports=0, dashboards=0)
    res = check_quota(tenant, usage, BillingResource.AI_TOKENS, buffer=1)
    assert res.warning_state == "warning"
    
    # 85% threshold -> high
    usage.ai_tokens = 85_000
    res = check_quota(tenant, usage, BillingResource.AI_TOKENS, buffer=1)
    assert res.warning_state == "high"
    
    # 95% threshold -> critical
    usage.ai_tokens = 96_000
    res = check_quota(tenant, usage, BillingResource.AI_TOKENS, buffer=1)
    assert res.warning_state == "critical"
    
    # 100% threshold -> limit
    usage.ai_tokens = 100_000
    res = check_quota(tenant, usage, BillingResource.AI_TOKENS, buffer=1)
    assert res.warning_state == "limit"
