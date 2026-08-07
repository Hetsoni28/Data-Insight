# app/core/exceptions.py
from fastapi import Request
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import uuid


# ═══════════════════════════════════════
# CUSTOM EXCEPTION CLASSES
# ═══════════════════════════════════════


class DataInsightException(Exception):
    """Base exception for all Data Insight errors."""

    def __init__(self, message: str, code: str = "DI-BE-GLOBAL-001"):
        self.message = message
        self.code = code
        super().__init__(message)


class ResourceNotFoundException(DataInsightException):
    def __init__(self, resource: str, resource_id: str = ""):
        super().__init__(
            message=(
                f"{resource} not found."
                if not resource_id
                else f"{resource} with ID '{resource_id}' not found."
            ),
            code="DI-BE-GLOBAL-404",
        )


class UnauthorizedException(DataInsightException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(message=message, code="DI-BE-AUTH-401")


class ForbiddenException(DataInsightException):
    def __init__(
        self, message: str = "You do not have permission to perform this action."
    ):
        super().__init__(message=message, code="DI-BE-AUTH-403")


class ConflictException(DataInsightException):
    def __init__(self, message: str):
        super().__init__(message=message, code="DI-BE-GLOBAL-409")


class ValidationException(DataInsightException):
    def __init__(self, message: str):
        super().__init__(message=message, code="DI-BE-GLOBAL-422")


class TenantQuotaExceededException(DataInsightException):
    def __init__(
        self,
        message: str = "You have reached your plan limit. Please upgrade your subscription.",
        resource_type: str = "general",
        current_usage: int | float | None = None,
        max_limit: int | float | None = None,
        plan_name: str | None = None,
    ):
        self.resource_type = resource_type
        self.current_usage = current_usage
        self.max_limit = max_limit
        self.plan_name = plan_name
        super().__init__(message=message, code="DI-BE-BILL-009")


class StorageQuotaExceededException(DataInsightException):
    def __init__(
        self,
        message: str = "You have reached your storage limit. Please upgrade your plan or delete old datasets.",
        current_storage_mb: float | None = None,
        max_storage_mb: float | None = None,
    ):
        self.current_storage_mb = current_storage_mb
        self.max_storage_mb = max_storage_mb
        super().__init__(message=message, code="DI-BE-DATASET-016")


class AIServiceException(DataInsightException):
    def __init__(
        self, message: str = "AI service is temporarily unavailable. Please try again."
    ):
        super().__init__(message=message, code="DI-AI-GLOBAL-001")


class JobNotFoundException(DataInsightException):
    def __init__(self, job_id: str):
        super().__init__(message=f"Job '{job_id}' not found.", code="DI-BE-GLOBAL-404")


# ═══════════════════════════════════════
# EXCEPTION HANDLERS
# Register these in main.py
# ═══════════════════════════════════════


def _error_response(
    status_code: int, error_type: str, message: str, code: str, request_id: str
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": error_type,
            "message": message,
            "code": code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
        },
    )


async def resource_not_found_handler(
    request: Request, exc: ResourceNotFoundException
) -> JSONResponse:
    return _error_response(
        404, "RESOURCE_NOT_FOUND", exc.message, exc.code, str(uuid.uuid4())
    )


async def unauthorized_handler(
    request: Request, exc: UnauthorizedException
) -> JSONResponse:
    return _error_response(
        401, "UNAUTHORIZED", exc.message, exc.code, str(uuid.uuid4())
    )


async def forbidden_handler(request: Request, exc: ForbiddenException) -> JSONResponse:
    return _error_response(403, "FORBIDDEN", exc.message, exc.code, str(uuid.uuid4()))


async def conflict_handler(request: Request, exc: ConflictException) -> JSONResponse:
    return _error_response(409, "CONFLICT", exc.message, exc.code, str(uuid.uuid4()))


async def validation_handler(
    request: Request, exc: ValidationException
) -> JSONResponse:
    return _error_response(
        422, "VALIDATION_ERROR", exc.message, exc.code, str(uuid.uuid4())
    )


async def quota_exceeded_handler(
    request: Request, exc: TenantQuotaExceededException
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=402,
        content={
            "error": "QUOTA_EXCEEDED",
            "message": exc.message,
            "code": exc.code,
            "resource_type": exc.resource_type,
            "current_usage": exc.current_usage,
            "max_limit": exc.max_limit,
            "plan_name": exc.plan_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
        },
    )


async def storage_quota_handler(
    request: Request, exc: StorageQuotaExceededException
) -> JSONResponse:
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
    return JSONResponse(
        status_code=402,
        content={
            "error": "STORAGE_QUOTA_EXCEEDED",
            "message": exc.message,
            "code": exc.code,
            "current_storage_mb": exc.current_storage_mb,
            "max_storage_mb": exc.max_storage_mb,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id,
        },
    )


async def ai_service_handler(request: Request, exc: AIServiceException) -> JSONResponse:
    return _error_response(
        502, "AI_SERVICE_ERROR", exc.message, exc.code, str(uuid.uuid4())
    )
