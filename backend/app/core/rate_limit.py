"""Rate limiter setup using SlowAPI."""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

# Singleton limiter — apply to AI endpoints, utilizing Redis backend
limiter = Limiter(
    key_func=get_remote_address, 
    default_limits=["200/minute"],
    storage_uri=settings.REDIS_URL
)
