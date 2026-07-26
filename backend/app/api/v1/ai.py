"""AI Copilot endpoints — chat, deep analysis, job status."""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_active_tenant_user
from app.models.user import User
from app.services.ai_service import AIService
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/ai", tags=["AI Copilot"])


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=4000)
    dataset_id: uuid.UUID
    history: list[dict] | None = None  # [{"role": "user"/"assistant", "content": "..."}]


class ChatResponse(BaseModel):
    answer: str
    model: str


class AnalyzeRequest(BaseModel):
    dataset_id: uuid.UUID
    analysis_type: str = "general"  # general | forecast | anomaly | segmentation


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    result: dict | None = None


@router.post("/chat", response_model=ChatResponse, summary="AI Copilot — ask a question about your data")
async def copilot_chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.tenant_id:
        raise ForbiddenException("Organization required.")
    svc = AIService(db)
    return await svc.copilot_chat(
        question=body.question,
        dataset_id=body.dataset_id,
        actor=current_user,
        history=body.history,
    )


@router.post("/analyze", status_code=202, summary="Trigger deep AI analysis (async)")
async def analyze_dataset(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_active_tenant_user),
    db: AsyncSession = Depends(get_db),
):
    """Offloads deep analysis to Celery. Returns job_id to poll."""
    from app.worker.tasks.dataset_tasks import analyze_dataset_task
    task = analyze_dataset_task.delay(str(body.dataset_id), str(current_user.id), body.analysis_type)
    return {
        "job_id": task.id,
        "status": "queued",
        "message": "Analysis started. Poll /ai/jobs/{job_id} for results.",
    }


@router.get("/jobs/{job_id}", response_model=JobStatusResponse, summary="Poll async AI job status")
async def get_job_status(job_id: str):
    """Check the status of any async Celery task."""
    from app.worker.celery_app import celery_app
    result = celery_app.AsyncResult(job_id)
    return {
        "job_id": job_id,
        "status": result.status,
        "result": result.result if result.ready() else None,
    }
