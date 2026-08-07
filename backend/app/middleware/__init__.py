"""Middleware package for Data Insight backend."""

from app.middleware.tenant_middleware import TenantMiddleware

__all__ = ["TenantMiddleware"]
