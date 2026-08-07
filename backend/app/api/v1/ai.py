"""AI Copilot endpoints — chat, SSE streaming, NL-to-SQL, deep analysis, job status."""

import uuid
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.services.ai_service import AIService
from app.core.exceptions import ForbiddenException, AIServiceException
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AINLQueryRequest,
    AINLQueryResponse,
    AIAnalyzeRequest,
    AIAnalyzeResponse,
    AIProvidersListResponse,
)

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


@router.get(
    "/providers",
    response_model=AIProvidersListResponse,
    summary="List available AI providers and supported models",
)
async def list_ai_providers(
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    svc = AIService(db)
    providers = svc.list_providers()
    return {
        "providers": providers,
        "active_default": "groq",
    }


@router.post(
    "/chat",
    response_model=AIChatResponse,
    summary="AI Copilot — ask a question about your data",
)
async def copilot_chat(
    body: AIChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    try:
        history_dicts = [h.model_dump() for h in body.history] if body.history else []
        return await svc.copilot_chat(
            question=body.question,
            dataset_id=body.dataset_id,
            actor=current_user,
            history=history_dicts,
            preferred_provider=body.provider,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503, detail=f"AI service temporarily unavailable: {str(e)}"
        )


@router.post(
    "/chat/stream",
    summary="AI Copilot — stream responses in real-time via Server-Sent Events (SSE)",
)
async def copilot_chat_stream(
    body: AIChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    history_dicts = [h.model_dump() for h in body.history] if body.history else []

    async def event_generator():
        try:
            async for token in svc.copilot_chat_stream(
                question=body.question,
                dataset_id=body.dataset_id,
                actor=current_user,
                history=history_dicts,
                preferred_provider=body.provider,
            ):
                payload = json.dumps({"token": token})
                yield f"data: {payload}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_payload = json.dumps({"error": str(e)})
            yield f"data: {error_payload}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post(
    "/nl-query",
    response_model=AINLQueryResponse,
    summary="Natural Language to DuckDB SQL — direct query and tabular answer",
)
async def natural_language_query(
    body: AINLQueryRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    try:
        return await svc.nl_query(
            question=body.question,
            dataset_id=body.dataset_id,
            actor=current_user,
            preferred_provider=body.provider,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Natural language query failed: {str(e)}"
        )


@router.post(
    "/analyze",
    response_model=AIAnalyzeResponse,
    status_code=202,
    summary="Trigger deep AI dataset narrative analysis (async)",
)
async def analyze_dataset(
    body: AIAnalyzeRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Offloads deep narrative generation to Celery. Returns job_id to poll."""
    from app.worker.tasks.dataset_tasks import analyze_dataset_task

    task = analyze_dataset_task.delay(
        str(body.dataset_id),
        str(current_user.id),
        body.provider or "groq",
    )
    return {
        "job_id": task.id,
        "status": "queued",
        "message": "Deep analysis started. Poll /ai/jobs/{job_id} for results.",
    }


@router.get(
    "/jobs/{job_id}",
    summary="Poll async AI job status",
)
async def get_job_status(job_id: str):
    """Check the status of any async Celery task."""
    from app.worker.celery_app import celery_app

    result = celery_app.AsyncResult(job_id)
    return {
        "job_id": job_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }
