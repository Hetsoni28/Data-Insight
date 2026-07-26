"""
Redis connection pool — shared singleton across all requests.

Uses redis.asyncio with connection pooling for efficiency.
"""
from redis.asyncio import ConnectionPool
from redis.asyncio import Redis
from app.core.config import settings
from loguru import logger

_pool: ConnectionPool | None = None


async def get_redis_pool() -> ConnectionPool:
    """Return the shared Redis connection pool, creating it on first call."""
    global _pool
    if _pool is None:
        _pool = ConnectionPool.from_url(
            settings.REDIS_URL,
            max_connections=20,
            decode_responses=False,  # Keep as bytes for OTP storage
        )
        logger.info(f"[Redis] Pool created: {settings.REDIS_URL}")
    return _pool


async def get_redis_client() -> Redis:
    """Return a Redis client using the shared pool."""
    pool = await get_redis_pool()
    return Redis(connection_pool=pool)


async def close_redis_pool() -> None:
    """Gracefully close the Redis pool on app shutdown."""
    global _pool
    if _pool:
        await _pool.aclose()
        _pool = None
        logger.info("[Redis] Pool closed.")
