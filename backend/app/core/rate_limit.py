"""Rate limiter setup using SlowAPI."""

from slowapi import Limiter
from slowapi.util import get_remote_address

# Singleton limiter — apply to AI endpoints
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
