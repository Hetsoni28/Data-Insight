"""AI Copilot endpoints — chat, SSE streaming, NL-to-SQL, deep analysis, job status."""

import uuid
import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from app.core.rate_limit import limiter
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.models.tenant import Tenant
from app.services.ai_service import AIService
from app.services.entitlements import check_quota, BillingResource, get_usage
from app.repositories.chat import ChatRepository
from app.core.exceptions import ForbiddenException, ResourceNotFoundException, AIServiceException
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    AINLQueryRequest,
    AINLQueryResponse,
    AIAnalyzeRequest,
    AIAnalyzeResponse,
    AIProvidersListResponse,
    ChatSessionCreate,
    ChatSessionUpdate,
    ChatSessionResponse,
    ChatSessionListResponse,
    ChatMessageResponse,
    AICopilotMessageRequest,
    AICopilotMessageResponse,
    AICopilotSuggestionsResponse,
)

router = APIRouter(prefix="/ai", tags=["AI Copilot"])

async def _ensure_ai_quota(tenant_id: uuid.UUID, db: AsyncSession, buffer: int = 100):
    from sqlalchemy import select
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    usage = await get_usage(tenant, db)
    quota = check_quota(tenant, usage, BillingResource.AI_TOKENS, buffer=buffer)
    if not quota.allowed:
        raise HTTPException(status_code=402, detail="AI Tokens quota exceeded for your organization's plan.")
    return tenant



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
    summary="AI Copilot — interactive Q&A over specific datasets or general platform help",
)
@limiter.limit("10/minute")
async def copilot_chat(
    request: Request,
    body: AIChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    
    await _ensure_ai_quota(current_user.tenant_id, db)
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
@limiter.limit("10/minute")
async def copilot_chat_stream(
    request: Request,
    body: AIChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    
    await _ensure_ai_quota(current_user.tenant_id, db)
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
@limiter.limit("15/minute")
async def natural_language_query(
    request: Request,
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
@limiter.limit("5/minute")
async def analyze_dataset(
    request: Request,
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


# =========================================================================
# Phase 6: AI Copilot — Sessions, Multi-Turn Memory & Visual Artifacts
# =========================================================================

@router.get(
    "/suggestions/{dataset_id}",
    response_model=AICopilotSuggestionsResponse,
    summary="Get proactive smart contextual questions for a dataset",
)
async def get_dataset_suggestions(
    dataset_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Inspects dataset profiling and returns smart categorized questions."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    try:
        suggestions = await svc.get_dataset_suggestions(dataset_id=dataset_id, actor=current_user)
        return {
            "dataset_id": dataset_id,
            "suggestions": suggestions,
        }
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")


@router.get(
    "/sessions",
    response_model=ChatSessionListResponse,
    summary="List persistent chat sessions for current user",
)
async def list_chat_sessions(
    dataset_id: Optional[uuid.UUID] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve chat history sessions ordered by latest activity."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    chat_repo = ChatRepository(db)
    sessions = await chat_repo.list_sessions(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        dataset_id=dataset_id,
        limit=limit,
        offset=offset,
    )
    total = await chat_repo.count_sessions(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        dataset_id=dataset_id,
    )

    results = []
    for s in sessions:
        results.append(
            ChatSessionResponse(
                id=s.id,
                tenant_id=s.tenant_id,
                user_id=s.user_id,
                title=s.title,
                dataset_id=s.dataset_id,
                dataset_name=s.dataset.name if s.dataset else None,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=len(s.messages) if s.messages else 0,
                messages=[
                    ChatMessageResponse(
                        id=m.id,
                        session_id=m.session_id,
                        role=m.role,
                        content=m.content,
                        artifact_data=m.artifact_data,
                        created_at=m.created_at,
                    )
                    for m in (s.messages or [])
                ],
            )
        )

    return {"sessions": results, "total": total}


@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=201,
    summary="Create a new persistent AI Copilot chat session",
)
async def create_chat_session(
    body: ChatSessionCreate,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new chat session optionally bound to a dataset."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    chat_repo = ChatRepository(db)
    session = await chat_repo.create_session(
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=body.title or "New Chat",
        dataset_id=body.dataset_id,
    )
    return ChatSessionResponse(
        id=session.id,
        tenant_id=session.tenant_id,
        user_id=session.user_id,
        title=session.title,
        dataset_id=session.dataset_id,
        dataset_name=session.dataset.name if session.dataset else None,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=0,
        messages=[],
    )


@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    summary="Get a chat session with full conversation history and visual artifacts",
)
async def get_chat_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch complete session history with interactive chart artifacts."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    chat_repo = ChatRepository(db)
    session = await chat_repo.get_session(
        session_id=session_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        load_messages=True,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    return ChatSessionResponse(
        id=session.id,
        tenant_id=session.tenant_id,
        user_id=session.user_id,
        title=session.title,
        dataset_id=session.dataset_id,
        dataset_name=session.dataset.name if session.dataset else None,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages) if session.messages else 0,
        messages=[
            ChatMessageResponse(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                artifact_data=m.artifact_data,
                created_at=m.created_at,
            )
            for m in (session.messages or [])
        ],
    )


@router.patch(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    summary="Update chat session title or bound dataset",
)
async def update_chat_session(
    session_id: uuid.UUID,
    body: ChatSessionUpdate,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename a session or switch its dataset."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    chat_repo = ChatRepository(db)
    session = await chat_repo.update_session(
        session_id=session_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
        title=body.title,
        dataset_id=body.dataset_id,
    )
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found.")

    return ChatSessionResponse(
        id=session.id,
        tenant_id=session.tenant_id,
        user_id=session.user_id,
        title=session.title,
        dataset_id=session.dataset_id,
        dataset_name=session.dataset.name if session.dataset else None,
        created_at=session.created_at,
        updated_at=session.updated_at,
        message_count=len(session.messages) if session.messages else 0,
        messages=[
            ChatMessageResponse(
                id=m.id,
                session_id=m.session_id,
                role=m.role,
                content=m.content,
                artifact_data=m.artifact_data,
                created_at=m.created_at,
            )
            for m in (session.messages or [])
        ],
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=204,
    summary="Delete a chat session and all messages",
)
async def delete_chat_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete conversation session permanently."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    chat_repo = ChatRepository(db)
    deleted = await chat_repo.delete_session(
        session_id=session_id,
        tenant_id=current_user.tenant_id,
        user_id=current_user.id,
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Chat session not found.")
    return None


@router.post(
    "/sessions/{session_id}/messages",
    response_model=AICopilotMessageResponse,
    summary="Send message into persistent session (returns answer + visual artifacts)",
)
async def send_session_message(
    session_id: uuid.UUID,
    body: AICopilotMessageRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute AI query, store user & assistant messages, and generate visual artifacts."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    try:
        return await svc.chat_in_session(
            session_id=session_id,
            question=body.question,
            actor=current_user,
            preferred_provider=body.provider,
        )
    except ResourceNotFoundException as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Copilot query failed: {str(e)}"
        )


@router.post(
    "/sessions/{session_id}/messages/stream",
    summary="Stream message in real-time via SSE and persist visual artifacts upon completion",
)
async def send_session_message_stream(
    session_id: uuid.UUID,
    body: AICopilotMessageRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream token chunks and deliver visual artifact events directly into chat session."""
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)

    async def sse_event_stream():
        try:
            async for chunk in svc.chat_in_session_stream(
                session_id=session_id,
                question=body.question,
                actor=current_user,
                preferred_provider=body.provider,
            ):
                yield chunk
        except Exception as e:
            err_payload = json.dumps({"type": "error", "error": str(e)})
            yield f"data: {err_payload}\n\n"

    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")


@router.post(
    "/forecast",
    response_model=Dict[str, Any],
    summary="Generate real ML time-series forecast on a dataset",
)
async def generate_ml_forecast(
    body: Dict[str, Any],
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Run the Machine Learning time-series forecasting engine on any tenant dataset.
    Returns trendline, confidence intervals, growth projections, and statistical metrics.
    """
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")

    dataset_id_str = body.get("dataset_id")
    if not dataset_id_str:
        raise HTTPException(status_code=400, detail="dataset_id is required.")

    from app.models.dataset import Dataset, DatasetFileType
    from app.core.storage import download_file_bytes, DATASETS_BUCKET
    from app.services.analytics.forecasting_engine import ForecastingEngine
    import io
    import pandas as pd
    from sqlalchemy import select

    stmt = select(Dataset).where(
        Dataset.id == uuid.UUID(dataset_id_str),
        Dataset.tenant_id == current_user.tenant_id,
    )
    dataset = (await db.execute(stmt)).scalars().first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        file_bytes = await download_file_bytes(DATASETS_BUCKET, dataset.file_url)
        file_buffer = io.BytesIO(file_bytes)

        if dataset.file_type == DatasetFileType.csv:
            df = pd.read_csv(file_buffer)
        elif dataset.file_type == DatasetFileType.xlsx:
            df = pd.read_excel(file_buffer)
        elif dataset.file_type == DatasetFileType.json:
            df = pd.read_json(file_buffer)
        else:
            df = pd.read_csv(file_buffer)

        horizon = int(body.get("horizon", 6))
        target_column = body.get("target_column")
        date_column = body.get("date_column")
        confidence_level = float(body.get("confidence_level", 0.95))

        forecast_result = ForecastingEngine.fit_and_forecast(
            df=df,
            target_column=target_column,
            date_column=date_column,
            horizon=horizon,
            confidence_level=confidence_level,
        )
        return forecast_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting failed: {str(e)}")

