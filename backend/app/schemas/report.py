"""Pydantic schemas for Report requests/responses."""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    dataset_id: uuid.UUID
    title: str | None = Field(None, max_length=500)
    report_type: str = "excel"
    generation_config: dict | None = None


class ReportApproveRequest(BaseModel):
    notes: str | None = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    dataset_id: uuid.UUID
    title: str
    report_type: str
    status: str
    progress: int
    output_url: str | None
    celery_task_id: str | None
    error_message: str | None
    ai_tokens_used: int
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportJobResponse(BaseModel):
    id: uuid.UUID
    status: str
    progress: int
    message: str = "Report generation has started. Poll /reports/{id} for status."

    model_config = {"from_attributes": True}
