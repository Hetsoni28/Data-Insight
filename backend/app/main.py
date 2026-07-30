# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from loguru import logger
import uuid
import sys
from datetime import datetime, timezone

from app.core.config import settings
from app.core.exceptions import (
    ResourceNotFoundException,
    resource_not_found_handler,
    UnauthorizedException,
    unauthorized_handler,
    ForbiddenException,
    forbidden_handler,
    ConflictException,
    conflict_handler,
    ValidationException,
    validation_handler,
    TenantQuotaExceededException,
    quota_exceeded_handler,
    StorageQuotaExceededException,
    storage_quota_handler,
    AIServiceException,
    ai_service_handler,
)
from app.api.v1.router import api_router
from app.db.session import engine
from app.core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from prometheus_fastapi_instrumentator import Instrumentator
from app.worker.celery_app import celery_app  # Initialize Celery app

# ─── Loguru Configuration ─────────────────────────────────────────────────────
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.APP_ENV == "development" else "INFO",
    colorize=True,
)
logger.add(
    "logs/data_insight_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    compression="zip",
    level="INFO",
)


from app.db.redis import close_redis_pool


# ─── Application Lifespan ─────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.
    - Startup: Initialize connections, warm caches
    - Shutdown: Close DB + Redis connections cleanly
    """
    logger.info(
        f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.APP_ENV}]"
    )
    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")
    await engine.dispose()
    await close_redis_pool()
    logger.info("All connections closed.")


# ─── Application Factory ──────────────────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=f"{settings.APP_NAME} API",
        description="Enterprise AI Business Intelligence Platform — API Documentation",
        version=settings.APP_VERSION,
        lifespan=lifespan,
        # Hide Swagger docs in production
        docs_url="/docs" if settings.APP_ENV == "development" else None,
        redoc_url="/redoc" if settings.APP_ENV == "development" else None,
        openapi_url="/openapi.json" if settings.APP_ENV == "development" else None,
    )

    # ─── Rate Limiter ─────────────────────────────────────────────────────
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore

    # ─── CORS Middleware ──────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # ─── Request ID Middleware ────────────────────────────────────────────────
    @app.middleware("http")
    async def add_request_id(request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    # ─── Register Custom Exception Handlers ──────────────────────────────────
    app.add_exception_handler(ResourceNotFoundException, resource_not_found_handler)  # type: ignore
    app.add_exception_handler(UnauthorizedException, unauthorized_handler)  # type: ignore
    app.add_exception_handler(ForbiddenException, forbidden_handler)  # type: ignore
    app.add_exception_handler(ConflictException, conflict_handler)  # type: ignore
    app.add_exception_handler(ValidationException, validation_handler)  # type: ignore
    app.add_exception_handler(TenantQuotaExceededException, quota_exceeded_handler)  # type: ignore
    app.add_exception_handler(StorageQuotaExceededException, storage_quota_handler)  # type: ignore
    app.add_exception_handler(AIServiceException, ai_service_handler)  # type: ignore

    # ─── Pydantic Validation Error Handler ───────────────────────────────────
    @app.exception_handler(RequestValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: RequestValidationError
    ):
        errors = []
        for error in exc.errors():
            field = " → ".join(str(loc) for loc in error["loc"])
            errors.append({"field": field, "message": error["msg"]})
        return JSONResponse(
            status_code=422,
            content={
                "error": "VALIDATION_ERROR",
                "message": "Input validation failed. Please check the fields below.",
                "code": "DI-BE-GLOBAL-005",
                "errors": errors,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": getattr(request.state, "request_id", str(uuid.uuid4())),
            },
        )

    # ─── Global Unhandled Exception Handler ──────────────────────────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        logger.exception(f"Unhandled exception | request_id={request_id} | {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Our engineering team has been notified.",
                "code": "DI-BE-GLOBAL-001",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "request_id": request_id,
            },
        )

    # ─── Register API Routes ──────────────────────────────────────────────
    app.include_router(api_router, prefix="/api/v1")

    # ─── Local Storage Fallback Mount ─────────────────────────────────────
    import os
    from fastapi.staticfiles import StaticFiles
    from app.core.storage import LOCAL_UPLOADS_DIR, is_local_storage

    if is_local_storage():
        os.makedirs(LOCAL_UPLOADS_DIR, exist_ok=True)
        # We mount it under /api/v1/storage so frontend proxy catches it
        app.mount(
            "/api/v1/storage",
            StaticFiles(directory=LOCAL_UPLOADS_DIR),
            name="local_storage",
        )

    # ─── Prometheus Metrics ───────────────────────────────────────────────
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=True,
        env_var_name="ENABLE_METRICS",
        excluded_handlers=["/health", "/metrics"],
    ).instrument(app).expose(app, endpoint="/metrics", tags=["System"])

    # ─── Health Check Endpoint ────────────────────────────────────────────────
    @app.get("/health", tags=["System"], summary="Health Check")
    async def health_check():
        """
        Platform health check endpoint.
        Used by Docker, load balancers, and monitoring systems.
        Returns 200 if the API is running correctly.
        """
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    return app


# ─── Application Instance ─────────────────────────────────────────────────────
app = create_app()
